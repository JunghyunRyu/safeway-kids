"""얼굴 등록 및 인식 모듈.

MediaPipe FaceDetector (Tasks API) + 히스토그램 기반 매칭.
PoC 데모 수준에서 충분한 정확도를 제공한다.
"""

import json
import logging
import os
from dataclasses import dataclass

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import FaceDetector, FaceDetectorOptions
import numpy as np

from config import FACE_DB_DIR, FACE_TOLERANCE

logger = logging.getLogger(__name__)

_ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")


@dataclass
class FaceMatch:
    name: str
    confidence: float
    location: tuple[int, int, int, int]  # top, right, bottom, left


class FaceManager:
    def __init__(self) -> None:
        model_path = os.path.join(_ASSETS_DIR, "face_detector.tflite")
        base_options = BaseOptions(model_asset_path=model_path)
        options = FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.5,
        )
        self._detector = FaceDetector.create_from_options(options)
        self._known_faces: dict[str, np.ndarray] = {}
        os.makedirs(FACE_DB_DIR, exist_ok=True)
        self._load_registered_faces()

    def _extract_descriptor(self, face_crop: np.ndarray) -> np.ndarray:
        """얼굴 크롭에서 히스토그램 기반 특징 디스크립터를 추출."""
        face = cv2.resize(face_crop, (128, 128))

        hsv = cv2.cvtColor(face, cv2.COLOR_BGR2HSV)
        h_hist = cv2.calcHist([hsv], [0], None, [32], [0, 180])
        s_hist = cv2.calcHist([hsv], [1], None, [32], [0, 256])

        gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        g_hist = cv2.calcHist([gray], [0], None, [64], [0, 256])

        descriptor = np.concatenate([h_hist.flatten(), s_hist.flatten(), g_hist.flatten()])
        descriptor = descriptor / (np.linalg.norm(descriptor) + 1e-7)
        return descriptor

    def _load_registered_faces(self) -> None:
        meta_path = os.path.join(FACE_DB_DIR, "faces.json")
        if not os.path.exists(meta_path):
            logger.info("등록된 얼굴 없음")
            return

        with open(meta_path) as f:
            faces = json.load(f)

        for entry in faces:
            name = entry["name"]
            img_path = os.path.join(FACE_DB_DIR, f"{name}.jpg")
            if os.path.exists(img_path):
                img = cv2.imread(img_path)
                if img is not None:
                    self._known_faces[name] = self._extract_descriptor(img)

        logger.info("%d명의 얼굴 로드 완료", len(self._known_faces))

    def _detect_faces(self, frame: np.ndarray) -> list[tuple[int, int, int, int, float]]:
        """MediaPipe FaceDetector로 얼굴 감지. Returns (x1, y1, x2, y2, score) list."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self._detector.detect(mp_image)

        faces = []
        h, w = frame.shape[:2]
        for detection in result.detections:
            bbox = detection.bounding_box
            x1 = max(0, bbox.origin_x)
            y1 = max(0, bbox.origin_y)
            x2 = min(w, bbox.origin_x + bbox.width)
            y2 = min(h, bbox.origin_y + bbox.height)
            score = detection.categories[0].score if detection.categories else 0.5
            faces.append((x1, y1, x2, y2, score))

        return faces

    def register_face(self, frame: np.ndarray, name: str) -> bool:
        faces = self._detect_faces(frame)
        if not faces:
            logger.warning("프레임에서 얼굴을 찾을 수 없음")
            return False

        # 가장 큰 얼굴
        best = max(faces, key=lambda f: (f[2] - f[0]) * (f[3] - f[1]))
        x1, y1, x2, y2, _ = best

        face_crop = frame[y1:y2, x1:x2]
        if face_crop.size == 0:
            return False

        self._known_faces[name] = self._extract_descriptor(face_crop)

        face_path = os.path.join(FACE_DB_DIR, f"{name}.jpg")
        cv2.imwrite(face_path, face_crop)
        self._save_meta()
        logger.info("얼굴 등록 완료: %s", name)
        return True

    def _save_meta(self) -> None:
        meta_path = os.path.join(FACE_DB_DIR, "faces.json")
        with open(meta_path, "w") as f:
            json.dump([{"name": n} for n in self._known_faces], f)

    def recognize(self, frame: np.ndarray) -> list[FaceMatch]:
        faces = self._detect_faces(frame)
        matches: list[FaceMatch] = []

        for x1, y1, x2, y2, det_score in faces:
            location = (y1, x2, y2, x1)  # top, right, bottom, left

            face_crop = frame[y1:y2, x1:x2]
            if face_crop.size == 0:
                continue

            if not self._known_faces:
                matches.append(FaceMatch(name="미등록", confidence=0.0, location=location))
                continue

            descriptor = self._extract_descriptor(face_crop)
            best_name = "미등록"
            best_score = 0.0

            for name, known_desc in self._known_faces.items():
                similarity = float(np.dot(descriptor, known_desc))
                if similarity > best_score:
                    best_score = similarity
                    best_name = name

            threshold = 1.0 - FACE_TOLERANCE
            if best_score >= threshold:
                matches.append(FaceMatch(
                    name=best_name,
                    confidence=round(best_score, 2),
                    location=location,
                ))
            else:
                matches.append(FaceMatch(name="미등록", confidence=0.0, location=location))

        return matches

    def get_registered_names(self) -> list[str]:
        return list(self._known_faces.keys())

    def delete_face(self, name: str) -> bool:
        if name not in self._known_faces:
            return False
        del self._known_faces[name]
        face_path = os.path.join(FACE_DB_DIR, f"{name}.jpg")
        if os.path.exists(face_path):
            os.remove(face_path)
        self._save_meta()
        return True

    def close(self) -> None:
        self._detector.close()
