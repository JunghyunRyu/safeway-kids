"""Daily schedule pipeline: materialize → assign vehicles → generate routes.

Can be run as:
  - CLI: python -m app.modules.scheduling.scheduler [--date YYYY-MM-DD]
  - API: POST /schedules/daily/pipeline (admin)
"""

import logging
from datetime import date, timedelta

from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User, UserRole
from app.modules.scheduling.models import DailyScheduleInstance
from app.modules.scheduling.service import materialize_daily_schedules
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment

logger = logging.getLogger(__name__)


async def auto_assign_vehicles(
    db: AsyncSession, target_date: date
) -> list[VehicleAssignment]:
    """Auto-assign vehicles to drivers for a date if no assignments exist.

    Strategy: round-robin assign active vehicles to active drivers.
    Creates VehicleAssignment rows for each (vehicle, driver) pair.
    """
    # Check if assignments already exist for this date
    existing_stmt = select(VehicleAssignment).where(
        VehicleAssignment.assigned_date == target_date,
    )
    existing = await db.execute(existing_stmt)
    if list(existing.scalars().all()):
        logger.info("Vehicle assignments already exist for %s, skipping", target_date)
        return []

    # Get active vehicles
    vehicle_stmt = (
        select(Vehicle).where(Vehicle.is_active.is_(True)).order_by(Vehicle.license_plate)
    )
    vehicles = list((await db.execute(vehicle_stmt)).scalars().all())
    if not vehicles:
        logger.warning("No active vehicles found")
        return []

    # Get active drivers
    driver_stmt = select(User).where(
        User.role == UserRole.DRIVER,
        User.is_active.is_(True),
        User.deleted_at.is_(None),
    ).order_by(User.name)
    drivers = list((await db.execute(driver_stmt)).scalars().all())
    if not drivers:
        logger.warning("No active drivers found")
        return []

    # Round-robin: assign vehicles to drivers
    assignments: list[VehicleAssignment] = []
    for i, vehicle in enumerate(vehicles):
        driver = drivers[i % len(drivers)]
        assignment = VehicleAssignment(
            vehicle_id=vehicle.id,
            driver_id=driver.id,
            assigned_date=target_date,
        )
        db.add(assignment)
        assignments.append(assignment)
        logger.info(
            "Assigned vehicle %s to driver %s for %s",
            vehicle.license_plate, driver.name, target_date,
        )

    await db.flush()

    # REG-07: Warn about assignments missing safety escorts
    missing_escort = [a for a in assignments if not a.safety_escort_id]
    if missing_escort:
        plates = []
        for a in missing_escort:
            v = await db.get(Vehicle, a.vehicle_id)
            plates.append(v.license_plate if v else str(a.vehicle_id))
        logger.warning(
            "SAFETY_ESCORT_MISSING: %d vehicle(s) assigned without safety escort for %s: %s",
            len(missing_escort), target_date, ", ".join(plates),
        )

    return assignments


async def run_daily_pipeline(
    db: AsyncSession, target_date: date
) -> dict:
    """Run the full daily pipeline: materialize → assign → route.

    Returns summary dict with counts.
    """
    result: dict = {"date": str(target_date)}

    # Step 1: Materialize daily schedules from templates
    instances = await materialize_daily_schedules(db, target_date)
    result["schedules_created"] = len(instances)
    logger.info("Materialized %d schedule instances for %s", len(instances), target_date)

    # Step 2: Auto-assign vehicles if needed
    assignments = await auto_assign_vehicles(db, target_date)
    result["assignments_created"] = len(assignments)

    # REG-07: Check all assignments (new + existing) for missing safety escorts
    all_assign_stmt = select(VehicleAssignment).where(
        VehicleAssignment.assigned_date == target_date,
        VehicleAssignment.safety_escort_id.is_(None),
    )
    no_escort = list((await db.execute(all_assign_stmt)).scalars().all())
    if no_escort:
        result["safety_escort_warnings"] = len(no_escort)
        for a in no_escort:
            v = await db.get(Vehicle, a.vehicle_id)
            plate = v.license_plate if v else str(a.vehicle_id)
            logger.warning(
                "SAFETY_ESCORT_MISSING: vehicle %s has no safety escort for %s",
                plate, target_date,
            )
    else:
        result["safety_escort_warnings"] = 0

    # If new assignments were created, update schedule instances with vehicle_id
    if assignments:
        # Get all unassigned schedules for this date
        unassigned_stmt = select(DailyScheduleInstance).where(
            DailyScheduleInstance.schedule_date == target_date,
            DailyScheduleInstance.vehicle_id.is_(None),
            DailyScheduleInstance.status == "scheduled",
        )
        unassigned = list((await db.execute(unassigned_stmt)).scalars().all())

        # Assign round-robin to vehicles
        for i, inst in enumerate(unassigned):
            inst.vehicle_id = assignments[i % len(assignments)].vehicle_id

        await db.flush()
        logger.info("Assigned %d schedules to vehicles", len(unassigned))

    # Step 3: Generate optimized routes per academy
    from app.modules.routing_engine.service import generate_route_plan

    # Get distinct academy IDs with scheduled instances for this date
    academy_stmt = select(distinct(DailyScheduleInstance.academy_id)).where(
        DailyScheduleInstance.schedule_date == target_date,
        DailyScheduleInstance.status == "scheduled",
    )
    academy_ids = list((await db.execute(academy_stmt)).scalars().all())

    routes_generated = 0
    for academy_id in academy_ids:
        route_result = await generate_route_plan(db, academy_id, target_date)
        routes_generated += len(route_result.routes)
        logger.info(
            "Generated %d routes for academy %s: %s",
            len(route_result.routes), academy_id, route_result.status,
        )

    result["routes_generated"] = routes_generated
    result["academies_processed"] = len(academy_ids)

    return result


async def run_pipeline_cli(target_date: date | None = None) -> None:
    """CLI entry point for the daily pipeline."""
    from app.database import async_session_factory

    if target_date is None:
        target_date = date.today() + timedelta(days=1)

    logger.info("Running daily pipeline for %s", target_date)

    async with async_session_factory() as db:
        result = await run_daily_pipeline(db, target_date)
        await db.commit()

    logger.info("Pipeline complete: %s", result)
