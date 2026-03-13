import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.academy_management import service
from app.modules.academy_management.schemas import (
    AcademyCreateRequest,
    AcademyResponse,
    AcademyUpdateRequest,
)
from app.modules.auth.models import User, UserRole

router = APIRouter()


@router.post("", response_model=AcademyResponse, status_code=201)
async def create_academy(
    body: AcademyCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> AcademyResponse:
    """학원 등록"""
    academy = await service.create_academy(db, current_user.id, body)
    return AcademyResponse.model_validate(academy)


@router.get("", response_model=list[AcademyResponse])
async def list_academies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AcademyResponse]:
    """학원 목록 조회"""
    academies = await service.list_academies(db)
    return [AcademyResponse.model_validate(a) for a in academies]


@router.get("/{academy_id}", response_model=AcademyResponse)
async def get_academy(
    academy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AcademyResponse:
    """학원 상세 조회"""
    academy = await service.get_academy(db, academy_id)
    return AcademyResponse.model_validate(academy)


@router.patch("/{academy_id}", response_model=AcademyResponse)
async def update_academy(
    academy_id: uuid.UUID,
    body: AcademyUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> AcademyResponse:
    """학원 정보 수정"""
    academy = await service.update_academy(db, academy_id, body)
    return AcademyResponse.model_validate(academy)
