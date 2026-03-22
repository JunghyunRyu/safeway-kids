"""P3-77: Daily dispatch notifier — sends push to drivers with today's assignments."""

import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.scheduling.models import DailyScheduleInstance
from app.modules.vehicle_telemetry.models import VehicleAssignment

logger = logging.getLogger(__name__)


async def send_daily_dispatch_notifications(db: AsyncSession, target_date: date) -> int:
    """Send push notifications to drivers with assignments on target_date.

    Returns the number of notifications sent.
    """
    # Find all vehicle assignments for the date
    stmt = select(VehicleAssignment).where(VehicleAssignment.assigned_date == target_date)
    result = await db.execute(stmt)
    assignments = list(result.scalars().all())

    if not assignments:
        return 0

    sent = 0
    for assignment in assignments:
        if not assignment.driver_id:
            continue

        # Count students for this vehicle
        count_stmt = select(DailyScheduleInstance).where(
            DailyScheduleInstance.vehicle_id == assignment.vehicle_id,
            DailyScheduleInstance.schedule_date == target_date,
            DailyScheduleInstance.status == "scheduled",
        )
        count_result = await db.execute(count_stmt)
        schedules = list(count_result.scalars().all())
        student_count = len(schedules)

        if student_count == 0:
            continue

        # Find earliest pickup time
        earliest = min(s.pickup_time for s in schedules)
        earliest_str = earliest.strftime("%H:%M") if earliest else "미정"

        # Get driver user for FCM token
        driver_stmt = select(User).where(User.id == assignment.driver_id)
        driver = (await db.execute(driver_stmt)).scalar_one_or_none()
        if not driver or not driver.fcm_token:
            continue

        # Send push notification
        try:
            from app.modules.notification import service as notif_service

            title = "오늘 배차 안내"
            body = f"오늘 {student_count}명 학생 픽업 예정 (첫 픽업 {earliest_str})"
            await notif_service._push_provider.send_push(
                device_token=driver.fcm_token,
                title=title,
                body=body,
                data={"type": "daily_dispatch", "student_count": str(student_count)},
            )
            sent += 1
        except Exception:
            logger.warning("Failed to send dispatch notification to driver %s", driver.id, exc_info=True)

    return sent
