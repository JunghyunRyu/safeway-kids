"""Edge AI PoC 설정."""

import os

# SafeWay Kids 백엔드 URL
BACKEND_URL = os.getenv("EDGE_BACKEND_URL", "http://localhost:8000")
API_BASE = f"{BACKEND_URL}/api/v1"

# 웹캠 설정
CAMERA_INDEX = int(os.getenv("EDGE_CAMERA_INDEX", "0"))
FRAME_WIDTH = 640
FRAME_HEIGHT = 480

# 안면 인식
FACE_TOLERANCE = float(os.getenv("EDGE_FACE_TOLERANCE", "0.5"))
FACE_DB_DIR = os.path.join(os.path.dirname(__file__), "registered_faces")

# YOLOv8 설정
YOLO_MODEL = os.getenv("EDGE_YOLO_MODEL", "yolov8n.pt")
YOLO_CONFIDENCE = float(os.getenv("EDGE_YOLO_CONFIDENCE", "0.5"))

# 이상 행동 감지
BEHAVIOR_STANDING_THRESHOLD = float(os.getenv("EDGE_STANDING_THRESHOLD", "0.3"))
BEHAVIOR_FALLING_THRESHOLD = float(os.getenv("EDGE_FALLING_THRESHOLD", "0.4"))

# 데모용 차량/사용자 ID (시드 데이터 기준)
DEMO_VEHICLE_ID = os.getenv("EDGE_DEMO_VEHICLE_ID", "")
DEMO_API_TOKEN = os.getenv("EDGE_DEMO_API_TOKEN", "")
