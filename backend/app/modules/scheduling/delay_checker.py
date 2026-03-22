"""ITEM-P1-15: Delay checker — monitors scheduled pickups and sends delay alerts."""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.scheduling.models import DailyScheduleInstance

logger = logging.getLogger(__name__)


async def check_delays(db: AsyncSession) -> int:
    """Check for delayed pickups and send notifications.

    Returns the number of delay notifications sent.
    """
    from app.modules.academy_management.models import Academy
    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student

    now = datetime.now(UTC)
    today = now.date()
    count = 0

    # Find scheduled instances where pickup_time + 10min < now and not yet notified
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.schedule_date == today,
        DailyScheduleInstance.status == "scheduled",
        DailyScheduleInstance.delay_notified_at.is_(None),
    )
    result = await db.execute(stmt)
    instances = list(result.scalars().all())

    for inst in instances:
        # Calculate delay
        scheduled_dt = datetime.combine(today, inst.pickup_time, tzinfo=UTC)
        delay_minutes = (now - scheduled_dt).total_seconds() / 60

        if delay_minutes < 10:
            continue

        # Get student + parent info
        student = (await db.execute(
            select(Student).where(Student.id == inst.student_id)
        )).scalar_one_or_none()
        if not student:
            continue

        parent = (await db.execute(
            select(User).where(User.id == student.guardian_id)
        )).scalar_one_or_none()

        delay_min_int = int(delay_minutes)

        # Send parent notification (10+ minutes)
        msg = (
            f"[세이프웨이키즈] {student.name} 학생의 픽업이 "
            f"{delay_min_int}분 지연되고 있습니다. 차량 위치를 앱에서 확인해주세요."
        )
        if parent and parent.fcm_token:
            try:
                await notif_service._push_provider.send_push(
                    device_token=parent.fcm_token,
                    title="운행 지연 안내",
                    body=msg,
                    data={"type": "delay", "student_name": student.name},
                )
            except Exception:
                logger.warning("Failed to send delay push", exc_info=True)
        if parent and parent.phone and not parent.phone.startswith("kakao_"):
            try:
                await notif_service.send_critical_alert_sms(parent.phone, msg)
            except Exception:
                logger.warning("Failed to send delay SMS", exc_info=True)

        # 20+ minutes: escalate to academy admin + platform
        if delay_minutes >= 20:
            academy = (await db.execute(
                select(Academy).where(Academy.id == inst.academy_id)
            )).scalar_one_or_none()
            if academy and academy.admin_id:
                admin = (await db.execute(
                    select(User).where(User.id == academy.admin_id)
                )).scalar_one_or_none()
                if admin and admin.fcm_token:
                    escalation_msg = (
                        f"[세이프웨이키즈 관리자] {student.name} 학생 픽업 {delay_min_int}분 지연. "
                        f"학원: {academy.name}. 확인이 필요합니다."
                    )
                    try:
                        await notif_service._push_provider.send_push(
                            device_token=admin.fcm_token,
                            title="운행 지연 에스컬레이션",
                            body=escalation_msg,
                            data={"type": "delay_escalation"},
                        )
                    except Exception:
                        logger.warning("Failed to send escalation push", exc_info=True)

        # Mark as notified
        inst.delay_notified_at = now
        count += 1

    if count > 0:
        await db.flush()
        logger.info("Delay checker: sent %d delay notifications", count)

    return count
