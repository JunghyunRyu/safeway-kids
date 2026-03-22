import logging
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.middleware.consent import require_consent
from app.modules.scheduling.models import DailyScheduleInstance, DriverMemo, ScheduleTemplate, VehicleClearance
from app.modules.scheduling.schemas import (
    DriverDailyScheduleResponse,
    ScheduleTemplateCreateRequest,
    VehicleClearanceResponse,
)
from app.modules.student_management.service import get_student

logger = logging.getLogger(__name__)


async def _broadcast_schedule_update(instance: DailyScheduleInstance, status: str) -> None:
    """P2-52: Broadcast schedule status change via Redis → WebSocket (best-effort)."""
    if not instance.vehicle_id:
        return
    try:
        import json
        from app.redis import redis_client
        channel = f"vehicle:{instance.vehicle_id}:gps_updates"
        payload = json.dumps({
            "type": "schedule_updated",
            "instance_id": str(instance.id),
            "status": status,
        })
        await redis_client.publish(channel, payload)
    except Exception:
        pass  # WebSocket broadcast is best-effort


def _mask_phone(phone: str | None) -> str | None:
    """Mask phone number: 01012345678 -> 010-****-5678"""
    if not phone or len(phone) < 10 or phone.startswith("kakao_"):
        return None
    if len(phone) == 11:
        return f"{phone[:3]}-****-{phone[7:]}"
    return f"{phone[:3]}-****-{phone[6:]}"


async def create_schedule_template(
    db: AsyncSession, guardian_id: uuid.UUID, request: ScheduleTemplateCreateRequest
) -> ScheduleTemplate:
    # Verify student ownership
    student = await get_student(db, request.student_id)
    if student.guardian_id != guardian_id:
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


async def create_schedule_template_admin(
    db: AsyncSession, admin_id: uuid.UUID, request: ScheduleTemplateCreateRequest
) -> ScheduleTemplate:
    """학원 관리자용 템플릿 생성 (소유권 검증 스킵, 학원 소속 확인)."""
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


async def list_templates_by_academy(
    db: AsyncSession, academy_id: uuid.UUID
) -> list[ScheduleTemplate]:
    """학원별 전체 템플릿 조회."""
    stmt = (
        select(ScheduleTemplate)
        .where(
            ScheduleTemplate.academy_id == academy_id,
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

    # Pre-load vehicle assignments for the date
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

    # P2-52: broadcast schedule update
    await _broadcast_schedule_update(instance, "cancelled")

    return instance


async def list_daily_schedules(
    db: AsyncSession,
    target_date: date,
    student_id: uuid.UUID | None = None,
    guardian_id: uuid.UUID | None = None,
) -> list[dict]:
    """Return enriched daily schedule dicts with student/academy/vehicle/driver info."""
    from app.modules.academy_management.models import Academy
    from app.modules.auth.models import User
    from app.modules.student_management.models import Student
    from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment

    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.schedule_date == target_date
    )
    if student_id:
        stmt = stmt.where(DailyScheduleInstance.student_id == student_id)
    if guardian_id:
        student_ids_subq = (
            select(Student.id)
            .where(Student.guardian_id == guardian_id)
            .scalar_subquery()
        )
        stmt = stmt.where(DailyScheduleInstance.student_id.in_(student_ids_subq))
    stmt = stmt.order_by(DailyScheduleInstance.pickup_time)
    result = await db.execute(stmt)
    instances = list(result.scalars().all())

    if not instances:
        return []

    # Batch-load related data
    student_ids = {i.student_id for i in instances}
    academy_ids = {i.academy_id for i in instances}
    vehicle_ids = {i.vehicle_id for i in instances if i.vehicle_id}

    students_map: dict[uuid.UUID, Student] = {}
    if student_ids:
        s_result = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students_map = {s.id: s for s in s_result.scalars().all()}

    academies_map: dict[uuid.UUID, Academy] = {}
    if academy_ids:
        a_result = await db.execute(select(Academy).where(Academy.id.in_(academy_ids)))
        academies_map = {a.id: a for a in a_result.scalars().all()}

    vehicles_map: dict[uuid.UUID, Vehicle] = {}
    if vehicle_ids:
        v_result = await db.execute(select(Vehicle).where(Vehicle.id.in_(vehicle_ids)))
        vehicles_map = {v.id: v for v in v_result.scalars().all()}

    # Load driver/escort assignments for vehicles on this date
    assignments_map: dict[uuid.UUID, VehicleAssignment] = {}
    if vehicle_ids:
        va_result = await db.execute(
            select(VehicleAssignment).where(
                VehicleAssignment.vehicle_id.in_(vehicle_ids),
                VehicleAssignment.assigned_date == target_date,
            )
        )
        assignments_map = {a.vehicle_id: a for a in va_result.scalars().all()}

    # Load driver/escort user names
    driver_ids = {a.driver_id for a in assignments_map.values() if a.driver_id}
    escort_ids = {a.safety_escort_id for a in assignments_map.values() if a.safety_escort_id}
    all_user_ids = driver_ids | escort_ids
    users_map: dict[uuid.UUID, User] = {}
    if all_user_ids:
        u_result = await db.execute(select(User).where(User.id.in_(all_user_ids)))
        users_map = {u.id: u for u in u_result.scalars().all()}

    # Lookup pickup_address from templates
    template_ids = {i.template_id for i in instances if i.template_id}
    templates_map: dict[uuid.UUID, str | None] = {}
    if template_ids:
        t_result = await db.execute(
            select(ScheduleTemplate.id, ScheduleTemplate.pickup_address).where(
                ScheduleTemplate.id.in_(template_ids)
            )
        )
        templates_map = {row.id: row.pickup_address for row in t_result.all()}

    enriched = []
    for inst in instances:
        student = students_map.get(inst.student_id)
        academy = academies_map.get(inst.academy_id)
        vehicle = vehicles_map.get(inst.vehicle_id) if inst.vehicle_id else None
        assignment = assignments_map.get(inst.vehicle_id) if inst.vehicle_id else None
        driver = users_map.get(assignment.driver_id) if assignment and assignment.driver_id else None
        escort = users_map.get(assignment.safety_escort_id) if assignment and assignment.safety_escort_id else None
        pickup_address = templates_map.get(inst.template_id) if inst.template_id else None

        enriched.append({
            "id": inst.id,
            "template_id": inst.template_id,
            "student_id": inst.student_id,
            "student_name": student.name if student else None,
            "student_photo_url": student.profile_photo_url if student else None,
            "academy_id": inst.academy_id,
            "academy_name": academy.name if academy else None,
            "vehicle_id": inst.vehicle_id,
            "vehicle_license_plate": vehicle.license_plate if vehicle else None,
            "driver_name": driver.name if driver else None,
            "driver_phone_masked": _mask_phone(driver.phone) if driver else None,
            "safety_escort_name": escort.name if escort else None,
            "schedule_date": inst.schedule_date,
            "pickup_time": inst.pickup_time,
            "pickup_address": pickup_address,
            "status": inst.status,
            "boarded_at": inst.boarded_at,
            "alighted_at": inst.alighted_at,
            "created_at": inst.created_at,
        })

    return enriched


async def _verify_driver_vehicle(
    db: AsyncSession, driver_id: uuid.UUID, vehicle_id: uuid.UUID, schedule_date: date
) -> None:
    """Verify driver/escort is assigned to the vehicle on the given date."""
    from app.modules.vehicle_telemetry.models import VehicleAssignment

    stmt = select(VehicleAssignment).where(
        VehicleAssignment.vehicle_id == vehicle_id,
        VehicleAssignment.assigned_date == schedule_date,
    )
    result = await db.execute(stmt)
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise ForbiddenError(detail="해당 차량에 배정 정보가 없습니다")
    if assignment.driver_id != driver_id and assignment.safety_escort_id != driver_id:
        raise ForbiddenError(detail="해당 차량에 배정된 기사/안전도우미가 아닙니다")


async def mark_boarded(
    db: AsyncSession, instance_id: uuid.UUID, driver_id: uuid.UUID | None = None
) -> DailyScheduleInstance:
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    # Verify driver is assigned to this schedule's vehicle
    if driver_id and instance.vehicle_id:
        await _verify_driver_vehicle(db, driver_id, instance.vehicle_id, instance.schedule_date)

    instance.boarded_at = datetime.now(UTC)
    await db.flush()

    success = await _send_boarding_push(db, instance)
    instance.notification_sent = success
    await db.flush()

    # P2-52: broadcast schedule update
    await _broadcast_schedule_update(instance, "boarded")

    return instance


async def mark_no_show(
    db: AsyncSession, instance_id: uuid.UUID, reason: str, driver_id: uuid.UUID | None = None
) -> DailyScheduleInstance:
    """Mark a student as no-show and notify parent + academy admin."""
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    # IDOR: verify driver is assigned to this vehicle
    if driver_id and instance.vehicle_id:
        await _verify_driver_vehicle(db, driver_id, instance.vehicle_id, instance.schedule_date)

    if instance.status != "scheduled":
        raise ConflictError(detail="미탑승 처리할 수 없는 상태입니다")

    instance.status = "no_show"
    await db.flush()

    # Send no-show notification to parent
    await _send_no_show_notification(db, instance, reason)

    # P2-52: broadcast schedule update
    await _broadcast_schedule_update(instance, "no_show")

    return instance


async def undo_board(
    db: AsyncSession, instance_id: uuid.UUID
) -> DailyScheduleInstance:
    """Undo boarding (within 5 minutes)."""
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    if not instance.boarded_at:
        raise ConflictError(detail="탑승 처리되지 않은 스케줄입니다")

    elapsed = (datetime.now(UTC) - instance.boarded_at).total_seconds()
    if elapsed > 300:
        raise ForbiddenError(detail="탑승 처리 후 5분이 경과하여 취소할 수 없습니다")

    instance.boarded_at = None
    instance.status = "scheduled"
    await db.flush()
    return instance


async def undo_alight(
    db: AsyncSession, instance_id: uuid.UUID
) -> DailyScheduleInstance:
    """Undo alighting (within 5 minutes)."""
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    if not instance.alighted_at:
        raise ConflictError(detail="하차 처리되지 않은 스케줄입니다")

    elapsed = (datetime.now(UTC) - instance.alighted_at).total_seconds()
    if elapsed > 300:
        raise ForbiddenError(detail="하차 처리 후 5분이 경과하여 취소할 수 없습니다")

    instance.alighted_at = None
    instance.status = "boarded"
    instance.boarded_at = instance.boarded_at  # keep original boarded_at
    await db.flush()
    return instance


async def complete_vehicle_clearance(
    db: AsyncSession, driver_id: uuid.UUID, vehicle_id: uuid.UUID,
    schedule_date: date, checklist: dict,
) -> VehicleClearance:
    """Record vehicle clearance (seats/trunk/lock check)."""
    # Validate checklist
    required_keys = {"seats_checked", "trunk_checked", "locked"}
    if not required_keys.issubset(checklist.keys()):
        from app.common.exceptions import ValidationError
        raise ValidationError(detail=f"체크리스트 필수 항목: {', '.join(required_keys)}")

    if not all(checklist.get(k) for k in required_keys):
        from app.common.exceptions import ValidationError
        raise ValidationError(detail="모든 체크리스트 항목을 완료해야 합니다")

    # Check if already completed
    existing_stmt = select(VehicleClearance).where(
        VehicleClearance.vehicle_id == vehicle_id,
        VehicleClearance.schedule_date == schedule_date,
    )
    existing = await db.execute(existing_stmt)
    if existing.scalar_one_or_none():
        raise ConflictError(detail="이미 차량 점검이 완료되었습니다")

    clearance = VehicleClearance(
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        schedule_date=schedule_date,
        checklist=checklist,
    )
    db.add(clearance)
    await db.flush()
    return clearance


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
            Student.profile_photo_url.label("student_photo_url"),
            Student.special_notes.label("special_notes"),
            Student.allergies.label("allergies"),
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

    # Get pickup_address from template and guardian phone
    responses = []
    for row in rows:
        inst = row.DailyScheduleInstance

        # Lookup pickup_address from template
        pickup_address = None
        if inst.template_id:
            tmpl_stmt = select(ScheduleTemplate.pickup_address).where(
                ScheduleTemplate.id == inst.template_id
            )
            tmpl_result = await db.execute(tmpl_stmt)
            pickup_address = tmpl_result.scalar_one_or_none()

        # Get guardian phone (masked)
        guardian_phone_masked = None
        guardian_stmt = select(Student.guardian_id).where(Student.id == inst.student_id)
        guardian_id_result = await db.execute(guardian_stmt)
        guardian_id = guardian_id_result.scalar_one_or_none()
        if guardian_id:
            from app.modules.auth.models import User
            user_stmt = select(User.phone).where(User.id == guardian_id)
            user_result = await db.execute(user_stmt)
            phone = user_result.scalar_one_or_none()
            guardian_phone_masked = _mask_phone(phone)

        # P1-28 법률: 건강정보(알레르기) 민감정보 동의 확인 (개인정보보호법 §23)
        # health_info_sharing 미동의 시 알레르기 정보 마스킹
        allergies_display = row.allergies
        if row.allergies and guardian_id:
            from app.modules.compliance.models import GuardianConsent
            consent_stmt = select(GuardianConsent).where(
                GuardianConsent.guardian_id == guardian_id,
                GuardianConsent.child_id == inst.student_id,
                GuardianConsent.withdrawn_at.is_(None),
            )
            consent = (await db.execute(consent_stmt)).scalar_one_or_none()
            health_consented = False
            if consent and consent.consent_scope:
                health_consented = consent.consent_scope.get("health_info_sharing", False)
            if not health_consented:
                allergies_display = None  # 미동의 시 건강정보 미표시

        responses.append(
            DriverDailyScheduleResponse(
                id=inst.id,
                student_id=inst.student_id,
                student_name=row.student_name,
                student_photo_url=row.student_photo_url,
                academy_id=inst.academy_id,
                academy_name=row.academy_name,
                schedule_date=inst.schedule_date,
                pickup_time=inst.pickup_time,
                pickup_latitude=inst.pickup_latitude,
                pickup_longitude=inst.pickup_longitude,
                pickup_address=pickup_address,
                special_notes=row.special_notes,
                allergies=allergies_display,
                guardian_phone_masked=guardian_phone_masked,
                status=inst.status,
                boarded_at=inst.boarded_at,
                alighted_at=inst.alighted_at,
                arrival_confirmed_at=inst.arrival_confirmed_at,
                notification_sent=inst.notification_sent,
            )
        )

    return responses


async def mark_alighted(
    db: AsyncSession, instance_id: uuid.UUID, driver_id: uuid.UUID | None = None
) -> DailyScheduleInstance:
    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.id == instance_id
    )
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    # Verify driver is assigned to this schedule's vehicle
    if driver_id and instance.vehicle_id:
        await _verify_driver_vehicle(db, driver_id, instance.vehicle_id, instance.schedule_date)

    instance.alighted_at = datetime.now(UTC)
    instance.status = "completed"
    await db.flush()

    success = await _send_alighting_push(db, instance)
    instance.notification_sent = success
    await db.flush()

    # P2-52: broadcast schedule update
    await _broadcast_schedule_update(instance, "completed")

    return instance


async def _send_boarding_push(
    db: AsyncSession, instance: DailyScheduleInstance
) -> bool:
    """Send boarding push notification to parent. Returns True if sent."""
    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student
    from app.modules.vehicle_telemetry.models import Vehicle

    try:
        student_stmt = select(Student).where(Student.id == instance.student_id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student:
            return False

        parent_stmt = select(User).where(User.id == student.guardian_id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if not parent or not parent.fcm_token:
            return False

        vehicle_plate = "차량"
        if instance.vehicle_id:
            vehicle_stmt = select(Vehicle).where(Vehicle.id == instance.vehicle_id)
            vehicle = (await db.execute(vehicle_stmt)).scalar_one_or_none()
            if vehicle:
                vehicle_plate = vehicle.license_plate

        return await notif_service.send_boarding_notification(
            parent.fcm_token, student.name, vehicle_plate
        )
    except Exception:
        logger.warning("Failed to send boarding push", exc_info=True)
        return False


async def _send_alighting_push(
    db: AsyncSession, instance: DailyScheduleInstance
) -> bool:
    """Send alighting push notification to parent. Returns True if sent."""
    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student

    try:
        student_stmt = select(Student).where(Student.id == instance.student_id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student:
            return False

        parent_stmt = select(User).where(User.id == student.guardian_id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if not parent or not parent.fcm_token:
            return False

        return await notif_service.send_alighting_notification(parent.fcm_token, student.name)
    except Exception:
        logger.warning("Failed to send alighting push", exc_info=True)
        return False


async def _send_no_show_notification(
    db: AsyncSession, instance: DailyScheduleInstance, reason: str
) -> None:
    """Send no-show notification to parent + academy admin."""
    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student

    try:
        student_stmt = select(Student).where(Student.id == instance.student_id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student:
            return

        parent_stmt = select(User).where(User.id == student.guardian_id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if not parent:
            return

        msg = f"[세이프웨이키즈] {student.name} 학생 미탑승 처리됨. 사유: {reason}"
        if parent.fcm_token:
            await notif_service._push_provider.send_push(
                device_token=parent.fcm_token,
                title="미탑승 안내",
                body=msg,
                data={"type": "no_show", "student_name": student.name},
            )
        if parent.phone and not parent.phone.startswith("kakao_"):
            await notif_service.send_critical_alert_sms(parent.phone, msg)
    except Exception:
        logger.warning("Failed to send no-show notification", exc_info=True)


async def mark_alighted_with_handoff(
    db: AsyncSession, instance_id: uuid.UUID, driver_id: uuid.UUID, handoff_type: str
) -> DailyScheduleInstance:
    """ITEM-P2-50: Mark alighted with handoff type."""
    valid_handoff_types = {"guardian", "academy_staff", "self"}
    if handoff_type not in valid_handoff_types:
        from app.common.exceptions import ValidationError
        raise ValidationError(detail=f"인수자 유형은 {', '.join(valid_handoff_types)} 중 하나여야 합니다")

    stmt = select(DailyScheduleInstance).where(DailyScheduleInstance.id == instance_id)
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    if driver_id and instance.vehicle_id:
        await _verify_driver_vehicle(db, driver_id, instance.vehicle_id, instance.schedule_date)

    instance.alighted_at = datetime.now(UTC)
    instance.status = "completed"
    instance.handoff_type = handoff_type
    await db.flush()

    success = await _send_alighting_push(db, instance)
    instance.notification_sent = success
    await db.flush()

    return instance


async def create_driver_memo(
    db: AsyncSession, instance_id: uuid.UUID, driver_id: uuid.UUID, memo_text: str
) -> DriverMemo:
    """ITEM-P2-49: Create or update driver memo for a schedule instance."""
    # Check instance exists
    inst = (await db.execute(
        select(DailyScheduleInstance).where(DailyScheduleInstance.id == instance_id)
    )).scalar_one_or_none()
    if not inst:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    # Check if memo already exists, update if so
    existing = (await db.execute(
        select(DriverMemo).where(DriverMemo.daily_schedule_id == instance_id)
    )).scalar_one_or_none()
    if existing:
        existing.memo = memo_text
        await db.flush()
        return existing

    memo = DriverMemo(
        daily_schedule_id=instance_id,
        driver_id=driver_id,
        memo=memo_text,
    )
    db.add(memo)
    await db.flush()
    return memo


async def get_driver_memo(
    db: AsyncSession, instance_id: uuid.UUID
) -> DriverMemo | None:
    """ITEM-P2-49: Get driver memo for a schedule instance."""
    return (await db.execute(
        select(DriverMemo).where(DriverMemo.daily_schedule_id == instance_id)
    )).scalar_one_or_none()


async def confirm_arrival(
    db: AsyncSession, instance_id: uuid.UUID, user_id: uuid.UUID
) -> DailyScheduleInstance:
    """Mark a student as arrived at academy after alighting."""
    stmt = select(DailyScheduleInstance).where(DailyScheduleInstance.id == instance_id)
    result = await db.execute(stmt)
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundError(detail="스케줄을 찾을 수 없습니다")

    if instance.status != "completed":
        raise ConflictError(detail="하차 완료 상태에서만 도착 확인이 가능합니다")

    if instance.arrival_confirmed_at:
        raise ConflictError(detail="이미 도착 확인이 완료되었습니다")

    # Verify user is assigned to vehicle
    if instance.vehicle_id:
        await _verify_driver_vehicle(db, user_id, instance.vehicle_id, instance.schedule_date)

    instance.arrival_confirmed_at = datetime.now(UTC)
    await db.flush()

    # Send arrival notification to parent
    await _send_arrival_notification(db, instance)

    return instance


async def _send_arrival_notification(
    db: AsyncSession, instance: DailyScheduleInstance
) -> None:
    """Send arrival confirmation notification to parent."""
    from app.modules.academy_management.models import Academy
    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.student_management.models import Student

    try:
        student = (await db.execute(select(Student).where(Student.id == instance.student_id))).scalar_one_or_none()
        if not student:
            return

        parent = (await db.execute(select(User).where(User.id == student.guardian_id))).scalar_one_or_none()
        if not parent:
            return

        academy = (await db.execute(select(Academy).where(Academy.id == instance.academy_id))).scalar_one_or_none()
        academy_name = academy.name if academy else "학원"

        msg = f"[세이프웨이키즈] {student.name} 학생이 {academy_name}에 안전하게 도착했습니다."
        if parent.fcm_token:
            await notif_service._push_provider.send_push(
                device_token=parent.fcm_token,
                title="학원 도착 확인",
                body=msg,
                data={"type": "arrival_confirmed", "student_name": student.name},
            )
        if parent.phone and not parent.phone.startswith("kakao_"):
            await notif_service.send_critical_alert_sms(parent.phone, msg)
    except Exception:
        logger.warning("Failed to send arrival notification", exc_info=True)


async def start_route_session(
    db: AsyncSession, driver_id: uuid.UUID, vehicle_id: uuid.UUID, schedule_date: date
) -> "RouteSession":
    """Start a route session for a vehicle."""
    from app.modules.scheduling.models import RouteSession

    # Check not already started
    existing = (await db.execute(
        select(RouteSession).where(
            RouteSession.vehicle_id == vehicle_id,
            RouteSession.schedule_date == schedule_date,
        )
    )).scalar_one_or_none()
    if existing and not existing.ended_at:
        raise ConflictError(detail="이미 운행이 시작되었습니다")

    session = RouteSession(
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        schedule_date=schedule_date,
    )
    db.add(session)
    await db.flush()
    return session


async def end_route_session(
    db: AsyncSession, driver_id: uuid.UUID, vehicle_id: uuid.UUID, schedule_date: date
) -> "RouteSession":
    """End a route session for a vehicle."""
    from app.modules.scheduling.models import RouteSession

    stmt = select(RouteSession).where(
        RouteSession.vehicle_id == vehicle_id,
        RouteSession.schedule_date == schedule_date,
        RouteSession.ended_at.is_(None),
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError(detail="활성 운행 세션을 찾을 수 없습니다")

    session.ended_at = datetime.now(UTC)
    await db.flush()
    return session
