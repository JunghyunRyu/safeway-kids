import uuid
from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError
from app.middleware.consent import require_consent
from app.modules.scheduling.models import DailyScheduleInstance, ScheduleTemplate
from app.modules.scheduling.schemas import (
    DriverDailyScheduleResponse,
    ScheduleTemplateCreateRequest,
)
from app.modules.student_management.service import get_student


async def create_schedule_template(
    db: AsyncSession, guardian_id: uuid.UUID, request: ScheduleTemplateCreateRequest
) -> ScheduleTemplate:
    # Verify student ownership
    student = await get_student(db, request.student_id)
    if student.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 자녀 스케줄만 등록할 수 있습니다")

    # Check consent
    await require_consent(db, guardian_id, request.student_id)

    template = ScheduleTemplate(
        student_id=request.student_id,
        academy_id=request.academy_id,
        day_of_week=request.day_of_week,
        pickup_time=request.pickup_time,
        pickup_latitude=request.pickup_latitude,
        pickup_longitude=request.pickup_longitude,
        pickup_address=request.pickup_address,
    )
    db.add(template)
    await db.flush()
    return template


async def list_templates_by_student(
    db: AsyncSession, student_id: uuid.UUID
) -> list[ScheduleTemplate]:
    stmt = (
        select(ScheduleTemplate)
        .where(
            ScheduleTemplate.student_id == student_id,
            ScheduleTemplate.is_active.is_(True),
        )
        .order_by(ScheduleTemplate.day_of_week, ScheduleTemplate.pickup_time)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def materialize_daily_schedules(
    db: AsyncSession, target_date: date
) -> list[DailyScheduleInstance]:
    """Generate daily schedule instances from active templates for a given date."""
    from app.modules.vehicle_telemetry.models import VehicleAssignment

    day_of_week = target_date.weekday()  # 0=Mon, 6=Sun

    # Find matching templates
    stmt = select(ScheduleTemplate).where(
        ScheduleTemplate.day_of_week == day_of_week,
        ScheduleTemplate.is_active.is_(True),
    )
    result = await db.execute(stmt)
    templates = result.scalars().all()

    # Pre-load vehicle assignments for the date (keyed by academy_id is not direct,
    # so we cache all assignments and match later via academy schedules)
    assignment_stmt = select(VehicleAssignment).where(
        VehicleAssignment.assigned_date == target_date,
    )
    assignment_result = await db.execute(assignment_stmt)
    assignments_by_vehicle = {a.vehicle_id: a for a in assignment_result.scalars().all()}

    instances = []
    for template in templates:
        # Check if already materialized
        existing_stmt = select(DailyScheduleInstance).where(
            DailyScheduleInstance.template_id == template.id,
            DailyScheduleInstance.schedule_date == target_date,
        )
        existing = await db.execute(existing_stmt)
        if existing.scalar_one_or_none():
            continue

        # Try to find a vehicle assignment for this date
        # For M2: pick the first available assignment (simple 1:1 mapping)
        vehicle_id = None
        if assignments_by_vehicle:
            first_assignment = next(iter(assignments_by_vehicle.values()), None)
            if first_assignment:
                vehicle_id = first_assignment.vehicle_id

        instance = DailyScheduleInstance(
            template_id=template.id,
            student_id=template.student_id,
            academy_id=template.academy_id,
            vehicle_id=vehicle_id,
            schedule_date=target_date,
            pickup_time=template.pickup_time,
            pickup_latitude=template.pickup_latitude,
            pickup_longitude=template.pickup_longitude,
            status="scheduled",
        )
        db.add(instance)
        instances.append(instance)

    await db.flush()
    return instances


async def cancel_daily_schedule(
    db: AsyncSession, instance_id: uuid.UUID, cancelled_by: uuid.UUID
) -> DailyScheduleInstance:
    """One-touch schedule cancellation by parent."""
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    if instance.status != "scheduled":
        raise ConflictError(detail="취소할 수 없는 상태입니다")

    instance.status = "cancelled"
    instance.cancelled_at = datetime.now(UTC)
    instance.cancelled_by = cancelled_by
    await db.flush()
    return instance


async def list_daily_schedules(
    db: AsyncSession, target_date: date, student_id: uuid.UUID | None = None
) -> list[DailyScheduleInstance]:
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.schedule_date == target_date
    )
    if student_id:
        stmt = stmt.where(DailyScheduleInstance.student_id == student_id)
    stmt = stmt.order_by(DailyScheduleInstance.pickup_time)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_boarded(
    db: AsyncSession, instance_id: uuid.UUID
) -> DailyScheduleInstance:
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    instance.boarded_at = datetime.now(UTC)
    await db.flush()

    # Fire-and-forget push notification to parent
    await _send_boarding_push(db, instance)

    return instance


async def get_driver_daily_schedules(
    db: AsyncSession, driver_id: uuid.UUID, target_date: date
) -> list[DriverDailyScheduleResponse]:
    """Get all daily schedules assigned to a driver's vehicle for a date."""
    from app.modules.academy_management.models import Academy
    from app.modules.student_management.models import Student
    from app.modules.vehicle_telemetry.models import VehicleAssignment

    # Find driver's vehicle assignment for the date
    assignment_stmt = select(VehicleAssignment).where(
        VehicleAssignment.driver_id == driver_id,
        VehicleAssignment.assigned_date == target_date,
    )
    result = await db.execute(assignment_stmt)
    assignment = result.scalar_one_or_none()
    if not assignment:
        return []

    # Find all daily schedules for that vehicle
    stmt = (
        select(
            DailyScheduleInstance,
            Student.name.label("student_name"),
            Academy.name.label("academy_name"),
        )
        .join(Student, DailyScheduleInstance.student_id == Student.id)
        .join(Academy, DailyScheduleInstance.academy_id == Academy.id)
        .where(
            DailyScheduleInstance.vehicle_id == assignment.vehicle_id,
            DailyScheduleInstance.schedule_date == target_date,
        )
        .order_by(DailyScheduleInstance.pickup_time)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        DriverDailyScheduleResponse(
            id=row.DailyScheduleInstance.id,
            student_id=row.DailyScheduleInstance.student_id,
            student_name=row.student_name,
            academy_id=row.DailyScheduleInstance.academy_id,
            academy_name=row.academy_name,
            schedule_date=row.DailyScheduleInstance.schedule_date,
            pickup_time=row.DailyScheduleInstance.pickup_time,
            pickup_latitude=row.DailyScheduleInstance.pickup_latitude,
            pickup_longitude=row.DailyScheduleInstance.pickup_longitude,
            status=row.DailyScheduleInstance.status,
            boarded_at=row.DailyScheduleInstance.boarded_at,
            alighted_at=row.DailyScheduleInstance.alighted_at,
        )
        for row in rows
    ]


async def mark_alighted(
    db: AsyncSession, instance_id: uuid.UUID
) -> DailyScheduleInstance:
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    instance.alighted_at = datetime.now(UTC)
    instance.status = "completed"
    await db.flush()

    # Fire-and-forget push notification to parent
    await _send_alighting_push(db, instance)

    return instance


async def _send_boarding_push(
    db: AsyncSession, instance: DailyScheduleInstance
) -> None:
    """Send boarding push notification to parent (fire-and-forget)."""
    import logging

    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student
    from app.modules.vehicle_telemetry.models import Vehicle

    logger = logging.getLogger(__name__)
    try:
        student_stmt = select(Student).where(Student.id == instance.student_id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student:
            return

        parent_stmt = select(User).where(User.id == student.guardian_id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if not parent or not parent.fcm_token:
            return

        vehicle_plate = "차량"
        if instance.vehicle_id:
            vehicle_stmt = select(Vehicle).where(Vehicle.id == instance.vehicle_id)
            vehicle = (await db.execute(vehicle_stmt)).scalar_one_or_none()
            if vehicle:
                vehicle_plate = vehicle.license_plate

        await notif_service.send_boarding_notification(
            parent.fcm_token, student.name, vehicle_plate
        )
    except Exception:
        logger.warning("Failed to send boarding push", exc_info=True)


async def _send_alighting_push(
    db: AsyncSession, instance: DailyScheduleInstance
) -> None:
    """Send alighting push notification to parent (fire-and-forget)."""
    import logging

    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student

    logger = logging.getLogger(__name__)
    try:
        student_stmt = select(Student).where(Student.id == instance.student_id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student:
            return

        parent_stmt = select(User).where(User.id == student.guardian_id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if not parent or not parent.fcm_token:
            return

        await notif_service.send_alighting_notification(parent.fcm_token, student.name)
    except Exception:
        logger.warning("Failed to send alighting push", exc_info=True)
