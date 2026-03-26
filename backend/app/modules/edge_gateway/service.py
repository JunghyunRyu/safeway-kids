"""Edge AI 이벤트 처리 서비스."""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.edge_gateway.models import EdgeEvent, EdgeEventType
from app.modules.notification.providers.fcm import FCMProvider

logger = logging.getLogger(__name__)

_fcm = FCMProvider()

# 이벤트 유형별 알림 메시지 템플릿
_NOTIFICATION_TEMPLATES: dict[str, dict[str, str]] = {
    EdgeEventType.FACE_RECOGNIZED: {
        "title": "승하차 확인",
        "body_template": "{student_name} 원생이 확인되었습니다. (신뢰도: {confidence:.0%})",
    },
    EdgeEventType.ABNORMAL_BEHAVIOR: {
        "title": "!! 이상 행동 감지",
        "body_template": "차량 내 이상 행동이 감지되었습니다. (유형: {behavior_type})",
    },
    EdgeEventType.REMAINING_PASSENGER: {
        "title": "!! 잔류 인원 감지",
        "body_template": "차량 내 {passenger_count}명의 잔류 인원이 감지되었습니다. 즉시 확인 바랍니다.",
    },
}


async def create_edge_event(
    db: AsyncSession,
    event_type: str,
    details: dict,
    vehicle_id: str | None = None,
    event_timestamp: datetime | None = None,
) -> EdgeEvent:
    """Edge AI 이벤트를 생성하고 저장."""
    vid = None
    if vehicle_id:
        try:
            vid = uuid.UUID(vehicle_id)
        except ValueError:
            pass

    event = EdgeEvent(
        event_type=event_type,
        vehicle_id=vid,
        details=details,
        event_timestamp=event_timestamp or datetime.now(timezone.utc),
    )
    db.add(event)
    await db.flush()

    logger.info("[EDGE] Event created: type=%s id=%s", event_type, event.id)
    return event


async def send_edge_notification(
    event_type: str,
    details: dict,
) -> bool:
    """Edge 이벤트에 대한 FCM 푸시 알림 발송.

    데모에서는 플랫폼 관리자 전원에게 알림을 보낸다.
    """
    from sqlalchemy import select
    from app.database import async_session_factory
    from app.modules.auth.models import User, UserRole

    template = _NOTIFICATION_TEMPLATES.get(event_type)
    if not template:
        return False

    title = template["title"]
    try:
        body = template["body_template"].format(**details)
    except (KeyError, ValueError):
        body = f"Edge AI 이벤트: {event_type}"

    try:
        async with async_session_factory() as db:
            stmt = select(User).where(
                User.role == UserRole.PLATFORM_ADMIN,
                User.is_active.is_(True),
                User.deleted_at.is_(None),
                User.fcm_token.isnot(None),
            )
            result = await db.execute(stmt)
            admins = result.scalars().all()

            sent = 0
            for admin in admins:
                if admin.fcm_token:
                    ok = await _fcm.send_push(
                        device_token=admin.fcm_token,
                        title=title,
                        body=body,
                        data={"type": f"edge_{event_type}", "details": str(details)},
                    )
                    if ok:
                        sent += 1

            # 학부모에게도 알림 (잔류 인원/이상행동의 경우)
            if event_type in (EdgeEventType.ABNORMAL_BEHAVIOR, EdgeEventType.REMAINING_PASSENGER):
                parent_stmt = select(User).where(
                    User.role == UserRole.PARENT,
                    User.is_active.is_(True),
                    User.deleted_at.is_(None),
                    User.fcm_token.isnot(None),
                )
                parent_result = await db.execute(parent_stmt)
                parents = parent_result.scalars().all()

                for parent in parents:
                    if parent.fcm_token:
                        ok = await _fcm.send_push(
                            device_token=parent.fcm_token,
                            title=title,
                            body=body,
                            data={"type": f"edge_{event_type}"},
                        )
                        if ok:
                            sent += 1

            logger.info("[EDGE] Notifications sent: %d", sent)
            return sent > 0

    except Exception:
        logger.exception("[EDGE] Notification send failed")
        return False


async def list_edge_events(
    db: AsyncSession,
    event_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[EdgeEvent], int]:
    """Edge 이벤트 목록 조회."""
    base = select(EdgeEvent)
    count_base = select(func.count(EdgeEvent.id))

    if event_type:
        base = base.where(EdgeEvent.event_type == event_type)
        count_base = count_base.where(EdgeEvent.event_type == event_type)

    total = (await db.execute(count_base)).scalar() or 0

    stmt = (
        base
        .order_by(EdgeEvent.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    events = list(result.scalars().all())

    return events, total
