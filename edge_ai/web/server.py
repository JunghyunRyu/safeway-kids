"""SafeWay Kids Edge AI PoC — Flask + Socket.IO 서버.

Tech Spec 7.2 스레드 구조:
- Main Thread: Flask + Socket.IO (eventlet)
- Camera Thread (daemon): OpenCV 30fps → frame_queue(maxsize=1)
- Inference Thread (daemon): frame_queue → 시나리오별 추론 → Socket.IO emit
- Performance Monitor Thread (daemon): psutil 1초 간격 → metrics emit

실행: python -m web.server  또는  python web/server.py
"""

import base64
import logging
import os
import sys
import threading
import time
from datetime import datetime, timezone
from queue import Queue

import os as _os
# Windows MSMF 하드웨어 가속 비활성화 (프레임 읽기 실패 방지)
_os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"

import cv2
import numpy as np
import psutil

# edge_ai를 패키지 루트로 설정
_EDGE_AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _EDGE_AI_DIR not in sys.path:
    sys.path.insert(0, _EDGE_AI_DIR)

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit

import config
from web.backend_bridge import BackendBridge
from web.fallback import FallbackManager

# ---------------------------------------------------------------------------
# 로깅
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("edge_ai.server")

# ---------------------------------------------------------------------------
# Flask + Socket.IO 앱 생성
# ---------------------------------------------------------------------------
app = Flask(
    __name__,
    template_folder=os.path.join(_EDGE_AI_DIR, "web", "templates"),
    static_folder=os.path.join(_EDGE_AI_DIR, "web", "static"),
)
app.config["SECRET_KEY"] = "safeway-edge-ai-poc"

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    ping_timeout=60,
    ping_interval=25,
)

# ---------------------------------------------------------------------------
# 글로벌 상태
# ---------------------------------------------------------------------------
_state = {
    "mode": "boarding",           # boarding | transit | alighting | post_trip
    "engine_off": False,
    "camera_active": False,
    "inference_active": False,
    "registered_faces": {},       # name -> embedding (mock: name -> True)
    "event_log": [],              # 최근 이벤트 (최대 100건)
    "consent_log": [],            # 보호자 동의 기록
    "connected_clients": 0,
    "start_time": None,
}

_frame_queue: Queue = Queue(maxsize=1)
_latest_raw_frame: np.ndarray | None = None
_frame_lock = threading.Lock()
_stop_event = threading.Event()

# 성능 지표
_metrics = {
    "cpu_percent": 0.0,
    "memory_percent": 0.0,
    "fps": 0.0,
    "inference_ms": 0.0,
    "model_name": "Mock (AI 엔진 대기)",
    "frame_count": 0,
}
_metrics_lock = threading.Lock()

# 추론 타이밍
_last_frame_time = 0.0
_consecutive_failures = 0

# 백엔드 브릿지
_bridge: BackendBridge | None = None

# Human Fallback 매니저
_fallback_mgr: FallbackManager | None = None


# ===========================================================================
# 유틸리티
# ===========================================================================

def _log_event(event_type: str, message: str, details: dict | None = None) -> dict:
    """이벤트 기록 + Socket.IO emit + 백엔드 전송."""
    entry = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "type": event_type,
        "message": message,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _state["event_log"].insert(0, entry)
    if len(_state["event_log"]) > 100:
        _state["event_log"].pop()

    # Socket.IO로 클라이언트에 전송
    socketio.emit("event", entry)

    # 백엔드에 전송 (연동 모드일 때)
    if _bridge:
        _bridge.send_event(event_type, details or {})

    return entry


def _get_status() -> dict:
    """시스템 상태 딕셔너리."""
    return {
        "mode": _state["mode"],
        "engine_off": _state["engine_off"],
        "camera": _state["camera_active"],
        "inference": _state["inference_active"],
        "backend": _bridge.connected if _bridge else False,
        "backend_mode": _bridge.mode if _bridge else "standalone",
        "registered_faces": len(_state["registered_faces"]),
        "face_names": list(_state["registered_faces"].keys()),
        "connected_clients": _state["connected_clients"],
        "fallback_active": _fallback_mgr.is_active if _fallback_mgr else False,
        "uptime_sec": (time.time() - _state["start_time"]) if _state["start_time"] else 0,
    }


# ===========================================================================
# 카메라 스레드 (Tech Spec 7.2)
# ===========================================================================

_pre_opened_cap = None  # 메인 스레드에서 미리 열어둔 카메라


def pre_open_camera():
    """메인 스레드에서 카메라를 미리 열어 MSMF 초기화 (Windows 호환성)."""
    global _pre_opened_cap
    cap = cv2.VideoCapture(config.CAMERA_INDEX)
    if cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)
        # 워밍업
        for _ in range(10):
            cap.read()
            time.sleep(0.05)
        _pre_opened_cap = cap
        logger.info("[Camera] 메인 스레드에서 카메라 사전 초기화 완료 (%dx%d)",
                    config.FRAME_WIDTH, config.FRAME_HEIGHT)
    else:
        logger.warning("[Camera] 카메라 사전 초기화 실패")


def _camera_thread():
    """OpenCV로 30fps 캡처. frame_queue(maxsize=1)에 최신 프레임 전달."""
    global _latest_raw_frame, _last_frame_time, _pre_opened_cap

    logger.info("[Camera] 스레드 시작 (camera_index=%d)", config.CAMERA_INDEX)

    # 메인 스레드에서 미리 열어둔 카메라 사용
    cap = _pre_opened_cap
    _pre_opened_cap = None

    if cap is not None and cap.isOpened():
        _state["camera_active"] = True
        logger.info("[Camera] 사전 초기화된 카메라 사용")
        _consecutive_failures = 0
    else:
        cap = None
        _consecutive_failures = 0

    while not _stop_event.is_set():
        # 카메라 열기 / 재연결
        if cap is None or not cap.isOpened():
            _state["camera_active"] = False
            cap = cv2.VideoCapture(config.CAMERA_INDEX)
            if not cap.isOpened():
                logger.warning("[Camera] 카메라 열기 실패, 3초 후 재시도")
                if _fallback_mgr:
                    _fallback_mgr.report_camera_failure()
                time.sleep(3)
                continue

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)

            for _ in range(10):
                cap.read()
                time.sleep(0.05)

            _state["camera_active"] = True
            logger.info("[Camera] 카메라 연결 성공 (%dx%d)",
                        config.FRAME_WIDTH, config.FRAME_HEIGHT)
            _consecutive_failures = 0

        ret, frame = cap.read()
        if not ret:
            _consecutive_failures += 1
            if _consecutive_failures >= 10:
                logger.warning("[Camera] 프레임 읽기 10회 연속 실패, 카메라 재연결")
                if _fallback_mgr:
                    _fallback_mgr.report_camera_failure()
                cap.release()
                cap = None
                time.sleep(3)
            else:
                time.sleep(0.1)
            continue

        # 최신 프레임 갱신
        with _frame_lock:
            _latest_raw_frame = frame
        _last_frame_time = time.time()

        if _fallback_mgr:
            _fallback_mgr.report_camera_success()

        # frame_queue에 넣기 (maxsize=1이므로 오래된 건 버림)
        if _frame_queue.full():
            try:
                _frame_queue.get_nowait()
            except Exception:
                pass
        _frame_queue.put(frame)

        # 약 30fps 속도 제어
        time.sleep(1.0 / 30)

    if cap is not None:
        cap.release()
    logger.info("[Camera] 스레드 종료")


# ===========================================================================
# Mock 얼굴 감지 (MediaPipe 또는 Haar cascade)
# ===========================================================================

_face_cascade = None

def _detect_faces_mock(frame: np.ndarray) -> list[dict]:
    """OpenCV Haar cascade로 간단한 얼굴 감지 (mock용)."""
    global _face_cascade
    if _face_cascade is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _face_cascade = cv2.CascadeClassifier(cascade_path)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=5, minSize=(60, 60))

    results = []
    for (x, y, w, h) in faces:
        results.append({"bbox": [int(x), int(y), int(x + w), int(y + h)]})
    return results


# ===========================================================================
# 추론 스레드 (Tech Spec 7.2) — M2 완료 전까지 mock
# ===========================================================================

def _inference_thread():
    """frame_queue에서 프레임을 꺼내 시나리오별 추론(mock) 후 Socket.IO emit."""
    global _consecutive_failures

    logger.info("[Inference] 스레드 시작 (mock 모드)")
    fps_counter = 0
    fps_timer = time.time()

    while not _stop_event.is_set():
        # 시나리오 ④ (사각지대)는 JS 단독이므로 Python 추론 불필요
        if _state["mode"] == "post_trip":
            time.sleep(0.5)
            continue

        try:
            frame = _frame_queue.get(timeout=1.0)
        except Exception:
            continue

        infer_start = time.perf_counter()
        _state["inference_active"] = True

        try:
            # ── Mock 추론: AI 엔진(M2)이 아직 없으므로 원본 프레임에 정보 오버레이 ──
            processed = frame.copy()
            detections = []
            mode = _state["mode"]

            if mode == "boarding":
                model_name = "FaceDetector + ArcFace"
                # 실제 얼굴 감지 시도 (MediaPipe)
                face_detections = _detect_faces_mock(frame)
                registered_names = list(_state["registered_faces"].keys())

                for i, face in enumerate(face_detections):
                    # 등록된 이름이 있으면 순서대로 매칭 (mock 인식)
                    if i < len(registered_names):
                        label = registered_names[i]
                        confidence = 0.92
                        alert_level = "face_recognized"
                    else:
                        label = "미등록"
                        confidence = 0.0
                        alert_level = "face_unknown"

                    detections.append({
                        "type": "face",
                        "bbox": face["bbox"],
                        "label": label,
                        "confidence": confidence,
                        "alert_level": alert_level,
                    })

                # 인식 이벤트 emit (1초에 1번만)
                if face_detections and fps_counter == 0:
                    recognized = [d["label"] for d in detections if d["label"] != "미등록"]
                    unknown_count = sum(1 for d in detections if d["label"] == "미등록")
                    if recognized:
                        socketio.emit("event", {
                            "type": "face_recognized",
                            "message": ", ".join(recognized) + " 인식됨",
                        })
                    if unknown_count > 0:
                        socketio.emit("event", {
                            "type": "face_unknown",
                            "message": f"미등록 얼굴 {unknown_count}명 감지",
                        })

            elif mode == "transit":
                model_name = "YOLOv8n + MediaPipe Pose (mock)"

            elif mode == "alighting":
                model_name = "YOLOv8n (mock)"
                if _state["engine_off"]:
                    # mock: 잔류인원 스캔 시뮬레이션
                    detections.append({
                        "type": "passenger",
                        "bbox": [100, 100, 300, 400],
                        "label": "잔류인원 스캔 중",
                        "confidence": 0.0,
                        "alert_level": "normal",
                    })
            else:
                model_name = "None"

            infer_elapsed = (time.perf_counter() - infer_start) * 1000

            # FPS 계산
            fps_counter += 1
            elapsed_since_timer = time.time() - fps_timer
            if elapsed_since_timer >= 1.0:
                current_fps = fps_counter / elapsed_since_timer
                fps_counter = 0
                fps_timer = time.time()
            else:
                current_fps = _metrics["fps"]

            # 프레임을 base64 JPEG로 인코딩 (quality 70)
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, 70]
            _, jpeg_buf = cv2.imencode(".jpg", processed, encode_params)
            frame_b64 = base64.b64encode(jpeg_buf).decode("ascii")

            # metrics 갱신
            with _metrics_lock:
                _metrics["fps"] = round(current_fps, 1)
                _metrics["inference_ms"] = round(infer_elapsed, 1)
                _metrics["model_name"] = model_name
                _metrics["frame_count"] += 1

            # Socket.IO emit: frame 이벤트 (Tech Spec 8.1)
            socketio.emit("frame", {
                "image": frame_b64,
                "mode": mode,
                "detections": detections,
                "metrics": {
                    "cpu_percent": _metrics["cpu_percent"],
                    "memory_percent": _metrics["memory_percent"],
                    "fps": _metrics["fps"],
                    "inference_ms": _metrics["inference_ms"],
                    "model_name": model_name,
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            _consecutive_failures = 0
            if _fallback_mgr:
                _fallback_mgr.report_inference_success()

        except Exception as e:
            logger.error("[Inference] 추론 오류: %s", e)
            _consecutive_failures += 1
            if _fallback_mgr:
                _fallback_mgr.report_inference_failure()

        # 추론 FPS 제어 (~5fps target)
        time.sleep(max(0, 0.2 - (time.perf_counter() - infer_start)))

    _state["inference_active"] = False
    logger.info("[Inference] 스레드 종료")


# ===========================================================================
# 성능 모니터 스레드 (Tech Spec 7.2)
# ===========================================================================

def _performance_thread():
    """psutil로 CPU/메모리 1초 간격 샘플링 → Socket.IO emit."""
    logger.info("[PerfMon] 스레드 시작")
    process = psutil.Process(os.getpid())

    while not _stop_event.is_set():
        try:
            cpu = psutil.cpu_percent(interval=None)
            mem = process.memory_info()
            mem_percent = process.memory_percent()

            with _metrics_lock:
                _metrics["cpu_percent"] = round(cpu, 1)
                _metrics["memory_percent"] = round(mem_percent, 1)

            # Socket.IO emit: performance 이벤트
            socketio.emit("performance", {
                "cpu_percent": round(cpu, 1),
                "memory_percent": round(mem_percent, 1),
                "memory_mb": round(mem.rss / 1024 / 1024, 1),
                "fps": _metrics["fps"],
                "inference_ms": _metrics["inference_ms"],
                "model_name": _metrics["model_name"],
                "frame_count": _metrics["frame_count"],
            })

            # Fallback: 메모리 95% 이상 체크
            if _fallback_mgr and mem_percent > 95:
                _fallback_mgr.report_memory_critical()

        except Exception as e:
            logger.error("[PerfMon] 오류: %s", e)

        time.sleep(1.0)

    logger.info("[PerfMon] 스레드 종료")


# ===========================================================================
# Socket.IO 이벤트 핸들러 (T22 — WebSocket 프로토콜)
# ===========================================================================

@socketio.on("connect")
def handle_connect():
    _state["connected_clients"] += 1
    logger.info("[WS] 클라이언트 연결 (총 %d)", _state["connected_clients"])
    emit("status", _get_status())


@socketio.on("disconnect")
def handle_disconnect():
    _state["connected_clients"] = max(0, _state["connected_clients"] - 1)
    logger.info("[WS] 클라이언트 연결 해제 (총 %d)", _state["connected_clients"])


@socketio.on("change_mode")
def handle_change_mode(data):
    """시나리오 모드 변경."""
    mode = data.get("mode", "").strip()
    valid_modes = ("boarding", "transit", "alighting", "post_trip")
    if mode not in valid_modes:
        emit("error", {"message": f"잘못된 모드: {mode}. 유효: {valid_modes}"})
        return

    old_mode = _state["mode"]
    _state["mode"] = mode
    logger.info("[WS] 모드 변경: %s → %s", old_mode, mode)

    # 모드별 활성 모델 맵 (Tech Spec 8.3)
    model_map = {
        "boarding": ["FaceDetector", "ArcFace"],
        "transit": ["YOLOv8n", "MediaPipe Pose"],
        "alighting": ["YOLOv8n"],
        "post_trip": [],
    }

    socketio.emit("mode_changed", {
        "mode": mode,
        "previous_mode": old_mode,
        "active_models": model_map.get(mode, []),
    })

    _log_event("mode_change", f"모드 변경: {old_mode} → {mode}")


@socketio.on("engine_off")
def handle_engine_off():
    """시동 OFF — 잔류인원 스캔 시작."""
    _state["engine_off"] = True
    logger.info("[WS] 시동 OFF — 잔류인원 스캔 시작")
    _log_event("engine_off", "시동 OFF — 잔류인원 스캔 시작")
    socketio.emit("status", _get_status())


@socketio.on("engine_on")
def handle_engine_on():
    """시동 ON — 잔류인원 스캔 중지."""
    _state["engine_off"] = False
    logger.info("[WS] 시동 ON")
    _log_event("engine_on", "시동 ON")
    socketio.emit("status", _get_status())


@socketio.on("register_face")
def handle_register_face(data):
    """Socket.IO를 통한 얼굴 등록 요청."""
    name = data.get("name", "").strip()
    if not name:
        emit("error", {"message": "이름을 입력하세요."})
        return

    # mock: 현재 프레임에서 얼굴 등록 (AI 엔진 대기)
    with _frame_lock:
        if _latest_raw_frame is None:
            emit("error", {"message": "카메라 프레임이 없습니다."})
            return

    _state["registered_faces"][name] = True  # mock embedding
    logger.info("[WS] 얼굴 등록: %s", name)
    _log_event("face_registered", f"{name} 원생 얼굴 등록 완료",
               {"student_name": name})
    emit("face_registered", {
        "success": True,
        "name": name,
        "registered_count": len(_state["registered_faces"]),
    })
    socketio.emit("status", _get_status())


@socketio.on("reset_demo")
def handle_reset_demo():
    """데모 전체 리셋."""
    _state["mode"] = "boarding"
    _state["engine_off"] = False
    _state["registered_faces"].clear()
    _state["event_log"].clear()
    _state["consent_log"].clear()
    with _metrics_lock:
        _metrics["frame_count"] = 0
    logger.info("[WS] 데모 리셋")
    socketio.emit("status", _get_status())
    socketio.emit("event", {
        "type": "system",
        "message": "데모가 초기화되었습니다.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@socketio.on("blindspot_event")
def handle_blindspot_event(data):
    """사각지대 이벤트 수신 (JS → 서버)."""
    event_type = data.get("type", "unknown")
    distance = data.get("distance", 0)
    child_id = data.get("child_id", "unknown")

    level_map = {"caution": "주의", "warning": "경고", "danger": "위험"}
    level_kr = level_map.get(event_type, event_type)

    _log_event("blindspot", f"사각지대 {level_kr}: 거리 {distance}m",
               {"alert_type": event_type, "distance": distance, "child_id": child_id})

    # 위험 단계면 alert emit
    if event_type == "danger":
        socketio.emit("alert", {
            "level": "danger",
            "message": f"사각지대 위험! 어린이 감지 (거리: {distance}m)",
            "scenario": "blindspot",
        })


# ===========================================================================
# REST API 라우트 (T20)
# ===========================================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/mode", methods=["POST"])
def api_set_mode():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "").strip()
    valid_modes = ("boarding", "transit", "alighting", "post_trip")
    if mode not in valid_modes:
        return jsonify({"error": f"잘못된 모드: {mode}", "valid": valid_modes}), 400

    old_mode = _state["mode"]
    _state["mode"] = mode

    model_map = {
        "boarding": ["FaceDetector", "ArcFace"],
        "transit": ["YOLOv8n", "MediaPipe Pose"],
        "alighting": ["YOLOv8n"],
        "post_trip": [],
    }
    socketio.emit("mode_changed", {
        "mode": mode,
        "previous_mode": old_mode,
        "active_models": model_map.get(mode, []),
    })

    _log_event("mode_change", f"모드 변경: {old_mode} → {mode}")
    return jsonify({"success": True, "mode": mode, "previous": old_mode})


@app.route("/api/engine_off", methods=["POST"])
def api_engine_off():
    _state["engine_off"] = True
    _log_event("engine_off", "시동 OFF — 잔류인원 스캔 시작")
    socketio.emit("status", _get_status())
    return jsonify({"success": True, "engine_off": True})


@app.route("/api/engine_on", methods=["POST"])
def api_engine_on():
    _state["engine_off"] = False
    _log_event("engine_on", "시동 ON")
    socketio.emit("status", _get_status())
    return jsonify({"success": True, "engine_off": False})


@app.route("/api/register_face", methods=["POST"])
def api_register_face():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "이름이 필요합니다."}), 400

    consent = data.get("consent", False)
    if not consent:
        return jsonify({"error": "보호자 동의가 필요합니다 (consent: true)."}), 400

    with _frame_lock:
        if _latest_raw_frame is None:
            return jsonify({"error": "카메라 프레임이 없습니다."}), 503

    # mock 등록
    _state["registered_faces"][name] = True
    _log_event("face_registered", f"{name} 원생 얼굴 등록 완료",
               {"student_name": name, "consent": True})

    # 등록 성공 이벤트 브로드캐스트
    socketio.emit("event", {
        "type": "face_registered",
        "message": f"✔ {name} 얼굴 등록 완료",
    })
    socketio.emit("face_registered", {
        "success": True,
        "name": name,
        "registered_count": len(_state["registered_faces"]),
        "face_names": list(_state["registered_faces"].keys()),
    })
    socketio.emit("status", _get_status())
    return jsonify({
        "success": True,
        "name": name,
        "registered_count": len(_state["registered_faces"]),
    })


@app.route("/api/face/<name>", methods=["DELETE"])
def api_delete_face(name: str):
    if name not in _state["registered_faces"]:
        return jsonify({"error": f"등록되지 않은 이름: {name}"}), 404

    del _state["registered_faces"][name]
    _log_event("face_deleted", f"{name} 원생 얼굴 삭제",
               {"student_name": name})
    socketio.emit("status", _get_status())
    return jsonify({"success": True, "name": name})


@app.route("/api/events", methods=["GET"])
def api_get_events():
    limit = request.args.get("limit", 30, type=int)
    return jsonify(_state["event_log"][:limit])


@app.route("/api/status", methods=["GET"])
def api_get_status():
    return jsonify(_get_status())


@app.route("/api/performance", methods=["GET"])
def api_get_performance():
    with _metrics_lock:
        return jsonify({
            "cpu_percent": _metrics["cpu_percent"],
            "memory_percent": _metrics["memory_percent"],
            "fps": _metrics["fps"],
            "inference_ms": _metrics["inference_ms"],
            "model_name": _metrics["model_name"],
            "frame_count": _metrics["frame_count"],
        })


@app.route("/api/consent", methods=["POST"])
def api_consent():
    data = request.get_json(silent=True) or {}
    guardian_name = data.get("guardian_name", "").strip()
    student_name = data.get("student_name", "").strip()
    if not guardian_name or not student_name:
        return jsonify({"error": "guardian_name, student_name 필요"}), 400

    record = {
        "guardian_name": guardian_name,
        "student_name": student_name,
        "consent_type": data.get("consent_type", "face_recognition"),
        "agreed": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _state["consent_log"].append(record)
    _log_event("consent", f"보호자 동의: {guardian_name} → {student_name}",
               record)
    return jsonify({"success": True, "record": record})


@app.route("/api/demo/reset", methods=["POST"])
def api_reset_demo():
    _state["mode"] = "boarding"
    _state["engine_off"] = False
    _state["registered_faces"].clear()
    _state["event_log"].clear()
    _state["consent_log"].clear()
    with _metrics_lock:
        _metrics["frame_count"] = 0

    socketio.emit("status", _get_status())
    socketio.emit("event", {
        "type": "system",
        "message": "데모가 초기화되었습니다.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    logger.info("[API] 데모 리셋 완료")
    return jsonify({"success": True})


@app.route("/api/blindspot_event", methods=["POST"])
def api_blindspot_event():
    data = request.get_json(silent=True) or {}
    event_type = data.get("type", "unknown")
    distance = data.get("distance", 0)

    level_map = {"caution": "주의", "warning": "경고", "danger": "위험"}
    level_kr = level_map.get(event_type, event_type)

    _log_event("blindspot", f"사각지대 {level_kr}: 거리 {distance}m", data)

    if event_type == "danger":
        socketio.emit("alert", {
            "level": "danger",
            "message": f"사각지대 위험! 어린이 감지 (거리: {distance}m)",
            "scenario": "blindspot",
        })

    return jsonify({"ok": True})


# ===========================================================================
# 서버 시작
# ===========================================================================

def start_server(host: str | None = None, port: int | None = None):
    """서버 시작. 카메라/추론/성능 모니터 스레드를 함께 시작한다."""
    global _bridge, _fallback_mgr

    host = host or config.SERVER_HOST
    port = port or config.SERVER_PORT

    _state["start_time"] = time.time()

    # 백엔드 브릿지 초기화
    _bridge = BackendBridge(
        backend_url=config.BACKEND_URL,
        api_token=config.DEMO_API_TOKEN,
        standalone_setting=config.STANDALONE_MODE,
    )
    _bridge.check_backend()
    logger.info("[Server] 백엔드 모드: %s (connected=%s)",
                _bridge.mode, _bridge.connected)

    # Fallback 매니저 초기화
    _fallback_mgr = FallbackManager(socketio=socketio, log_event_fn=_log_event)

    # 백엔드 연결 상태 emit
    socketio.emit("status", _get_status())

    # 데몬 스레드 시작
    threads = [
        threading.Thread(target=_camera_thread, name="CameraThread", daemon=True),
        threading.Thread(target=_inference_thread, name="InferenceThread", daemon=True),
        threading.Thread(target=_performance_thread, name="PerfMonThread", daemon=True),
        threading.Thread(target=_fallback_mgr.monitor_loop,
                         args=(_stop_event,), name="FallbackThread", daemon=True),
    ]
    for t in threads:
        t.start()
        logger.info("[Server] %s 시작", t.name)

    logger.info("[Server] Flask+SocketIO 서버 시작: http://%s:%d", host, port)

    try:
        socketio.run(app, host=host, port=port, debug=False, allow_unsafe_werkzeug=True)
    except KeyboardInterrupt:
        logger.info("[Server] 종료 요청")
    finally:
        _stop_event.set()
        logger.info("[Server] 서버 종료")


if __name__ == "__main__":
    start_server()
