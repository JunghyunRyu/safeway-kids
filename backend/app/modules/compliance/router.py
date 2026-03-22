import uuid

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.compliance import service
from app.modules.compliance.models import DocumentType
from app.modules.compliance.schemas import (
    ConsentCreateRequest,
    ConsentResponse,
    ConsentWithdrawRequest,
    ContractCreateRequest,
    ContractResponse,
    DocumentResponse,
    DocumentUploadRequest,
)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/haansofthwp",
    "application/x-hwp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

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
    """동의 상세 조회 (소유권 확인)"""
    from app.common.exceptions import ForbiddenError

    consent = await service.get_consent(db, consent_id)
    if current_user.role == UserRole.PARENT and consent.guardian_id != current_user.id:
        raise ForbiddenError(detail="본인의 동의 정보만 조회할 수 있습니다")
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


@router.patch("/consents/{consent_id}/viewed")
async def mark_consent_viewed(
    consent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> dict:
    """동의서 전문 열람 기록 (ITEM-REG-05)"""
    from datetime import UTC

    consent = await service.get_consent(db, consent_id)
    if consent.guardian_id != current_user.id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 동의 정보만 열람할 수 있습니다")
    from datetime import datetime
    consent.terms_viewed_at = datetime.now(UTC)
    await db.flush()
    return {"status": "ok", "terms_viewed_at": str(consent.terms_viewed_at)}


@router.post("/driver-consent", status_code=201)
async def create_driver_location_consent(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> dict:
    """기사/안전도우미 위치정보 수집 동의 (ITEM-REG-07)"""
    from sqlalchemy import select as _select

    from app.modules.compliance.models import DriverLocationConsent

    existing = (await db.execute(
        _select(DriverLocationConsent).where(DriverLocationConsent.user_id == current_user.id)
    )).scalar_one_or_none()
    if existing:
        return {"status": "already_consented", "granted_at": str(existing.granted_at)}

    ip = request.client.host if request.client else None
    consent = DriverLocationConsent(
        user_id=current_user.id,
        consent_granted=True,
        ip_address=ip,
    )
    db.add(consent)
    await db.flush()
    return {"status": "ok", "granted_at": str(consent.granted_at)}


@router.get("/driver-consent/check")
async def check_driver_location_consent(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)),
) -> dict:
    """기사/안전도우미 위치정보 동의 여부 확인"""
    from sqlalchemy import select as _select

    from app.modules.compliance.models import DriverLocationConsent

    existing = (await db.execute(
        _select(DriverLocationConsent).where(DriverLocationConsent.user_id == current_user.id)
    )).scalar_one_or_none()
    return {"consented": existing is not None}


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
    from app.common.exceptions import ValidationError

    # document_type 검증
    try:
        DocumentType(document_type)
    except ValueError:
        raise ValidationError(
            detail=f"유효하지 않은 문서 유형: {document_type}. "
                   f"허용: {[e.value for e in DocumentType]}"
        )

    # MIME 타입 검증
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            detail=f"허용되지 않는 파일 형식: {file.content_type}"
        )

    # 파일 크기 검증
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValidationError(
            detail=f"파일 크기가 {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB를 초과합니다"
        )
    await file.seek(0)

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
    # IDOR: 학원 관리자는 자기 학원 문서만 조회 가능
    if current_user.role == UserRole.ACADEMY_ADMIN:
        from sqlalchemy import select as _select

        from app.modules.academy_management.models import Academy

        _stmt = _select(Academy).where(Academy.id == academy_id, Academy.admin_id == current_user.id)
        _result = await db.execute(_stmt)
        if not _result.scalar_one_or_none():
            from app.common.exceptions import ForbiddenError
            raise ForbiddenError(detail="본인 학원의 문서만 조회할 수 있습니다")
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
