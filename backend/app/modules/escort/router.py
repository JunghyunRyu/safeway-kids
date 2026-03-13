"""Safety escort API endpoints."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.escort import service
from app.modules.escort.schemas import (
    AvailabilityCreate,
    AvailabilityResponse,
    MatchRequest,
    MatchResponse,
    ShiftResponse,
)

router = APIRouter()


@router.post("/availability", response_model=AvailabilityResponse)
async def register_availability(
    request: AvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SAFETY_ESCORT)),
) -> AvailabilityResponse:
    """가용시간 등록 (안전도우미)"""
    avail = await service.register_availability(
        db, current_user.id,
        request.available_date, request.start_time, request.end_time,
    )
    await db.commit()
    return AvailabilityResponse.model_validate(avail)


@router.get("/availability/my", response_model=list[AvailabilityResponse])
async def my_availability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SAFETY_ESCORT)),
) -> list[AvailabilityResponse]:
    """내 가용시간 조회"""
    items = await service.get_my_availability(db, current_user.id)
    return [AvailabilityResponse.model_validate(a) for a in items]


@router.post("/match", response_model=MatchResponse)
async def auto_match(
    request: MatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> dict:
    """자동 매칭 실행 (관리자)"""
    result = await service.auto_match(db, request.target_date)
    await db.commit()
    return result


@router.post("/shifts/{shift_id}/check-in", response_model=ShiftResponse)
async def check_in(
    shift_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SAFETY_ESCORT)),
) -> ShiftResponse:
    """출근 확인"""
    shift = await service.check_in(db, shift_id, current_user.id)
    if not shift:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="근무를 찾을 수 없습니다")
    await db.commit()
    return ShiftResponse.model_validate(shift)


@router.post("/shifts/{shift_id}/check-out", response_model=ShiftResponse)
async def check_out(
    shift_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SAFETY_ESCORT)),
) -> ShiftResponse:
    """퇴근 확인"""
    shift = await service.check_out(db, shift_id, current_user.id)
    if not shift:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="근무를 찾을 수 없습니다")
    await db.commit()
    return ShiftResponse.model_validate(shift)


@router.get("/shifts/my", response_model=list[ShiftResponse])
async def my_shifts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SAFETY_ESCORT)),
) -> list[ShiftResponse]:
    """내 근무 내역"""
    shifts = await service.get_my_shifts(db, current_user.id)
    return [ShiftResponse.model_validate(s) for s in shifts]
