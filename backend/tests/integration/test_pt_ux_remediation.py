"""PT UX 개편 신규 동작 회귀 가드 (2026-06-04, QA 에이전트 GAP 대응).

- O-21 펫 소프트삭제 + 소유권 검증
- O-02 견종 size 필터 (accepted_sizes=None 레거시 호환 / 불일치 제외)
- O-15 워커 리뷰 공개 엔드포인트 (reviewer_name 채움)
QA 발견: 신규 엔드포인트 전용 assertion 부재가 P0(confirm_payment)를 숨긴 사례 → 가드 추가.
"""

import uuid
from datetime import UTC, date, datetime, time

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import (
    Pet, PtBooking, PtPayment, PtPaymentStatus, WalkSession,
    WalkerAvailability, WalkerQualification, WalkerReview,
)
from app.modules.auth.models import APP_PETTRACKER, User, UserRole
from app.modules.auth.service import create_access_token


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _make_user(db: AsyncSession, role: UserRole, phone: str, name: str) -> User:
    user = User(
        id=uuid.uuid4(), role=role, phone=phone, name=name,
        app_context=APP_PETTRACKER, is_active=True,
    )
    db.add(user)
    await db.flush()
    return user


async def _make_walker(
    db: AsyncSession, phone: str, name: str, lat: float, lng: float,
    when: date, accepted_sizes: list[str] | None,
) -> User:
    walker = await _make_user(db, UserRole.WALKER, phone, name)
    db.add(WalkerQualification(
        id=uuid.uuid4(), user_id=walker.id, approval_status="approved",
        service_areas=[{"lat": lat, "lon": lng, "radius_km": 5}],
        experience_years=2, accepted_sizes=accepted_sizes,
    ))
    db.add(WalkerAvailability(
        id=uuid.uuid4(), walker_id=walker.id, available_date=when,
        start_time=time(9, 0), end_time=time(18, 0), status="available",
    ))
    await db.flush()
    return walker


# ── O-21 펫 소프트삭제 ───────────────────────────────────────────

async def test_delete_pet_soft_delete_excluded_from_list(client: AsyncClient, db_session: AsyncSession):
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000001", "견주")
    pet = Pet(id=uuid.uuid4(), owner_id=owner.id, name="콩이", species="dog")
    db_session.add(pet)
    await db_session.commit()
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.delete(f"/api/v1/pt/pets/{pet.id}", headers=_auth(token))
    assert resp.status_code == 204

    listed = await client.get("/api/v1/pt/pets", headers=_auth(token))
    assert listed.status_code == 200
    assert all(p["id"] != str(pet.id) for p in listed.json())


async def test_delete_pet_other_owner_404(client: AsyncClient, db_session: AsyncSession):
    owner_a = await _make_user(db_session, UserRole.PET_OWNER, "01040000002", "견주A")
    owner_b = await _make_user(db_session, UserRole.PET_OWNER, "01040000003", "견주B")
    pet = Pet(id=uuid.uuid4(), owner_id=owner_a.id, name="보리", species="dog")
    db_session.add(pet)
    await db_session.commit()
    token_b = create_access_token(owner_b.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.delete(f"/api/v1/pt/pets/{pet.id}", headers=_auth(token_b))
    assert resp.status_code == 404


# ── O-02 견종 size 필터 ──────────────────────────────────────────

async def test_search_size_filter_excludes_mismatch(client: AsyncClient, db_session: AsyncSession):
    when = date.today()
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000010", "견주")
    # 소형만 받는 워커 → 대형 검색에서 제외돼야 함
    await _make_walker(db_session, "01040000011", "소형워커", 37.5, 127.0, when, ["small"])
    await db_session.commit()
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.get(
        "/api/v1/pt/walkers/search",
        params={"latitude": 37.5, "longitude": 127.0, "date": when.isoformat(), "size": "large"},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    assert all(w["name"] != "소형워커" for w in resp.json())


async def test_search_size_filter_legacy_null_included(client: AsyncClient, db_session: AsyncSession):
    when = date.today()
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000020", "견주")
    # accepted_sizes 미지정(레거시) → 모든 크기 요청에 포함돼야 함 (회귀 핵심)
    await _make_walker(db_session, "01040000021", "레거시워커", 37.5, 127.0, when, None)
    await db_session.commit()
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.get(
        "/api/v1/pt/walkers/search",
        params={"latitude": 37.5, "longitude": 127.0, "date": when.isoformat(), "size": "large"},
        headers=_auth(token),
    )
    assert resp.status_code == 200
    names = [w["name"] for w in resp.json()]
    assert "레거시워커" in names
    # 검색 카드용 신규 필드도 응답에 포함 (보호자 QA P1)
    legacy = next(w for w in resp.json() if w["name"] == "레거시워커")
    assert "profile_photo_url" in legacy
    assert "total_walks" in legacy


# ── O-15 워커 리뷰 공개 엔드포인트 ───────────────────────────────

async def test_walker_reviews_endpoint_includes_reviewer_name(client: AsyncClient, db_session: AsyncSession):
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000030", "리뷰견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01040000031", "리뷰워커")
    pet = Pet(id=uuid.uuid4(), owner_id=owner.id, name="멍이", species="dog")
    db_session.add(pet)
    await db_session.flush()
    booking = PtBooking(
        id=uuid.uuid4(), owner_id=owner.id, walker_id=walker.id, pet_id=pet.id,
        service_type="walk", duration_minutes=30, scheduled_at=datetime.now(UTC),
        pickup_latitude=37.5, pickup_longitude=127.0, status="completed",
        price=15000, commission_rate=15,
    )
    db_session.add(booking)
    await db_session.flush()
    db_session.add(WalkerReview(
        id=uuid.uuid4(), booking_id=booking.id, reviewer_id=owner.id,
        walker_id=walker.id, rating=5, comment="최고였어요",
    ))
    await db_session.commit()
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.get(f"/api/v1/pt/walkers/{walker.id}/reviews", headers=_auth(token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["rating"] == 5
    assert data[0]["comment"] == "최고였어요"
    assert data[0]["reviewer_name"] == "리뷰견주"


# ── 산책 세션/예약 헬퍼 ──────────────────────────────────────────

async def _make_session(
    db: AsyncSession, owner: User, walker: User, status: str = "in_progress",
) -> tuple[PtBooking, WalkSession]:
    pet = Pet(id=uuid.uuid4(), owner_id=owner.id, name="멍멍이", species="dog")
    db.add(pet)
    await db.flush()
    booking = PtBooking(
        id=uuid.uuid4(), owner_id=owner.id, walker_id=walker.id, pet_id=pet.id,
        service_type="walk", duration_minutes=30, scheduled_at=datetime.now(UTC),
        pickup_latitude=37.5, pickup_longitude=127.0, status=status,
        price=15000, commission_rate=15,
    )
    db.add(booking)
    await db.flush()
    session = WalkSession(
        id=uuid.uuid4(), booking_id=booking.id, walker_id=walker.id,
        started_at=datetime.now(UTC),
    )
    db.add(session)
    await db.commit()
    return booking, session


# ── W-04 end_walk 메모/사진 저장 ─────────────────────────────────

async def test_end_walk_saves_memo_and_photo(client: AsyncClient, db_session: AsyncSession):
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000040", "견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01040000041", "워커")
    _, session = await _make_session(db_session, owner, walker)
    token = create_access_token(walker.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(
        f"/api/v1/pt/walks/{session.id}/end",
        json={"walker_memo": "오늘 잘 걸었어요", "photo_url": "https://cdn/x.jpg"},
        headers=_auth(token),
    )
    assert resp.status_code == 200

    fresh = await db_session.get(WalkSession, session.id, populate_existing=True)
    assert fresh.walker_memo == "오늘 잘 걸었어요"
    assert fresh.arrival_photo_url == "https://cdn/x.jpg"


async def test_end_walk_no_body_no_crash(client: AsyncClient, db_session: AsyncSession):
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000042", "견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01040000043", "워커")
    _, session = await _make_session(db_session, owner, walker)
    token = create_access_token(walker.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(f"/api/v1/pt/walks/{session.id}/end", headers=_auth(token))
    assert resp.status_code == 200


# ── O-01/O-18 walk_report walker_name/phone ──────────────────────

async def test_get_walk_report_includes_walker_name_and_phone(client: AsyncClient, db_session: AsyncSession):
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000050", "견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01044445555", "산책왕")
    _, session = await _make_session(db_session, owner, walker)
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.get(f"/api/v1/pt/walks/{session.id}/report", headers=_auth(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["walker_name"] == "산책왕"
    assert body["walker_phone"] == "01044445555"


# ── O-11/O-12/O-19 list_bookings walker 필드 + has_review ────────

async def test_list_bookings_populates_walker_fields_and_has_review(client: AsyncClient, db_session: AsyncSession):
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000060", "견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01046667777", "워커킴")
    booking, _ = await _make_session(db_session, owner, walker, status="completed")
    db_session.add(WalkerReview(
        id=uuid.uuid4(), booking_id=booking.id, reviewer_id=owner.id,
        walker_id=walker.id, rating=4, comment=None,
    ))
    await db_session.commit()
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.get("/api/v1/pt/bookings", headers=_auth(token))
    assert resp.status_code == 200
    row = next(b for b in resp.json() if b["id"] == str(booking.id))
    assert row["walker_name"] == "워커킴"
    assert row["walker_phone"] == "01046667777"
    assert row["has_review"] is True
    assert row["session_id"] is not None  # completed도 session_id 포함(O-04)


# ── P0 회귀 가드: confirm_payment가 PAID 저장 후 반환 ────────────

async def test_confirm_payment_marks_paid(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    from app.modules.billing.providers import portone as portone_mod

    async def _fake_confirm(*args, **kwargs):
        return {"status": "PAID"}

    monkeypatch.setattr(portone_mod.portone_provider, "confirm_payment", _fake_confirm)

    owner = await _make_user(db_session, UserRole.PET_OWNER, "01040000070", "견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01040000071", "워커")
    booking, _ = await _make_session(db_session, owner, walker, status="accepted")
    merchant_uid = f"pt_{uuid.uuid4().hex[:16]}"
    db_session.add(PtPayment(
        id=uuid.uuid4(), booking_id=booking.id, amount=15000,
        merchant_uid=merchant_uid, status=PtPaymentStatus.PENDING,
    ))
    await db_session.commit()
    token = create_access_token(owner.id, UserRole.PET_OWNER, APP_PETTRACKER)

    resp = await client.post(
        "/api/v1/pt/payments/confirm",
        json={"imp_uid": "imp_test_123", "merchant_uid": merchant_uid},
        headers=_auth(token),
    )
    # 데드코드 버그였다면 confirm_payment가 None 반환 → 500. 수정 후 200 + PAID.
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == PtPaymentStatus.PAID.value
    assert data["imp_uid"] == "imp_test_123"
    assert data["paid_at"] is not None
