"""이상 행동 감지 (ONNX YOLOv8 + MediaPipe Pose).

기존 behavior_detector.py를 ONNX 기반으로 리팩터링.
Tech Spec FR3.1~FR3.8, 섹션 25, 26 구현.
"""

import logging
import os
import time
from collections import deque
from dataclasses import dataclass
from enum import Enum

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions

from config import (
    ALERT_CONFIDENCE_MIN,
    ALERT_COOLDOWN_SEC,
    ALERT_DURATION_SEC,
    ALERT_TEMPORAL_FRAMES,
    ALERT_TEMPORAL_MAJORITY,
    BEHAVIOR_FALLING_RATIO,
    BEHAVIOR_STANDING_HEIGHT,
    BEHAVIOR_STANDING_RATIO,
    POSE_LANDMARKER_PATH,
)

logger = logging.getLogger(__name__)


class BehaviorType(str, Enum):
    NORMAL = "normal"
    STANDING = "standing"
    FALLING = "falling"
    UNKNOWN = "unknown"


@dataclass
class _AlertState:
    """개인별 경고 상태 추적."""
    detections: deque  # (timestamp, behavior, confidence) 최근 기록
    last_alert_time: dict  # behavior_type → last alert timestamp
    first_detect_time: dict  # behavior_type → first continuous detection time


class BehaviorAnalyzer:
    """이상 행동 감지 (YOLOv8 ONNX + MediaPipe Pose).

    - ONNX 기반 YOLODetector로 person 감지
    - MediaPipe PoseLandmarker로 상체 자세 분석
    - 거짓 경고 억제: confidence, duration, temporal majority, cooldown
    - 운행 모드(TRANSIT)에서만 동작
    """

    def __init__(self, yolo: "YOLODetector"):  # noqa: F821
        from core.yolo_detector import YOLODetector
        if not isinstance(yolo, YOLODetector):
            raise TypeError("yolo는 YOLODetector 인스턴스여야 합니다")

        self._yolo = yolo
        self._pose: PoseLandmarker | None = None
        self._last_inference_ms: float = 0.0

        # 거짓 경고 억제 (섹션 26)
        self._alert_states: dict[int, _AlertState] = {}

        # MediaPipe PoseLandmarker 초기화
        self._init_pose()

    def _init_pose(self) -> None:
        """MediaPipe PoseLandmarker 초기화."""
        if not os.path.exists(POSE_LANDMARKER_PATH):
            logger.error("[BehaviorAnalyzer] Pose 모델 없음: %s", POSE_LANDMARKER_PATH)
            return

        base_options = BaseOptions(model_asset_path=POSE_LANDMARKER_PATH)
        options = PoseLandmarkerOptions(
            base_options=base_options,
            num_poses=1,
        )
        self._pose = PoseLandmarker.create_from_options(options)
        logger.info("[BehaviorAnalyzer] MediaPipe PoseLandmarker 초기화 완료")

    @property
    def last_inference_ms(self) -> float:
        return self._last_inference_ms

    def analyze(self, frame: np.ndarray) -> list[dict]:
        """프레임 분석.

        Returns:
            [{"bbox": (x1,y1,x2,y2), "behavior": str, "confidence": float, "duration_sec": float}]
        """
        t0 = time.perf_counter()

        # 1. YOLO로 person 감지
        detections = self._yolo.detect(frame)

        results: list[dict] = []

        for idx, det in enumerate(detections):
            bbox = det["bbox"]
            det_conf = det["confidence"]
            x1, y1, x2, y2 = bbox

            # 2. person crop → MediaPipe Pose
            person_crop = frame[max(0, y1):min(frame.shape[0], y2),
                                max(0, x1):min(frame.shape[1], x2)]
            if person_crop.size == 0:
                continue

            # 3. 자세 분석
            behavior, pose_conf = self._classify_pose(person_crop)

            # 결합 신뢰도
            combined_conf = det_conf * pose_conf

            # 4. 거짓 경고 필터 적용
            now = time.time()
            duration = self._get_duration(idx, behavior, now)
            should_alert = self._apply_filters(idx, behavior, combined_conf, now)

            results.append({
                "bbox": bbox,
                "behavior": behavior.value,
                "confidence": round(combined_conf, 3),
                "duration_sec": round(duration, 1),
                "alert": should_alert,
            })

        self._last_inference_ms = (time.perf_counter() - t0) * 1000
        return results

    def _classify_pose(self, person_crop: np.ndarray) -> tuple[BehaviorType, float]:
        """자세 분류 (FR3.3~FR3.6).

        상체 랜드마크 기반:
        - standing: shoulder_y / hip_y 비율 >= 0.7 AND torso_height > 0.35
        - falling: torso_width / torso_height > 2.0
        - normal: 그 외
        """
        if self._pose is None:
            return BehaviorType.UNKNOWN, 0.0

        rgb_crop = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_crop)

        try:
            pose_results = self._pose.detect(mp_image)
        except Exception:
            return BehaviorType.UNKNOWN, 0.0

        if not pose_results.pose_landmarks or len(pose_results.pose_landmarks) == 0:
            return BehaviorType.UNKNOWN, 0.0

        landmarks = pose_results.pose_landmarks[0]

        # PoseLandmark indices (MediaPipe):
        # 11=left_shoulder, 12=right_shoulder, 23=left_hip, 24=right_hip
        try:
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
        except (IndexError, KeyError):
            return BehaviorType.UNKNOWN, 0.0

        shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_y = (left_hip.y + right_hip.y) / 2

        shoulder_x = (left_shoulder.x + right_shoulder.x) / 2
        hip_x = (left_hip.x + right_hip.x) / 2

        torso_height = abs(hip_y - shoulder_y)
        torso_width = abs(hip_x - shoulder_x)

        # 넘어짐: torso_width / torso_height > 2.0 (FR3.5)
        if torso_height > 0.01 and torso_width / torso_height > BEHAVIOR_FALLING_RATIO:
            confidence = min(1.0, (torso_width / torso_height) / (BEHAVIOR_FALLING_RATIO * 1.5))
            return BehaviorType.FALLING, confidence

        # 서 있음: shoulder_y / hip_y >= 0.7 AND torso_height > 0.35 (FR3.4)
        if hip_y > 0.01:
            ratio = shoulder_y / hip_y
            if ratio >= BEHAVIOR_STANDING_RATIO and torso_height > BEHAVIOR_STANDING_HEIGHT:
                confidence = min(1.0, ratio / 1.0)
                return BehaviorType.STANDING, confidence

        return BehaviorType.NORMAL, 0.9

    def _get_duration(self, person_id: int, behavior: BehaviorType, now: float) -> float:
        """행동 지속 시간 계산."""
        if person_id not in self._alert_states:
            return 0.0
        state = self._alert_states[person_id]
        first_time = state.first_detect_time.get(behavior.value)
        if first_time is None:
            return 0.0
        return now - first_time

    def _apply_filters(self, person_id: int, behavior: BehaviorType, conf: float, now: float) -> bool:
        """거짓 경고 억제 필터 (섹션 26).

        1. Confidence >= 0.6
        2. Duration >= 2초 (연속 감지)
        3. 10프레임 중 7+ 감지 (majority)
        4. Cooldown 5초
        """
        # normal은 경고 대상이 아님
        if behavior in (BehaviorType.NORMAL, BehaviorType.UNKNOWN):
            # normal/unknown일 때 해당 person의 이상 행동 카운트 리셋
            if person_id in self._alert_states:
                state = self._alert_states[person_id]
                state.first_detect_time.pop(behavior.value, None)
            return False

        # 상태 초기화
        if person_id not in self._alert_states:
            self._alert_states[person_id] = _AlertState(
                detections=deque(maxlen=ALERT_TEMPORAL_FRAMES),
                last_alert_time={},
                first_detect_time={},
            )
        state = self._alert_states[person_id]

        # 감지 기록 추가
        state.detections.append((now, behavior.value, conf))

        # 1. Confidence filter
        if conf < ALERT_CONFIDENCE_MIN:
            return False

        # 2. Duration filter — 최초 감지 시각 기록
        btype = behavior.value
        if btype not in state.first_detect_time:
            state.first_detect_time[btype] = now
        duration = now - state.first_detect_time[btype]
        if duration < ALERT_DURATION_SEC:
            return False

        # 3. Temporal majority — 최근 N프레임 중 M+ 감지
        recent_behaviors = [b for _, b, _ in state.detections]
        count = sum(1 for b in recent_behaviors if b == btype)
        if count < ALERT_TEMPORAL_MAJORITY:
            return False

        # 4. Cooldown
        last_alert = state.last_alert_time.get(btype, 0.0)
        if now - last_alert < ALERT_COOLDOWN_SEC:
            return False

        # 모든 필터 통과 → 경고 발생
        state.last_alert_time[btype] = now
        logger.info("[BehaviorAnalyzer] 경고: person_%d %s (conf=%.2f, duration=%.1fs)",
                     person_id, btype, conf, duration)
        return True

    def reset(self) -> None:
        """경고 상태 초기화."""
        self._alert_states.clear()

    def close(self) -> None:
        """리소스 해제."""
        if self._pose:
            self._pose.close()
            self._pose = None
        self._alert_states.clear()
        logger.info("[BehaviorAnalyzer] 리소스 해제")
