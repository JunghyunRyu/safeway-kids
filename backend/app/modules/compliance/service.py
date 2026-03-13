import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError
from app.modules.compliance.models import Contract, GuardianConsent
from app.modules.compliance.schemas import ConsentCreateRequest, ContractCreateRequest


async def create_consent(
    db: AsyncSession,
    guardian_id: uuid.UUID,
    request: ConsentCreateRequest,
    ip_address: str | None = None,
) -> GuardianConsent:
    """Create a new guardian consent record."""
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
    stmt = select(GuardianConsent).where(
        GuardianConsent.guardian_id == guardian_id
    ).order_by(GuardianConsent.granted_at.desc())
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

    await db.flush()
    return consent


async def create_contract(
    db: AsyncSession, request: ContractCreateRequest
) -> Contract:
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
