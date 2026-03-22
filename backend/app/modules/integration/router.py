"""P3-68: ERP Integration router — API keys and webhooks."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ForbiddenError
from app.database import get_db
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.integration import service
from app.modules.integration.schemas import (
    ApiKeyCreateRequest,
    ApiKeyResponse,
    WebhookCreateRequest,
    WebhookResponse,
)

router = APIRouter()


async def _resolve_academy_id(db: AsyncSession, user: User) -> uuid.UUID:
    """Resolve the academy ID for the current user."""
    from sqlalchemy import select
    from app.modules.academy_management.models import Academy

    if user.role == UserRole.PLATFORM_ADMIN:
        raise ForbiddenError(detail="학원 관리자만 사용 가능합니다")
    stmt = select(Academy).where(Academy.admin_id == user.id)
    result = await db.execute(stmt)
    academy = result.scalar_one_or_none()
    if not academy:
        raise ForbiddenError(detail="소속 학원이 없습니다")
    return academy.id


# --- API Keys ---


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=201)
async def create_api_key(
    body: ApiKeyCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN)),
) -> ApiKeyResponse:
    """P3-68: API 키 발급"""
    academy_id = await _resolve_academy_id(db, current_user)
    return await service.create_api_key(db, academy_id, body.name)


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN)),
) -> list[ApiKeyResponse]:
    """P3-68: API 키 목록"""
    academy_id = await _resolve_academy_id(db, current_user)
    return await service.list_api_keys(db, academy_id)


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN)),
) -> dict:
    """P3-68: API 키 폐기"""
    await service.delete_api_key(db, key_id)
    return {"status": "ok"}


# --- Webhooks ---


@router.post("/webhooks", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    body: WebhookCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN)),
) -> WebhookResponse:
    """P3-68: Webhook 등록"""
    academy_id = await _resolve_academy_id(db, current_user)
    return await service.create_webhook(db, academy_id, body.url, body.events)


@router.get("/webhooks", response_model=list[WebhookResponse])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN)),
) -> list[WebhookResponse]:
    """P3-68: Webhook 목록"""
    academy_id = await _resolve_academy_id(db, current_user)
    return await service.list_webhooks(db, academy_id)


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN)),
) -> dict:
    """P3-68: Webhook 삭제"""
    await service.delete_webhook(db, webhook_id)
    return {"status": "ok"}
