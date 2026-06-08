"""Integration tests: PetTracker PortOne v2 payment endpoints.

prepare → confirm → cancel 전 구간 + 멱등성 + 소유권(403).

특히 `confirm`이 결제를 PAID로 **영속**하는지 회귀 가드한다 — 2026-06-08
이전 `confirm_payment`에는 `purge_old_walk_gps_history`가 함수 한가운데
잘못 삽입돼 `payment.status = PAID` 코드가 도달 불가(dead code)였고,
PT 결제 테스트 부재로 드러나지 않았다 (CC 패리티 작업 중 발견·수정).
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import Pet, PtBooking, PtBookingStatus, PtPayment, PtPaymentStatus
from app.modules.auth.models import APP_PETTRACKER, User, UserRole
from app.modules.auth.service import create_access_token
from tests.conftest import auth_header

PORTONE = "app.modules.billing.providers.portone.portone_provider"


async def _pet_owner(db: AsyncSession, phone: str = "01066660001") -> User:
    user = User(
        id=uuid.uuid4(), role=UserRole.PET_OWNER, phone=phone,
        name="반려인", is_active=True, app_context=APP_PETTRACKER,
    )
    db.add(user)
    await db.commit()
    return user


def _owner_token(user: User) -> str:
    return create_access_token(user.id, UserRole.PET_OWNER, app_context=APP_PETTRACKER)


async def _booking(db: AsyncSession, owner: User, *, price: int = 20000,
                   status: str = PtBookingStatus.CONFIRMED) -> PtBooking:
    pet = Pet(id=uuid.uuid4(), owner_id=owner.id, name="멍멍이", species="dog")
    db.add(pet)
    await db.flush()
    booking = PtBooking(
        id=uuid.uuid4(), owner_id=owner.id, pet_id=pet.id,
        service_type="walk", duration_minutes=30,
        scheduled_at=datetime(2026, 6, 10, 9, 0, tzinfo=timezone.utc),
        pickup_latitude=37.5, pickup_longitude=127.0,
        price=price, status=status,
    )
    db.add(booking)
    await db.commit()
    return booking


@pytest.mark.asyncio
async def test_pt_payment_full_flow(client, db_session: AsyncSession) -> None:
    owner = await _pet_owner(db_session)
    booking = await _booking(db_session, owner)
    token = _owner_token(owner)

    # prepare
    r = await client.post(
        "/api/v1/pt/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    assert r.status_code == 201, r.text
    prep = r.json()
    assert prep["amount"] == 20000
    merchant_uid = prep["merchant_uid"]
    payment_id = prep["payment_id"]

    # confirm — PG 응답 mock → PAID. (회귀 가드: 이전 dead-code 버그로 PAID 미영속)
    with patch(f"{PORTONE}.confirm_payment", new=AsyncMock(
            return_value={"status": "PAID", "amount": {"total": 20000}})):
        r = await client.post(
            "/api/v1/pt/payments/confirm",
            json={"imp_uid": "imp_pt_1", "merchant_uid": merchant_uid},
            headers=auth_header(token),
        )
    assert r.status_code == 200, r.text
    conf = r.json()
    assert conf["status"] == PtPaymentStatus.PAID
    assert conf["paid_at"] is not None
    assert conf["imp_uid"] == "imp_pt_1"

    # DB에도 영속됐는지 직접 확인 (dead-code 회귀 핵심)
    persisted = await db_session.get(PtPayment, uuid.UUID(payment_id))
    await db_session.refresh(persisted)
    assert persisted.status == PtPaymentStatus.PAID
    assert persisted.paid_at is not None

    # confirm 멱등 (재호출 동일 결과, PG 재호출 없음)
    with patch(f"{PORTONE}.confirm_payment", new=AsyncMock(side_effect=AssertionError("재호출 금지"))):
        r2 = await client.post(
            "/api/v1/pt/payments/confirm",
            json={"imp_uid": "imp_pt_1", "merchant_uid": merchant_uid},
            headers=auth_header(token),
        )
    assert r2.status_code == 200
    assert r2.json()["status"] == PtPaymentStatus.PAID

    # cancel (전액)
    with patch(f"{PORTONE}.cancel_payment", new=AsyncMock(return_value={"status": "CANCELLED"})):
        r = await client.post(
            f"/api/v1/pt/payments/{payment_id}/cancel",
            json={"reason": "보호자 사정"},
            headers=auth_header(token),
        )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == PtPaymentStatus.CANCELLED


@pytest.mark.asyncio
async def test_pt_payment_confirm_rejects_non_paid_pg_status(client, db_session: AsyncSession) -> None:
    owner = await _pet_owner(db_session, phone="01066660002")
    booking = await _booking(db_session, owner)
    token = _owner_token(owner)

    r = await client.post(
        "/api/v1/pt/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    merchant_uid = r.json()["merchant_uid"]

    with patch(f"{PORTONE}.confirm_payment", new=AsyncMock(
            return_value={"status": "FAILED"})):
        r = await client.post(
            "/api/v1/pt/payments/confirm",
            json={"imp_uid": "imp_pt_fail", "merchant_uid": merchant_uid},
            headers=auth_header(token),
        )
    assert r.status_code in (400, 422)


@pytest.mark.asyncio
async def test_pt_payment_prepare_blocks_other_owner(client, db_session: AsyncSession) -> None:
    owner = await _pet_owner(db_session, phone="01066660003")
    intruder = await _pet_owner(db_session, phone="01066660004")
    booking = await _booking(db_session, owner)
    token = _owner_token(intruder)

    r = await client.post(
        "/api/v1/pt/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    assert r.status_code == 403
