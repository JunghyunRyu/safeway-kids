"""Edge AI 엔진 — 모델 로딩 + warm-up + 시나리오 관리 진입점.

앱 시작 시 모든 AI 모델을 로드하고 warm-up을 수행한다.
Tech Spec: Consensus P5 (더미 프레임 5장 warm-up)
"""

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

import numpy as np

from config import (
    ARCFACE_ONNX_PATH,
    FACE_DETECTOR_PATH,
    INFERENCE_BACKEND,
    INPUT_RESOLUTION,
    ONNX_THREADS,
    POSE_LANDMARKER_PATH,
    WARMUP_FRAMES,
    YOLO_ONNX_PATH,
)
from hal.backend import InferenceBackend, create_backend

logger = logging.getLogger(__name__)


class ModelStatus(str, Enum):
    PENDING = "pending"
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"
    SKIPPED = "skipped"


@dataclass
class ModelInfo:
    name: str
    path: str
    status: ModelStatus = ModelStatus.PENDING
    backend: InferenceBackend | None = None
    load_time_ms: float = 0.0
    error: str = ""


@dataclass
class EngineState:
    models: dict[str, ModelInfo] = field(default_factory=dict)
    warmup_done: bool = False
    total_load_time_ms: float = 0.0


class Engine:
    """Edge AI 엔진. 모델 로딩, warm-up, 상태 관리."""

    def __init__(self, on_progress: Callable[[str, float, str], None] | None = None):
        """
        Args:
            on_progress: 로딩 진행 콜백 (stage, progress 0~1, message)
        """
        self._on_progress = on_progress or self._default_progress
        self._state = EngineState()
        self._backend_type = INFERENCE_BACKEND
        self._num_threads = ONNX_THREADS
        self._input_size = INPUT_RESOLUTION

        # 모델 정의
        self._state.models = {
            "yolov8n": ModelInfo(name="YOLOv8n ONNX", path=YOLO_ONNX_PATH),
            "arcface": ModelInfo(name="ArcFace ONNX", path=ARCFACE_ONNX_PATH),
            "face_detector": ModelInfo(name="MediaPipe FaceDetector", path=FACE_DETECTOR_PATH),
            "pose_landmarker": ModelInfo(name="MediaPipe PoseLandmarker", path=POSE_LANDMARKER_PATH),
        }

    @property
    def state(self) -> EngineState:
        return self._state

    def get_model_backend(self, model_key: str) -> InferenceBackend | None:
        """로드된 모델의 백엔드 반환."""
        info = self._state.models.get(model_key)
        if info and info.status == ModelStatus.READY:
            return info.backend
        return None

    def initialize(self) -> bool:
        """전체 모델 로딩 + warm-up 수행. 메인 스레드에서 호출."""
        logger.info("[Engine] 초기화 시작 (backend=%s, threads=%d)",
                     self._backend_type, self._num_threads)
        start = time.perf_counter()

        total_steps = len(self._state.models) + 1  # +1 for warmup
        current_step = 0

        # ONNX 모델 로드
        for key in ("yolov8n", "arcface"):
            info = self._state.models[key]
            current_step += 1
            progress = current_step / total_steps
            self._on_progress(key, progress, f"{info.name} 로딩 중...")
            self._load_onnx_model(info)

        # MediaPipe 모델은 실제 사용 시점에 로드 (mediapipe 자체 로더)
        # 여기서는 파일 존재 확인만 수행
        for key in ("face_detector", "pose_landmarker"):
            info = self._state.models[key]
            current_step += 1
            progress = current_step / total_steps
            self._on_progress(key, progress, f"{info.name} 확인 중...")
            self._check_mediapipe_model(info)

        # warm-up
        current_step += 1
        self._on_progress("warmup", current_step / total_steps, "Warm-up 수행 중...")
        self._warmup()

        elapsed = (time.perf_counter() - start) * 1000
        self._state.total_load_time_ms = elapsed

        ready_count = sum(
            1 for m in self._state.models.values()
            if m.status == ModelStatus.READY
        )
        total_count = len(self._state.models)

        logger.info("[Engine] 초기화 완료: %d/%d 모델 준비 (%.0fms)",
                     ready_count, total_count, elapsed)

        self._on_progress("done", 1.0, f"초기화 완료 ({ready_count}/{total_count} 모델)")
        return ready_count > 0

    def _load_onnx_model(self, info: ModelInfo) -> None:
        """ONNX 모델 로드."""
        import os
        if not os.path.exists(info.path):
            info.status = ModelStatus.ERROR
            info.error = f"파일 없음: {info.path}"
            logger.warning("[Engine] %s 로드 실패: %s", info.name, info.error)
            return

        info.status = ModelStatus.LOADING
        try:
            start = time.perf_counter()
            backend = create_backend(self._backend_type, num_threads=self._num_threads)
            backend.load_model(info.path)
            elapsed = (time.perf_counter() - start) * 1000

            info.backend = backend
            info.status = ModelStatus.READY
            info.load_time_ms = elapsed
            logger.info("[Engine] %s 로드 완료 (%.0fms)", info.name, elapsed)

        except Exception as e:
            info.status = ModelStatus.ERROR
            info.error = str(e)
            logger.error("[Engine] %s 로드 실패: %s", info.name, e)

    def _check_mediapipe_model(self, info: ModelInfo) -> None:
        """MediaPipe 모델 파일 존재 확인."""
        import os
        if os.path.exists(info.path):
            info.status = ModelStatus.READY
            info.load_time_ms = 0
            logger.info("[Engine] %s 파일 확인 완료", info.name)
        else:
            info.status = ModelStatus.ERROR
            info.error = f"파일 없음: {info.path}"
            logger.warning("[Engine] %s 파일 없음: %s", info.name, info.path)

    def _warmup(self) -> None:
        """더미 프레임으로 ONNX warm-up (Consensus P5)."""
        yolo_backend = self.get_model_backend("yolov8n")
        arcface_backend = self.get_model_backend("arcface")

        warmup_count = WARMUP_FRAMES
        logger.info("[Engine] Warm-up 시작 (%d 프레임)", warmup_count)

        if yolo_backend:
            dummy = np.random.rand(1, 3, self._input_size, self._input_size).astype(np.float32)
            for i in range(warmup_count):
                try:
                    yolo_backend.infer(dummy)
                except Exception:
                    pass
            logger.info("[Engine] YOLOv8n warm-up 완료")

        if arcface_backend:
            dummy = np.random.rand(1, 3, 112, 112).astype(np.float32)
            for i in range(warmup_count):
                try:
                    arcface_backend.infer(dummy)
                except Exception:
                    pass
            logger.info("[Engine] ArcFace warm-up 완료")

        self._state.warmup_done = True
        logger.info("[Engine] Warm-up 완료")

    def get_loading_status(self) -> dict:
        """현재 로딩 상태를 딕셔너리로 반환 (API/Socket.IO용)."""
        return {
            "models": {
                key: {
                    "name": info.name,
                    "status": info.status.value,
                    "load_time_ms": info.load_time_ms,
                    "error": info.error,
                }
                for key, info in self._state.models.items()
            },
            "warmup_done": self._state.warmup_done,
            "total_load_time_ms": self._state.total_load_time_ms,
        }

    @staticmethod
    def _default_progress(stage: str, progress: float, message: str) -> None:
        """기본 진행 콜백 (콘솔 출력)."""
        bar_len = 30
        filled = int(bar_len * progress)
        bar = "█" * filled + "░" * (bar_len - filled)
        logger.info("[%s] [%s] %.0f%% — %s", stage, bar, progress * 100, message)
