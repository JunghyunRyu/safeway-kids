"""PT 결제 end-to-end (prepare→confirm→list) — Tech Spec FR-MP (2026-06-11).

dev-mock 채널 (settings.environment="test"/"development") 기준.
gap-notes/2026-06-11-pt-confirm-payment-split-bug.md 회귀 방지 테스트 포함.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import Pet, PtBooking
from app.modules.auth.models import APP_PETTRACKER, User, UserRole
from app.modules.auth.service import create_access_token


def _auth(user: User) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id, user.role, user.app_context)}"
    }


@pytest.fixture
async def owner_booking(db_session: AsyncSession) -> tuple[User, PtBooking]:
    owner = User(
        role=UserRole.PET_OWNER, phone="01077770001", name="플로우 보호자",
        app_context=APP_PETTRACKER,
    )
    db_session.add(owner)
    await db_session.flush()
    pet = Pet(owner_id=owner.id, name="해피", species="dog")
    db_session.add(pet)
    await db_session.flush()
    booking = PtBooking(
        owner_id=owner.id, pet_id=pet.id, duration_minutes=60,
        scheduled_at=datetime.now(UTC), pickup_latitude=37.5, pickup_longitude=127.0,
        price=45_000,
    )
    db_session.add(booking)
    await db_session.commit()
    return owner, booking


async def test_prepare_confirm_list_end_to_end(
    client: AsyncClient, owner_booking: tuple[User, PtBooking]
) -> None:
    owner, booking = owner_booking
    headers = _auth(owner)

    # 1) prepare — merchant_uid 발급
    resp = await client.post(
        "/api/v1/pt/payments/prepare", json={"booking_id": str(booking.id)}, headers=headers
    )
    assert resp.status_code == 201
    prep = resp.json()
    assert prep["amount"] == 45_000
    merchant_uid = prep["merchant_uid"]

    # 2) confirm (dev-mock) — PAID 저장 + 응답 직렬화
    #    gap-note 2026-06-11: confirm_payment가 두 동강 나 None을 반환하던 버그의 회귀 방지
    imp_uid = f"imp_dev_{merchant_uid}"
    resp = await client.post(
        "/api/v1/pt/payments/confirm",
        json={"imp_uid": imp_uid, "merchant_uid": merchant_uid},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "paid"
    assert body["imp_uid"] == imp_uid
    assert body["paid_at"] is not None

    # 3) confirm 멱등 — 같은 imp_uid 재호출 200
    resp = await client.post(
        "/api/v1/pt/payments/confirm",
        json={"imp_uid": imp_uid, "merchant_uid": merchant_uid},
        headers=headers,
    )
    assert resp.status_code == 200

    # 4) list — paid 1건으로 표시
    resp = await client.get("/api/v1/pt/payments", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "paid"
    assert items[0]["pet_name"] == "해피"


async def test_confirm_rejected_for_other_owner(
    client: AsyncClient, db_session: AsyncSession, owner_booking: tuple[User, PtBooking]
) -> None:
    owner, booking = owner_booking
    resp = await client.post(
        "/api/v1/pt/payments/prepare", json={"booking_id": str(booking.id)}, headers=_auth(owner)
    )
    merchant_uid = resp.json()["merchant_uid"]

    intruder = User(
        role=UserRole.PET_OWNER, phone="01077770002", name="타인",
        app_context=APP_PETTRACKER,
    )
    db_session.add(intruder)
    await db_session.commit()

    resp = await client.post(
        "/api/v1/pt/payments/confirm",
        json={"imp_uid": "imp_x", "merchant_uid": merchant_uid},
        headers=_auth(intruder),
    )
    assert resp.status_code == 403
