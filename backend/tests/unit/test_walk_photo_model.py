"""Unit tests for the WalkPhoto model skeleton (P1-3, Tech Spec FR-B2/FR-F2).

The caption pipeline (Vision LLM via BackgroundTasks) lands in P2-2 —
these tests only pin the storage contract: defaults, the caption_status
state values, and session-scoped retrieval order used by the walk report
(FR-B7).
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import WalkPhoto, WalkPhotoCaptionStatus


async def test_walk_photo_defaults(db_session: AsyncSession) -> None:
    photo = WalkPhoto(session_id=uuid.uuid4(), s3_key="pt/walks/abc/photo-1.jpg")
    db_session.add(photo)
    await db_session.commit()
    await db_session.refresh(photo)

    assert photo.id is not None
    assert photo.caption is None
    assert photo.caption_status == "pending"
    assert photo.condition is None
    assert photo.created_at is not None


def test_caption_status_values_match_spec() -> None:
    # FR-B2: caption_status enum = pending|generated|edited|failed
    assert {s.value for s in WalkPhotoCaptionStatus} == {
        "pending",
        "generated",
        "edited",
        "failed",
    }


async def test_walker_caption_edit_transitions_status(db_session: AsyncSession) -> None:
    # FR-B5: 펫시터 1-tap 수정 시 caption_status="edited"
    photo = WalkPhoto(
        session_id=uuid.uuid4(),
        s3_key="pt/walks/abc/photo-2.jpg",
        caption="잔디밭에서 활발하게 뛰었어요 🐾",
        caption_status=WalkPhotoCaptionStatus.GENERATED,
    )
    db_session.add(photo)
    await db_session.commit()

    photo.caption = "공원 잔디밭에서 신나게 뛰었어요"
    photo.caption_status = WalkPhotoCaptionStatus.EDITED
    await db_session.commit()
    await db_session.refresh(photo)

    assert photo.caption_status == "edited"


async def test_photos_listed_per_session_in_upload_order(
    db_session: AsyncSession,
) -> None:
    # FR-B7: 산책 리포트는 세션별 사진 N장을 업로드 순서로 나열
    session_id = uuid.uuid4()
    other_session_id = uuid.uuid4()
    for i in range(3):
        db_session.add(WalkPhoto(session_id=session_id, s3_key=f"pt/walks/s1/{i}.jpg"))
    db_session.add(WalkPhoto(session_id=other_session_id, s3_key="pt/walks/s2/0.jpg"))
    await db_session.commit()

    result = await db_session.execute(
        select(WalkPhoto)
        .where(WalkPhoto.session_id == session_id)
        .order_by(WalkPhoto.created_at)
    )
    photos = result.scalars().all()

    assert len(photos) == 3
    assert [p.s3_key for p in photos] == [f"pt/walks/s1/{i}.jpg" for i in range(3)]
    assert all(p.caption_status == "pending" for p in photos)
