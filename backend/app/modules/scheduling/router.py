import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.scheduling import service
from app.modules.scheduling.schemas import (
    AlightWithHandoffRequest,
    BatchBoardRequest,
    DailyScheduleResponse,
    DriverDailyScheduleResponse,
    DriverMemoRequest,
    DriverMemoResponse,
    NoShowRequest,
    RouteReorderRequest,
    RouteSessionRequest,
    RouteSessionResponse,
    ScheduleCancelRequest,
    ScheduleTemplateCreateRequest,
    ScheduleTemplateResponse,
    VehicleClearanceRequest,
    VehicleClearanceResponse,
)

router = APIRouter()


@router.post("/templates", response_model=ScheduleTemplateResponse, status_code=201)
async def create_schedule_template(
    body: ScheduleTemplateCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN
    )),
) -> ScheduleTemplateResponse:
    """스케줄 템플릿 등록 (주간 반복) — 학부모/학원관리자/플랫폼관리자"""
    if current_user.role == UserRole.PARENT:
        template = await service.create_schedule_template(db, current_user.id, body)
    else:
        template = await service.create_schedule_template_admin(db, current_user.id, body)
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


@router.get("/templates/academy", response_model=list[ScheduleTemplateResponse])
async def list_academy_templates(
    academy_id: uuid.UUID = Query(..., description="학원 ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN
    )),
) -> list[ScheduleTemplateResponse]:
    """학원별 전체 템플릿 조회"""
    templates = await service.list_templates_by_academy(db, academy_id)
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


@router.get("/daily")
async def list_daily_schedules(
    target_date: date = Query(..., description="조회 날짜"),
    student_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=None, ge=1, description="P3-69: 페이지 번호 (생략 시 전체 반환)"),
    page_size: int = Query(default=50, ge=1, le=100, description="P3-69: 페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """일일 스케줄 조회 — 학부모는 본인 자녀만 조회, P3-69: 페이지네이션 지원"""
    results = await service.list_daily_schedules(
        db, target_date, student_id,
        guardian_id=current_user.id if current_user.role == UserRole.PARENT else None,
    )
    if page is not None:
        total = len(results)
        skip = (page - 1) * page_size
        items = results[skip : skip + page_size]
        return {"items": [DailyScheduleResponse(**r) for r in items], "total": total}
    return [DailyScheduleResponse(**r) for r in results]


@router.post("/daily/batch-board", response_model=list[DailyScheduleResponse])
async def batch_board(
    body: BatchBoardRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> list[DailyScheduleResponse]:
    """ITEM-P2-47: 동일 정류장 일괄 탑승 처리"""
    results = []
    for instance_id in body.instance_ids:
        instance = await service.mark_boarded(db, instance_id, driver_id=current_user.id)
        results.append(DailyScheduleResponse.model_validate(instance))
    return results


@router.post("/daily/{instance_id}/alight-handoff", response_model=DailyScheduleResponse)
async def alight_with_handoff(
    instance_id: uuid.UUID,
    body: AlightWithHandoffRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """ITEM-P2-50: 하차 처리 + 인수자 확인"""
    instance = await service.mark_alighted_with_handoff(
        db, instance_id, current_user.id, body.handoff_type
    )
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/memo", response_model=DriverMemoResponse, status_code=201)
async def create_driver_memo(
    instance_id: uuid.UUID,
    body: DriverMemoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DriverMemoResponse:
    """ITEM-P2-49: 기사 특이사항 메모 등록"""
    memo = await service.create_driver_memo(db, instance_id, current_user.id, body.memo)
    return DriverMemoResponse.model_validate(memo)


@router.get("/daily/{instance_id}/memo", response_model=DriverMemoResponse | None)
async def get_driver_memo(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.DRIVER, UserRole.SAFETY_ESCORT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN
    )),
) -> DriverMemoResponse | None:
    """ITEM-P2-49: 기사 메모 조회"""
    memo = await service.get_driver_memo(db, instance_id)
    return DriverMemoResponse.model_validate(memo) if memo else None


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
    instance = await service.mark_boarded(db, instance_id, driver_id=current_user.id)
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/alight", response_model=DailyScheduleResponse)
async def mark_alighted(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """하차 처리"""
    instance = await service.mark_alighted(db, instance_id, driver_id=current_user.id)
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/no-show", response_model=DailyScheduleResponse)
async def mark_no_show(
    instance_id: uuid.UUID,
    body: NoShowRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """미탑승 처리 + 학부모/학원 알림"""
    from app.modules.admin.service import log_audit

    instance = await service.mark_no_show(db, instance_id, body.reason, driver_id=current_user.id)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="NO_SHOW",
        entity_type="daily_schedule",
        entity_id=str(instance_id),
        details={"reason": body.reason},
        ip_address=request.client.host if request.client else None,
    )
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/arrival-confirm", response_model=DailyScheduleResponse)
async def confirm_arrival(
    instance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """학원 도착 확인 (하차 완료 후 학원 인계 확인)"""
    instance = await service.confirm_arrival(db, instance_id, current_user.id)
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/route/start", response_model=RouteSessionResponse, status_code=201)
async def start_route(
    body: RouteSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> RouteSessionResponse:
    """운행 시작"""
    session = await service.start_route_session(db, current_user.id, body.vehicle_id, body.schedule_date)
    return RouteSessionResponse.model_validate(session)


@router.post("/daily/route/end", response_model=RouteSessionResponse)
async def end_route(
    body: RouteSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> RouteSessionResponse:
    """운행 종료"""
    session = await service.end_route_session(db, current_user.id, body.vehicle_id, body.schedule_date)
    return RouteSessionResponse.model_validate(session)


@router.post("/daily/{instance_id}/undo-board", response_model=DailyScheduleResponse)
async def undo_board(
    instance_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """탑승 취소 (5분 이내)"""
    from app.modules.admin.service import log_audit

    instance = await service.undo_board(db, instance_id)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UNDO_BOARD",
        entity_type="daily_schedule",
        entity_id=str(instance_id),
        ip_address=request.client.host if request.client else None,
    )
    return DailyScheduleResponse.model_validate(instance)


@router.post("/daily/{instance_id}/undo-alight", response_model=DailyScheduleResponse)
async def undo_alight(
    instance_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> DailyScheduleResponse:
    """하차 취소 (5분 이내)"""
    from app.modules.admin.service import log_audit

    instance = await service.undo_alight(db, instance_id)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UNDO_ALIGHT",
        entity_type="daily_schedule",
        entity_id=str(instance_id),
        ip_address=request.client.host if request.client else None,
    )
    return DailyScheduleResponse.model_validate(instance)


# --- P3-66: Manual route reorder ---


@router.patch("/daily/reorder")
async def reorder_route(
    body: RouteReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> dict:
    """P3-66: 수동 노선 순서 변경"""
    return await service.reorder_route(db, current_user.id, body)


@router.post("/daily/vehicle-clear", response_model=VehicleClearanceResponse, status_code=201)
async def vehicle_clearance(
    body: VehicleClearanceRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> VehicleClearanceResponse:
    """차량 잔류 학생 확인 체크리스트 제출"""
    from app.modules.admin.service import log_audit

    clearance = await service.complete_vehicle_clearance(
        db, current_user.id, body.vehicle_id, body.date, body.checklist,
    )
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="VEHICLE_CLEARANCE",
        entity_type="vehicle_clearance",
        entity_id=str(clearance.id),
        details=body.checklist,
        ip_address=request.client.host if request.client else None,
    )
    return VehicleClearanceResponse.model_validate(clearance)
