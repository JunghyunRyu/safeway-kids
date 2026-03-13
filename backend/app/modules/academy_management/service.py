import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.modules.academy_management.models import Academy
from app.modules.academy_management.schemas import AcademyCreateRequest, AcademyUpdateRequest


async def create_academy(
    db: AsyncSession, admin_id: uuid.UUID, request: AcademyCreateRequest
) -> Academy:
    academy = Academy(
        name=request.name,
        address=request.address,
        latitude=request.latitude,
        longitude=request.longitude,
        phone=request.phone,
        admin_id=admin_id,
    )
    db.add(academy)
    await db.flush()
    return academy


async def get_academy(db: AsyncSession, academy_id: uuid.UUID) -> Academy:
    stmt = select(Academy).where(Academy.id == academy_id, Academy.deleted_at.is_(None))
    result = await db.execute(stmt)
    academy = result.scalar_one_or_none()
    if not academy:
        raise NotFoundError(detail="학원을 찾을 수 없습니다")
    return academy


async def list_academies(db: AsyncSession) -> list[Academy]:
    stmt = (
        select(Academy)
        .where(Academy.deleted_at.is_(None), Academy.is_active.is_(True))
        .order_by(Academy.name)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_academy(
    db: AsyncSession, academy_id: uuid.UUID, request: AcademyUpdateRequest
) -> Academy:
    academy = await get_academy(db, academy_id)
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(academy, field, value)
    await db.flush()
    return academy
