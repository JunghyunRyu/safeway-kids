"""PT GPS 저정확도·순간이동 필터링 — Tech Spec FR-3/FR-4/FR-6 (2026-06-14).

service.record_gps / end_walk를 직접 호출 (WS 인증 경유 불필요). 필터된 점은
보존되되 polyline·거리에서 제외됨을 검증.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.pettracker import service
from app.apps.pettracker.models import Pet, PtBooking, WalkGpsHistory, WalkSession
from app.apps.pettracker.schemas import GpsPoint
from app.modules.auth.models import APP_PETTRACKER, User, UserRole

# 서울시청 근처 — 약 100m 간격 도보 좌표
BASE_LAT, BASE_LON = 37.5665, 126.9780


@pytest.fixture
async def walk_session(db_session: AsyncSession) -> WalkSession:
    owner = User(role=UserRole.PET_OWNER, phone="01088880001", name="GPS 보호자", app_context=APP_PETTRACKER)
    walker = User(role=UserRole.WALKER, phone="01088880002", name="GPS 워커", app_context=APP_PETTRACKER)
    db_session.add_all([owner, walker])
    await db_session.flush()
    pet = Pet(owner_id=owner.id, name="바둑이", species="dog")
    db_session.add(pet)
    await db_session.flush()
    booking = PtBooking(
        owner_id=owner.id, walker_id=walker.id, pet_id=pet.id, duration_minutes=30,
        scheduled_at=datetime.now(UTC), pickup_latitude=BASE_LAT, pickup_longitude=BASE_LON,
        price=20_000,
    )
    db_session.add(booking)
    await db_session.flush()
    session = WalkSession(booking_id=booking.id, walker_id=walker.id, started_at=datetime.now(UTC))
    db_session.add(session)
    await db_session.commit()
    return session


def _point(lat: float, lon: float, *, accuracy: float | None, at: datetime) -> GpsPoint:
    return GpsPoint(latitude=lat, longitude=lon, accuracy=accuracy, recorded_at=at)


async def test_good_point_accepted_and_in_polyline(
    db_session: AsyncSession, walk_session: WalkSession
) -> None:
    gps, accepted = await service.record_gps(
        db_session, walk_session.id, _point(BASE_LAT, BASE_LON, accuracy=10, at=datetime.now(UTC))
    )
    assert accepted is True
    assert gps.is_filtered is False
    refreshed = await db_session.get(WalkSession, walk_session.id)
    assert refreshed.route_polyline == [[BASE_LAT, BASE_LON]]


async def test_low_accuracy_point_filtered_but_persisted(
    db_session: AsyncSession, walk_session: WalkSession
) -> None:
    gps, accepted = await service.record_gps(
        db_session, walk_session.id, _point(BASE_LAT, BASE_LON, accuracy=120, at=datetime.now(UTC))
    )
    assert accepted is False
    assert gps.is_filtered is True
    assert gps.filter_reason == "low_accuracy"
    # 원본은 보존
    rows = (await db_session.execute(
        select(WalkGpsHistory).where(WalkGpsHistory.session_id == walk_session.id)
    )).scalars().all()
    assert len(rows) == 1
    # polyline에는 미반영
    refreshed = await db_session.get(WalkSession, walk_session.id)
    assert not refreshed.route_polyline


async def test_none_accuracy_passes(
    db_session: AsyncSession, walk_session: WalkSession
) -> None:
    _gps, accepted = await service.record_gps(
        db_session, walk_session.id, _point(BASE_LAT, BASE_LON, accuracy=None, at=datetime.now(UTC))
    )
    assert accepted is True


async def test_implausible_speed_filtered(
    db_session: AsyncSession, walk_session: WalkSession
) -> None:
    t0 = datetime.now(UTC)
    # 첫 통과 점
    _g, ok = await service.record_gps(
        db_session, walk_session.id, _point(BASE_LAT, BASE_LON, accuracy=10, at=t0)
    )
    assert ok
    # 5초 뒤 ~1.5km 떨어진 좌표 → ~300 m/s, 도보 상한(4.2 m/s) 초과
    gps, accepted = await service.record_gps(
        db_session, walk_session.id,
        _point(BASE_LAT + 0.015, BASE_LON, accuracy=10, at=t0 + timedelta(seconds=5)),
    )
    assert accepted is False
    assert gps.filter_reason == "implausible_speed"


async def test_end_walk_distance_excludes_filtered_points(
    db_session: AsyncSession, walk_session: WalkSession
) -> None:
    t0 = datetime.now(UTC)
    # 통과: 시작점
    await service.record_gps(db_session, walk_session.id, _point(BASE_LAT, BASE_LON, accuracy=10, at=t0))
    # 필터: 저정확도 점 (거리 합산에서 빠져야 함)
    await service.record_gps(
        db_session, walk_session.id,
        _point(BASE_LAT + 0.01, BASE_LON, accuracy=200, at=t0 + timedelta(seconds=60)),
    )
    # 통과: 시작점에서 ~110m 북쪽 (도보 속도 내)
    await service.record_gps(
        db_session, walk_session.id,
        _point(BASE_LAT + 0.001, BASE_LON, accuracy=10, at=t0 + timedelta(seconds=120)),
    )
    await db_session.commit()

    session = await service.end_walk(db_session, walk_session.id, walk_session.walker_id)
    # polyline은 통과 2점만
    assert len(session.route_polyline) == 2
    # 거리는 시작↔세번째(~111m)만, 필터점 경유 거리 미포함
    assert 80 <= session.distance_meters <= 140


async def test_stationary_drift_guard(
    db_session: AsyncSession, walk_session: WalkSession
) -> None:
    t0 = datetime.now(UTC)
    # 거의 같은 자리, 둘 다 accuracy 30m, 실이동 ~11m < (30+30) → 드리프트로 0 처리
    await service.record_gps(db_session, walk_session.id, _point(BASE_LAT, BASE_LON, accuracy=30, at=t0))
    await service.record_gps(
        db_session, walk_session.id,
        _point(BASE_LAT + 0.0001, BASE_LON, accuracy=30, at=t0 + timedelta(seconds=60)),
    )
    await db_session.commit()
    session = await service.end_walk(db_session, walk_session.id, walk_session.walker_id)
    assert session.distance_meters == 0
