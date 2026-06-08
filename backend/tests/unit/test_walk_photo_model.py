"""Unit tests for the WalkPhoto model skeleton (P1-3).

Coverage (no LLM, no network — schema/ORM only):
- WalkPhoto INSERT defaults caption_status to "pending" and leaves
  caption/condition NULL (P1-3 적재 시점에는 LLM 미호출).
- caption_status / condition can be set to terminal values and read back.
- WalkPhotoCaptionStatus enum covers the FR-B2 lifecycle values.
- session_id FK column is required (nullable=False).

Uses the shared in-memory sqlite + Base.metadata.create_all fixture from
conftest, so this exercises the same DDL path the migration mirrors.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import (
    Pet,
    PtBooking,
    WalkPhoto,
    WalkPhotoCaptionStatus,
    WalkSession,
)
from app.modules.auth.models import User, UserRole


async def _make_walk_session(db: AsyncSession) -> WalkSession:
    """booking → walk_session 최소 fixture (FK 충족용)."""
    owner = User(id=uuid.uuid4(), role=UserRole.PARENT, phone="01000000001", name="견주", is_active=True)
    walker = User(id=uuid.uuid4(), role=UserRole.DRIVER, phone="01000000002", name="펫시터", is_active=True)
    db.add_all([owner, walker])
    await db.flush()

    pet = Pet(id=uuid.uuid4(), owner_id=owner.id, name="콩이", species="dog")
    db.add(pet)
    await db.flush()

    booking = PtBooking(
        id=uuid.uuid4(),
        owner_id=owner.id,
        walker_id=walker.id,
        pet_id=pet.id,
        scheduled_at=datetime(2026, 6, 8, 10, 0, tzinfo=timezone.utc),
        pickup_latitude=37.5,
        pickup_longitude=127.0,
        price=15000,
    )
    db.add(booking)
    await db.flush()

    session = WalkSession(id=uuid.uuid4(), booking_id=booking.id, walker_id=walker.id)
    db.add(session)
    await db.flush()
    return session


@pytest.mark.asyncio
async def test_walk_photo_defaults_to_pending(db_session: AsyncSession) -> None:
    session = await _make_walk_session(db_session)

    photo = WalkPhoto(session_id=session.id, s3_key="walk-photos/abc.jpg")
    db_session.add(photo)
    await db_session.commit()

    fetched = (
        await db_session.execute(select(WalkPhoto).where(WalkPhoto.id == photo.id))
    ).scalar_one()

    assert fetched.caption_status == "pending"
    assert fetched.caption is None
    assert fetched.condition is None
    assert fetched.s3_key == "walk-photos/abc.jpg"
    assert fetched.created_at is not None


@pytest.mark.asyncio
async def test_walk_photo_generated_caption_and_condition(db_session: AsyncSession) -> None:
    session = await _make_walk_session(db_session)

    photo = WalkPhoto(
        session_id=session.id,
        s3_key="walk-photos/def.jpg",
        caption="잔디밭에서 활발하게 뛰었어요 🐾",
        caption_status=WalkPhotoCaptionStatus.GENERATED,
        condition="활기",
    )
    db_session.add(photo)
    await db_session.commit()

    fetched = (
        await db_session.execute(select(WalkPhoto).where(WalkPhoto.id == photo.id))
    ).scalar_one()

    assert fetched.caption_status == "generated"
    assert fetched.condition == "활기"
    assert "뛰었어요" in fetched.caption


def test_caption_status_enum_covers_fr_b2_lifecycle() -> None:
    values = {s.value for s in WalkPhotoCaptionStatus}
    assert values == {"pending", "generated", "edited", "failed"}
