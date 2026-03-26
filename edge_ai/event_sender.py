"""백엔드 API 이벤트 전송 모듈.

Edge AI에서 감지한 이벤트를 SafeWay Kids 백엔드로 전송한다.
"""

import logging
from datetime import datetime, timezone
from enum import Enum

import requests

from config import API_BASE, DEMO_API_TOKEN

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    FACE_RECOGNIZED = "face_recognized"
    ABNORMAL_BEHAVIOR = "abnormal_behavior"
    REMAINING_PASSENGER = "remaining_passenger"


def send_event(
    event_type: EventType,
    details: dict,
    vehicle_id: str | None = None,
) -> bool:
    """백엔드에 Edge AI 이벤트를 전송.

    Args:
        event_type: 이벤트 유형
        details: 이벤트 상세 정보
        vehicle_id: 차량 ID (선택)

    Returns:
        전송 성공 여부
    """
    payload = {
        "event_type": event_type.value,
        "details": details,
        "vehicle_id": vehicle_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    headers = {"Content-Type": "application/json"}
    if DEMO_API_TOKEN:
        headers["Authorization"] = f"Bearer {DEMO_API_TOKEN}"

    try:
        resp = requests.post(
            f"{API_BASE}/edge/events",
            json=payload,
            headers=headers,
            timeout=5,
        )
        if resp.status_code in (200, 201):
            logger.info("[EVENT] %s 전송 성공", event_type.value)
            return True
        else:
            logger.warning(
                "[EVENT] %s 전송 실패: %d %s",
                event_type.value, resp.status_code, resp.text[:200],
            )
            return False
    except requests.RequestException as e:
        logger.warning("[EVENT] %s 전송 오류: %s", event_type.value, e)
        return False


def send_face_recognized(name: str, confidence: float) -> bool:
    return send_event(
        EventType.FACE_RECOGNIZED,
        {"student_name": name, "confidence": confidence},
    )


def send_abnormal_behavior(behavior_type: str, confidence: float) -> bool:
    return send_event(
        EventType.ABNORMAL_BEHAVIOR,
        {"behavior_type": behavior_type, "confidence": confidence},
    )


def send_remaining_passenger(count: int, confidences: list[float]) -> bool:
    return send_event(
        EventType.REMAINING_PASSENGER,
        {"passenger_count": count, "confidences": confidences},
    )
