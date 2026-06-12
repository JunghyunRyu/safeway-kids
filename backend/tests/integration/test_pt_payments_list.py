"""GET /pt/payments 목록 테스트 — Tech Spec FR-P1/FR-P2 (2026-06-11)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import Pet, PtBooking, PtPayment
from app.modules.auth.models import APP_PETTRACKER, User, UserRole
from app.modules.auth.service import create_access_token


def _auth(user: User) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id, user.role, user.app_context)}"
    }


@pytest.fixture
async def owner_with_payments(db_session: AsyncSession) -> tuple[User, User]:
    """결제 2건(paid·cancelled) 가진 owner + 결제 0건 other owner."""
    owner = User(
        role=UserRole.PET_OWNER, phone="01066660001", name="결제 보호자",
        app_context=APP_PETTRACKER,
    )
    other = User(
        role=UserRole.PET_OWNER, phone="01066660002", name="남의 보호자",
        app_context=APP_PETTRACKER,
    )
    db_session.add_all([owner, other])
    await db_session.flush()

    pet = Pet(owner_id=owner.id, name="콩이", species="dog")
    db_session.add(pet)
    await db_session.flush()

    def booking() -> PtBooking:
        return PtBooking(
            owner_id=owner.id,
            pet_id=pet.id,
            duration_minutes=30,
            scheduled_at=datetime.now(UTC),
            pickup_latitude=37.5,
            pickup_longitude=127.0,
            price=25_000,
        )

    b1, b2 = booking(), booking()
    db_session.add_all([b1, b2])
    await db_session.flush()

    db_session.add_all([
        PtPayment(
            booking_id=b1.id, amount=25_000, merchant_uid=f"pt_{uuid.uuid4().hex[:12]}_1",
            status="paid", paid_at=datetime.now(UTC),
        ),
        PtPayment(
            booking_id=b2.id, amount=25_000, merchant_uid=f"pt_{uuid.uuid4().hex[:12]}_2",
            status="cancelled", cancel_amount=25_000, cancel_reason="보호자 요청",
            cancelled_at=datetime.now(UTC),
        ),
    ])
    await db_session.commit()
    return owner, other


async def test_payments_list_owner_scoped(
    client: AsyncClient, owner_with_payments: tuple[User, User]
) -> None:
    owner, other = owner_with_payments

    resp = await client.get("/api/v1/pt/payments", headers=_auth(owner))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    item = body["items"][0]
    # 영수증 컨텍스트 필드 (FR-P1)
    assert item["pet_name"] == "콩이"
    assert item["duration_minutes"] == 30
    assert item["merchant_uid"].startswith("pt_")

    # 타 사용자에게는 보이지 않는다
    resp = await client.get("/api/v1/pt/payments", headers=_auth(other))
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


async def test_payments_list_status_filter_and_cancel_fields(
    client: AsyncClient, owner_with_payments: tuple[User, User]
) -> None:
    owner, _ = owner_with_payments
    resp = await client.get(
        "/api/v1/pt/payments", params={"status": "cancelled"}, headers=_auth(owner)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["status"] == "cancelled"
    assert item["cancel_amount"] == 25_000
    assert item["cancel_reason"] == "보호자 요청"
    assert item["cancelled_at"] is not None


async def test_payments_list_pagination(
    client: AsyncClient, owner_with_payments: tuple[User, User]
) -> None:
    owner, _ = owner_with_payments
    resp = await client.get(
        "/api/v1/pt/payments", params={"limit": 1, "offset": 1}, headers=_auth(owner)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert len(body["items"]) == 1


async def test_payments_list_requires_owner_role(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    walker = User(
        role=UserRole.WALKER, phone="01066660003", name="워커",
        app_context=APP_PETTRACKER,
    )
    db_session.add(walker)
    await db_session.commit()
    resp = await client.get("/api/v1/pt/payments", headers=_auth(walker))
    assert resp.status_code == 403
