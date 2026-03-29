"""Hardware Abstraction Layer - 추론 백엔드.

CPU(ONNX Runtime) / Jetson(TensorRT) 전환을 추상화한다.
Tech Spec 섹션 24 구현.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class InferenceBackend(ABC):
    """추론 백엔드 추상 인터페이스."""

    @abstractmethod
    def load_model(self, model_path: str, **kwargs) -> None:
        """모델 파일 로드."""

    @abstractmethod
    def infer(self, input_data: np.ndarray) -> Any:
        """추론 실행. 입력은 전처리된 numpy 배열."""

    @abstractmethod
    def get_device_info(self) -> dict:
        """디바이스 정보 반환."""

    @property
    @abstractmethod
    def is_loaded(self) -> bool:
        """모델 로드 여부."""


class CPUBackend(InferenceBackend):
    """PoC용 CPU 백엔드 (ONNX Runtime)."""

    def __init__(self, num_threads: int = 4):
        self._session = None
        self._num_threads = num_threads
        self._model_path: str | None = None

    def load_model(self, model_path: str, **kwargs) -> None:
        import onnxruntime as ort

        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = self._num_threads
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        providers = ["CPUExecutionProvider"]
        self._session = ort.InferenceSession(
            model_path, sess_options=sess_options, providers=providers,
        )
        self._model_path = model_path
        logger.info("[HAL] ONNX 모델 로드 완료: %s", model_path)

    def infer(self, input_data: np.ndarray) -> Any:
        if self._session is None:
            raise RuntimeError("모델이 로드되지 않았습니다.")
        input_name = self._session.get_inputs()[0].name
        outputs = self._session.run(None, {input_name: input_data})
        return outputs

    def get_device_info(self) -> dict:
        return {
            "backend": "cpu",
            "framework": "ONNX Runtime",
            "threads": self._num_threads,
            "model": self._model_path,
        }

    @property
    def is_loaded(self) -> bool:
        return self._session is not None

    @property
    def session(self):
        """ONNX 세션 직접 접근 (고급 사용)."""
        return self._session


class JetsonBackend(InferenceBackend):
    """파일럿용 Jetson 백엔드 (TensorRT). Phase 2에서 구현."""

    def __init__(self):
        self._loaded = False

    def load_model(self, model_path: str, **kwargs) -> None:
        raise NotImplementedError(
            "JetsonBackend는 Phase 2 파일럿에서 구현 예정입니다. "
            "현재는 EDGE_BACKEND=cpu를 사용하세요."
        )

    def infer(self, input_data: np.ndarray) -> Any:
        raise NotImplementedError("JetsonBackend 미구현")

    def get_device_info(self) -> dict:
        return {
            "backend": "jetson",
            "framework": "TensorRT",
            "status": "not_implemented",
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded


def create_backend(backend_type: str = "cpu", **kwargs) -> InferenceBackend:
    """백엔드 팩토리. 환경변수 EDGE_BACKEND 값에 따라 생성."""
    if backend_type == "cpu":
        num_threads = kwargs.get("num_threads", 4)
        return CPUBackend(num_threads=num_threads)
    elif backend_type == "jetson":
        return JetsonBackend()
    else:
        raise ValueError(f"지원하지 않는 백엔드: {backend_type}")
