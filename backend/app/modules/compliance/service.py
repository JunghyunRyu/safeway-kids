import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError
from app.modules.compliance.models import (
    ComplianceDocument,
    Contract,
    DocumentType,
    GuardianConsent,
)
from app.modules.compliance.schemas import (
    ConsentCreateRequest,
    ContractCreateRequest,
    DocumentUploadRequest,
)

UPLOAD_DIR = Path("uploads/compliance")


async def create_consent(
    db: AsyncSession,
    guardian_id: uuid.UUID,
    request: ConsentCreateRequest,
    ip_address: str | None = None,
) -> GuardianConsent:
    """Create a new guardian consent record."""
    # 필수 동의 항목 검증 (A14)
    required_items = ["service_terms", "privacy_policy", "child_info_collection"]
    scope = request.consent_scope
    for item in required_items:
        if not scope.get(item):
            from app.common.exceptions import ValidationError
            raise ValidationError(
                detail=f"필수 동의 항목 '{item}'에 동의해야 합니다"
            )

    # Check for existing active consent
    stmt = select(GuardianConsent).where(
        GuardianConsent.guardian_id == guardian_id,
        GuardianConsent.child_id == request.child_id,
        GuardianConsent.withdrawn_at.is_(None),
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise ConflictError(detail="이미 유효한 동의가 존재합니다")

    consent = GuardianConsent(
        guardian_id=guardian_id,
        child_id=request.child_id,
        consent_scope=request.consent_scope,
        consent_method=request.consent_method,
        ip_address=ip_address,
    )
    db.add(consent)
    await db.flush()
    return consent


async def get_consent(db: AsyncSession, consent_id: uuid.UUID) -> GuardianConsent:
    stmt = select(GuardianConsent).where(GuardianConsent.id == consent_id)
    result = await db.execute(stmt)
    consent = result.scalar_one_or_none()
    if not consent:
        raise NotFoundError(detail="동의 기록을 찾을 수 없습니다")
    return consent


async def list_consents_by_guardian(
    db: AsyncSession, guardian_id: uuid.UUID
) -> list[GuardianConsent]:
    stmt = (
        select(GuardianConsent)
        .where(GuardianConsent.guardian_id == guardian_id)
        .order_by(GuardianConsent.granted_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def withdraw_consent(
    db: AsyncSession, consent_id: uuid.UUID, guardian_id: uuid.UUID
) -> GuardianConsent:
    """Withdraw consent and cascade: deactivate child's schedules."""
    consent = await get_consent(db, consent_id)
    if consent.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError

        raise ForbiddenError(detail="본인의 동의만 철회할 수 있습니다")

    if consent.withdrawn_at:
        raise ConflictError(detail="이미 철회된 동의입니다")

    consent.withdrawn_at = datetime.now(UTC)

    # Cascade: deactivate related schedule templates
    from app.modules.scheduling.models import ScheduleTemplate

    stmt = (
        update(ScheduleTemplate)
        .where(
            ScheduleTemplate.student_id == consent.child_id,
            ScheduleTemplate.is_active.is_(True),
        )
        .values(is_active=False)
    )
    await db.execute(stmt)

    # A14: 동의 철회 시 기수집 GPS 데이터 즉시 삭제 (개인정보보호법 제36조)
    scope = consent.consent_scope or {}
    if scope.get("location_tracking"):
        import logging

        from sqlalchemy import Date as SqlDate
        from sqlalchemy import cast
        from sqlalchemy import delete as sql_delete

        from app.modules.scheduling.models import DailyScheduleInstance
        from app.modules.vehicle_telemetry.models import GpsHistory

        _logger = logging.getLogger(__name__)

        # Find vehicles and dates for this child's rides
        ride_stmt = (
            select(
                DailyScheduleInstance.vehicle_id,
                DailyScheduleInstance.schedule_date,
            )
            .where(
                DailyScheduleInstance.student_id == consent.child_id,
                DailyScheduleInstance.vehicle_id.isnot(None),
            )
        )
        ride_result = await db.execute(ride_stmt)
        rides = ride_result.all()

        if rides:
            vehicle_ids = list({r[0] for r in rides})
            ride_dates = list({r[1] for r in rides})
            del_stmt = sql_delete(GpsHistory).where(
                GpsHistory.vehicle_id.in_(vehicle_ids),
                cast(GpsHistory.recorded_at, SqlDate).in_(ride_dates),
            )
            result = await db.execute(del_stmt)
            _logger.info(
                "[CONSENT] Deleted %d GPS records on consent withdrawal for child=%s",
                result.rowcount,
                consent.child_id,
            )

    await db.flush()
    return consent


async def create_contract(db: AsyncSession, request: ContractCreateRequest) -> Contract:
    contract = Contract(
        academy_id=request.academy_id,
        operator_name=request.operator_name,
        vehicle_id=request.vehicle_id,
        contract_type=request.contract_type,
        effective_from=request.effective_from,
        effective_until=request.effective_until,
        terms=request.terms,
    )
    db.add(contract)
    await db.flush()
    return contract


# --- Compliance Document services ---


async def upload_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    metadata: DocumentUploadRequest,
    file: UploadFile,
) -> ComplianceDocument:
    """Save file to local storage and create DB record."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Validate document_type
    try:
        doc_type = DocumentType(metadata.document_type)
    except ValueError as err:
        from app.common.exceptions import ValidationError

        raise ValidationError(
            detail=f"유효하지 않은 문서 유형입니다: {metadata.document_type}"
        ) from err

    # Generate unique filename to avoid collisions
    ext = Path(file.filename).suffix if file.filename else ""
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = UPLOAD_DIR / stored_name

    async with aiofiles.open(stored_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    document = ComplianceDocument(
        academy_id=metadata.academy_id,
        document_type=doc_type,
        file_name=file.filename or stored_name,
        file_path=str(stored_path),
        expires_at=metadata.expires_at,
        uploaded_by=user_id,
    )
    db.add(document)
    await db.flush()
    return document


async def list_documents(
    db: AsyncSession,
    academy_id: uuid.UUID,
    document_type: str | None = None,
) -> list[ComplianceDocument]:
    """List active documents, optionally filtered by type."""
    stmt = select(ComplianceDocument).where(
        ComplianceDocument.academy_id == academy_id,
        ComplianceDocument.is_active.is_(True),
    )
    if document_type:
        stmt = stmt.where(ComplianceDocument.document_type == DocumentType(document_type))
    stmt = stmt.order_by(ComplianceDocument.uploaded_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_expiring_documents(
    db: AsyncSession,
    academy_id: uuid.UUID,
    days: int = 30,
) -> list[ComplianceDocument]:
    """List active documents expiring within the given number of days."""
    deadline = datetime.now(UTC) + timedelta(days=days)
    stmt = (
        select(ComplianceDocument)
        .where(
            ComplianceDocument.academy_id == academy_id,
            ComplianceDocument.is_active.is_(True),
            ComplianceDocument.expires_at.isnot(None),
            ComplianceDocument.expires_at <= deadline,
        )
        .order_by(ComplianceDocument.expires_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def deactivate_expired_documents(db: AsyncSession) -> int:
    """만료일이 지난 활성 문서를 비활성화. 처리 건수 반환."""
    now = datetime.now(UTC)
    stmt = (
        update(ComplianceDocument)
        .where(
            ComplianceDocument.is_active.is_(True),
            ComplianceDocument.expires_at.isnot(None),
            ComplianceDocument.expires_at <= now,
        )
        .values(is_active=False)
    )
    result = await db.execute(stmt)
    return result.rowcount


async def delete_document(db: AsyncSession, document_id: uuid.UUID) -> ComplianceDocument:
    """Soft delete a compliance document."""
    stmt = select(ComplianceDocument).where(ComplianceDocument.id == document_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    if not document:
        raise NotFoundError(detail="문서를 찾을 수 없습니다")
    document.is_active = False
    await db.flush()
    return document
