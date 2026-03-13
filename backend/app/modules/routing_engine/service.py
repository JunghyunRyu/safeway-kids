"""Route generation service — bridges DB models and VRP-TW solver."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.routing_engine.schemas import (
    GenerateRouteResponse,
    RouteResponse,
    RouteStopResponse,
)
from app.modules.routing_engine.solver import (
    Depot,
    SolverResult,
    Stop,
    VehicleSpec,
    solve_vrp_tw,
)
from app.modules.scheduling.models import DailyScheduleInstance, RoutePlan
from app.modules.student_management.models import Student
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment


async def generate_route_plan(
    db: AsyncSession,
    academy_id: uuid.UUID,
    plan_date: date,
    time_limit_seconds: int = 30,
) -> GenerateRouteResponse:
    """Generate optimized route plans for an academy on a given date.

    1. Load academy (depot coordinates)
    2. Load scheduled stops for the date
    3. Load assigned vehicles
    4. Solve VRP-TW
    5. Persist RoutePlan rows
    """
    # 1. Load academy as depot
    academy = await db.get(Academy, academy_id)
    if not academy:
        return GenerateRouteResponse(
            status="no_solution", routes=[], objective_value=0.0
        )

    depot = Depot(latitude=academy.latitude, longitude=academy.longitude)

    # 2. Load scheduled stops (DailyScheduleInstance for this academy + date)
    stmt = (
        select(DailyScheduleInstance, Student)
        .join(Student, DailyScheduleInstance.student_id == Student.id)
        .where(
            DailyScheduleInstance.academy_id == academy_id,
            DailyScheduleInstance.schedule_date == plan_date,
            DailyScheduleInstance.status == "scheduled",
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        return GenerateRouteResponse(
            status="no_solution", routes=[], objective_value=0.0
        )

    stops: list[Stop] = []
    student_names: dict[str, str] = {}
    stop_coords: dict[str, tuple[float, float]] = {}

    for schedule, student in rows:
        stop_id = str(schedule.id)
        pickup_minutes = schedule.pickup_time.hour * 60 + schedule.pickup_time.minute
        stops.append(Stop(
            id=stop_id,
            latitude=schedule.pickup_latitude,
            longitude=schedule.pickup_longitude,
            time_window_start=max(0, pickup_minutes - 15),  # 15 min early window
            time_window_end=pickup_minutes + 15,  # 15 min late window
        ))
        student_names[stop_id] = student.name
        stop_coords[stop_id] = (schedule.pickup_latitude, schedule.pickup_longitude)

    # 3. Load vehicles assigned for this date with schedules in this academy
    vehicle_ids_in_schedules = {
        schedule.vehicle_id
        for schedule, _ in rows
        if schedule.vehicle_id is not None
    }

    vehicles: list[VehicleSpec] = []
    vehicle_map: dict[str, uuid.UUID] = {}

    if vehicle_ids_in_schedules:
        v_stmt = select(Vehicle).where(
            Vehicle.id.in_(vehicle_ids_in_schedules),
            Vehicle.is_active.is_(True),
        )
        v_result = await db.execute(v_stmt)
        for vehicle in v_result.scalars().all():
            vid = str(vehicle.id)
            vehicles.append(VehicleSpec(id=vid, capacity=vehicle.capacity))
            vehicle_map[vid] = vehicle.id
    else:
        # Fallback: get any assigned vehicles for this date
        va_stmt = (
            select(VehicleAssignment, Vehicle)
            .join(Vehicle, VehicleAssignment.vehicle_id == Vehicle.id)
            .where(VehicleAssignment.assigned_date == plan_date)
        )
        va_result = await db.execute(va_stmt)
        for _assignment, vehicle in va_result.all():
            vid = str(vehicle.id)
            if vid not in vehicle_map:
                vehicles.append(VehicleSpec(id=vid, capacity=vehicle.capacity))
                vehicle_map[vid] = vehicle.id

    if not vehicles:
        return GenerateRouteResponse(
            status="no_solution", routes=[], objective_value=0.0
        )

    # 4. Build road distance matrix if Kakao API is configured
    precomputed_dist = None
    precomputed_time = None

    try:
        from app.common.map_provider.kakao import KakaoMapsProvider
        from app.modules.routing_engine.distance import build_road_distance_matrix
        from app.redis import redis_client

        map_provider = KakaoMapsProvider()
        precomputed_dist, precomputed_time = await build_road_distance_matrix(
            depot, stops, map_provider, redis_client
        )
    except Exception:
        pass  # Fall back to Euclidean inside solver

    # 5. Solve
    solver_result: SolverResult = solve_vrp_tw(
        depot=depot,
        stops=stops,
        vehicles=vehicles,
        time_limit_seconds=time_limit_seconds,
        precomputed_distance_matrix=precomputed_dist,
        precomputed_time_matrix=precomputed_time,
    )

    # 5. Persist RoutePlan rows and build response
    route_responses: list[RouteResponse] = []

    for route in solver_result.routes:
        vehicle_uuid = vehicle_map.get(route.vehicle_id)
        if not vehicle_uuid:
            continue

        # Build stops JSON for DB
        stops_json = []
        for order, stop_id in enumerate(route.ordered_stop_ids, 1):
            coord = stop_coords.get(stop_id, (0.0, 0.0))
            stops_json.append({
                "stop_id": stop_id,
                "order": order,
                "latitude": coord[0],
                "longitude": coord[1],
                "student_name": student_names.get(stop_id),
            })

        # Get next version number
        existing = await db.execute(
            select(RoutePlan)
            .where(
                RoutePlan.vehicle_id == vehicle_uuid,
                RoutePlan.plan_date == plan_date,
            )
            .order_by(RoutePlan.version.desc())
            .limit(1)
        )
        latest = existing.scalar_one_or_none()
        version = (latest.version + 1) if latest else 1

        plan = RoutePlan(
            vehicle_id=vehicle_uuid,
            plan_date=plan_date,
            version=version,
            stops=stops_json,
            total_distance_km=route.total_distance_km,
            total_duration_min=route.total_duration_min,
            generated_by="vrp-tw-v1",
        )
        db.add(plan)

        route_responses.append(RouteResponse(
            vehicle_id=vehicle_uuid,
            plan_date=plan_date,
            version=version,
            stops=[
                RouteStopResponse(
                    stop_id=s["stop_id"],
                    student_name=s.get("student_name"),
                    latitude=s["latitude"],
                    longitude=s["longitude"],
                    order=s["order"],
                )
                for s in stops_json
            ],
            total_distance_km=route.total_distance_km,
            total_duration_min=route.total_duration_min,
            generated_by="vrp-tw-v1",
        ))

    await db.flush()

    return GenerateRouteResponse(
        status=solver_result.status,
        routes=route_responses,
        objective_value=solver_result.objective_value,
    )


async def get_route_plan(
    db: AsyncSession,
    vehicle_id: uuid.UUID,
    plan_date: date,
) -> RoutePlan | None:
    """Get the latest route plan for a vehicle on a date."""
    stmt = (
        select(RoutePlan)
        .where(
            RoutePlan.vehicle_id == vehicle_id,
            RoutePlan.plan_date == plan_date,
        )
        .order_by(RoutePlan.version.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
