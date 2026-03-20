import uuid

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
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
    DocumentResponse,
    DocumentUploadRequest,
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


# --- Compliance Document endpoints ---


@router.post("/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    academy_id: uuid.UUID = Form(...),
    document_type: str = Form(...),
    expires_at: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> DocumentResponse:
    """법적 준수 문서 업로드"""
    from datetime import datetime as dt

    parsed_expires = dt.fromisoformat(expires_at) if expires_at else None
    metadata = DocumentUploadRequest(
        academy_id=academy_id,
        document_type=document_type,
        expires_at=parsed_expires,
    )
    document = await service.upload_document(db, current_user.id, metadata, file)
    return DocumentResponse.model_validate(document)


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    academy_id: uuid.UUID,
    document_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> list[DocumentResponse]:
    """학원별 법적 준수 문서 목록 조회"""
    documents = await service.list_documents(db, academy_id, document_type)
    return [DocumentResponse.model_validate(d) for d in documents]


@router.get("/documents/expiring", response_model=list[DocumentResponse])
async def list_expiring_documents(
    academy_id: uuid.UUID,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> list[DocumentResponse]:
    """만료 임박 문서 조회 (기본 30일 이내)"""
    documents = await service.list_expiring_documents(db, academy_id, days)
    return [DocumentResponse.model_validate(d) for d in documents]


@router.delete("/documents/{document_id}", response_model=DocumentResponse)
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> DocumentResponse:
    """법적 준수 문서 소프트 삭제"""
    document = await service.delete_document(db, document_id)
    return DocumentResponse.model_validate(document)
