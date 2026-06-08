"""Integration tests: CareConnect PortOne v2 payment endpoints.

prepare → confirm → cancel 전 구간 + 멱등성 + 소유권(403) + 중복 결제 방지.
PetTracker 패리티로 추가된 CC 결제 흐름을 검증한다 (PT에는 PortOne 결제
테스트가 없어 confirm 단계 버그가 드러나지 않았던 점을 CC에서는 방지).
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.careconnect.models import CcBooking, CcChild, CcPayment, CcPaymentStatus
from app.common.security import encrypt_value
from app.modules.auth.models import APP_CARECONNECT, User, UserRole
from app.modules.auth.service import create_access_token
from tests.conftest import auth_header

PORTONE = "app.modules.billing.providers.portone.portone_provider"


async def _cc_parent(db: AsyncSession, phone: str = "01055550001") -> User:
    user = User(
        id=uuid.uuid4(), role=UserRole.PARENT, phone=phone,
        name="CC학부모", is_active=True, app_context=APP_CARECONNECT,
    )
    db.add(user)
    await db.commit()
    return user


def _cc_parent_token(user: User) -> str:
    return create_access_token(user.id, UserRole.PARENT, app_context=APP_CARECONNECT)


async def _booking(db: AsyncSession, parent: User, *, hourly_rate: int = 15000,
                   duration_hours: float = 2.0, status: str = "confirmed") -> CcBooking:
    child = CcChild(
        id=uuid.uuid4(), parent_id=parent.id,
        name_encrypted=encrypt_value("아이"), birth_date=datetime(2018, 5, 1).date(),
        age_group="preschool",
    )
    db.add(child)
    await db.flush()
    booking = CcBooking(
        id=uuid.uuid4(), parent_id=parent.id, child_id=child.id,
        scheduled_at=datetime(2026, 6, 10, 9, 0, tzinfo=timezone.utc),
        duration_hours=duration_hours, hourly_rate=hourly_rate,
        care_latitude=37.5, care_longitude=127.0, status=status,
    )
    db.add(booking)
    await db.commit()
    return booking


@pytest.mark.asyncio
async def test_cc_payment_full_flow(client, db_session: AsyncSession) -> None:
    parent = await _cc_parent(db_session)
    booking = await _booking(db_session, parent)
    token = _cc_parent_token(parent)

    # prepare
    r = await client.post(
        "/api/v1/cc/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    assert r.status_code == 201, r.text
    prep = r.json()
    assert prep["amount"] == 30000  # 15000 * 2.0
    assert prep["merchant_uid"].startswith("cc_")
    merchant_uid = prep["merchant_uid"]
    payment_id = prep["payment_id"]

    # confirm (PortOne 응답 mock → PAID)
    with patch(f"{PORTONE}.confirm_payment", new=AsyncMock(
        return_value={"status": "PAID", "amount": {"total": 30000}})):
        r = await client.post(
            "/api/v1/cc/payments/confirm",
            json={"imp_uid": "imp_cc_1", "merchant_uid": merchant_uid},
            headers=auth_header(token),
        )
    assert r.status_code == 200, r.text
    conf = r.json()
    assert conf["status"] == CcPaymentStatus.PAID
    assert conf["paid_at"] is not None

    # confirm 멱등 (재호출 동일 결과, PG 재호출 없음)
    with patch(f"{PORTONE}.confirm_payment", new=AsyncMock(side_effect=AssertionError("재호출 금지"))):
        r2 = await client.post(
            "/api/v1/cc/payments/confirm",
            json={"imp_uid": "imp_cc_1", "merchant_uid": merchant_uid},
            headers=auth_header(token),
        )
    assert r2.status_code == 200
    assert r2.json()["status"] == CcPaymentStatus.PAID

    # cancel (전액)
    with patch(f"{PORTONE}.cancel_payment", new=AsyncMock(return_value={"status": "CANCELLED"})):
        r = await client.post(
            f"/api/v1/cc/payments/{payment_id}/cancel",
            json={"reason": "보호자 사정"},
            headers=auth_header(token),
        )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == CcPaymentStatus.CANCELLED


@pytest.mark.asyncio
async def test_cc_payment_prepare_idempotent_when_already_paid(client, db_session: AsyncSession) -> None:
    parent = await _cc_parent(db_session, phone="01055550002")
    booking = await _booking(db_session, parent)
    # 이미 PAID인 결제 직접 삽입
    paid = CcPayment(
        booking_id=booking.id, amount=30000, merchant_uid="cc_existing_paid",
        status=CcPaymentStatus.PAID, imp_uid="imp_existing",
    )
    db_session.add(paid)
    await db_session.commit()
    token = _cc_parent_token(parent)

    r = await client.post(
        "/api/v1/cc/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    assert r.status_code == 201
    assert r.json()["merchant_uid"] == "cc_existing_paid"  # 새로 만들지 않고 기존 반환


@pytest.mark.asyncio
async def test_cc_payment_prepare_blocks_other_parent(client, db_session: AsyncSession) -> None:
    owner = await _cc_parent(db_session, phone="01055550003")
    intruder = await _cc_parent(db_session, phone="01055550004")
    booking = await _booking(db_session, owner)
    token = _cc_parent_token(intruder)

    r = await client.post(
        "/api/v1/cc/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_cc_payment_prepare_blocks_completed_booking(client, db_session: AsyncSession) -> None:
    parent = await _cc_parent(db_session, phone="01055550005")
    booking = await _booking(db_session, parent, status="completed")
    token = _cc_parent_token(parent)

    r = await client.post(
        "/api/v1/cc/payments/prepare",
        json={"booking_id": str(booking.id)},
        headers=auth_header(token),
    )
    assert r.status_code in (400, 422)
