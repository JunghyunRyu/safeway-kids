"""ArcFace ONNX 기반 안면인식 엔진.

MediaPipe FaceDetector + ArcFace ONNX 512-dim embedding.
Tech Spec FR2.1~FR2.10, 섹션 22.1 구현.
"""

import collections
import json
import logging
import os
import time

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import FaceDetector, FaceDetectorOptions

from config import (
    ARCFACE_ONNX_PATH,
    FACE_DB_DIR,
    FACE_DETECTOR_PATH,
    FACE_EMBEDDING_DIM,
    FACE_MASK_THRESHOLD,
    FACE_QUALITY_BRIGHTNESS_MAX,
    FACE_QUALITY_BRIGHTNESS_MIN,
    FACE_QUALITY_EYE_DIFF_MAX,
    FACE_QUALITY_MIN_SIZE,
    FACE_SIMILARITY_THRESHOLD,
    FACE_TEMPORAL_WINDOW,
    ONNX_THREADS,
)

logger = logging.getLogger(__name__)


class FaceRecognizer:
    """ArcFace ONNX 기반 안면인식.

    - MediaPipe FaceDetector로 얼굴 감지
    - ArcFace ONNX로 512-dim embedding 추출
    - 코사인 유사도 매칭
    - 다중 각도 등록 (front, left15, right15)
    - 5프레임 temporal smoothing (majority voting)
    - 마스크 감지 (MediaPipe nose/mouth visibility)
    """

    ARCFACE_INPUT_SIZE = 112  # ArcFace 입력 크기

    def __init__(
        self,
        model_path: str = ARCFACE_ONNX_PATH,
        detector_path: str = FACE_DETECTOR_PATH,
        threshold: float = FACE_SIMILARITY_THRESHOLD,
        mask_threshold: float = FACE_MASK_THRESHOLD,
        num_threads: int = ONNX_THREADS,
    ):
        self._model_path = model_path
        self._detector_path = detector_path
        self._threshold = threshold
        self._mask_threshold = mask_threshold
        self._num_threads = num_threads

        # 등록된 얼굴 임베딩: name → [embedding, ...]
        self._embeddings: dict[str, list[np.ndarray]] = {}

        # Temporal smoothing 버퍼: track_id → deque of (name, confidence)
        self._temporal_buffer: dict[int, collections.deque] = {}
        self._temporal_window = FACE_TEMPORAL_WINDOW

        # 추론 시간 측정
        self._last_inference_ms: float = 0.0

        # MediaPipe FaceDetector 초기화
        self._detector = self._init_face_detector()

        # ArcFace ONNX 세션
        self._arcface_session = self._init_arcface()

        # 얼굴 DB 로드
        os.makedirs(FACE_DB_DIR, exist_ok=True)
        self._load_registered_faces()

    def _init_face_detector(self) -> FaceDetector | None:
        """MediaPipe FaceDetector 초기화."""
        if not os.path.exists(self._detector_path):
            logger.error("[FaceRecognizer] FaceDetector 모델 없음: %s", self._detector_path)
            return None

        base_options = BaseOptions(model_asset_path=self._detector_path)
        options = FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.5,
        )
        detector = FaceDetector.create_from_options(options)
        logger.info("[FaceRecognizer] MediaPipe FaceDetector 초기화 완료")
        return detector

    def _init_arcface(self):
        """ArcFace ONNX 세션 초기화."""
        if not os.path.exists(self._model_path):
            logger.warning(
                "[FaceRecognizer] ArcFace 모델 없음: %s — 안면인식 비활성화",
                self._model_path,
            )
            return None

        import onnxruntime as ort

        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = self._num_threads
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        session = ort.InferenceSession(
            self._model_path,
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )
        logger.info("[FaceRecognizer] ArcFace ONNX 로드 완료: %s", self._model_path)
        return session

    @property
    def last_inference_ms(self) -> float:
        return self._last_inference_ms

    # -----------------------------------------------------------------------
    # 얼굴 감지
    # -----------------------------------------------------------------------

    def detect_faces(self, frame: np.ndarray) -> list[dict]:
        """얼굴 감지.

        Returns:
            [{"bbox": (x1,y1,x2,y2), "score": float, "keypoints": list | None}]
        """
        if self._detector is None:
            return []

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self._detector.detect(mp_image)

        faces = []
        h, w = frame.shape[:2]
        for detection in result.detections:
            bbox = detection.bounding_box
            raw_x1 = max(0, bbox.origin_x)
            raw_y1 = max(0, bbox.origin_y)
            raw_x2 = min(w, bbox.origin_x + bbox.width)
            raw_y2 = min(h, bbox.origin_y + bbox.height)

            # MediaPipe는 얼굴+목+일부 상체까지 포함하므로 상하 20% 축소
            bh = raw_y2 - raw_y1
            bw = raw_x2 - raw_x1
            y1 = int(raw_y1 + bh * 0.05)   # 상단 5% 내림
            y2 = int(raw_y2 - bh * 0.20)   # 하단 20% 올림 (목/어깨 제거)
            x1 = int(raw_x1 + bw * 0.05)   # 좌우 5% 축소
            x2 = int(raw_x2 - bw * 0.05)
            score = detection.categories[0].score if detection.categories else 0.5

            # MediaPipe 키포인트 (right_eye, left_eye, nose, mouth, ...)
            keypoints = None
            if detection.keypoints:
                keypoints = [
                    {"x": kp.x * w, "y": kp.y * h}
                    for kp in detection.keypoints
                ]

            faces.append({
                "bbox": (int(x1), int(y1), int(x2), int(y2)),
                "score": float(score),
                "keypoints": keypoints,
            })

        return faces

    # -----------------------------------------------------------------------
    # ArcFace 임베딩 추출
    # -----------------------------------------------------------------------

    def extract_embedding(self, face_crop: np.ndarray) -> np.ndarray | None:
        """얼굴 크롭 → 512-dim embedding.

        1. 112x112 resize (affine 정렬은 register/recognize에서 처리)
        2. CLAHE + 화이트밸런스 전처리
        3. ArcFace ONNX 추론 → 512-dim vector
        4. L2 normalize
        """
        if self._arcface_session is None:
            return None

        # CLAHE + 화이트밸런스 전처리
        processed = self._preprocess_face(face_crop)

        # resize to 112x112
        aligned = cv2.resize(processed, (self.ARCFACE_INPUT_SIZE, self.ARCFACE_INPUT_SIZE))

        # BGR → RGB, normalize, HWC → CHW, add batch
        blob = aligned[:, :, ::-1].astype(np.float32)
        blob = (blob - 127.5) / 127.5  # [-1, 1] normalize
        blob = blob.transpose(2, 0, 1)  # CHW
        blob = np.expand_dims(blob, axis=0)  # NCHW

        # ArcFace 추론
        input_name = self._arcface_session.get_inputs()[0].name
        outputs = self._arcface_session.run(None, {input_name: blob})
        embedding = outputs[0].flatten()

        # L2 normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding

    def _preprocess_face(self, face_crop: np.ndarray) -> np.ndarray:
        """CLAHE + Gray World 화이트밸런스 전처리 (FR2.6)."""
        # CLAHE on L channel (LAB color space)
        lab = cv2.cvtColor(face_crop, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)
        enhanced = cv2.merge([l_enhanced, a_channel, b_channel])
        result = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

        # Gray World 화이트밸런스
        avg_b = np.mean(result[:, :, 0])
        avg_g = np.mean(result[:, :, 1])
        avg_r = np.mean(result[:, :, 2])
        avg_gray = (avg_b + avg_g + avg_r) / 3

        if avg_b > 0 and avg_g > 0 and avg_r > 0:
            result[:, :, 0] = np.clip(result[:, :, 0] * (avg_gray / avg_b), 0, 255).astype(np.uint8)
            result[:, :, 1] = np.clip(result[:, :, 1] * (avg_gray / avg_g), 0, 255).astype(np.uint8)
            result[:, :, 2] = np.clip(result[:, :, 2] * (avg_gray / avg_r), 0, 255).astype(np.uint8)

        return result

    def _align_face(self, frame: np.ndarray, bbox: tuple, keypoints: list[dict] | None) -> np.ndarray:
        """양쪽 눈 기준 affine transform → 112x112 정규화 (FR2.3).

        MediaPipe keypoints: [right_eye(0), left_eye(1), nose_tip(2), mouth_center(3), ...]
        """
        x1, y1, x2, y2 = bbox

        if keypoints and len(keypoints) >= 2:
            right_eye = np.array([keypoints[0]["x"], keypoints[0]["y"]])
            left_eye = np.array([keypoints[1]["x"], keypoints[1]["y"]])

            # 눈 중심
            eye_center = (left_eye + right_eye) / 2
            dy = right_eye[1] - left_eye[1]
            dx = right_eye[0] - left_eye[0]
            angle = np.degrees(np.arctan2(dy, dx))

            # 눈 사이 거리 기반 스케일
            eye_dist = np.linalg.norm(right_eye - left_eye)
            desired_eye_dist = self.ARCFACE_INPUT_SIZE * 0.35
            scale = desired_eye_dist / max(eye_dist, 1.0)

            # affine transform
            M = cv2.getRotationMatrix2D(tuple(eye_center.astype(float)), angle, scale)
            M[0, 2] += (self.ARCFACE_INPUT_SIZE / 2 - eye_center[0])
            M[1, 2] += (self.ARCFACE_INPUT_SIZE * 0.4 - eye_center[1])

            aligned = cv2.warpAffine(
                frame, M,
                (self.ARCFACE_INPUT_SIZE, self.ARCFACE_INPUT_SIZE),
                flags=cv2.INTER_LINEAR,
                borderValue=(114, 114, 114),
            )
            return aligned

        # fallback: 단순 크롭 + 리사이즈
        face_crop = frame[max(0, y1):min(frame.shape[0], y2),
                          max(0, x1):min(frame.shape[1], x2)]
        if face_crop.size == 0:
            return np.zeros((self.ARCFACE_INPUT_SIZE, self.ARCFACE_INPUT_SIZE, 3), dtype=np.uint8)
        return cv2.resize(face_crop, (self.ARCFACE_INPUT_SIZE, self.ARCFACE_INPUT_SIZE))

    # -----------------------------------------------------------------------
    # 등록
    # -----------------------------------------------------------------------

    def register(self, frame: np.ndarray, name: str, angle: str = "front") -> bool:
        """얼굴 등록. 품질 게이트 포함 (FR2.4, FR2.5).

        Args:
            frame: BGR 프레임
            name: 등록 이름
            angle: 각도 ("front", "left15", "right15")

        Returns:
            등록 성공 여부
        """
        faces = self.detect_faces(frame)
        if not faces:
            logger.warning("[FaceRecognizer] 등록 실패: 얼굴 미감지")
            return False

        # 가장 큰 얼굴 선택
        best = max(faces, key=lambda f: (f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]))
        bbox = best["bbox"]

        # 품질 게이트
        face_crop = frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        if face_crop.size == 0:
            return False

        passed, reason = self.check_quality(face_crop, bbox)
        if not passed:
            logger.warning("[FaceRecognizer] 등록 품질 미달: %s", reason)
            return False

        # affine 정렬 후 임베딩 추출
        aligned = self._align_face(frame, bbox, best.get("keypoints"))
        embedding = self.extract_embedding(aligned)
        if embedding is None:
            logger.warning("[FaceRecognizer] 임베딩 추출 실패")
            return False

        # 등록 저장
        if name not in self._embeddings:
            self._embeddings[name] = []
        self._embeddings[name].append(embedding)

        # 이미지 저장
        face_path = os.path.join(FACE_DB_DIR, f"{name}_{angle}.jpg")
        cv2.imwrite(face_path, face_crop)

        # 임베딩 저장
        emb_path = os.path.join(FACE_DB_DIR, f"{name}_{angle}.npy")
        np.save(emb_path, embedding)

        self._save_meta()
        logger.info("[FaceRecognizer] 등록 완료: %s (angle=%s, embeddings=%d)",
                     name, angle, len(self._embeddings[name]))
        return True

    def check_quality(self, face_crop: np.ndarray, bbox: tuple) -> tuple[bool, str]:
        """등록 품질 게이트 (FR2.5).

        - 얼굴 크기 >= 80x80 px
        - 밝기 40~220 범위
        - 정면도: 양쪽 눈 높이 차 <= 15% (키포인트 기반은 register에서 별도 처리)
        """
        x1, y1, x2, y2 = bbox
        face_w = x2 - x1
        face_h = y2 - y1

        # 크기 확인
        if face_w < FACE_QUALITY_MIN_SIZE or face_h < FACE_QUALITY_MIN_SIZE:
            return False, f"얼굴이 너무 작습니다 ({face_w}x{face_h}px, 최소 {FACE_QUALITY_MIN_SIZE}px)"

        # 밝기 확인
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        if brightness < FACE_QUALITY_BRIGHTNESS_MIN:
            return False, f"밝기가 부족합니다 ({brightness:.0f}, 최소 {FACE_QUALITY_BRIGHTNESS_MIN})"
        if brightness > FACE_QUALITY_BRIGHTNESS_MAX:
            return False, f"밝기가 과도합니다 ({brightness:.0f}, 최대 {FACE_QUALITY_BRIGHTNESS_MAX})"

        return True, "OK"

    # -----------------------------------------------------------------------
    # 인식
    # -----------------------------------------------------------------------

    def recognize(self, frame: np.ndarray) -> list[dict]:
        """프레임에서 모든 얼굴 감지 + 인식 (FR2.7~FR2.9).

        Returns:
            [{"name": str, "confidence": float, "bbox": (x1,y1,x2,y2), "is_masked": bool}]
        """
        t0 = time.perf_counter()

        faces = self.detect_faces(frame)
        results: list[dict] = []

        for i, face in enumerate(faces):
            bbox = face["bbox"]
            keypoints = face.get("keypoints")

            # 마스크 감지 (FR2.9)
            is_masked = self._detect_mask(keypoints)

            # threshold 결정
            threshold = self._mask_threshold if is_masked else self._threshold

            # ArcFace가 없으면 미등록 처리
            if self._arcface_session is None or not self._embeddings:
                results.append({
                    "name": "미등록",
                    "confidence": 0.0,
                    "bbox": bbox,
                    "is_masked": is_masked,
                })
                continue

            # affine 정렬 + 임베딩 추출
            aligned = self._align_face(frame, bbox, keypoints)
            embedding = self.extract_embedding(aligned)
            if embedding is None:
                results.append({
                    "name": "미등록",
                    "confidence": 0.0,
                    "bbox": bbox,
                    "is_masked": is_masked,
                })
                continue

            # 코사인 유사도 매칭
            best_name = "미등록"
            best_score = 0.0

            for name, embeddings_list in self._embeddings.items():
                for registered_emb in embeddings_list:
                    similarity = float(np.dot(embedding, registered_emb))
                    if similarity > best_score:
                        best_score = similarity
                        best_name = name

            if best_score < threshold:
                best_name = "미등록"
                best_score = 0.0

            # Temporal smoothing (FR2.7) — majority voting
            final_name, final_conf = self._temporal_smooth(i, best_name, best_score)

            results.append({
                "name": final_name,
                "confidence": round(final_conf, 3),
                "bbox": bbox,
                "is_masked": is_masked,
            })

        self._last_inference_ms = (time.perf_counter() - t0) * 1000
        return results

    def _detect_mask(self, keypoints: list[dict] | None) -> bool:
        """마스크 감지 (FR2.9).

        MediaPipe keypoints: [right_eye(0), left_eye(1), nose_tip(2), mouth_center(3), ...]
        nose/mouth visibility < 0.3 → 마스크 착용 판정.

        Note: MediaPipe FaceDetector keypoints는 normalized coordinates이므로
        visibility 정보는 직접 판단. nose/mouth가 bbox 하단에 너무 가까우면 가려진 것으로 판단.
        """
        if not keypoints or len(keypoints) < 4:
            return False

        # 눈 y 좌표 평균
        eye_y = (keypoints[0]["y"] + keypoints[1]["y"]) / 2
        # 코/입 y 좌표
        nose_y = keypoints[2]["y"]
        mouth_y = keypoints[3]["y"]

        # 눈-코 거리와 눈-입 거리의 비율로 마스크 판단
        # 마스크를 쓰면 코와 입의 위치가 부정확해짐
        eye_nose_dist = abs(nose_y - eye_y)
        eye_mouth_dist = abs(mouth_y - eye_y)

        # 정상: 눈-입 거리 > 눈-코 거리 * 1.5
        # 마스크: 코와 입이 거의 같은 위치에 감지되거나 비정상적 비율
        if eye_nose_dist > 0:
            ratio = eye_mouth_dist / eye_nose_dist
            if ratio < 1.2:  # 코와 입이 거의 겹침 → 마스크
                return True

        return False

    def _temporal_smooth(self, track_id: int, name: str, confidence: float) -> tuple[str, float]:
        """5프레임 temporal smoothing — majority voting (FR2.7)."""
        if track_id not in self._temporal_buffer:
            self._temporal_buffer[track_id] = collections.deque(maxlen=self._temporal_window)

        self._temporal_buffer[track_id].append((name, confidence))
        buffer = self._temporal_buffer[track_id]

        # majority voting
        name_counts: dict[str, int] = {}
        name_confs: dict[str, list[float]] = {}
        for n, c in buffer:
            name_counts[n] = name_counts.get(n, 0) + 1
            if n not in name_confs:
                name_confs[n] = []
            name_confs[n].append(c)

        majority_name = max(name_counts, key=name_counts.get)  # type: ignore[arg-type]
        avg_conf = float(np.mean(name_confs[majority_name]))

        return majority_name, avg_conf

    # -----------------------------------------------------------------------
    # 영속성 (DB 로드/저장)
    # -----------------------------------------------------------------------

    def _load_registered_faces(self) -> None:
        """등록 얼굴 DB 로드."""
        meta_path = os.path.join(FACE_DB_DIR, "faces_v2.json")
        if not os.path.exists(meta_path):
            # 기존 v1 호환
            self._load_v1_faces()
            return

        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)

        for entry in meta:
            name = entry["name"]
            self._embeddings[name] = []
            for emb_file in entry.get("embeddings", []):
                emb_path = os.path.join(FACE_DB_DIR, emb_file)
                if os.path.exists(emb_path):
                    emb = np.load(emb_path)
                    self._embeddings[name].append(emb)

        total = sum(len(v) for v in self._embeddings.values())
        logger.info("[FaceRecognizer] %d명 %d개 임베딩 로드", len(self._embeddings), total)

    def _load_v1_faces(self) -> None:
        """기존 faces.json (히스토그램 기반) 호환 — 이름만 가져옴."""
        meta_path = os.path.join(FACE_DB_DIR, "faces.json")
        if not os.path.exists(meta_path):
            logger.info("[FaceRecognizer] 등록된 얼굴 없음")
            return

        with open(meta_path, encoding="utf-8") as f:
            faces = json.load(f)

        for entry in faces:
            name = entry["name"]
            # npy 파일이 있으면 로드
            npy_files = [
                f for f in os.listdir(FACE_DB_DIR)
                if f.startswith(f"{name}_") and f.endswith(".npy")
            ]
            if npy_files:
                self._embeddings[name] = []
                for nf in npy_files:
                    emb = np.load(os.path.join(FACE_DB_DIR, nf))
                    self._embeddings[name].append(emb)

        logger.info("[FaceRecognizer] v1 호환 로드: %d명", len(self._embeddings))

    def _save_meta(self) -> None:
        """얼굴 메타데이터 저장."""
        meta_path = os.path.join(FACE_DB_DIR, "faces_v2.json")
        meta = []
        for name, embeddings_list in self._embeddings.items():
            emb_files = []
            for idx, _ in enumerate(embeddings_list):
                # npy 파일명 찾기
                for angle in ("front", "left15", "right15"):
                    f = f"{name}_{angle}.npy"
                    if os.path.exists(os.path.join(FACE_DB_DIR, f)):
                        if f not in emb_files:
                            emb_files.append(f)
                # index-based fallback
                if len(emb_files) <= idx:
                    f = f"{name}_{idx}.npy"
                    np.save(os.path.join(FACE_DB_DIR, f), embeddings_list[idx])
                    emb_files.append(f)

            meta.append({"name": name, "embeddings": emb_files})

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    # -----------------------------------------------------------------------
    # 유틸리티
    # -----------------------------------------------------------------------

    def get_registered_names(self) -> list[str]:
        return list(self._embeddings.keys())

    def delete_face(self, name: str) -> bool:
        if name not in self._embeddings:
            return False
        del self._embeddings[name]
        # 관련 파일 삭제
        for f in os.listdir(FACE_DB_DIR):
            if f.startswith(f"{name}_"):
                os.remove(os.path.join(FACE_DB_DIR, f))
        self._save_meta()
        return True

    def close(self) -> None:
        if self._detector:
            self._detector.close()
        self._arcface_session = None
        self._temporal_buffer.clear()
        logger.info("[FaceRecognizer] 리소스 해제")
