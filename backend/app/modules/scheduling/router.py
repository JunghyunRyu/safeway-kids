import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.scheduling import service
from app.modules.scheduling.schemas import (
    DailyScheduleResponse,
    DriverDailyScheduleResponse,
    ScheduleCancelRequest,
    ScheduleTemplateCreateRequest,
    ScheduleTemplateResponse,
)

router = APIRouter()


@router.post("/templates", response_model=ScheduleTemplateResponse, status_code=201)
async def create_schedule_template(
    body: ScheduleTemplateCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> ScheduleTemplateResponse:
    """스케줄 템플릿 등록 (주간 반복)"""
    template = await service.create_schedule_template(db, current_user.id, body)
    return ScheduleTemplateResponse.model_validate(template)


@router.get("/templates", response_model=list[ScheduleTemplateResponse])
async def list_schedule_templates(
    student_id: uuid.UUID = Query(..., description="학생 ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ScheduleTemplateResponse]:
    """스케줄 템플릿 목록"""
    templates = await service.list_templates_by_student(db, student_id)
    return [ScheduleTemplateResponse.model_validate(t) for t in templates]


@router.post("/daily/materialize", response_model=list[DailyScheduleResponse])
async def materialize_daily_schedules(
    target_date: date = Query(..., description="대상 날짜"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PLATFORM_ADMIN, UserRole.ACADEMY_ADMIN)
    ),
) -> list[DailyScheduleResponse]:
    """일일 스케줄 생성 (템플릿에서 인스턴스 생성)"""
    instances = await service.materialize_daily_schedules(db, target_date)
    return [DailyScheduleResponse.model_validate(i) for i in instances]


@router.post("/daily/pipeline")
async def run_daily_pipeline(
    target_date: date = Query(..., description="대상 날짜"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PLATFORM_ADMIN, UserRole.ACADEMY_ADMIN)
    ),
) -> dict:
    """일일 파이프라인 실행 (스케줄 생성 → 차량 배정 → 노선 최적화)"""
    from app.modules.scheduling.scheduler import run_daily_pipeline as pipeline
    return await pipeline(db, target_date)


@router.get("/daily/driver", response_model=list[DriverDailyScheduleResponse])
async def get_driver_daily_schedules(
    target_date: date = Query(..., description="조회 날짜"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)
    ),
) -> list[DriverDailyScheduleResponse]:
    """기사 오늘 배정 스케줄"""
    return await service.get_driver_daily_schedules(db, current_user.id, target_date)


@router.get("/daily", response_model=list[DailyScheduleResponse])
async def list_daily_schedules(
    target_date: date = Query(..., description="조회 날짜"),
    student_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DailyScheduleResponse]:
    """일일 스케줄 조회"""
    instances = await service.list_daily_schedules(db, target_date, student_id)
    return [DailyScheduleResponse.model_validate(i) for i in instances]


@router.post("/daily/{instance_id}/cancel", response_model=DailyScheduleResponse)
async def cancel_schedule(
    instance_id: uuid.UUID,
    body: ScheduleCancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> DailyScheduleResponse:
    """원터치 스케줄 취소"""
    instance = await service.cancel_daily_schedule(db, instance_id, current_user.id)
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/board", response_model=DailyScheduleResponse)
async def mark_boarded(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """탑승 처리"""
    instance = await service.mark_boarded(db, instance_id)
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/alight", response_model=DailyScheduleResponse)
async def mark_alighted(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """하차 처리"""
    instance = await service.mark_alighted(db, instance_id)
    return DailyScheduleResponse.model_validate(instance)
