"""ONNX 모델 다운로드 및 준비 스크립트.

실행: python setup_models.py
YOLOv8n ONNX + ArcFace ONNX 모델을 자동으로 다운로드한다.
MediaPipe 모델(face_detector.tflite, pose_landmarker_lite.task)은 assets/에 이미 존재.
"""

import os
import sys
import urllib.request
import hashlib
import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

# 모델 정의: (파일명, 다운로드 URL, 예상 크기 MB, 설명)
MODELS = [
    {
        "name": "YOLOv8n ONNX",
        "filename": "yolov8n.onnx",
        "url": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
        "size_mb": 12,
        "description": "객체 감지 (person class)",
    },
    {
        "name": "ArcFace W600K R50 ONNX",
        "filename": "arcface_w600k_r50.onnx",
        "url": "https://huggingface.co/public-data/insightface/resolve/main/models/buffalo_l/w600k_r50.onnx",
        "size_mb": 167,
        "description": "안면인식 512-dim embedding",
    },
]

MEDIAPIPE_ASSETS = [
    {
        "name": "MediaPipe Face Detector",
        "path": os.path.join(ASSETS_DIR, "face_detector.tflite"),
    },
    {
        "name": "MediaPipe Pose Landmarker",
        "path": os.path.join(ASSETS_DIR, "pose_landmarker_lite.task"),
    },
]


def download_file(url: str, dest_path: str, name: str) -> bool:
    """URL에서 파일 다운로드 (진행률 표시)."""
    if os.path.exists(dest_path):
        size_mb = os.path.getsize(dest_path) / (1024 * 1024)
        logger.info("  [OK] %s 이미 존재 (%.1f MB)", name, size_mb)
        return True

    logger.info("  [다운로드] %s ...", name)
    logger.info("    URL: %s", url)

    try:
        def progress_hook(block_num, block_size, total_size):
            downloaded = block_num * block_size
            if total_size > 0:
                pct = min(100, downloaded * 100 / total_size)
                bar_len = 30
                filled = int(bar_len * pct / 100)
                bar = "█" * filled + "░" * (bar_len - filled)
                sys.stdout.write(f"\r    [{bar}] {pct:5.1f}% ({downloaded/1024/1024:.1f} MB)")
                sys.stdout.flush()

        urllib.request.urlretrieve(url, dest_path, reporthook=progress_hook)
        print()  # 줄바꿈

        size_mb = os.path.getsize(dest_path) / (1024 * 1024)
        logger.info("  [완료] %s (%.1f MB)", name, size_mb)
        return True

    except Exception as e:
        logger.error("  [실패] %s 다운로드 오류: %s", name, e)
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False


def verify_onnx(model_path: str, name: str) -> bool:
    """ONNX 모델 파일 로드 가능 여부 확인."""
    try:
        import onnxruntime as ort
        sess_options = ort.SessionOptions()
        sess_options.log_severity_level = 3  # 경고 숨김
        session = ort.InferenceSession(
            model_path,
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )
        inputs = session.get_inputs()
        outputs = session.get_outputs()
        logger.info("  [검증] %s: 입력=%s, 출력=%s",
                     name,
                     [(i.name, i.shape) for i in inputs],
                     [(o.name, o.shape) for o in outputs])
        return True
    except Exception as e:
        logger.error("  [검증 실패] %s: %s", name, e)
        return False


def main():
    logger.info("=" * 60)
    logger.info("SafeWay Kids Edge AI - 모델 준비")
    logger.info("=" * 60)

    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. MediaPipe 모델 확인
    logger.info("\n[1/3] MediaPipe 모델 확인")
    for asset in MEDIAPIPE_ASSETS:
        if os.path.exists(asset["path"]):
            size_mb = os.path.getsize(asset["path"]) / (1024 * 1024)
            logger.info("  [OK] %s (%.1f MB)", asset["name"], size_mb)
        else:
            logger.warning("  [누락] %s — %s", asset["name"], asset["path"])

    # 2. ONNX 모델 다운로드
    logger.info("\n[2/3] ONNX 모델 다운로드")
    all_ok = True
    for model in MODELS:
        dest = os.path.join(MODELS_DIR, model["filename"])
        if not download_file(model["url"], dest, model["name"]):
            all_ok = False

    # 3. ONNX 모델 검증
    logger.info("\n[3/3] ONNX 모델 검증")
    for model in MODELS:
        dest = os.path.join(MODELS_DIR, model["filename"])
        if os.path.exists(dest):
            verify_onnx(dest, model["name"])

    # 결과
    logger.info("\n" + "=" * 60)
    if all_ok:
        logger.info("모든 모델 준비 완료!")
        logger.info("실행: python main.py 또는 start.bat 더블클릭")
    else:
        logger.error("일부 모델 다운로드 실패. 위 오류를 확인하세요.")
        sys.exit(1)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
