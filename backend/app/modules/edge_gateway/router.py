"""Edge AI Gateway API 라우터."""

import logging

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_platform_admin
from app.modules.auth.models import User
from app.modules.edge_gateway import service
from app.modules.edge_gateway.dependencies import verify_edge_api_key
from app.modules.edge_gateway.schemas import (
    EdgeEventCreate,
    EdgeEventListResponse,
    EdgeEventResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/events", response_model=EdgeEventResponse, status_code=201)
async def create_event(
    body: EdgeEventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    device_id: str = Depends(verify_edge_api_key),
) -> EdgeEventResponse:
    """Edge AI 디바이스에서 이벤트 수신.

    Authorization: Bearer <EDGE_API_KEY> 헤더로 인증한다.
    """
    # 감사 로그
    from app.modules.admin.service import log_audit

    event = await service.create_edge_event(
        db=db,
        event_type=body.event_type.value,
        details=body.details,
        vehicle_id=body.vehicle_id,
        event_timestamp=body.timestamp,
    )

    await log_audit(
        db,
        user_id=device_id,
        user_name="Edge AI Device",
        action="EDGE_EVENT",
        entity_type="edge_event",
        entity_id=str(event.id),
        details={
            "event_type": body.event_type.value,
            "details": body.details,
        },
        ip_address=request.client.host if request.client else None,
    )

    await db.commit()

    # 비동기로 알림 발송 (커밋 이후)
    import asyncio
    asyncio.create_task(
        service.send_edge_notification(body.event_type.value, body.details)
    )

    return EdgeEventResponse(
        id=str(event.id),
        event_type=event.event_type,
        vehicle_id=str(event.vehicle_id) if event.vehicle_id else None,
        details=event.details,
        event_timestamp=event.event_timestamp,
        created_at=event.created_at,
    )


@router.get("/events", response_model=EdgeEventListResponse)
async def list_events(
    event_type: str | None = Query(None, description="이벤트 유형 필터"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> EdgeEventListResponse:
    """Edge AI 이벤트 목록 조회. 플랫폼 관리자만 접근 가능."""
    events, total = await service.list_edge_events(
        db=db,
        event_type=event_type,
        limit=limit,
        offset=offset,
    )

    return EdgeEventListResponse(
        events=[
            EdgeEventResponse(
                id=str(e.id),
                event_type=e.event_type,
                vehicle_id=str(e.vehicle_id) if e.vehicle_id else None,
                details=e.details,
                event_timestamp=e.event_timestamp,
                created_at=e.created_at,
            )
            for e in events
        ],
        total=total,
    )
