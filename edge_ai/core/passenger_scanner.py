"""잔류 인원 감지 모듈 (ONNX 기반).

시동 OFF 후 차량 내 잔류 인원을 감지한다.
기존 passenger_detector.py의 로직을 ONNX 기반으로 재작성.

Tech Spec FR4.1~FR4.5 구현.
"""

import logging
import time
from dataclasses import dataclass
from typing import Any

import numpy as np

from config import REMAINING_SCAN_FRAMES

logger = logging.getLogger(__name__)


@dataclass
class ScanResult:
    """잔류 인원 스캔 결과."""
    detected: bool
    count: int
    bboxes: list[tuple[int, int, int, int]]
    confidences: list[float]
    scan_frames: int
    scan_time_ms: float


class PassengerScanner:
    """잔류 인원 감지기 (ONNX 기반).

    YOLODetector 인스턴스를 공유받아 person 감지를 수행한다.
    """

    def __init__(self, yolo_detector=None, on_event: Any = None):
        """
        Args:
            yolo_detector: YOLODetector 인스턴스 (공유). None이면 스캔 시 오류.
            on_event: 이벤트 콜백 (event_type: str, data: dict) -> None
        """
        self._yolo = yolo_detector
        self._on_event = on_event
        self._last_result: ScanResult | None = None

    @property
    def last_result(self) -> ScanResult | None:
        return self._last_result

    def set_yolo_detector(self, yolo_detector) -> None:
        """YOLODetector 인스턴스 설정 (지연 주입용)."""
        self._yolo = yolo_detector

    def detect_single(self, frame: np.ndarray) -> ScanResult:
        """단일 프레임에서 잔류 인원 감지.

        Args:
            frame: BGR 이미지

        Returns:
            ScanResult
        """
        if self._yolo is None:
            logger.error("[PassengerScanner] YOLODetector가 설정되지 않았습니다")
            return ScanResult(
                detected=False, count=0, bboxes=[], confidences=[],
                scan_frames=0, scan_time_ms=0,
            )

        t0 = time.perf_counter()
        detections = self._yolo.detect(frame)
        elapsed = (time.perf_counter() - t0) * 1000

        bboxes = [d["bbox"] for d in detections]
        confidences = [d["confidence"] for d in detections]
        count = len(detections)

        result = ScanResult(
            detected=count > 0,
            count=count,
            bboxes=bboxes,
            confidences=confidences,
            scan_frames=1,
            scan_time_ms=elapsed,
        )
        self._last_result = result
        return result

    def scan_multi_frame(self, frames: list[np.ndarray]) -> ScanResult:
        """Multi-frame 분석으로 잔류 인원을 정확하게 감지.

        연속 프레임을 분석하여 가장 많은 인원이 감지된 결과를 채택한다.
        Tech Spec FR4.2: 연속 5프레임 분석.

        Args:
            frames: BGR 이미지 리스트

        Returns:
            가장 많은 인원이 감지된 ScanResult
        """
        if self._yolo is None:
            logger.error("[PassengerScanner] YOLODetector가 설정되지 않았습니다")
            return ScanResult(
                detected=False, count=0, bboxes=[], confidences=[],
                scan_frames=0, scan_time_ms=0,
            )

        t0 = time.perf_counter()
        best = ScanResult(
            detected=False, count=0, bboxes=[], confidences=[],
            scan_frames=0, scan_time_ms=0,
        )

        scan_count = min(len(frames), REMAINING_SCAN_FRAMES)
        for i in range(scan_count):
            detections = self._yolo.detect(frames[i])
            count = len(detections)
            if count > best.count:
                best = ScanResult(
                    detected=True,
                    count=count,
                    bboxes=[d["bbox"] for d in detections],
                    confidences=[d["confidence"] for d in detections],
                    scan_frames=i + 1,
                    scan_time_ms=0,
                )

        elapsed = (time.perf_counter() - t0) * 1000
        best.scan_frames = scan_count
        best.scan_time_ms = elapsed

        self._last_result = best

        # 이벤트 발생
        if best.detected:
            logger.warning("[PassengerScanner] 잔류 인원 감지: %d명", best.count)
            self._emit_event("remaining_passenger", {
                "count": best.count,
                "confidences": best.confidences,
                "scan_frames": best.scan_frames,
            })
        else:
            logger.info("[PassengerScanner] ALL CLEAR (잔류 인원 없음)")
            self._emit_event("all_clear", {
                "scan_frames": best.scan_frames,
            })

        return best

    def get_status(self) -> dict:
        """현재 상태 딕셔너리 (UI 전송용)."""
        if self._last_result is None:
            return {"scanned": False}

        r = self._last_result
        return {
            "scanned": True,
            "detected": r.detected,
            "count": r.count,
            "scan_frames": r.scan_frames,
            "scan_time_ms": round(r.scan_time_ms, 1),
        }

    def _emit_event(self, event_type: str, data: dict) -> None:
        if self._on_event:
            try:
                self._on_event(event_type, data)
            except Exception as e:
                logger.error("[PassengerScanner] 이벤트 콜백 오류: %s", e)
