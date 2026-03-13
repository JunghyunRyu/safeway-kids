import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConsentRequiredError
from app.modules.compliance.models import GuardianConsent


async def verify_guardian_consent(
    db: AsyncSession, guardian_id: uuid.UUID, child_id: uuid.UUID
) -> bool:
    """Check if active guardian consent exists for a child."""
    stmt = select(GuardianConsent).where(
        GuardianConsent.guardian_id == guardian_id,
        GuardianConsent.child_id == child_id,
        GuardianConsent.withdrawn_at.is_(None),
    )
    result = await db.execute(stmt)
    consent = result.scalar_one_or_none()
    return consent is not None


async def require_consent(
    db: AsyncSession, guardian_id: uuid.UUID, child_id: uuid.UUID
) -> None:
    """Raise ConsentRequiredError if no active consent exists."""
    has_consent = await verify_guardian_consent(db, guardian_id, child_id)
    if not has_consent:
        raise ConsentRequiredError()
