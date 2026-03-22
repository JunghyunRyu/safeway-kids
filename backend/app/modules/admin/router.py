import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ForbiddenError
from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_platform_admin, require_roles
from app.modules.admin import service
from app.modules.admin.schemas import (
    AcademyStatsResponse,
    BoardingStatusResponse,
    DriverInfoResponse,
    PaginatedAuditLogResponse,
    PaginatedNotificationLogResponse,
    PaginatedTicketResponse,
    StudentSearchResult,
    SupportTicketCreateRequest,
    SupportTicketResponse,
    SupportTicketUpdateRequest,
)
from app.modules.auth.models import User, UserRole

router = APIRouter()


@router.post("/seed")
async def seed_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> dict:
    """시드 데이터 생성 (개발 환경 전용, 플랫폼 관리자 전용)"""
    if settings.environment == "production":
        raise ForbiddenError(detail="프로덕션 환경에서는 시드 데이터를 생성할 수 없습니다")

    return await service.seed_data(db)


@router.get("/audit-logs", response_model=PaginatedAuditLogResponse)
async def list_audit_logs(
    entity_type: str | None = Query(None, description="엔티티 유형 필터 (user, student, vehicle, billing_plan, invoice)"),
    action: str | None = Query(None, description="액션 필터 (CREATE, UPDATE, DELETE)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(50, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> dict:
    """감사 로그 조회 (플랫폼 관리자 전용)"""
    skip = (page - 1) * page_size
    return await service.list_audit_logs(
        db, entity_type=entity_type, action=action, skip=skip, limit=page_size,
    )


@router.get("/students/search", response_model=list[StudentSearchResult])
async def search_students(
    q: str = Query(..., min_length=1, description="학생 이름 또는 보호자 전화번호"),
    request: Request = None,  # type: ignore[assignment]
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> list:
    """ITEM-P1-24: CS 학생 통합 조회 (감사 로그 포함)"""
    results = await service.search_students(db, q)
    # P1-24 법률: 개인정보 접속기록 (안전성 확보조치 기준 §8, 최소 1년 보관)
    await service.log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="SEARCH",
        entity_type="student",
        entity_id=None,
        details={"query": q, "result_count": len(results)},
        ip_address=request.client.host if request and request.client else None,
    )
    return results


@router.get("/notifications/logs", response_model=PaginatedNotificationLogResponse)
async def list_notification_logs(
    user_id: uuid.UUID | None = Query(None),
    notification_type: str | None = Query(None),
    channel: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> dict:
    """ITEM-P1-25: 알림 발송 이력 조회"""
    skip = (page - 1) * page_size
    return await service.list_notification_logs(
        db, user_id=user_id, notification_type=notification_type,
        channel=channel, status=status, skip=skip, limit=page_size,
    )


@router.get("/academy/{academy_id}/drivers", response_model=list[DriverInfoResponse])
async def list_academy_drivers(
    academy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> list:
    """ITEM-P1-31: 학원별 기사 조회"""
    if current_user.role == UserRole.ACADEMY_ADMIN:
        from sqlalchemy import select as _select
        from app.modules.academy_management.models import Academy
        _result = await db.execute(
            _select(Academy).where(Academy.id == academy_id, Academy.admin_id == current_user.id)
        )
        if not _result.scalar_one_or_none():
            raise ForbiddenError(detail="본인 학원의 기사만 조회할 수 있습니다")
    return await service.list_academy_drivers(db, academy_id)


# --- P2-54: Academy stats ---


@router.get("/academy/{academy_id}/stats", response_model=AcademyStatsResponse)
async def get_academy_stats(
    academy_id: uuid.UUID,
    start_date: str = Query(..., description="시작일 YYYY-MM-DD"),
    end_date: str = Query(..., description="종료일 YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> AcademyStatsResponse:
    """ITEM-P2-54: 학원별 운행 통계"""
    from datetime import date as date_type

    if current_user.role == UserRole.ACADEMY_ADMIN:
        from sqlalchemy import select as _select
        from app.modules.academy_management.models import Academy
        _result = await db.execute(
            _select(Academy).where(Academy.id == academy_id, Academy.admin_id == current_user.id)
        )
        if not _result.scalar_one_or_none():
            raise ForbiddenError(detail="본인 학원의 통계만 조회할 수 있습니다")

    sd = date_type.fromisoformat(start_date)
    ed = date_type.fromisoformat(end_date)
    return await service.get_academy_stats(db, academy_id, sd, ed)


# --- P2-57: Support tickets ---


@router.post("/support/tickets", response_model=SupportTicketResponse, status_code=201)
async def create_ticket(
    body: SupportTicketCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SupportTicketResponse:
    """ITEM-P2-57: 문의 접수"""
    return await service.create_support_ticket(db, current_user, body)


@router.get("/support/tickets", response_model=PaginatedTicketResponse)
async def list_tickets(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """ITEM-P2-57: 문의 목록 (본인 or 관리자 전체)"""
    skip = (page - 1) * page_size
    return await service.list_support_tickets(db, current_user, status_filter, skip, page_size)


@router.patch("/support/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_ticket(
    ticket_id: uuid.UUID,
    body: SupportTicketUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLATFORM_ADMIN, UserRole.ACADEMY_ADMIN)),
) -> SupportTicketResponse:
    """ITEM-P2-57: 문의 상태 변경 (관리자)"""
    return await service.update_support_ticket(db, ticket_id, body)


# --- P2-58: Boarding status dashboard ---


@router.get("/boarding-status", response_model=BoardingStatusResponse)
async def get_boarding_status(
    date: str = Query(..., description="조회 날짜 YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLATFORM_ADMIN, UserRole.ACADEMY_ADMIN)),
) -> BoardingStatusResponse:
    """ITEM-P2-58: 탑승 현황 대시보드"""
    from datetime import date as date_type
    d = date_type.fromisoformat(date)
    return await service.get_boarding_status(db, d, current_user)
