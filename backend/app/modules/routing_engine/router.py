import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.routing_engine import service
from app.modules.routing_engine.schemas import (
    GenerateRouteRequest,
    GenerateRouteResponse,
    RouteResponse,
    RouteStopResponse,
)

router = APIRouter()


@router.post("/generate", response_model=GenerateRouteResponse)
async def generate_route(
    body: GenerateRouteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> GenerateRouteResponse:
    """노선 최적화 실행 (학원 관리자 / 플랫폼 관리자)"""
    return await service.generate_route_plan(
        db, body.academy_id, body.plan_date, body.time_limit_seconds
    )


@router.get("/my-route", response_model=RouteResponse | None)
async def get_my_route(
    plan_date: date = Query(..., description="노선 날짜"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> RouteResponse | None:
    """기사 본인 오늘 노선 조회"""
    from sqlalchemy import select

    from app.modules.vehicle_telemetry.models import VehicleAssignment

    # Find driver's vehicle assignment
    stmt = select(VehicleAssignment).where(
        VehicleAssignment.driver_id == current_user.id,
        VehicleAssignment.assigned_date == plan_date,
    )
    result = await db.execute(stmt)
    assignment = result.scalar_one_or_none()
    if not assignment:
        return None

    plan = await service.get_route_plan(db, assignment.vehicle_id, plan_date)
    if not plan:
        return None

    return RouteResponse(
        vehicle_id=plan.vehicle_id,
        plan_date=plan.plan_date,
        version=plan.version,
        stops=[
            RouteStopResponse(
                stop_id=s["stop_id"],
                student_name=s.get("student_name"),
                latitude=s["latitude"],
                longitude=s["longitude"],
                order=s["order"],
            )
            for s in plan.stops
        ],
        total_distance_km=plan.total_distance_km,
        total_duration_min=plan.total_duration_min,
        generated_by=plan.generated_by,
    )


@router.get("/{vehicle_id}/{plan_date}", response_model=RouteResponse | None)
async def get_route(
    vehicle_id: uuid.UUID,
    plan_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.DRIVER, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> RouteResponse | None:
    """차량별 노선 조회 (기사 / 관리자)"""
    plan = await service.get_route_plan(db, vehicle_id, plan_date)
    if not plan:
        return None

    return RouteResponse(
        vehicle_id=plan.vehicle_id,
        plan_date=plan.plan_date,
        version=plan.version,
        stops=[
            RouteStopResponse(
                stop_id=s["stop_id"],
                student_name=s.get("student_name"),
                latitude=s["latitude"],
                longitude=s["longitude"],
                order=s["order"],
            )
            for s in plan.stops
        ],
        total_distance_km=plan.total_distance_km,
        total_duration_min=plan.total_duration_min,
        generated_by=plan.generated_by,
    )
