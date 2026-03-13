import json
import uuid
from datetime import UTC, date, datetime

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.modules.vehicle_telemetry.models import GpsHistory, Vehicle, VehicleAssignment
from app.modules.vehicle_telemetry.schemas import GpsUpdateRequest, VehicleAssignmentResponse, VehicleCreateRequest


async def create_vehicle(
    db: AsyncSession, request: VehicleCreateRequest
) -> Vehicle:
    vehicle = Vehicle(
        license_plate=request.license_plate,
        capacity=request.capacity,
        operator_name=request.operator_name,
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
    await redis.set(vehicle_key, payload, ex=300)  # 5 min TTL

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
