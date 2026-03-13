import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.compliance import service
from app.modules.compliance.schemas import (
    ConsentCreateRequest,
    ConsentResponse,
    ConsentWithdrawRequest,
    ContractCreateRequest,
    ContractResponse,
)

router = APIRouter()


@router.post("/consents", response_model=ConsentResponse, status_code=201)
async def create_consent(
    body: ConsentCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> ConsentResponse:
    """법정대리인 동의 등록"""
    ip = request.client.host if request.client else None
    consent = await service.create_consent(db, current_user.id, body, ip)
    return ConsentResponse.model_validate(consent)


@router.get("/consents", response_model=list[ConsentResponse])
async def list_consents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> list[ConsentResponse]:
    """내 동의 목록 조회"""
    consents = await service.list_consents_by_guardian(db, current_user.id)
    return [ConsentResponse.model_validate(c) for c in consents]


@router.get("/consents/{consent_id}", response_model=ConsentResponse)
async def get_consent(
    consent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConsentResponse:
    """동의 상세 조회"""
    consent = await service.get_consent(db, consent_id)
    return ConsentResponse.model_validate(consent)


@router.post("/consents/{consent_id}/withdraw", response_model=ConsentResponse)
async def withdraw_consent(
    consent_id: uuid.UUID,
    body: ConsentWithdrawRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> ConsentResponse:
    """동의 철회 (스케줄 자동 비활성화)"""
    consent = await service.withdraw_consent(db, consent_id, current_user.id)
    return ConsentResponse.model_validate(consent)


@router.post("/contracts", response_model=ContractResponse, status_code=201)
async def create_contract(
    body: ContractCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> ContractResponse:
    """운송 계약 등록"""
    contract = await service.create_contract(db, body)
    return ContractResponse.model_validate(contract)
