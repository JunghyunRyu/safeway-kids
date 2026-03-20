import asyncio
import logging
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import decode_token
from app.modules.vehicle_telemetry import service
from app.modules.vehicle_telemetry.schemas import (
    GpsLocationResponse,
    GpsUpdateRequest,
    VehicleAssignmentResponse,
    VehicleCreateRequest,
    VehicleResponse,
    VehicleUpdateRequest,
)
from app.redis import redis_client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/vehicles", response_model=VehicleResponse, status_code=201)
async def create_vehicle(
    body: VehicleCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> VehicleResponse:
    """차량 등록"""
    from app.modules.admin.service import log_audit

    vehicle = await service.create_vehicle(db, body)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="CREATE",
        entity_type="vehicle",
        entity_id=str(vehicle.id),
        details={"license_plate": body.license_plate, "capacity": body.capacity},
        ip_address=request.client.host if request.client else None,
    )
    return VehicleResponse.model_validate(vehicle)


@router.get("/vehicles", response_model=list[VehicleResponse])
async def list_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[VehicleResponse]:
    """차량 목록"""
    vehicles = await service.list_vehicles(db)
    return [VehicleResponse.model_validate(v) for v in vehicles]


@router.patch("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    body: VehicleUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> VehicleResponse:
    """차량 정보 수정 (학원/플랫폼 관리자)"""
    from app.modules.admin.service import log_audit

    vehicle = await service.update_vehicle(db, vehicle_id, body)
    changes = {}
    if body.license_plate is not None:
        changes["license_plate"] = body.license_plate
    if body.capacity is not None:
        changes["capacity"] = body.capacity
    if body.model_name is not None:
        changes["model_name"] = body.model_name
    if body.is_active is not None:
        changes["is_active"] = body.is_active
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UPDATE",
        entity_type="vehicle",
        entity_id=str(vehicle_id),
        details=changes,
        ip_address=request.client.host if request.client else None,
    )
    return VehicleResponse.model_validate(vehicle)


@router.delete("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def deactivate_vehicle(
    vehicle_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> VehicleResponse:
    """차량 비활성화 (학원/플랫폼 관리자)"""
    from app.modules.admin.service import log_audit

    vehicle = await service.deactivate_vehicle(db, vehicle_id)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="DELETE",
        entity_type="vehicle",
        entity_id=str(vehicle_id),
        ip_address=request.client.host if request.client else None,
    )
    return VehicleResponse.model_validate(vehicle)


@router.get("/vehicles/my-assignment", response_model=VehicleAssignmentResponse | None)
async def get_my_vehicle_assignment(
    target_date: date = Query(..., description="배정 날짜"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> VehicleAssignmentResponse | None:
    """기사 본인 차량 배정 조회"""
    return await service.get_driver_vehicle_assignment(db, current_user.id, target_date)


@router.post("/gps")
async def update_gps(
    body: GpsUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> dict[str, str]:
    """GPS 위치 업데이트 (기사 앱에서 호출)"""
    await service.update_gps(redis_client, body)
    return {"message": "위치가 업데이트되었습니다"}


@router.get("/vehicles/{vehicle_id}/location", response_model=GpsLocationResponse | None)
async def get_vehicle_location(
    vehicle_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> dict | None:
    """차량 실시간 위치 조회"""
    return await service.get_latest_gps(redis_client, vehicle_id)


@router.websocket("/ws/vehicles/{vehicle_id}")
async def vehicle_location_ws(websocket: WebSocket, vehicle_id: uuid.UUID) -> None:
    """차량 위치 실시간 WebSocket 스트림 (학부모 앱용) — JWT 인증 필수"""
    # Authenticate via query parameter ?token=<JWT>
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=4001, reason="Invalid token type")
            return

        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Verify user exists and is active
        async with async_session_factory() as db:
            stmt = select(User).where(
                User.id == uuid.UUID(user_id_str),
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()

        if not user:
            await websocket.close(code=4001, reason="User not found")
            return
    except Exception:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    logger.info("WebSocket connected: vehicle=%s user=%s", vehicle_id, user.id)

    pubsub = redis_client.pubsub()
    channel = f"vehicle:{vehicle_id}:gps_updates"
    await pubsub.subscribe(channel)

    async def ping_loop() -> None:
        """Send WebSocket ping every 30s to keep connection alive."""
        try:
            while True:
                await asyncio.sleep(30)
                await websocket.send_json({"type": "ping"})
        except Exception:
            pass

    ping_task = asyncio.create_task(ping_loop())

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        ping_task.cancel()
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        logger.info("WebSocket disconnected: vehicle=%s user=%s", vehicle_id, user.id)
