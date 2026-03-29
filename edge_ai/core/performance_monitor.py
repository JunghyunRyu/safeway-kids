"""성능 모니터 + 적응형 프레임 스킵.

CPU/메모리 실시간 측정, FPS 카운터, 추론 시간 추적,
적응형 프레임 스킵을 관리한다.

Tech Spec: Consensus P3 (적응형 프레임 스킵), FR6.7 (성능 대시보드)
"""

import logging
import time
from collections import deque
from dataclasses import dataclass, field

import psutil

from config import (
    DEGRADATION_THRESHOLD_MS,
    FRAME_SKIP_COUNT,
    FRAME_SKIP_THRESHOLD_MS,
    INPUT_RESOLUTION,
    INPUT_RESOLUTION_FALLBACK,
)

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """성능 지표."""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_mb: float = 0.0
    fps: float = 0.0
    inference_ms: float = 0.0
    inference_p95_ms: float = 0.0
    frame_skip: int = 0
    input_resolution: int = 416
    active_model: str = ""
    uptime_sec: float = 0.0


class PerformanceMonitor:
    """성능 모니터.

    - CPU/메모리: psutil 기반
    - FPS: sliding window (최근 30프레임)
    - 추론 시간: 모델별 측정 + P95
    - 적응형 프레임 스킵: 추론 시간에 따라 자동 조절
    """

    def __init__(self, window_size: int = 30):
        """
        Args:
            window_size: FPS 계산용 sliding window 크기 (프레임 수)
        """
        self._window_size = window_size
        self._frame_times: deque[float] = deque(maxlen=window_size)
        self._inference_times: deque[float] = deque(maxlen=100)  # P95 계산용
        self._start_time = time.perf_counter()
        self._process = psutil.Process()

        # 적응형 프레임 스킵 상태
        self._skip_counter = 0
        self._current_skip = 0
        self._current_resolution = INPUT_RESOLUTION
        self._degraded = False

        # 최신 시스템 메트릭
        self._cpu_percent = 0.0
        self._memory_percent = 0.0
        self._memory_mb = 0.0

        # 현재 활성 모델명
        self._active_model = ""

    @property
    def current_resolution(self) -> int:
        """현재 입력 해상도 (적응형 축소 반영)."""
        return self._current_resolution

    @property
    def is_degraded(self) -> bool:
        """Graceful degradation 활성 여부."""
        return self._degraded

    def update_system_metrics(self) -> None:
        """시스템 메트릭 갱신 (1초 간격 호출 권장)."""
        try:
            self._cpu_percent = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            self._memory_percent = mem.percent
            proc_mem = self._process.memory_info()
            self._memory_mb = proc_mem.rss / (1024 * 1024)
        except Exception as e:
            logger.debug("[PerfMon] 시스템 메트릭 수집 오류: %s", e)

    def record_frame(self) -> None:
        """프레임 처리 완료 기록 (FPS 계산용)."""
        self._frame_times.append(time.perf_counter())

    def record_inference(self, inference_ms: float, model_name: str = "") -> None:
        """추론 시간 기록 + 적응형 프레임 스킵 업데이트.

        Args:
            inference_ms: 추론 소요 시간 (ms)
            model_name: 활성 모델명
        """
        self._inference_times.append(inference_ms)
        self._active_model = model_name
        self._update_adaptive_skip(inference_ms)

    def should_skip_frame(self) -> bool:
        """현재 프레임을 스킵해야 하는지 반환.

        호출할 때마다 스킵 카운터가 감소한다.
        """
        if self._current_skip <= 0:
            return False

        self._skip_counter += 1
        if self._skip_counter >= self._current_skip:
            self._skip_counter = 0
            return False
        return True

    def get_metrics(self) -> PerformanceMetrics:
        """현재 성능 지표 반환."""
        return PerformanceMetrics(
            cpu_percent=round(self._cpu_percent, 1),
            memory_percent=round(self._memory_percent, 1),
            memory_mb=round(self._memory_mb, 1),
            fps=round(self._calculate_fps(), 1),
            inference_ms=round(self._get_latest_inference(), 1),
            inference_p95_ms=round(self._get_p95_inference(), 1),
            frame_skip=self._current_skip,
            input_resolution=self._current_resolution,
            active_model=self._active_model,
            uptime_sec=round(time.perf_counter() - self._start_time, 1),
        )

    def get_metrics_dict(self) -> dict:
        """성능 지표를 딕셔너리로 반환 (Socket.IO 전송용)."""
        m = self.get_metrics()
        return {
            "cpu_percent": m.cpu_percent,
            "memory_percent": m.memory_percent,
            "memory_mb": m.memory_mb,
            "fps": m.fps,
            "inference_ms": m.inference_ms,
            "inference_p95_ms": m.inference_p95_ms,
            "frame_skip": m.frame_skip,
            "input_resolution": m.input_resolution,
            "active_model": m.active_model,
            "uptime_sec": m.uptime_sec,
        }

    def reset(self) -> None:
        """통계 초기화."""
        self._frame_times.clear()
        self._inference_times.clear()
        self._start_time = time.perf_counter()
        self._skip_counter = 0
        self._current_skip = 0
        self._current_resolution = INPUT_RESOLUTION
        self._degraded = False

    def _calculate_fps(self) -> float:
        """sliding window 기반 FPS 계산."""
        if len(self._frame_times) < 2:
            return 0.0
        elapsed = self._frame_times[-1] - self._frame_times[0]
        if elapsed <= 0:
            return 0.0
        return (len(self._frame_times) - 1) / elapsed

    def _get_latest_inference(self) -> float:
        """최신 추론 시간 (ms)."""
        if not self._inference_times:
            return 0.0
        return self._inference_times[-1]

    def _get_p95_inference(self) -> float:
        """P95 추론 시간 (ms)."""
        if not self._inference_times:
            return 0.0
        sorted_times = sorted(self._inference_times)
        idx = int(len(sorted_times) * 0.95)
        idx = min(idx, len(sorted_times) - 1)
        return sorted_times[idx]

    def _update_adaptive_skip(self, inference_ms: float) -> None:
        """적응형 프레임 스킵 업데이트.

        - 추론 > 300ms: 해상도 축소(416→320) + 3프레임 스킵
        - 추론 > 200ms: 2프레임 스킵
        - 추론 ≤ 200ms: 스킵 없음
        """
        if inference_ms > DEGRADATION_THRESHOLD_MS:
            if not self._degraded:
                self._current_resolution = INPUT_RESOLUTION_FALLBACK
                self._degraded = True
                logger.warning(
                    "[PerfMon] Graceful degradation: 해상도 %d → %d (추론 %.0fms)",
                    INPUT_RESOLUTION, INPUT_RESOLUTION_FALLBACK, inference_ms,
                )
            self._current_skip = FRAME_SKIP_COUNT + 1  # 3프레임 스킵
        elif inference_ms > FRAME_SKIP_THRESHOLD_MS:
            self._current_skip = FRAME_SKIP_COUNT  # 2프레임 스킵
        else:
            self._current_skip = 0
            if self._degraded:
                self._current_resolution = INPUT_RESOLUTION
                self._degraded = False
                logger.info(
                    "[PerfMon] 해상도 복구: %d → %d (추론 %.0fms)",
                    INPUT_RESOLUTION_FALLBACK, INPUT_RESOLUTION, inference_ms,
                )
