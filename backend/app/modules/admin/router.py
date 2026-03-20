from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ForbiddenError
from app.config import settings
from app.database import get_db
from app.middleware.rbac import require_platform_admin
from app.modules.admin import service
from app.modules.admin.schemas import PaginatedAuditLogResponse
from app.modules.auth.models import User

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
