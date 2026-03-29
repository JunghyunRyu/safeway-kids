"""Edge AI PoC 단위 테스트.

모델 파일 없이도 동작하는 테스트 위주로 구성.
모델 의존 테스트는 pytest.mark.skipif로 보호.
"""

import os
import sys
import time

import pytest

# edge_ai를 패키지 루트로 설정
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# =========================================================================
# Config
# =========================================================================

class TestConfig:
    def test_server_port(self):
        from config import SERVER_PORT
        assert SERVER_PORT == 7860

    def test_input_resolution(self):
        from config import INPUT_RESOLUTION
        assert INPUT_RESOLUTION == 416

    def test_model_paths_defined(self):
        from config import YOLO_ONNX_PATH, ARCFACE_ONNX_PATH
        assert YOLO_ONNX_PATH.endswith("yolov8n.onnx")
        assert ARCFACE_ONNX_PATH.endswith("arcface_w600k_r50.onnx")

    def test_backend_defaults(self):
        from config import INFERENCE_BACKEND, STANDALONE_MODE
        assert INFERENCE_BACKEND == "cpu"
        assert STANDALONE_MODE in ("auto", "true", "false")

    def test_alert_thresholds(self):
        from config import (
            ALERT_CONFIDENCE_MIN, ALERT_DURATION_SEC,
            ALERT_TEMPORAL_FRAMES, ALERT_TEMPORAL_MAJORITY,
        )
        assert 0 < ALERT_CONFIDENCE_MIN <= 1.0
        assert ALERT_DURATION_SEC > 0
        assert ALERT_TEMPORAL_MAJORITY <= ALERT_TEMPORAL_FRAMES


# =========================================================================
# ScenarioManager
# =========================================================================

class TestScenarioManager:
    def test_initial_mode(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        assert mgr.current_mode == ScenarioMode.BOARDING

    def test_valid_transition(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        assert mgr.set_mode(ScenarioMode.TRANSIT) is True
        assert mgr.current_mode == ScenarioMode.TRANSIT

    def test_invalid_transition_rejected(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        # BOARDING -> POST_TRIP is not in VALID_TRANSITIONS
        assert mgr.set_mode(ScenarioMode.POST_TRIP) is False
        assert mgr.current_mode == ScenarioMode.BOARDING

    def test_force_transition(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        assert mgr.set_mode(ScenarioMode.POST_TRIP, force=True) is True
        assert mgr.current_mode == ScenarioMode.POST_TRIP

    def test_same_mode_noop(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        assert mgr.set_mode(ScenarioMode.BOARDING) is True

    def test_active_models_map(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        models = mgr.active_models
        assert models["face_recognizer"] is True
        assert models["behavior_analyzer"] is False

    def test_transit_models(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        mgr.set_mode(ScenarioMode.TRANSIT)
        models = mgr.active_models
        assert models["behavior_analyzer"] is True
        assert models["face_recognizer"] is False

    def test_demo_step_sequence(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode, DEMO_SEQUENCE
        mgr = ScenarioManager()
        # Initial step is 0 (BOARDING)
        next_mode = mgr.next_demo_step()
        assert next_mode == DEMO_SEQUENCE[1]
        assert mgr.current_mode == DEMO_SEQUENCE[1]

    def test_go_to_demo_step(self):
        from core.scenario_manager import ScenarioManager, DEMO_SEQUENCE
        mgr = ScenarioManager()
        target = mgr.go_to_demo_step(2)
        assert target == DEMO_SEQUENCE[2]

    def test_is_module_active(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        assert mgr.is_module_active("face_recognizer") is True
        assert mgr.is_module_active("behavior_analyzer") is False
        assert mgr.is_module_active("nonexistent") is False

    def test_get_status(self):
        from core.scenario_manager import ScenarioManager
        mgr = ScenarioManager()
        status = mgr.get_status()
        assert "mode" in status
        assert "active_models" in status
        assert "demo_step" in status
        assert status["mode"] == "boarding"

    def test_reset(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        mgr = ScenarioManager()
        mgr.set_mode(ScenarioMode.TRANSIT)
        mgr.reset()
        assert mgr.current_mode == ScenarioMode.BOARDING

    def test_mode_change_callback(self):
        from core.scenario_manager import ScenarioManager, ScenarioMode
        callback_log = []

        def on_change(old, new, activation):
            callback_log.append((old, new))

        mgr = ScenarioManager(on_mode_change=on_change)
        mgr.set_mode(ScenarioMode.TRANSIT)
        assert len(callback_log) == 1
        assert callback_log[0] == (ScenarioMode.BOARDING, ScenarioMode.TRANSIT)

    def test_scenario_info(self):
        from core.scenario_manager import ScenarioManager
        mgr = ScenarioManager()
        info = mgr.scenario_info
        assert "title" in info
        assert "domain" in info


# =========================================================================
# BoardingManager
# =========================================================================

class TestBoardingManager:
    def test_initial_mode(self):
        from core.boarding_manager import BoardingManager, BoardingMode
        mgr = BoardingManager()
        assert mgr.mode == BoardingMode.IDLE

    def test_record_boarding(self):
        from core.boarding_manager import BoardingManager, CheckResult
        mgr = BoardingManager()
        resp = mgr.record_boarding("김민준", 0.95)
        assert resp.result == CheckResult.BOARDING_OK
        assert resp.name == "김민준"

    def test_already_boarded(self):
        from core.boarding_manager import BoardingManager, CheckResult
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        resp = mgr.record_boarding("김민준", 0.90)
        assert resp.result == CheckResult.ALREADY_BOARDED

    def test_record_alighting(self):
        from core.boarding_manager import BoardingManager, CheckResult
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        resp = mgr.record_alighting("김민준", 0.92)
        assert resp.result in (CheckResult.ALIGHTING_OK, CheckResult.ALL_ALIGHTED)

    def test_alighting_not_boarded(self):
        from core.boarding_manager import BoardingManager, CheckResult
        mgr = BoardingManager()
        resp = mgr.record_alighting("미등록", 0.80)
        assert resp.result == CheckResult.NOT_BOARDED

    def test_all_alighted(self):
        from core.boarding_manager import BoardingManager
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        mgr.record_boarding("이서연", 0.93)
        mgr.record_alighting("김민준", 0.92)
        assert mgr.is_all_alighted() is False
        mgr.record_alighting("이서연", 0.91)
        assert mgr.is_all_alighted() is True

    def test_get_not_alighted(self):
        from core.boarding_manager import BoardingManager
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        mgr.record_boarding("이서연", 0.93)
        mgr.record_alighting("김민준", 0.92)
        not_alighted = mgr.get_not_alighted()
        assert len(not_alighted) == 1
        assert not_alighted[0].name == "이서연"

    def test_process_recognition_boarding(self):
        from core.boarding_manager import BoardingManager, BoardingMode, CheckResult
        mgr = BoardingManager()
        mgr.set_mode(BoardingMode.BOARDING)
        resp = mgr.process_recognition("김민준", 0.95)
        assert resp.result == CheckResult.BOARDING_OK

    def test_process_recognition_alighting(self):
        from core.boarding_manager import BoardingManager, BoardingMode, CheckResult
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        mgr.set_mode(BoardingMode.ALIGHTING)
        resp = mgr.process_recognition("김민준", 0.92)
        assert resp.result in (CheckResult.ALIGHTING_OK, CheckResult.ALL_ALIGHTED)

    def test_process_recognition_idle(self):
        from core.boarding_manager import BoardingManager, CheckResult
        mgr = BoardingManager()
        resp = mgr.process_recognition("김민준", 0.95)
        assert resp.result == CheckResult.UNREGISTERED

    def test_get_status(self):
        from core.boarding_manager import BoardingManager
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        status = mgr.get_status()
        assert status["total_boarded"] == 1
        assert status["total_alighted"] == 0
        assert len(status["passengers"]) == 1

    def test_reset(self):
        from core.boarding_manager import BoardingManager, BoardingMode
        mgr = BoardingManager()
        mgr.record_boarding("김민준", 0.95)
        mgr.set_mode(BoardingMode.BOARDING)
        mgr.reset()
        assert mgr.mode == BoardingMode.IDLE
        assert mgr.get_not_alighted() == []

    def test_event_callback(self):
        from core.boarding_manager import BoardingManager
        events = []

        def on_event(event_type, data):
            events.append(event_type)

        mgr = BoardingManager(on_event=on_event)
        mgr.record_boarding("김민준", 0.95)
        assert "boarding_confirmed" in events


# =========================================================================
# PerformanceMonitor
# =========================================================================

class TestPerformanceMonitor:
    def test_initial_metrics(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        metrics = mon.get_metrics_dict()
        assert "cpu_percent" in metrics
        assert "fps" in metrics
        assert "inference_ms" in metrics
        assert metrics["fps"] == 0.0

    def test_record_inference(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        mon.record_inference(50.0, "test_model")
        metrics = mon.get_metrics_dict()
        assert metrics["inference_ms"] == 50.0
        assert metrics["active_model"] == "test_model"

    def test_record_frame_fps(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor(window_size=10)
        # Record frames at ~100fps
        for _ in range(5):
            mon.record_frame()
            time.sleep(0.01)
        metrics = mon.get_metrics()
        assert metrics.fps > 0

    def test_no_skip_below_threshold(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        mon.record_inference(50.0)  # well below 200ms threshold
        assert mon.should_skip_frame() is False

    def test_skip_above_threshold(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        mon.record_inference(250.0)  # above 200ms threshold
        # Should skip some frames now
        assert mon.should_skip_frame() is True

    def test_degradation_on_high_latency(self):
        from core.performance_monitor import PerformanceMonitor
        from config import INPUT_RESOLUTION_FALLBACK
        mon = PerformanceMonitor()
        mon.record_inference(350.0)  # above 300ms degradation threshold
        assert mon.is_degraded is True
        assert mon.current_resolution == INPUT_RESOLUTION_FALLBACK

    def test_recovery_from_degradation(self):
        from core.performance_monitor import PerformanceMonitor
        from config import INPUT_RESOLUTION
        mon = PerformanceMonitor()
        mon.record_inference(350.0)
        assert mon.is_degraded is True
        mon.record_inference(50.0)
        assert mon.is_degraded is False
        assert mon.current_resolution == INPUT_RESOLUTION

    def test_reset(self):
        from core.performance_monitor import PerformanceMonitor
        from config import INPUT_RESOLUTION
        mon = PerformanceMonitor()
        mon.record_inference(350.0)
        mon.reset()
        assert mon.is_degraded is False
        assert mon.current_resolution == INPUT_RESOLUTION
        assert mon.get_metrics().fps == 0.0

    def test_p95_inference(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        for i in range(100):
            mon.record_inference(float(i))
        metrics = mon.get_metrics()
        assert metrics.inference_p95_ms >= 90.0

    def test_update_system_metrics(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        mon.update_system_metrics()
        metrics = mon.get_metrics_dict()
        # Should have some CPU/memory values now
        assert isinstance(metrics["cpu_percent"], float)
        assert isinstance(metrics["memory_mb"], float)

    def test_uptime(self):
        from core.performance_monitor import PerformanceMonitor
        mon = PerformanceMonitor()
        time.sleep(0.05)
        metrics = mon.get_metrics()
        assert metrics.uptime_sec >= 0.04


# =========================================================================
# PassengerScanner
# =========================================================================

class TestPassengerScanner:
    def test_no_yolo_returns_empty(self):
        from core.passenger_scanner import PassengerScanner
        import numpy as np
        scanner = PassengerScanner(yolo_detector=None)
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = scanner.detect_single(frame)
        assert result.detected is False
        assert result.count == 0

    def test_last_result_initially_none(self):
        from core.passenger_scanner import PassengerScanner
        scanner = PassengerScanner()
        assert scanner.last_result is None

    def test_get_status_not_scanned(self):
        from core.passenger_scanner import PassengerScanner
        scanner = PassengerScanner()
        status = scanner.get_status()
        assert status["scanned"] is False

    def test_set_yolo_detector(self):
        from core.passenger_scanner import PassengerScanner
        scanner = PassengerScanner()
        # Just test that the setter works without error
        scanner.set_yolo_detector(None)


# =========================================================================
# BackendBridge
# =========================================================================

class TestBackendBridge:
    def test_standalone_mode_forced(self):
        from web.backend_bridge import BackendBridge
        bridge = BackendBridge(standalone_setting="true")
        result = bridge.check_backend()
        assert result is False
        assert bridge.mode == "standalone"
        assert bridge.connected is False

    def test_send_event_standalone(self):
        from web.backend_bridge import BackendBridge
        bridge = BackendBridge(standalone_setting="true")
        bridge.check_backend()
        ok = bridge.send_event("test_event", {"key": "value"})
        assert ok is True
        assert len(bridge.local_events) == 1

    def test_local_events_limit(self):
        from web.backend_bridge import BackendBridge
        bridge = BackendBridge(standalone_setting="true")
        bridge.check_backend()
        for i in range(510):
            bridge.send_event("test", {"i": i})
        assert len(bridge.local_events) <= 500


# =========================================================================
# Engine (모델 파일 없이 테스트 가능한 부분)
# =========================================================================

class TestEngine:
    def test_initial_state(self):
        from core.engine import Engine, ModelStatus
        engine = Engine()
        state = engine.state
        assert len(state.models) == 4
        assert state.warmup_done is False
        for info in state.models.values():
            assert info.status == ModelStatus.PENDING

    def test_get_loading_status(self):
        from core.engine import Engine
        engine = Engine()
        status = engine.get_loading_status()
        assert "models" in status
        assert "warmup_done" in status
        assert len(status["models"]) == 4

    def test_get_model_backend_pending(self):
        from core.engine import Engine
        engine = Engine()
        backend = engine.get_model_backend("yolov8n")
        assert backend is None  # not loaded yet


# =========================================================================
# YOLODetector (모델 필요)
# =========================================================================

class TestYOLODetector:
    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "yolov8n.onnx")),
        reason="YOLO model not found",
    )
    def test_load_and_detect(self):
        from core.yolo_detector import YOLODetector
        import numpy as np
        det = YOLODetector()
        assert det is not None
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        results = det.detect(frame)
        assert isinstance(results, list)

    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "yolov8n.onnx")),
        reason="YOLO model not found",
    )
    def test_preprocess_shape(self):
        from core.yolo_detector import YOLODetector
        import numpy as np
        det = YOLODetector()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        tensor, ratio, pad = det.preprocess(frame)
        assert tensor.shape[0] == 1  # batch
        assert tensor.shape[1] == 3  # channels


# =========================================================================
# HAL Backend
# =========================================================================

class TestHALBackend:
    def test_create_cpu_backend(self):
        from hal.backend import create_backend, CPUBackend
        backend = create_backend("cpu", num_threads=2)
        assert isinstance(backend, CPUBackend)
        assert backend.is_loaded is False

    def test_create_jetson_backend(self):
        from hal.backend import create_backend, JetsonBackend
        backend = create_backend("jetson")
        assert isinstance(backend, JetsonBackend)
        assert backend.is_loaded is False

    def test_invalid_backend_raises(self):
        from hal.backend import create_backend
        with pytest.raises(ValueError):
            create_backend("invalid")

    def test_cpu_device_info(self):
        from hal.backend import CPUBackend
        backend = CPUBackend(num_threads=4)
        info = backend.get_device_info()
        assert info["backend"] == "cpu"
        assert info["threads"] == 4

    def test_jetson_not_implemented(self):
        from hal.backend import JetsonBackend
        backend = JetsonBackend()
        with pytest.raises(NotImplementedError):
            backend.load_model("test.onnx")


# =========================================================================
# EdgeAIApp 통합 (main_v2)
# =========================================================================

class TestEdgeAIApp:
    def test_app_creation(self):
        from main_v2 import EdgeAIApp
        app = EdgeAIApp()
        assert app.engine is not None
        assert app.scenario_mgr is not None
        assert app.boarding_mgr is not None
        assert app.perf_monitor is not None

    def test_change_mode(self):
        from main_v2 import EdgeAIApp
        app = EdgeAIApp()
        assert app.change_mode("transit") is True
        assert app.scenario_mgr.current_mode.value == "transit"

    def test_change_mode_invalid(self):
        from main_v2 import EdgeAIApp
        app = EdgeAIApp()
        assert app.change_mode("invalid_mode") is False

    def test_reset(self):
        from main_v2 import EdgeAIApp
        app = EdgeAIApp()
        app.change_mode("transit")
        app.boarding_mgr.record_boarding("테스트", 0.9)
        app.reset()
        assert app.scenario_mgr.current_mode.value == "boarding"

    def test_process_frame_without_models(self):
        """모델 없이도 process_frame이 에러 없이 동작."""
        import numpy as np
        from main_v2 import EdgeAIApp
        app = EdgeAIApp()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = app.process_frame(frame)
        assert "mode" in result
        assert "detections" in result
        assert "metrics" in result
        assert isinstance(result["detections"], list)
