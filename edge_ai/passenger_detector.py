"""잔류 인원 감지 모듈.

시동 OFF 후 차량 내 잔류 인원을 YOLOv8로 감지한다.
"""

import logging
from dataclasses import dataclass

import cv2
import numpy as np
from ultralytics import YOLO

from config import YOLO_CONFIDENCE, YOLO_MODEL

logger = logging.getLogger(__name__)


@dataclass
class PassengerDetection:
    count: int
    bboxes: list[tuple[int, int, int, int]]  # (x1, y1, x2, y2) per person
    confidences: list[float]


class PassengerDetector:
    def __init__(self, yolo_model: YOLO | None = None) -> None:
        """YOLO 모델을 공유받거나 새로 로드."""
        if yolo_model is not None:
            self._yolo = yolo_model
        else:
            logger.info("PassengerDetector: YOLOv8 모델 로딩: %s", YOLO_MODEL)
            self._yolo = YOLO(YOLO_MODEL)

    def detect(self, frame: np.ndarray) -> PassengerDetection:
        """프레임에서 잔류 인원 감지.

        Args:
            frame: BGR 이미지

        Returns:
            감지 결과 (인원 수, 바운딩 박스, 신뢰도)
        """
        results = self._yolo(frame, verbose=False, conf=YOLO_CONFIDENCE)

        bboxes: list[tuple[int, int, int, int]] = []
        confidences: list[float] = []

        if results and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                if cls_id != 0:  # person only
                    continue
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                bboxes.append((x1, y1, x2, y2))
                confidences.append(conf)

        return PassengerDetection(
            count=len(bboxes),
            bboxes=bboxes,
            confidences=confidences,
        )

    def scan_multiple_frames(
        self, cap: cv2.VideoCapture, num_frames: int = 5
    ) -> PassengerDetection:
        """여러 프레임을 분석하여 잔류 인원을 더 정확하게 감지.

        Args:
            cap: OpenCV VideoCapture 객체
            num_frames: 분석할 프레임 수

        Returns:
            가장 많은 인원이 감지된 결과
        """
        best_result = PassengerDetection(count=0, bboxes=[], confidences=[])

        for _ in range(num_frames):
            ret, frame = cap.read()
            if not ret:
                break
            result = self.detect(frame)
            if result.count > best_result.count:
                best_result = result

        return best_result
