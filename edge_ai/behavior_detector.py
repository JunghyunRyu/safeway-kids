"""이상 행동 감지 모듈.

MediaPipe PoseLandmarker (Tasks API) + YOLOv8로 구현.
사람의 자세를 분석하여 서 있거나 넘어지는 행동을 감지한다.
"""

import logging
import os
import time
from dataclasses import dataclass
from enum import Enum

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions
import numpy as np
from ultralytics import YOLO

from config import (
    BEHAVIOR_FALLING_THRESHOLD,
    BEHAVIOR_STANDING_THRESHOLD,
    YOLO_CONFIDENCE,
    YOLO_MODEL,
)

logger = logging.getLogger(__name__)

_ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")


class BehaviorType(str, Enum):
    NORMAL = "normal"
    STANDING = "standing"
    FALLING = "falling"
    UNKNOWN = "unknown"


@dataclass
class BehaviorDetection:
    behavior: BehaviorType
    confidence: float
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2


class BehaviorDetector:
    def __init__(self) -> None:
        logger.info("YOLOv8 모델 로딩: %s", YOLO_MODEL)
        self._yolo = YOLO(YOLO_MODEL)

        model_path = os.path.join(_ASSETS_DIR, "pose_landmarker_lite.task")
        base_options = BaseOptions(model_asset_path=model_path)
        options = PoseLandmarkerOptions(
            base_options=base_options,
            num_poses=1,
        )
        self._pose = PoseLandmarker.create_from_options(options)

        self._prev_shoulder_y: float | None = None
        self._prev_time: float | None = None

        logger.info("BehaviorDetector 초기화 완료")

    def detect(self, frame: np.ndarray) -> list[BehaviorDetection]:
        results: list[BehaviorDetection] = []

        yolo_results = self._yolo(frame, verbose=False, conf=YOLO_CONFIDENCE)

        if not yolo_results or len(yolo_results[0].boxes) == 0:
            self._prev_shoulder_y = None
            return results

        for box in yolo_results[0].boxes:
            cls_id = int(box.cls[0])
            if cls_id != 0:  # person only
                continue

            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            person_crop = frame[max(0, y1):min(frame.shape[0], y2),
                                max(0, x1):min(frame.shape[1], x2)]

            if person_crop.size == 0:
                continue

            behavior = self._analyze_pose(person_crop)

            results.append(BehaviorDetection(
                behavior=behavior,
                confidence=conf,
                bbox=(x1, y1, x2, y2),
            ))

        return results

    def _analyze_pose(self, person_crop: np.ndarray) -> BehaviorType:
        """MediaPipe PoseLandmarker로 자세를 분석."""
        rgb_crop = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_crop)

        try:
            pose_results = self._pose.detect(mp_image)
        except Exception:
            return BehaviorType.UNKNOWN

        if not pose_results.pose_landmarks or len(pose_results.pose_landmarks) == 0:
            return BehaviorType.UNKNOWN

        landmarks = pose_results.pose_landmarks[0]

        # PoseLandmark indices (MediaPipe convention):
        # 11=left_shoulder, 12=right_shoulder, 23=left_hip, 24=right_hip,
        # 25=left_knee, 26=right_knee
        try:
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            left_knee = landmarks[25]
            right_knee = landmarks[26]
        except (IndexError, KeyError):
            return BehaviorType.UNKNOWN

        shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_y = (left_hip.y + right_hip.y) / 2
        knee_y = (left_knee.y + right_knee.y) / 2

        shoulder_x = (left_shoulder.x + right_shoulder.x) / 2
        hip_x = (left_hip.x + right_hip.x) / 2

        torso_height = abs(hip_y - shoulder_y)
        torso_width = abs(hip_x - shoulder_x)

        # 넘어짐: 어깨-엉덩이가 수평에 가까운 경우
        if torso_height > 0 and torso_width / max(torso_height, 0.01) > (1.0 / BEHAVIOR_FALLING_THRESHOLD):
            current_time = time.time()
            if self._prev_shoulder_y is not None and self._prev_time is not None:
                dt = current_time - self._prev_time
                if dt > 0:
                    velocity = abs(shoulder_y - self._prev_shoulder_y) / dt
                    if velocity > 0.5:
                        self._prev_shoulder_y = shoulder_y
                        self._prev_time = current_time
                        return BehaviorType.FALLING

            self._prev_shoulder_y = shoulder_y
            self._prev_time = current_time

            if torso_width / max(torso_height, 0.01) > 2.0:
                return BehaviorType.FALLING

        # 서 있음: 상체가 수직으로 길게 분포
        body_height = abs(knee_y - shoulder_y)
        if body_height > 0:
            upper_ratio = torso_height / body_height
            if upper_ratio > BEHAVIOR_STANDING_THRESHOLD and torso_height > 0.3:
                self._prev_shoulder_y = shoulder_y
                self._prev_time = time.time()
                return BehaviorType.STANDING

        self._prev_shoulder_y = shoulder_y
        self._prev_time = time.time()
        return BehaviorType.NORMAL

    def close(self) -> None:
        self._pose.close()
