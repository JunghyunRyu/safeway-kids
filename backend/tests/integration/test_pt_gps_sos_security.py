"""안전 핵심 수정 검증 (2026-06-03).

- G-21: PT 산책 세션 소유권 검증 — 타 워커의 GPS 주입 차단(403)
- M-02: /pt/sos 엔드포인트 — 위치 nullable
- C-2: /notifications/sos — 위치 nullable + location_unknown ((0,0) 미전송 정책)
- G-01(PT): 속도 이상은 로그온리 — 좌표 거부하지 않음(정상 산책 보존)
"""

import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker.models import Pet, PtBooking, WalkSession
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


async def _make_walk_session(db: AsyncSession, walker_id: uuid.UUID, owner_id: uuid.UUID) -> WalkSession:
    pet = Pet(id=uuid.uuid4(), owner_id=owner_id, name="멍멍이", species="dog")
    db.add(pet)
    await db.flush()
    booking = PtBooking(
        id=uuid.uuid4(), owner_id=owner_id, walker_id=walker_id, pet_id=pet.id,
        service_type="walk", duration_minutes=30, scheduled_at=datetime.now(UTC),
        pickup_latitude=37.5, pickup_longitude=127.0, status="accepted",
        price=15000, commission_rate=15,
    )
    db.add(booking)
    await db.flush()
    session = WalkSession(
        id=uuid.uuid4(), booking_id=booking.id, walker_id=walker_id,
        started_at=datetime.now(UTC),
    )
    db.add(session)
    await db.commit()
    return session


def _gps_body(lat: float, lng: float) -> dict:
    return {
        "latitude": lat, "longitude": lng,
        "recorded_at": datetime.now(UTC).isoformat(),
    }


# ── G-21: 세션 소유권 ────────────────────────────────────────────

async def test_g21_other_walker_gps_injection_blocked(client: AsyncClient, db_session: AsyncSession):
    """타 워커가 남의 session_id에 GPS 주입 시도 → 403."""
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01030000001", "견주")
    walker_a = await _make_user(db_session, UserRole.WALKER, "01030000002", "워커A")
    walker_b = await _make_user(db_session, UserRole.WALKER, "01030000003", "워커B")
    session = await _make_walk_session(db_session, walker_a.id, owner.id)
    token_b = create_access_token(walker_b.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(
        f"/api/v1/pt/walks/{session.id}/gps",
        json=_gps_body(37.5012, 127.0396),
        headers=_auth(token_b),
    )
    assert resp.status_code == 403, resp.text


async def test_g21_owner_walker_gps_accepted(client: AsyncClient, db_session: AsyncSession):
    """세션 소유 워커의 GPS → 200."""
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01030000011", "견주")
    walker_a = await _make_user(db_session, UserRole.WALKER, "01030000012", "워커A")
    session = await _make_walk_session(db_session, walker_a.id, owner.id)
    token_a = create_access_token(walker_a.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(
        f"/api/v1/pt/walks/{session.id}/gps",
        json=_gps_body(37.5012, 127.0396),
        headers=_auth(token_a),
    )
    assert resp.status_code == 200, resp.text


async def test_g21_nonexistent_session_404(client: AsyncClient, db_session: AsyncSession):
    """존재하지 않는 세션 → 404."""
    walker = await _make_user(db_session, UserRole.WALKER, "01030000021", "워커")
    await db_session.commit()
    token = create_access_token(walker.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(
        f"/api/v1/pt/walks/{uuid.uuid4()}/gps",
        json=_gps_body(37.5, 127.0),
        headers=_auth(token),
    )
    assert resp.status_code == 404, resp.text


# ── G-01(PT): 속도 이상 로그온리 (거부하지 않음) ──────────────────

async def test_g01_pt_teleport_logged_not_rejected(client: AsyncClient, db_session: AsyncSession):
    """도보 텔레포트 좌표도 로그온리라 200으로 저장됨(정상 산책 보존)."""
    owner = await _make_user(db_session, UserRole.PET_OWNER, "01030000031", "견주")
    walker = await _make_user(db_session, UserRole.WALKER, "01030000032", "워커")
    session = await _make_walk_session(db_session, walker.id, owner.id)
    token = create_access_token(walker.id, UserRole.WALKER, APP_PETTRACKER)

    r1 = await client.post(f"/api/v1/pt/walks/{session.id}/gps",
                           json=_gps_body(37.5012, 127.0396), headers=_auth(token))
    assert r1.status_code == 200, r1.text
    # 부산으로 텔레포트 — 로그온리 정책이므로 여전히 200
    r2 = await client.post(f"/api/v1/pt/walks/{session.id}/gps",
                           json=_gps_body(35.1796, 129.0756), headers=_auth(token))
    assert r2.status_code == 200, r2.text


# ── M-02: /pt/sos ────────────────────────────────────────────────

async def test_m02_pt_sos_location_unknown(client: AsyncClient, db_session: AsyncSession):
    """PT SOS — 위치 미확인(null + location_unknown) → 200."""
    walker = await _make_user(db_session, UserRole.WALKER, "01030000041", "워커")
    await db_session.commit()
    token = create_access_token(walker.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(
        "/api/v1/pt/sos",
        json={"session_id": None, "latitude": None, "longitude": None,
              "location_unknown": True, "message": "긴급"},
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["success"] is True


async def test_m02_pt_sos_with_location(client: AsyncClient, db_session: AsyncSession):
    """PT SOS — 위치 포함 → 200."""
    walker = await _make_user(db_session, UserRole.WALKER, "01030000051", "워커")
    await db_session.commit()
    token = create_access_token(walker.id, UserRole.WALKER, APP_PETTRACKER)

    resp = await client.post(
        "/api/v1/pt/sos",
        json={"session_id": None, "latitude": 37.5, "longitude": 127.0,
              "location_unknown": False},
        headers=_auth(token),
    )
    assert resp.status_code == 200, resp.text


# ── C-2: /notifications/sos nullable ─────────────────────────────

async def test_c2_safeway_sos_null_location(client: AsyncClient, driver_token: str):
    """SafeWay SOS — lat/lng null + location_unknown → 200 (None 포맷 크래시 없음, (0,0) 미전송)."""
    resp = await client.post(
        "/api/v1/notifications/sos",
        json={"latitude": None, "longitude": None, "location_unknown": True,
              "sos_type": "other", "message": "위치 미확인 테스트"},
        headers=_auth(driver_token),
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["success"] is True


async def test_c2_safeway_sos_with_location(client: AsyncClient, driver_token: str):
    """SafeWay SOS — 위치 포함 → 200 (회귀 가드)."""
    resp = await client.post(
        "/api/v1/notifications/sos",
        json={"latitude": 37.5665, "longitude": 126.978, "sos_type": "vehicle_accident"},
        headers=_auth(driver_token),
    )
    assert resp.status_code == 200, resp.text
