import asyncio
import logging
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
) -> dict[str, str]:
    """GPS 위치 업데이트 (기사 앱에서 호출) — 배정된 차량만 허용"""
    from app.common.exceptions import ForbiddenError

    has_access = await service.check_vehicle_access(db, current_user, body.vehicle_id)
    if not has_access:
        raise ForbiddenError(detail="배정되지 않은 차량의 GPS를 업데이트할 수 없습니다")
    await service.update_gps(redis_client, body)
    return {"message": "위치가 업데이트되었습니다"}


@router.get("/vehicles/{vehicle_id}/location", response_model=GpsLocationResponse | None)
async def get_vehicle_location(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict | None:
    """차량 실시간 위치 조회 — 접근 권한 확인"""
    from app.common.exceptions import ForbiddenError

    has_access = await service.check_vehicle_access(db, current_user, vehicle_id)
    if not has_access:
        raise ForbiddenError(detail="해당 차량의 위치 정보에 접근할 수 없습니다")
    return await service.get_latest_gps(redis_client, vehicle_id)


async def _authenticate_token(token: str) -> User | None:
    """Validate JWT and return the authenticated User, or None."""
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None

        user_id_str = payload.get("sub")
        if not user_id_str:
            return None

        async with async_session_factory() as db:
            stmt = select(User).where(
                User.id == uuid.UUID(user_id_str),
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
    except Exception:
        return None


@router.websocket("/ws/vehicles/{vehicle_id}")
async def vehicle_location_ws(websocket: WebSocket, vehicle_id: uuid.UUID) -> None:
    """차량 위치 실시간 WebSocket 스트림 — JWT 인증 + 인가 필수"""
    # 1) query param 방식 (deprecated, 호환 유지)
    token = websocket.query_params.get("token")

    if token:
        logger.warning("Deprecated: JWT via query param. Use first-message auth.")
        user = await _authenticate_token(token)
        if not user:
            await websocket.close(code=4001, reason="Unauthorized")
            return
        await websocket.accept()
    else:
        # 2) first-message auth
        await websocket.accept()
        try:
            data = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
            token = data.get("token")
            if not token:
                await websocket.close(code=4001, reason="Missing token")
                return
            user = await _authenticate_token(token)
            if not user:
                await websocket.close(code=4001, reason="Unauthorized")
                return
            await websocket.send_json({"type": "auth_ok"})
        except asyncio.TimeoutError:
            await websocket.close(code=4001, reason="Auth timeout")
            return
        except Exception:
            await websocket.close(code=4001, reason="Auth error")
            return

    # 인가: 사용자가 해당 차량에 접근 권한이 있는지 확인
    async with async_session_factory() as auth_db:
        has_access = await service.check_vehicle_access(auth_db, user, vehicle_id)
    if not has_access:
        logger.warning("WebSocket authorization denied: vehicle=%s user=%s role=%s", vehicle_id, user.id, user.role)
        await websocket.close(code=4003, reason="Forbidden")
        return

    # 위치정보법 제16조: 위치정보 수집/이용/제공 기록 저장
    try:
        async with async_session_factory() as log_db:
            await service.log_location_access(
                log_db,
                subject_type="vehicle",
                subject_id=vehicle_id,
                vehicle_id=vehicle_id,
                accessor_user_id=user.id,
                access_purpose="realtime_tracking",
            )
            await log_db.commit()
    except Exception:
        logger.warning("Failed to log location access for vehicle=%s user=%s", vehicle_id, user.id)

    logger.info("WebSocket connected: vehicle=%s user=%s", vehicle_id, user.id)

    pubsub = redis_client.pubsub()
    channel = f"vehicle:{vehicle_id}:gps_updates"
    await pubsub.subscribe(channel)

    async def ping_loop() -> None:
        """Send WebSocket ping every N seconds to keep connection alive."""
        try:
            while True:
                await asyncio.sleep(settings.ws_ping_interval_seconds)
                await websocket.send_json({"type": "ping"})
        except WebSocketDisconnect:
            logger.debug("WebSocket ping loop: client disconnected, vehicle=%s", vehicle_id)
        except asyncio.CancelledError:
            pass  # Task cancelled normally
        except Exception as e:
            logger.warning("WebSocket ping loop error: vehicle=%s error=%s", vehicle_id, e)

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
