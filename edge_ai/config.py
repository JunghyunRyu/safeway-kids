"""Edge AI PoC 설정.

환경변수 기반 설정. 모든 설정은 EDGE_ 접두사를 사용한다.
"""

import os

# ---------------------------------------------------------------------------
# 기본 경로
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
FACE_DB_DIR = os.path.join(BASE_DIR, "registered_faces")
FALLBACK_DIR = os.path.join(BASE_DIR, "fallback")
SCENARIOS_DIR = os.path.join(BASE_DIR, "simulation", "scenarios")

# ---------------------------------------------------------------------------
# SafeWay Kids 백엔드 연동
# ---------------------------------------------------------------------------
BACKEND_URL = os.getenv("EDGE_BACKEND_URL", "http://localhost:8000")
API_BASE = f"{BACKEND_URL}/api/v1"
DEMO_VEHICLE_ID = os.getenv("EDGE_DEMO_VEHICLE_ID", "")
DEMO_API_TOKEN = os.getenv("EDGE_DEMO_API_TOKEN", "")
STANDALONE_MODE = os.getenv("EDGE_STANDALONE", "auto")  # auto | true | false

# ---------------------------------------------------------------------------
# 서버 설정
# ---------------------------------------------------------------------------
SERVER_HOST = os.getenv("EDGE_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("EDGE_PORT", "7860"))

# ---------------------------------------------------------------------------
# 웹캠 설정
# ---------------------------------------------------------------------------
CAMERA_INDEX = int(os.getenv("EDGE_CAMERA_INDEX", "0"))
FRAME_WIDTH = 640
FRAME_HEIGHT = 480

# ---------------------------------------------------------------------------
# HAL - 추론 백엔드
# ---------------------------------------------------------------------------
INFERENCE_BACKEND = os.getenv("EDGE_BACKEND", "cpu")  # cpu | jetson
SENSOR_MODE = os.getenv("EDGE_SENSOR_MODE", "simulation")  # simulation | hardware

# ---------------------------------------------------------------------------
# ONNX Runtime 설정
# ---------------------------------------------------------------------------
ONNX_THREADS = int(os.getenv("EDGE_ONNX_THREADS", "4"))
INPUT_RESOLUTION = int(os.getenv("EDGE_INPUT_SIZE", "416"))  # 416 | 320
INPUT_RESOLUTION_FALLBACK = 320  # Graceful degradation 시 축소

# ---------------------------------------------------------------------------
# 안면인식 (ArcFace ONNX)
# ---------------------------------------------------------------------------
FACE_SIMILARITY_THRESHOLD = float(os.getenv("EDGE_FACE_THRESHOLD", "0.45"))
FACE_MASK_THRESHOLD = float(os.getenv("EDGE_FACE_MASK_THRESHOLD", "0.35"))
FACE_QUALITY_MIN_SIZE = 80        # 최소 얼굴 크기 (px)
FACE_QUALITY_BRIGHTNESS_MIN = 40  # 최소 밝기
FACE_QUALITY_BRIGHTNESS_MAX = 220 # 최대 밝기
FACE_QUALITY_EYE_DIFF_MAX = 0.15  # 양쪽 눈 높이 차 최대 비율
FACE_TEMPORAL_WINDOW = 5          # temporal smoothing 프레임 수
FACE_EMBEDDING_DIM = 512          # ArcFace embedding 차원

# ---------------------------------------------------------------------------
# YOLO 설정 (ONNX)
# ---------------------------------------------------------------------------
YOLO_CONFIDENCE = float(os.getenv("EDGE_YOLO_CONFIDENCE", "0.5"))
YOLO_NMS_IOU = float(os.getenv("EDGE_YOLO_NMS_IOU", "0.45"))
YOLO_PERSON_CLASS = 0             # COCO person class ID

# ---------------------------------------------------------------------------
# 이상 행동 감지
# ---------------------------------------------------------------------------
BEHAVIOR_STANDING_RATIO = float(os.getenv("EDGE_STANDING_RATIO", "0.7"))
BEHAVIOR_STANDING_HEIGHT = float(os.getenv("EDGE_STANDING_HEIGHT", "0.35"))
BEHAVIOR_FALLING_RATIO = float(os.getenv("EDGE_FALLING_RATIO", "2.0"))

# ---------------------------------------------------------------------------
# 거짓 경고 억제 (섹션 26)
# ---------------------------------------------------------------------------
ALERT_CONFIDENCE_MIN = float(os.getenv("EDGE_ALERT_CONFIDENCE", "0.6"))
ALERT_DURATION_SEC = float(os.getenv("EDGE_ALERT_DURATION", "2.0"))
ALERT_TEMPORAL_FRAMES = int(os.getenv("EDGE_ALERT_TEMPORAL", "10"))
ALERT_TEMPORAL_MAJORITY = int(os.getenv("EDGE_ALERT_MAJORITY", "7"))
ALERT_COOLDOWN_SEC = float(os.getenv("EDGE_ALERT_COOLDOWN", "5.0"))

# ---------------------------------------------------------------------------
# 적응형 프레임 스킵 (Consensus P3)
# ---------------------------------------------------------------------------
FRAME_SKIP_THRESHOLD_MS = 200    # 추론 > 이 값이면 프레임 스킵
FRAME_SKIP_COUNT = 2             # 스킵할 프레임 수
DEGRADATION_THRESHOLD_MS = 300   # 추론 > 이 값이면 해상도 축소
WARMUP_FRAMES = 5                # 시작 시 warm-up 프레임 수

# ---------------------------------------------------------------------------
# 잔류 인원 감지
# ---------------------------------------------------------------------------
REMAINING_SCAN_FRAMES = 5        # multi-frame 스캔 프레임 수

# ---------------------------------------------------------------------------
# 사각지대 센서 (시뮬레이션 파라미터 — JS 프론트엔드 참조용)
# ---------------------------------------------------------------------------
LIDAR_RAYS = 360                 # VLP-16 기반 360도
LIDAR_RANGE_M = 15.0             # 시각화 범위 (m)
LIDAR_NOISE_SIGMA = 0.03         # 가우시안 노이즈 σ (m)
LIDAR_DROPOUT_RATE = 0.02        # 드롭아웃 비율

ULTRASONIC_COUNT = 12            # 센서 수 (전4/후4/측면4)
ULTRASONIC_BEAM_ANGLE = 15       # 빔 각도 (도)
ULTRASONIC_RANGE_M = 4.0         # 범위 (m)
ULTRASONIC_NOISE_SIGMA = 0.01    # 가우시안 노이즈 σ (m)

FUSION_LIDAR_WEIGHT = 0.7        # 센서 융합 가중치
FUSION_ULTRASONIC_WEIGHT = 0.3

ALERT_DISTANCE_CAUTION = 4.0     # 주의 (m)
ALERT_DISTANCE_WARNING = 2.5     # 경고 (m)
ALERT_DISTANCE_DANGER = 1.0      # 위험 (m)

VEHICLE_WIDTH_M = 2.0            # 차량 폭 (m)
VEHICLE_LENGTH_M = 7.0           # 차량 길이 (m)

# ---------------------------------------------------------------------------
# 암호화 (개인정보 보호 — 섹션 19)
# ---------------------------------------------------------------------------
ENCRYPTION_KEY = os.getenv("EDGE_ENCRYPTION_KEY", "")  # AES-256 키 (환경변수 필수)

# ---------------------------------------------------------------------------
# 모델 파일 경로
# ---------------------------------------------------------------------------
YOLO_ONNX_PATH = os.path.join(MODELS_DIR, "yolov8n.onnx")
ARCFACE_ONNX_PATH = os.path.join(MODELS_DIR, "arcface_w600k_r50.onnx")
FACE_DETECTOR_PATH = os.path.join(ASSETS_DIR, "face_detector.tflite")
POSE_LANDMARKER_PATH = os.path.join(ASSETS_DIR, "pose_landmarker_lite.task")
