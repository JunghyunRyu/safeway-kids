"""YOLOv8n ONNX 추론 래퍼.

ONNX Runtime 기반 YOLOv8n 객체 감지.
Tech Spec FR1.1~FR1.7, FR3.1 구현.
"""

import logging
import os
import time

import cv2
import numpy as np

from config import (
    INPUT_RESOLUTION,
    ONNX_THREADS,
    YOLO_CONFIDENCE,
    YOLO_NMS_IOU,
    YOLO_ONNX_PATH,
    YOLO_PERSON_CLASS,
)

logger = logging.getLogger(__name__)


class YOLODetector:
    """YOLOv8n ONNX 추론 래퍼.

    - letterbox resize (aspect ratio 유지)
    - NMS (IoU threshold 0.45)
    - person class (id=0) 필터링
    - 추론 시간 측정
    """

    def __init__(
        self,
        model_path: str = YOLO_ONNX_PATH,
        input_size: int = INPUT_RESOLUTION,
        conf_threshold: float = YOLO_CONFIDENCE,
        iou_threshold: float = YOLO_NMS_IOU,
        num_threads: int = ONNX_THREADS,
    ):
        self._model_path = model_path
        self._input_size = input_size
        self._conf_threshold = conf_threshold
        self._iou_threshold = iou_threshold
        self._num_threads = num_threads
        self._session = None
        self._last_inference_ms: float = 0.0

        self._load_model()

    def _load_model(self) -> None:
        """ONNX Runtime 세션 초기화."""
        if not os.path.exists(self._model_path):
            logger.error("[YOLODetector] 모델 파일 없음: %s", self._model_path)
            raise FileNotFoundError(f"YOLO ONNX 모델 파일 없음: {self._model_path}")

        import onnxruntime as ort

        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = self._num_threads
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        self._session = ort.InferenceSession(
            self._model_path,
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )

        self._input_name = self._session.get_inputs()[0].name
        logger.info(
            "[YOLODetector] 모델 로드 완료: %s (input=%dx%d, threads=%d)",
            self._model_path, self._input_size, self._input_size, self._num_threads,
        )

    @property
    def last_inference_ms(self) -> float:
        """마지막 추론 시간 (ms)."""
        return self._last_inference_ms

    def detect(self, frame: np.ndarray) -> list[dict]:
        """프레임에서 person(class 0) 감지.

        Args:
            frame: BGR 이미지 (HxWxC)

        Returns:
            [{"bbox": (x1,y1,x2,y2), "confidence": float, "class_id": int}]
        """
        if self._session is None:
            return []

        orig_shape = frame.shape[:2]  # (H, W)

        t0 = time.perf_counter()

        # 1. 전처리
        input_tensor, ratio, pad = self.preprocess(frame)

        # 2. ONNX 추론
        outputs = self._session.run(None, {self._input_name: input_tensor})

        # 3. 후처리
        detections = self.postprocess(outputs[0], orig_shape, ratio, pad)

        self._last_inference_ms = (time.perf_counter() - t0) * 1000
        return detections

    def preprocess(self, frame: np.ndarray) -> tuple[np.ndarray, float, tuple[int, int]]:
        """입력 전처리: letterbox resize + normalize.

        Args:
            frame: BGR 이미지

        Returns:
            (input_tensor, ratio, (pad_w, pad_h))
        """
        h, w = frame.shape[:2]
        target = self._input_size

        # aspect ratio를 유지하면서 resize
        ratio = min(target / h, target / w)
        new_w = int(w * ratio)
        new_h = int(h * ratio)

        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # 패딩 (letterbox)
        pad_w = (target - new_w) // 2
        pad_h = (target - new_h) // 2

        padded = np.full((target, target, 3), 114, dtype=np.uint8)
        padded[pad_h:pad_h + new_h, pad_w:pad_w + new_w] = resized

        # BGR → RGB, normalize to [0, 1], HWC → CHW, add batch dim
        blob = padded[:, :, ::-1].astype(np.float32) / 255.0
        blob = blob.transpose(2, 0, 1)  # CHW
        blob = np.expand_dims(blob, axis=0)  # NCHW

        return blob, ratio, (pad_w, pad_h)

    def postprocess(
        self,
        output: np.ndarray,
        orig_shape: tuple[int, int],
        ratio: float,
        pad: tuple[int, int],
    ) -> list[dict]:
        """출력 후처리: NMS + confidence filter + person class filter.

        YOLOv8 출력 형식: (1, 84, 8400) - [x_center, y_center, w, h, 80_class_scores]

        Args:
            output: ONNX 출력 (1, 84, 8400)
            orig_shape: 원본 이미지 (H, W)
            ratio: letterbox resize 비율
            pad: letterbox 패딩 (pad_w, pad_h)

        Returns:
            [{"bbox": (x1,y1,x2,y2), "confidence": float, "class_id": int}]
        """
        # (1, 84, 8400) → (8400, 84)
        predictions = output[0].T  # (8400, 84)

        # 좌표: x_center, y_center, w, h
        boxes_xywh = predictions[:, :4]
        # 클래스 점수: 80개
        class_scores = predictions[:, 4:]

        # person class (id=0)만 추출
        person_scores = class_scores[:, YOLO_PERSON_CLASS]
        mask = person_scores >= self._conf_threshold
        if not np.any(mask):
            return []

        filtered_boxes = boxes_xywh[mask]
        filtered_scores = person_scores[mask]

        # xywh → xyxy (입력 해상도 기준)
        x_center = filtered_boxes[:, 0]
        y_center = filtered_boxes[:, 1]
        w = filtered_boxes[:, 2]
        h = filtered_boxes[:, 3]

        x1 = x_center - w / 2
        y1 = y_center - h / 2
        x2 = x_center + w / 2
        y2 = y_center + h / 2

        # letterbox 패딩 제거 + 원본 좌표로 역변환
        pad_w, pad_h = pad
        x1 = (x1 - pad_w) / ratio
        y1 = (y1 - pad_h) / ratio
        x2 = (x2 - pad_w) / ratio
        y2 = (y2 - pad_h) / ratio

        # 원본 이미지 범위로 클리핑
        orig_h, orig_w = orig_shape
        x1 = np.clip(x1, 0, orig_w)
        y1 = np.clip(y1, 0, orig_h)
        x2 = np.clip(x2, 0, orig_w)
        y2 = np.clip(y2, 0, orig_h)

        # NMS (OpenCV)
        boxes_for_nms = np.stack([x1, y1, x2 - x1, y2 - y1], axis=1).tolist()
        scores_for_nms = filtered_scores.tolist()

        indices = cv2.dnn.NMSBoxes(
            boxes_for_nms,
            scores_for_nms,
            self._conf_threshold,
            self._iou_threshold,
        )

        detections: list[dict] = []
        if len(indices) > 0:
            indices = np.array(indices).flatten()
            for i in indices:
                detections.append({
                    "bbox": (int(x1[i]), int(y1[i]), int(x2[i]), int(y2[i])),
                    "confidence": float(filtered_scores[i]),
                    "class_id": YOLO_PERSON_CLASS,
                })

        return detections

    def close(self) -> None:
        """세션 해제."""
        self._session = None
        logger.info("[YOLODetector] 세션 해제")
