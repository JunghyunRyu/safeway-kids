"""Safety escort matching service."""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.escort.models import EscortAvailability, EscortShift
from app.modules.vehicle_telemetry.models import VehicleAssignment


async def register_availability(
    db: AsyncSession,
    escort_id: uuid.UUID,
    available_date: date,
    start_time,
    end_time,
) -> EscortAvailability:
    avail = EscortAvailability(
        escort_id=escort_id,
        available_date=available_date,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(avail)
    await db.flush()
    return avail


async def get_my_availability(
    db: AsyncSession, escort_id: uuid.UUID
) -> list[EscortAvailability]:
    stmt = (
        select(EscortAvailability)
        .where(EscortAvailability.escort_id == escort_id)
        .order_by(EscortAvailability.available_date.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def auto_match(db: AsyncSession, target_date: date) -> dict:
    """Auto-match available escorts to vehicle assignments for a date.

    Strategy: first-come-first-served matching of available escorts
    to assignments that don't already have a safety escort.
    """
    # Get assignments without safety escort
    assign_stmt = select(VehicleAssignment).where(
        VehicleAssignment.assigned_date == target_date,
        VehicleAssignment.safety_escort_id.is_(None),
    )
    assignments = list(
        (await db.execute(assign_stmt)).scalars().all()
    )

    # Get available escorts
    avail_stmt = select(EscortAvailability).where(
        EscortAvailability.available_date == target_date,
        EscortAvailability.status == "available",
    )
    availabilities = list(
        (await db.execute(avail_stmt)).scalars().all()
    )

    shifts_created = 0
    for assignment in assignments:
        if not availabilities:
            break

        avail = availabilities.pop(0)

        # Update assignment
        assignment.safety_escort_id = avail.escort_id

        # Create shift
        shift = EscortShift(
            escort_id=avail.escort_id,
            vehicle_assignment_id=assignment.id,
            shift_date=target_date,
        )
        db.add(shift)

        # Mark availability as matched
        avail.status = "matched"
        shifts_created += 1

    await db.flush()
    return {
        "shifts_created": shifts_created,
        "unmatched_assignments": len(assignments) - shifts_created,
    }


async def check_in(
    db: AsyncSession, shift_id: uuid.UUID, escort_id: uuid.UUID
) -> EscortShift | None:
    shift = await db.get(EscortShift, shift_id)
    if not shift or shift.escort_id != escort_id:
        return None
    shift.check_in_at = datetime.now(UTC)
    shift.status = "checked_in"
    await db.flush()
    return shift


async def check_out(
    db: AsyncSession, shift_id: uuid.UUID, escort_id: uuid.UUID
) -> EscortShift | None:
    shift = await db.get(EscortShift, shift_id)
    if not shift or shift.escort_id != escort_id:
        return None
    shift.check_out_at = datetime.now(UTC)
    shift.status = "completed"
    await db.flush()
    return shift


async def get_my_shifts(
    db: AsyncSession, escort_id: uuid.UUID
) -> list[EscortShift]:
    stmt = (
        select(EscortShift)
        .where(EscortShift.escort_id == escort_id)
        .order_by(EscortShift.shift_date.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
