"""WebSocket 메시지 프로토콜 정의.

모든 Socket.IO 이벤트 타입을 상수와 dataclass로 정의한다.
Tech Spec 섹션 8.1 WebSocket 메시지 프로토콜 구현.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum


# ===========================================================================
# 이벤트 이름 상수
# ===========================================================================

class ServerEvent(str, Enum):
    """서버 → 클라이언트 이벤트."""
    FRAME = "frame"
    EVENT = "event"
    PERFORMANCE = "performance"
    MODE_CHANGED = "mode_changed"
    ALERT = "alert"
    STATUS = "status"
    LOADING = "loading"
    FALLBACK_MODE = "fallback_mode"
    RECOVERY = "recovery"
    FACE_REGISTERED = "face_registered"
    ERROR = "error"


class ClientEvent(str, Enum):
    """클라이언트 → 서버 이벤트."""
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    CHANGE_MODE = "change_mode"
    ENGINE_OFF = "engine_off"
    ENGINE_ON = "engine_on"
    REGISTER_FACE = "register_face"
    RESET_DEMO = "reset_demo"
    BLINDSPOT_EVENT = "blindspot_event"


# ===========================================================================
# 공통 타입
# ===========================================================================

class DemoMode(str, Enum):
    """시나리오 모드 (Tech Spec 25.1)."""
    BOARDING = "boarding"        # 승차 — 안면인식
    TRANSIT = "transit"          # 운행 — 이상행동
    ALIGHTING = "alighting"     # 하차 — 잔류인원
    POST_TRIP = "post_trip"     # 하차후 — 사각지대

    @classmethod
    def is_valid(cls, mode: str) -> bool:
        return mode in cls._value2member_map_


class AlertLevel(str, Enum):
    """경고 수준."""
    NORMAL = "normal"
    WARNING = "warning"
    DANGER = "danger"


class DetectionType(str, Enum):
    """감지 유형."""
    FACE = "face"
    BEHAVIOR = "behavior"
    PASSENGER = "passenger"


# 시나리오별 활성 모델 맵 (Tech Spec 8.3)
MODE_MODEL_MAP: dict[str, list[str]] = {
    DemoMode.BOARDING: ["FaceDetector", "ArcFace"],
    DemoMode.TRANSIT: ["YOLOv8n", "MediaPipe Pose"],
    DemoMode.ALIGHTING: ["YOLOv8n"],
    DemoMode.POST_TRIP: [],
}


# ===========================================================================
# 서버 → 클라이언트 페이로드
# ===========================================================================

@dataclass
class Detection:
    """개별 감지 결과."""
    type: str           # DetectionType value
    bbox: list[int]     # [x1, y1, x2, y2]
    label: str
    confidence: float
    alert_level: str = AlertLevel.NORMAL  # AlertLevel value


@dataclass
class Metrics:
    """성능 지표."""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    fps: float = 0.0
    inference_ms: float = 0.0
    model_name: str = ""


@dataclass
class FramePayload:
    """frame 이벤트 페이로드 (3~5 FPS)."""
    image: str                    # base64 JPEG (quality 70)
    mode: str                     # DemoMode value
    detections: list[dict] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = _now_iso()


@dataclass
class EventPayload:
    """event 이벤트 페이로드."""
    type: str               # 이벤트 유형 (face_recognized, behavior_alert, ...)
    message: str             # 한국어 메시지
    details: dict = field(default_factory=dict)
    time: str = ""           # HH:MM:SS (로그 표시용)
    timestamp: str = ""

    def __post_init__(self):
        now = datetime.now(timezone.utc)
        if not self.time:
            self.time = now.strftime("%H:%M:%S")
        if not self.timestamp:
            self.timestamp = now.isoformat()


@dataclass
class PerformancePayload:
    """performance 이벤트 페이로드 (1초 간격)."""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_mb: float = 0.0
    fps: float = 0.0
    inference_ms: float = 0.0
    model_name: str = ""
    frame_count: int = 0


@dataclass
class ModeChangedPayload:
    """mode_changed 이벤트 페이로드."""
    mode: str                     # 새 모드
    previous_mode: str            # 이전 모드
    active_models: list[str] = field(default_factory=list)


@dataclass
class AlertPayload:
    """alert 이벤트 페이로드."""
    level: str              # AlertLevel value
    message: str
    scenario: str = ""      # boarding, transit, alighting, blindspot, fallback


@dataclass
class StatusPayload:
    """status 이벤트 페이로드."""
    mode: str = DemoMode.BOARDING
    engine_off: bool = False
    camera: bool = False
    inference: bool = False
    backend: bool = False
    backend_mode: str = "standalone"
    registered_faces: int = 0
    face_names: list[str] = field(default_factory=list)
    connected_clients: int = 0
    fallback_active: bool = False
    uptime_sec: float = 0.0


@dataclass
class LoadingPayload:
    """loading 이벤트 페이로드 (모델 로딩 진행)."""
    stage: str              # yolov8n, arcface, face_detector, pose_landmarker, warmup, done
    progress: float         # 0.0 ~ 1.0
    message: str = ""


@dataclass
class FallbackModePayload:
    """fallback_mode 이벤트 페이로드."""
    active: bool
    message: str = ""
    reason: str = ""
    reason_kr: str = ""
    checklist: list[dict] = field(default_factory=list)
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = _now_iso()


@dataclass
class RecoveryPayload:
    """recovery 이벤트 페이로드."""
    message: str = "AI 시스템이 복구되었습니다. 자동 모드로 전환합니다."
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = _now_iso()


@dataclass
class FaceRegisteredPayload:
    """face_registered 이벤트 페이로드."""
    success: bool
    name: str = ""
    registered_count: int = 0
    quality_message: str = ""


@dataclass
class ErrorPayload:
    """error 이벤트 페이로드."""
    message: str


# ===========================================================================
# 클라이언트 → 서버 페이로드
# ===========================================================================

@dataclass
class ChangeModeRequest:
    """change_mode 요청."""
    mode: str  # DemoMode value


@dataclass
class RegisterFaceRequest:
    """register_face 요청."""
    name: str
    angle: str = "front"      # front, left15, right15
    consent: bool = False


@dataclass
class BlindspotEventRequest:
    """blindspot_event 요청 (JS → 서버)."""
    type: str               # caution, warning, danger
    distance: float = 0.0
    angle: float = 0.0
    confidence: float = 0.0
    child_id: str = ""


# ===========================================================================
# 이벤트 유형 상수 (event.type 값)
# ===========================================================================

class EventType(str, Enum):
    """이벤트 로그 유형."""
    # 안면인식
    FACE_RECOGNIZED = "face_recognized"
    FACE_UNREGISTERED = "face_unregistered"
    FACE_REGISTERED = "face_registered"
    FACE_DELETED = "face_deleted"

    # 이상행동
    BEHAVIOR_STANDING = "behavior_standing"
    BEHAVIOR_FALLING = "behavior_falling"

    # 잔류인원
    REMAINING_DETECTED = "remaining_detected"
    REMAINING_CLEAR = "remaining_clear"

    # 사각지대
    BLINDSPOT = "blindspot"

    # 시스템
    MODE_CHANGE = "mode_change"
    ENGINE_OFF = "engine_off"
    ENGINE_ON = "engine_on"
    SYSTEM = "system"
    CONSENT = "consent"
    FALLBACK = "fallback"
    RECOVERY = "recovery"


# ===========================================================================
# 유틸리티
# ===========================================================================

def _now_iso() -> str:
    """현재 UTC ISO 타임스탬프."""
    return datetime.now(timezone.utc).isoformat()


def to_dict(payload) -> dict:
    """dataclass 페이로드를 Socket.IO emit용 dict로 변환."""
    return asdict(payload)
