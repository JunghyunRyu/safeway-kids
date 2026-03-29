"""SafeWay Kids Edge AI PoC Demo v2 — 통합 진입점.

기존 모듈들을 연결하여 실제 AI 엔진 기반 추론 루프를 구성한다.
web/server.py의 mock 추론을 실제 엔진으로 교체하는 DI 방식.

실행: python main_v2.py
"""

import os
# Windows MSMF 카메라 HW 가속 비활성화 (cv2 import 전에 설정 필수)
os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"

import logging
import sys
import threading
import time
from datetime import datetime, timezone
from flask import request, jsonify
from queue import Queue

import numpy as np

# edge_ai를 패키지 루트로 설정
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from core.engine import Engine
from core.scenario_manager import ScenarioManager, ScenarioMode
from core.boarding_manager import BoardingManager, BoardingMode
from core.performance_monitor import PerformanceMonitor
from core.passenger_scanner import PassengerScanner
from web.backend_bridge import BackendBridge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("edge_ai.main_v2")


class EdgeAIApp:
    """Edge AI 통합 애플리케이션.

    AI 엔진, 시나리오 관리, 승하차 관리, 성능 모니터를 통합하고
    web/server.py의 추론 루프에 실제 엔진을 주입한다.
    """

    def __init__(self):
        self.engine = Engine(on_progress=self._on_engine_progress)
        self.scenario_mgr = ScenarioManager(on_mode_change=self._on_mode_change)
        self.boarding_mgr = BoardingManager(on_event=self._on_boarding_event)
        self.perf_monitor = PerformanceMonitor()
        self.backend_bridge = BackendBridge(
            backend_url=config.BACKEND_URL,
            api_token=config.DEMO_API_TOKEN,
            standalone_setting=config.STANDALONE_MODE,
        )

        # AI 모듈 (엔진 초기화 후 생성)
        self._yolo_detector = None
        self._face_recognizer = None
        self._behavior_analyzer = None
        self._passenger_scanner = PassengerScanner(on_event=self._on_boarding_event)

        self._initialized = False

    def initialize(self) -> bool:
        """AI 엔진 + 모듈 초기화."""
        logger.info("=== SafeWay Kids Edge AI PoC Demo v2 ===")

        # 백엔드 연결 확인
        self.backend_bridge.check_backend()
        logger.info("Backend mode: %s (connected=%s)",
                     self.backend_bridge.mode, self.backend_bridge.connected)

        # AI 엔진 초기화 (모델 로딩 + warm-up)
        engine_ok = self.engine.initialize()
        logger.info("Engine initialized: %s", engine_ok)

        # AI 모듈 초기화 (모델 파일 유무에 따라 graceful)
        self._init_ai_modules()

        self._initialized = True
        return engine_ok

    def _init_ai_modules(self):
        """AI 모듈을 안전하게 초기화. 모델 파일이 없으면 None 유지."""
        # YOLODetector
        if os.path.exists(config.YOLO_ONNX_PATH):
            try:
                from core.yolo_detector import YOLODetector
                self._yolo_detector = YOLODetector(model_path=config.YOLO_ONNX_PATH)
                logger.info("YOLODetector initialized")
            except Exception as e:
                logger.warning("YOLODetector init failed: %s", e)
        else:
            logger.info("YOLO model not found, skipping YOLODetector")

        # FaceRecognizer
        if os.path.exists(config.ARCFACE_ONNX_PATH) and os.path.exists(config.FACE_DETECTOR_PATH):
            try:
                from core.face_recognizer import FaceRecognizer
                self._face_recognizer = FaceRecognizer()
                logger.info("FaceRecognizer initialized")
            except Exception as e:
                logger.warning("FaceRecognizer init failed: %s", e)
        else:
            logger.info("Face models not found, skipping FaceRecognizer")

        # BehaviorAnalyzer (requires YOLODetector)
        if self._yolo_detector and os.path.exists(config.POSE_LANDMARKER_PATH):
            try:
                from core.behavior_analyzer import BehaviorAnalyzer
                self._behavior_analyzer = BehaviorAnalyzer(yolo=self._yolo_detector)
                logger.info("BehaviorAnalyzer initialized")
            except Exception as e:
                logger.warning("BehaviorAnalyzer init failed: %s", e)
        else:
            logger.info("Pose model or YOLO not available, skipping BehaviorAnalyzer")

        # PassengerScanner (shares YOLODetector)
        if self._yolo_detector:
            self._passenger_scanner.set_yolo_detector(self._yolo_detector)
            logger.info("PassengerScanner configured with YOLODetector")

    def process_frame(self, frame: np.ndarray) -> dict:
        """현재 시나리오 모드에 따라 프레임 처리.

        Returns:
            {
                "mode": str,
                "detections": list[dict],
                "metrics": dict,
                "boarding_status": dict | None,
                "model_name": str,
                "inference_ms": float,
            }
        """
        if self.perf_monitor.should_skip_frame():
            return {"mode": self.scenario_mgr.current_mode.value,
                    "detections": [], "metrics": self.perf_monitor.get_metrics_dict(),
                    "boarding_status": None, "model_name": "skipped",
                    "inference_ms": 0.0}

        mode = self.scenario_mgr.current_mode
        detections = []
        model_name = "None"
        inference_ms = 0.0

        t0 = time.perf_counter()

        if mode == ScenarioMode.BOARDING:
            detections, model_name = self._process_boarding(frame)
        elif mode == ScenarioMode.TRANSIT:
            detections, model_name = self._process_transit(frame)
        elif mode == ScenarioMode.ALIGHTING:
            detections, model_name = self._process_alighting(frame)
        elif mode == ScenarioMode.POST_TRIP:
            detections, model_name = self._process_post_trip(frame)
        # BLINDSPOT is JS-only, no Python inference needed

        inference_ms = (time.perf_counter() - t0) * 1000
        self.perf_monitor.record_inference(inference_ms, model_name)
        self.perf_monitor.record_frame()

        return {
            "mode": mode.value,
            "detections": detections,
            "metrics": self.perf_monitor.get_metrics_dict(),
            "boarding_status": self.boarding_mgr.get_status(),
            "model_name": model_name,
            "inference_ms": round(inference_ms, 1),
        }

    def _process_boarding(self, frame: np.ndarray) -> tuple[list[dict], str]:
        """승차 모드: 안면인식."""
        if self._face_recognizer is None:
            return self._mock_face_detections(frame), "FaceDetector + ArcFace (mock)"

        if self.boarding_mgr.mode != BoardingMode.BOARDING:
            self.boarding_mgr.set_mode(BoardingMode.BOARDING)
        results = self._face_recognizer.recognize(frame)
        detections = []
        for r in results:
            x1, y1, x2, y2 = r["bbox"]
            is_recognized = r["name"] != "미등록" and r["confidence"] > 0
            det = {
                "type": "face",
                "bbox": [x1, y1, x2, y2],
                "label": r["name"],
                "confidence": r["confidence"],
                "is_masked": r.get("is_masked", False),
                "alert_level": "face_recognized" if is_recognized else "face_unknown",
            }
            # 승차 기록
            if is_recognized:
                check = self.boarding_mgr.record_boarding(r["name"], r["confidence"])
                det["boarding_result"] = check.result.value
            detections.append(det)
        return detections, "FaceDetector + ArcFace"

    def _process_transit(self, frame: np.ndarray) -> tuple[list[dict], str]:
        """운행 모드: 이상행동 감지."""
        if self._behavior_analyzer is None:
            return [], "YOLOv8n + MediaPipe Pose (mock)"

        results = self._behavior_analyzer.analyze(frame)
        detections = []
        for r in results:
            x1, y1, x2, y2 = r["bbox"]
            alert_level = "danger" if r.get("alert") else "normal"
            if r["behavior"] in ("standing", "falling") and not r.get("alert"):
                alert_level = "warning"
            detections.append({
                "type": "behavior",
                "bbox": [x1, y1, x2, y2],
                "label": r["behavior"],
                "confidence": r["confidence"],
                "duration_sec": r.get("duration_sec", 0),
                "alert_level": alert_level,
            })
        return detections, "YOLOv8n + MediaPipe Pose"

    def _process_alighting(self, frame: np.ndarray) -> tuple[list[dict], str]:
        """하차 모드: 안면인식으로 하차 체크."""
        if self._face_recognizer is None:
            return self._mock_face_detections(frame), "FaceDetector + ArcFace (mock)"

        if self.boarding_mgr.mode != BoardingMode.ALIGHTING:
            self.boarding_mgr.set_mode(BoardingMode.ALIGHTING)
        results = self._face_recognizer.recognize(frame)
        detections = []
        for r in results:
            x1, y1, x2, y2 = r["bbox"]
            det = {
                "type": "face",
                "bbox": [x1, y1, x2, y2],
                "label": r["name"],
                "confidence": r["confidence"],
                "alert_level": "normal",
            }
            if r["name"] != "\ubbf8\ub4f1\ub85d" and r["confidence"] > 0:
                check = self.boarding_mgr.record_alighting(r["name"], r["confidence"])
                det["alighting_result"] = check.result.value
                if check.result.value == "not_boarded":
                    det["alert_level"] = "warning"
            detections.append(det)
        return detections, "FaceDetector + ArcFace"

    def _process_post_trip(self, frame: np.ndarray) -> tuple[list[dict], str]:
        """잔류인원 감지."""
        if self._yolo_detector is None:
            return [], "YOLOv8n (mock)"

        result = self._passenger_scanner.detect_single(frame)
        detections = []
        for bbox, conf in zip(result.bboxes, result.confidences):
            detections.append({
                "type": "passenger",
                "bbox": list(bbox),
                "label": "잔류인원" if result.detected else "clear",
                "confidence": conf,
                "alert_level": "danger" if result.detected else "normal",
            })
        return detections, "YOLOv8n"

    def _mock_face_detections(self, frame: np.ndarray) -> list[dict]:
        """AI 모델 없을 때 mock 감지 결과."""
        return []

    def change_mode(self, mode_str: str) -> bool:
        """모드 변경 (문자열 → ScenarioMode)."""
        try:
            new_mode = ScenarioMode(mode_str)
        except ValueError:
            return False
        return self.scenario_mgr.set_mode(new_mode, force=True)

    def reset(self):
        """데모 리셋."""
        self.scenario_mgr.reset()
        self.boarding_mgr.reset()
        self.perf_monitor.reset()

    def _on_engine_progress(self, stage: str, progress: float, message: str):
        logger.info("[Engine %s] %.0f%% — %s", stage, progress * 100, message)

    def _on_mode_change(self, old_mode, new_mode, activation_map):
        logger.info("Mode changed: %s -> %s (active: %s)",
                     old_mode.value, new_mode.value,
                     [k for k, v in activation_map.items() if v])

    def _on_boarding_event(self, event_type: str, data: dict):
        logger.info("Boarding event: %s — %s", event_type, data)
        self.backend_bridge.send_event(event_type, data)


def inject_into_server(edge_app: EdgeAIApp):
    """web/server.py의 추론 루프를 실제 엔진으로 교체.

    server.py의 글로벌 _inference_thread를 오버라이드하는 대신,
    server.py를 import하여 socketio/app에 접근하고
    기존 추론 스레드를 대체하는 새 스레드를 등록한다.
    """
    import base64
    import cv2
    from web.server import (
        app, socketio, _state, _frame_queue, _metrics, _metrics_lock, _stop_event,
    )

    def _v2_inference_thread():
        """실제 AI 엔진 기반 추론 스레드."""
        logger.info("[Inference-v2] 스레드 시작 (AI 엔진 모드)")
        fps_counter = 0
        fps_timer = time.time()

        while not _stop_event.is_set():
            mode = _state["mode"]
            # BLINDSPOT/POST_TRIP(사각지대)는 JS 단독
            if mode == "blindspot":
                time.sleep(0.5)
                continue

            try:
                frame = _frame_queue.get(timeout=1.0)
            except Exception:
                continue

            # 시나리오 모드 동기화
            edge_app.change_mode(mode)

            # AI 추론
            result = edge_app.process_frame(frame)
            _state["inference_active"] = True

            # FPS 계산
            fps_counter += 1
            elapsed_since_timer = time.time() - fps_timer
            if elapsed_since_timer >= 1.0:
                current_fps = fps_counter / elapsed_since_timer
                fps_counter = 0
                fps_timer = time.time()
            else:
                current_fps = _metrics["fps"]

            # 프레임을 base64 JPEG로 인코딩
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, 70]
            _, jpeg_buf = cv2.imencode(".jpg", frame, encode_params)
            frame_b64 = base64.b64encode(jpeg_buf).decode("ascii")

            # metrics 갱신
            with _metrics_lock:
                _metrics["fps"] = round(current_fps, 1)
                _metrics["inference_ms"] = result["inference_ms"]
                _metrics["model_name"] = result["model_name"]
                _metrics["frame_count"] += 1

            # Socket.IO emit
            socketio.emit("frame", {
                "image": frame_b64,
                "mode": mode,
                "detections": result["detections"],
                "metrics": result["metrics"],
                "boarding_status": result["boarding_status"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # 인식 이벤트 emit (1초에 1번)
            if mode == "boarding" and fps_counter == 0 and result["detections"]:
                recognized = [d["label"] for d in result["detections"]
                              if d.get("alert_level") == "face_recognized"]
                unknown_cnt = sum(1 for d in result["detections"]
                                 if d.get("alert_level") == "face_unknown")
                if recognized:
                    socketio.emit("event", {
                        "type": "face_recognized",
                        "message": ", ".join(recognized) + " 인식됨",
                    })
                if unknown_cnt > 0:
                    socketio.emit("event", {
                        "type": "face_unknown",
                        "message": f"미등록 얼굴 {unknown_cnt}명 감지",
                    })

            # 성능 모니터 시스템 메트릭 갱신 (1초 간격)
            if elapsed_since_timer >= 1.0:
                edge_app.perf_monitor.update_system_metrics()

            # ~5fps target
            time.sleep(max(0, 0.2 - result["inference_ms"] / 1000))

        _state["inference_active"] = False
        logger.info("[Inference-v2] 스레드 종료")

    # ── 실제 얼굴 등록 핸들러 오버라이드 ────────────────
    import web.server as _srv
    _frame_lock = _srv._frame_lock
    server_log = _srv._log_event

    @socketio.on("register_face")
    def handle_register_face_v2(data):
        """실제 ArcFace 기반 얼굴 등록."""
        from flask_socketio import emit
        name = data.get("name", "").strip()
        if not name:
            emit("error", {"message": "이름을 입력하세요."})
            return

        if edge_app._face_recognizer is None:
            # fallback: mock 등록
            _state["registered_faces"][name] = True
            server_log("face_registered", f"{name} 등록 (mock)")
            emit("face_registered", {"success": True, "name": name,
                 "registered_count": len(_state["registered_faces"])})
            return

        with _frame_lock:
            frame = _srv._latest_raw_frame
        if frame is None:
            emit("error", {"message": "카메라 프레임이 없습니다."})
            return

        success = edge_app._face_recognizer.register(frame.copy(), name, angle="front")
        if success:
            _state["registered_faces"][name] = True
            server_log("face_registered", f"{name} 원생 얼굴 등록 완료 (ArcFace)",
                       {"student_name": name})
            logger.info("[v2] 얼굴 등록 성공: %s (embeddings: %d)",
                        name, len(edge_app._face_recognizer._embeddings.get(name, [])))
            emit("face_registered", {"success": True, "name": name,
                 "registered_count": len(_state["registered_faces"])})
        else:
            emit("error", {"message": "얼굴 등록 실패. 정면을 바라보고 다시 시도하세요."})

    # mock 핸들러를 v2로 교체
    def api_register_face_v2():
        """REST 기반 실제 얼굴 등록."""
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "이름이 필요합니다."}), 400

        if edge_app._face_recognizer is None:
            _state["registered_faces"][name] = True
            return jsonify({"success": True, "name": name, "mock": True})

        with _frame_lock:
            frame = _srv._latest_raw_frame
        if frame is None:
            return jsonify({"error": "카메라 프레임이 없습니다."}), 503

        logger.info("[v2-REST] 얼굴 등록 시도: %s (frame shape=%s)", name, frame.shape)
        success = edge_app._face_recognizer.register(frame.copy(), name, angle="front")
        if success:
            _state["registered_faces"][name] = True
            emb_count = len(edge_app._face_recognizer._embeddings.get(name, []))
            logger.info("[v2-REST] 등록 성공: %s (임베딩 %d개)", name, emb_count)
            # 등록 이벤트 브로드캐스트
            socketio.emit("event", {"type": "face_registered", "message": f"✔ {name} 얼굴 등록 완료"})
            socketio.emit("face_registered", {
                "success": True, "name": name,
                "registered_count": len(_state["registered_faces"]),
                "face_names": list(_state["registered_faces"].keys()),
            })
            return jsonify({"success": True, "name": name, "embeddings": emb_count})
        logger.warning("[v2-REST] 등록 실패: %s", name)
        return jsonify({"error": "얼굴 등록 실패. 정면을 바라보고 다시 시도하세요."}), 400

    # mock 핸들러를 v2로 교체
    app.view_functions["api_register_face"] = api_register_face_v2

    return app, socketio, _v2_inference_thread


def main():
    """메인 진입점."""
    logger.info("SafeWay Kids Edge AI PoC Demo v2 starting...")

    # 1. 통합 앱 초기화
    edge_app = EdgeAIApp()
    engine_ok = edge_app.initialize()

    if engine_ok:
        logger.info("AI engine ready — using real inference")
    else:
        logger.warning("AI engine not fully ready — some modules will use mock")

    # 2. server.py에 주입
    app, socketio, v2_inference_thread = inject_into_server(edge_app)

    # 3. server.py의 start_server와 유사하게 스레드 시작
    from web.server import (
        _camera_thread, _performance_thread, _stop_event, _state,
    )
    from web.fallback import FallbackManager

    _state["start_time"] = time.time()

    # Fallback 매니저
    from web.server import _log_event
    fallback_mgr = FallbackManager(socketio=socketio, log_event_fn=_log_event)

    # Windows MSMF 호환성: 카메라를 메인 스레드에서 열기
    from web.server import pre_open_camera, _frame_queue, _frame_lock
    import web.server as _srv
    pre_open_camera()
    _main_cap = _srv._pre_opened_cap
    _srv._pre_opened_cap = None

    # 추론/성능/fallback 스레드 (카메라 제외)
    threads = [
        threading.Thread(target=v2_inference_thread, name="InferenceV2Thread", daemon=True),
        threading.Thread(target=_performance_thread, name="PerfMonThread", daemon=True),
        threading.Thread(target=fallback_mgr.monitor_loop,
                         args=(_stop_event,), name="FallbackThread", daemon=True),
    ]
    for t in threads:
        t.start()
        logger.info("[main_v2] %s started", t.name)

    # Flask 서버를 별도 스레드에서 실행 (socketio.run이 카메라를 blocking하므로)
    host = config.SERVER_HOST
    port = config.SERVER_PORT
    logger.info("[main_v2] Server starting: http://%s:%d", host, port)

    from werkzeug.serving import make_server
    server = make_server(host, port, app, threaded=True)
    server_thread = threading.Thread(target=server.serve_forever, name="FlaskServer", daemon=True)
    server_thread.start()
    logger.info("[main_v2] Werkzeug server started")

    # 메인 스레드에서 카메라 루프 실행 (Windows MSMF 호환성)
    logger.info("[main_v2] Camera loop starting on main thread")
    _state["camera_active"] = True
    _consecutive_failures = 0

    try:
        while not _stop_event.is_set():
            if _main_cap is None or not _main_cap.isOpened():
                _state["camera_active"] = False
                _main_cap = cv2.VideoCapture(config.CAMERA_INDEX)
                if not _main_cap.isOpened():
                    time.sleep(3)
                    continue
                _main_cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
                _main_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)
                for _ in range(10):
                    _main_cap.read()
                    time.sleep(0.05)
                _state["camera_active"] = True
                _consecutive_failures = 0
                logger.info("[main_v2] Camera reconnected")

            ret, frame = _main_cap.read()
            if not ret:
                _consecutive_failures += 1
                if _consecutive_failures >= 10:
                    _main_cap.release()
                    _main_cap = None
                    time.sleep(3)
                else:
                    time.sleep(0.1)
                continue

            _consecutive_failures = 0
            with _frame_lock:
                _srv._latest_raw_frame = frame
            _srv._last_frame_time = time.time()

            if fallback_mgr:
                fallback_mgr.report_camera_success()

            if _frame_queue.full():
                try:
                    _frame_queue.get_nowait()
                except Exception:
                    pass
            _frame_queue.put(frame)
            time.sleep(1.0 / 30)
    except KeyboardInterrupt:
        logger.info("[main_v2] Shutdown requested")
    finally:
        _stop_event.set()
        logger.info("[main_v2] Server stopped")


if __name__ == "__main__":
    main()
