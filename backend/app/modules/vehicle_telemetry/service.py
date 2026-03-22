import json
import logging
import uuid
from datetime import UTC, date, datetime, timedelta

from redis.asyncio import Redis
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.config import settings
from app.modules.vehicle_telemetry.models import GpsHistory, LocationAccessLog, Vehicle, VehicleAssignment
from app.modules.vehicle_telemetry.schemas import (
    GpsUpdateRequest,
    VehicleAssignmentResponse,
    VehicleCreateRequest,
    VehicleUpdateRequest,
)

logger = logging.getLogger(__name__)


async def create_vehicle(
    db: AsyncSession, request: VehicleCreateRequest
) -> Vehicle:
    vehicle = Vehicle(
        license_plate=request.license_plate,
        capacity=request.capacity,
        operator_name=request.operator_name,
        manufacture_year=request.manufacture_year,
        school_bus_registration_no=request.school_bus_registration_no,
        is_yellow_painted=request.is_yellow_painted,
        vehicle_type=request.vehicle_type,
        has_cctv=request.has_cctv,
        has_stop_sign=request.has_stop_sign,
        last_inspection_date=request.last_inspection_date,
        insurance_expiry=request.insurance_expiry,
        insurance_type=request.insurance_type,
        insurance_coverage_amount=request.insurance_coverage_amount,
        registration_expiry=request.registration_expiry,
        safety_inspection_expiry=request.safety_inspection_expiry,
    )
    db.add(vehicle)
    await db.flush()
    return vehicle


async def get_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> Vehicle:
    stmt = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(stmt)
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise NotFoundError(detail="차량을 찾을 수 없습니다")
    return vehicle


async def update_vehicle(
    db: AsyncSession, vehicle_id: uuid.UUID, request: VehicleUpdateRequest
) -> Vehicle:
    """Update vehicle fields. Only non-None values are applied."""
    vehicle = await get_vehicle(db, vehicle_id)
    if request.license_plate is not None:
        vehicle.license_plate = request.license_plate
    if request.capacity is not None:
        vehicle.capacity = request.capacity
    if request.model_name is not None:
        vehicle.operator_name = request.model_name  # maps model_name to operator_name column
    if request.is_active is not None:
        vehicle.is_active = request.is_active
    if request.manufacture_year is not None:
        vehicle.manufacture_year = request.manufacture_year
    if request.school_bus_registration_no is not None:
        vehicle.school_bus_registration_no = request.school_bus_registration_no
    if request.is_yellow_painted is not None:
        vehicle.is_yellow_painted = request.is_yellow_painted
    if request.vehicle_type is not None:
        vehicle.vehicle_type = request.vehicle_type
    if request.has_cctv is not None:
        vehicle.has_cctv = request.has_cctv
    if request.has_stop_sign is not None:
        vehicle.has_stop_sign = request.has_stop_sign
    if request.last_inspection_date is not None:
        vehicle.last_inspection_date = request.last_inspection_date
    if request.insurance_expiry is not None:
        vehicle.insurance_expiry = request.insurance_expiry
    if request.insurance_type is not None:
        vehicle.insurance_type = request.insurance_type
    if request.insurance_coverage_amount is not None:
        vehicle.insurance_coverage_amount = request.insurance_coverage_amount
    if request.registration_expiry is not None:
        vehicle.registration_expiry = request.registration_expiry
    if request.safety_inspection_expiry is not None:
        vehicle.safety_inspection_expiry = request.safety_inspection_expiry
    await db.flush()
    return vehicle


async def deactivate_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> Vehicle:
    """Soft-deactivate a vehicle by setting is_active = False."""
    vehicle = await get_vehicle(db, vehicle_id)
    vehicle.is_active = False
    await db.flush()
    return vehicle


async def list_vehicles(db: AsyncSession) -> list[Vehicle]:
    stmt = select(Vehicle).where(Vehicle.is_active.is_(True)).order_by(Vehicle.license_plate)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_driver_vehicle_assignment(
    db: AsyncSession, driver_id: uuid.UUID, target_date: date
) -> VehicleAssignmentResponse | None:
    """Get driver's vehicle assignment for a specific date."""
    from app.modules.auth.models import User

    stmt = (
        select(VehicleAssignment, Vehicle)
        .join(Vehicle, VehicleAssignment.vehicle_id == Vehicle.id)
        .where(
            VehicleAssignment.driver_id == driver_id,
            VehicleAssignment.assigned_date == target_date,
        )
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        return None

    assignment, vehicle = row.VehicleAssignment, row.Vehicle

    # Get safety escort name if assigned
    safety_escort_name = None
    if assignment.safety_escort_id:
        escort_stmt = select(User).where(User.id == assignment.safety_escort_id)
        escort_result = await db.execute(escort_stmt)
        escort = escort_result.scalar_one_or_none()
        if escort:
            safety_escort_name = escort.name

    return VehicleAssignmentResponse(
        vehicle_id=vehicle.id,
        license_plate=vehicle.license_plate,
        capacity=vehicle.capacity,
        operator_name=vehicle.operator_name,
        safety_escort_name=safety_escort_name,
        assigned_date=assignment.assigned_date,
    )


async def update_gps(redis: Redis, request: GpsUpdateRequest) -> None:  # type: ignore[type-arg]
    """
    GPS update flow:
    1. Store latest position in Redis (for real-time reads)
    2. Publish to Redis channel (for WebSocket subscribers)
    3. Buffer for batch write to PostgreSQL
    """
    now = datetime.now(UTC).isoformat()
    vehicle_key = f"vehicle:{request.vehicle_id}:gps"
    channel = f"vehicle:{request.vehicle_id}:gps_updates"
    buffer_key = f"gps_buffer:{request.vehicle_id}"

    location_data = {
        "vehicle_id": str(request.vehicle_id),
        "latitude": request.latitude,
        "longitude": request.longitude,
        "heading": request.heading,
        "speed": request.speed,
        "recorded_at": now,
    }

    payload = json.dumps(location_data)

    # 1. Update latest position
    await redis.set(vehicle_key, payload, ex=settings.gps_data_ttl_seconds)

    # 2. Publish for real-time subscribers
    await redis.publish(channel, payload)

    # 3. Buffer for batch write to PostgreSQL
    await redis.rpush(buffer_key, payload)

    # 4. Track active vehicles for background flush
    await redis.sadd("active_vehicles", str(request.vehicle_id))


async def get_latest_gps(redis: Redis, vehicle_id: uuid.UUID) -> dict | None:  # type: ignore[type-arg]
    """Get the latest GPS position from Redis."""
    vehicle_key = f"vehicle:{vehicle_id}:gps"
    data = await redis.get(vehicle_key)
    if data:
        return json.loads(data)
    return None


async def flush_gps_buffer(
    redis: Redis, db: AsyncSession, vehicle_id: uuid.UUID  # type: ignore[type-arg]
) -> int:
    """Flush buffered GPS data from Redis to PostgreSQL. Returns count of flushed records."""
    buffer_key = f"gps_buffer:{vehicle_id}"
    count = 0

    while True:
        data = await redis.lpop(buffer_key)
        if not data:
            break

        location = json.loads(data)
        record = GpsHistory(
            vehicle_id=uuid.UUID(location["vehicle_id"]),
            latitude=location["latitude"],
            longitude=location["longitude"],
            heading=location.get("heading"),
            speed=location.get("speed"),
            recorded_at=datetime.fromisoformat(location["recorded_at"]),
        )
        db.add(record)
        count += 1

    if count > 0:
        await db.flush()

    return count


async def check_vehicle_access(
    db: AsyncSession, user: "User", vehicle_id: uuid.UUID  # type: ignore[name-defined]
) -> bool:
    """Check if a user has permission to access a vehicle's location stream."""
    from app.modules.auth.models import UserRole

    if user.role == UserRole.PLATFORM_ADMIN:
        return True

    today = date.today()

    if user.role == UserRole.DRIVER:
        stmt = select(VehicleAssignment).where(
            VehicleAssignment.driver_id == user.id,
            VehicleAssignment.vehicle_id == vehicle_id,
            VehicleAssignment.assigned_date == today,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None

    if user.role == UserRole.SAFETY_ESCORT:
        stmt = select(VehicleAssignment).where(
            VehicleAssignment.safety_escort_id == user.id,
            VehicleAssignment.vehicle_id == vehicle_id,
            VehicleAssignment.assigned_date == today,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None

    if user.role == UserRole.PARENT:
        from app.modules.scheduling.models import DailyScheduleInstance
        from app.modules.student_management.models import Student

        student_ids_subq = (
            select(Student.id).where(Student.guardian_id == user.id).scalar_subquery()
        )
        stmt = select(DailyScheduleInstance).where(
            DailyScheduleInstance.student_id.in_(student_ids_subq),
            DailyScheduleInstance.vehicle_id == vehicle_id,
            DailyScheduleInstance.schedule_date == today,
        )
        result = await db.execute(stmt)
        return result.first() is not None

    if user.role == UserRole.ACADEMY_ADMIN:
        from app.modules.academy_management.models import Academy
        from app.modules.scheduling.models import DailyScheduleInstance

        academy_stmt = select(Academy).where(Academy.admin_id == user.id)
        academy_result = await db.execute(academy_stmt)
        academy = academy_result.scalar_one_or_none()
        if not academy:
            return False
        stmt = select(DailyScheduleInstance).where(
            DailyScheduleInstance.academy_id == academy.id,
            DailyScheduleInstance.vehicle_id == vehicle_id,
            DailyScheduleInstance.schedule_date == today,
        )
        result = await db.execute(stmt)
        return result.first() is not None

    return False


async def purge_old_gps_data(db: AsyncSession) -> int:
    """Delete GPS history older than 180 days (위치정보법 제16조)."""
    cutoff = datetime.now(UTC) - timedelta(days=180)
    stmt = delete(GpsHistory).where(GpsHistory.recorded_at < cutoff)
    result = await db.execute(stmt)
    count = result.rowcount
    if count > 0:
        logger.info("[GPS] Purged %d old GPS records (before %s)", count, cutoff.isoformat())
    return count


async def log_location_access(
    db: AsyncSession,
    subject_type: str,
    subject_id: uuid.UUID,
    vehicle_id: uuid.UUID,
    accessor_user_id: uuid.UUID,
    access_purpose: str = "safety_monitoring",
) -> None:
    """위치정보법 제16조: 위치정보 수집/이용/제공 기록 저장 (6개월 보관)."""
    retention = date.today() + timedelta(days=180)
    log = LocationAccessLog(
        subject_type=subject_type,
        subject_id=subject_id,
        vehicle_id=vehicle_id,
        accessor_user_id=accessor_user_id,
        access_purpose=access_purpose,
        retention_until=retention,
    )
    db.add(log)
    await db.flush()


async def purge_old_location_access_logs(db: AsyncSession) -> int:
    """Delete location access logs past retention_until (6개월, 위치정보법 제24조)."""
    today = date.today()
    stmt = delete(LocationAccessLog).where(LocationAccessLog.retention_until < today)
    result = await db.execute(stmt)
    count = result.rowcount
    if count > 0:
        logger.info("[LocationAccessLog] Purged %d expired records", count)
    return count


async def send_driver_change_notification(
    db: AsyncSession, vehicle_id: uuid.UUID, new_driver_name: str, license_plate: str
) -> None:
    """Send notification to parents when driver changes for a vehicle."""
    from app.modules.auth.models import User
    from app.modules.notification import service as notif_service
    from app.modules.scheduling.models import DailyScheduleInstance
    from app.modules.student_management.models import Student

    today = date.today()
    stmt = (
        select(DailyScheduleInstance)
        .where(
            DailyScheduleInstance.vehicle_id == vehicle_id,
            DailyScheduleInstance.schedule_date == today,
        )
    )
    result = await db.execute(stmt)
    instances = result.scalars().all()

    notified_parents: set[uuid.UUID] = set()
    for instance in instances:
        student_stmt = select(Student).where(Student.id == instance.student_id)
        student = (await db.execute(student_stmt)).scalar_one_or_none()
        if not student or student.guardian_id in notified_parents:
            continue

        parent_stmt = select(User).where(User.id == student.guardian_id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if not parent:
            continue

        notified_parents.add(parent.id)
        msg = f"[세이프웨이키즈] {student.name} 학생의 담당 기사가 {new_driver_name}(으)로 변경되었습니다. 차량번호: {license_plate}"
        if parent.fcm_token:
            await notif_service._push_provider.send_push(
                device_token=parent.fcm_token,
                title="기사 변경 안내",
                body=msg,
                data={"type": "driver_change"},
            )
        if parent.phone and not parent.phone.startswith("kakao_"):
            await notif_service._sms_provider.send_sms(parent.phone, msg)
