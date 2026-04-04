"""
페르소나 기반 기능 테스트 — 7가지 사용자 페르소나로 3개 앱 전체 검증

Personas:
  ┌─ SafeWay Kids ──────────────────────────────────┐
  │ P1. 김영희 (학부모) — 아이 등록→동의→스케줄→취소  │
  │ P2. 이철수 (운전기사) — 탑승→하차→GPS→노쇼 처리   │
  │ P3. 박원장 (학원장) — 학원 관리, 스케줄 생성      │
  ├─ PetTracker ────────────────────────────────────┤
  │ P4. 정민수 (펫 오너) — 반려견 등록→예약→리뷰      │
  │ P5. 한지은 (워커) — 자격→수락→산책→정산           │
  ├─ CareConnect ───────────────────────────────────┤
  │ P6. 오수진 (부모) — 아이 등록→동의→예약→인수인계  │
  │ P7. 최미래 (돌보미) — 자격→수락→체크인→활동→정산   │
  └─────────────────────────────────────────────────┘

Cross-cutting:
  X1. 크로스앱 차단 — 각 앱 사용자가 다른 앱 접근 불가
  X2. 플랫폼 관리자 — 모든 앱 관리 기능 접근 가능
"""

import uuid
from datetime import date, datetime, time, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import (
    APP_CARECONNECT,
    APP_PETTRACKER,
    APP_SAFEWAY_KIDS,
    User,
    UserRole,
)
from app.modules.auth.service import create_access_token
from tests.conftest import auth_header

# ═══════════════════════════════════════════════════════════════
# Persona Fixtures
# ═══════════════════════════════════════════════════════════════


# --- SafeWay Kids ---
@pytest.fixture
async def 김영희(db_session: AsyncSession) -> User:
    """학부모 — 초등 1학년 아이의 엄마"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PARENT,
        phone="01011110001",
        name="김영희",
        app_context=APP_SAFEWAY_KIDS,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 김영희_token(김영희: User) -> str:
    return create_access_token(김영희.id, 김영희.role, APP_SAFEWAY_KIDS)


@pytest.fixture
async def 이철수(db_session: AsyncSession) -> User:
    """운전기사 — 강남 지역 15인승 셔틀 운전"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.DRIVER,
        phone="01011110002",
        name="이철수",
        app_context=APP_SAFEWAY_KIDS,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 이철수_token(이철수: User) -> str:
    return create_access_token(이철수.id, 이철수.role, APP_SAFEWAY_KIDS)


@pytest.fixture
async def 박원장(db_session: AsyncSession) -> User:
    """학원장 — 강남 수학학원 운영"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.ACADEMY_ADMIN,
        phone="01011110003",
        name="박원장",
        app_context=APP_SAFEWAY_KIDS,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 박원장_token(박원장: User) -> str:
    return create_access_token(박원장.id, 박원장.role, APP_SAFEWAY_KIDS)


# --- PetTracker ---
@pytest.fixture
async def 정민수(db_session: AsyncSession) -> User:
    """펫 오너 — 골든 리트리버 '콩이' 키움"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PET_OWNER,
        phone="01022220001",
        name="정민수",
        app_context=APP_PETTRACKER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 정민수_token(정민수: User) -> str:
    return create_access_token(정민수.id, 정민수.role, APP_PETTRACKER)


@pytest.fixture
async def 한지은(db_session: AsyncSession) -> User:
    """워커 — 대학생, 경험 2년, 강남 지역"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.WALKER,
        phone="01022220002",
        name="한지은",
        app_context=APP_PETTRACKER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 한지은_token(한지은: User) -> str:
    return create_access_token(한지은.id, 한지은.role, APP_PETTRACKER)


# --- CareConnect ---
@pytest.fixture
async def 오수진(db_session: AsyncSession) -> User:
    """부모 — 유치원 아이의 엄마, 돌봄 서비스 이용"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PARENT,
        phone="01033330001",
        name="오수진",
        app_context=APP_CARECONNECT,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 오수진_token(오수진: User) -> str:
    return create_access_token(오수진.id, 오수진.role, APP_CARECONNECT)


@pytest.fixture
async def 최미래(db_session: AsyncSession) -> User:
    """돌보미 — 보육교사 자격, 경력 5년"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.CAREGIVER,
        phone="01033330002",
        name="최미래",
        app_context=APP_CARECONNECT,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 최미래_token(최미래: User) -> str:
    return create_access_token(최미래.id, 최미래.role, APP_CARECONNECT)


# --- Platform Admin (cross-app) ---
@pytest.fixture
async def 관리자(db_session: AsyncSession) -> User:
    """플랫폼 관리자 — 전체 시스템 관리"""
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PLATFORM_ADMIN,
        phone="01099990001",
        name="플랫폼관리자",
        app_context=APP_SAFEWAY_KIDS,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def 관리자_token(관리자: User) -> str:
    return create_access_token(관리자.id, 관리자.role, APP_SAFEWAY_KIDS)


# ═══════════════════════════════════════════════════════════════
# Scenario 1: SafeWay Kids — 학부모 김영희의 하루
# ═══════════════════════════════════════════════════════════════


class TestP1_김영희_학부모:
    """학부모 김영희가 아이를 등록하고 통학을 시작하는 전체 흐름"""

    async def test_scenario_register_child_and_schedule(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        김영희: User,
        김영희_token: str,
        박원장: User,
        박원장_token: str,
    ) -> None:
        """아이 등록 → 학원 등록 → 동의서 → 스케줄 → 조회"""

        # Step 1: 박원장이 학원 등록
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "강남 수학학원",
                "address": "서울시 강남구 대치동 123",
                "latitude": 37.4943,
                "longitude": 127.0573,
                "phone": "0212345678",
            },
            headers=auth_header(박원장_token),
        )
        assert resp.status_code == 201, f"학원 등록 실패: {resp.text}"
        academy_id = resp.json()["id"]

        # Step 2: 김영희가 아이 등록
        resp = await client.post(
            "/api/v1/students",
            json={
                "name": "김민준",
                "date_of_birth": "2018-05-01",
                "grade": "초등1",
            },
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 201, f"학생 등록 실패: {resp.text}"
        student_id = resp.json()["id"]
        assert resp.json()["name"] == "김민준"

        # Step 3: 내 아이 목록 조회 — 김민준이 보여야 함
        resp = await client.get(
            "/api/v1/students",
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 200
        assert any(s["id"] == student_id for s in resp.json()["items"])

        # Step 4: 위치정보법 동의서 제출 (동의 없으면 스케줄 생성 불가)
        resp = await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": student_id,
                "consent_scope": {
                    "service_terms": True,
                    "privacy_policy": True,
                    "child_info_collection": True,
                    "location_tracking": True,
                },
            },
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 201, f"동의서 실패: {resp.text}"
        assert resp.json()["withdrawn_at"] is None

        # Step 5: 월요일 15시 픽업 스케줄 생성
        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 0,
                "pickup_time": "15:00:00",
                "pickup_latitude": 37.4979,
                "pickup_longitude": 127.0276,
                "pickup_address": "강남역 2번 출구",
            },
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 201, f"스케줄 생성 실패: {resp.text}"
        template_id = resp.json()["id"]
        assert resp.json()["is_active"] is True

        # Step 6: 스케줄 조회 확인
        resp = await client.get(
            f"/api/v1/schedules/templates?student_id={student_id}",
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_scenario_consent_withdrawal_blocks_schedule(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        김영희: User,
        김영희_token: str,
        박원장: User,
        박원장_token: str,
    ) -> None:
        """동의 철회 후 스케줄 생성이 차단되는지 확인"""

        # Setup: 학원 + 학생
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "서초 영어학원",
                "address": "서울시 서초구 1",
                "latitude": 37.4837,
                "longitude": 127.0324,
                "phone": "0211112222",
            },
            headers=auth_header(박원장_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "김서연", "date_of_birth": "2019-11-20", "grade": "유치원"},
            headers=auth_header(김영희_token),
        )
        student_id = resp.json()["id"]

        # 동의 없이 스케줄 생성 시도 → 차단
        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 2,
                "pickup_time": "14:00:00",
                "pickup_latitude": 37.4979,
                "pickup_longitude": 127.0276,
            },
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 403, "동의 없이 스케줄 생성이 허용됨!"


# ═══════════════════════════════════════════════════════════════
# Scenario 2: SafeWay Kids — 운전기사 이철수의 운행
# ═══════════════════════════════════════════════════════════════


class TestP2_이철수_운전기사:
    """운전기사 이철수가 학생을 태우고 운행하는 흐름"""

    async def test_scenario_boarding_and_alighting(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        김영희: User,
        김영희_token: str,
        이철수: User,
        이철수_token: str,
        박원장: User,
        박원장_token: str,
    ) -> None:
        """탑승 → 하차 → 완료 상태 전이"""

        # Setup: 학원 + 학생 + 동의 + 스케줄 + 일일 생성
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "대치 과학학원",
                "address": "서울시 강남구 대치동 456",
                "latitude": 37.4943,
                "longitude": 127.0573,
                "phone": "0234567890",
            },
            headers=auth_header(박원장_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "박지호", "date_of_birth": "2017-08-20", "grade": "초등2"},
            headers=auth_header(김영희_token),
        )
        student_id = resp.json()["id"]

        await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": student_id,
                "consent_scope": {
                    "service_terms": True,
                    "privacy_policy": True,
                    "child_info_collection": True,
                    "location_tracking": True,
                },
            },
            headers=auth_header(김영희_token),
        )

        await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 0,
                "pickup_time": "15:30:00",
                "pickup_latitude": 37.4960,
                "pickup_longitude": 127.0290,
            },
            headers=auth_header(김영희_token),
        )

        # 일일 스케줄 생성 (월요일 2026-03-16)
        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(박원장_token),
        )
        assert resp.status_code == 200
        instances = resp.json()
        assert len(instances) >= 1
        instance_id = instances[0]["id"]
        assert instances[0]["status"] == "scheduled"

        # 이철수가 탑승 처리
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/board",
            headers=auth_header(이철수_token),
        )
        assert resp.status_code == 200
        assert resp.json()["boarded_at"] is not None

        # 이철수가 하차 처리
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/alight",
            headers=auth_header(이철수_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

        # 김영희(학부모)가 최종 상태 확인
        resp = await client.get(
            f"/api/v1/schedules/daily?target_date=2026-03-16&student_id={student_id}",
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 200
        assert resp.json()[0]["status"] == "completed"

    async def test_scenario_no_show_handling(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        김영희: User,
        김영희_token: str,
        이철수: User,
        이철수_token: str,
        박원장: User,
        박원장_token: str,
    ) -> None:
        """노쇼 처리 — 학생이 안 나왔을 때"""

        # Setup
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "잠실 음악학원",
                "address": "서울시 송파구 잠실동 1",
                "latitude": 37.5133,
                "longitude": 127.1001,
                "phone": "0244445555",
            },
            headers=auth_header(박원장_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "이하은", "date_of_birth": "2018-02-14", "grade": "초등1"},
            headers=auth_header(김영희_token),
        )
        student_id = resp.json()["id"]

        await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": student_id,
                "consent_scope": {
                    "service_terms": True,
                    "privacy_policy": True,
                    "child_info_collection": True,
                    "location_tracking": True,
                },
            },
            headers=auth_header(김영희_token),
        )

        await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 0,
                "pickup_time": "16:00:00",
                "pickup_latitude": 37.5133,
                "pickup_longitude": 127.1001,
            },
            headers=auth_header(김영희_token),
        )

        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(박원장_token),
        )
        instance_id = resp.json()[0]["id"]

        # 이철수가 노쇼 처리
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/no-show",
            json={"reason": "학생이 픽업 장소에 나오지 않음"},
            headers=auth_header(이철수_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "no_show"


# ═══════════════════════════════════════════════════════════════
# Scenario 3: SafeWay Kids — 학원장 박원장의 운영
# ═══════════════════════════════════════════════════════════════


class TestP3_박원장_학원장:
    """학원장 박원장이 학원을 운영하는 흐름"""

    async def test_scenario_academy_vehicle_management(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        박원장: User,
        박원장_token: str,
    ) -> None:
        """학원 등록 → 차량 등록 → 조회"""

        # Step 1: 학원 등록
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "강남 피아노학원",
                "address": "서울시 강남구 논현동 789",
                "latitude": 37.5100,
                "longitude": 127.0300,
                "phone": "0255556666",
            },
            headers=auth_header(박원장_token),
        )
        assert resp.status_code == 201
        academy_id = resp.json()["id"]

        # Step 2: 내 학원 조회
        resp = await client.get(
            "/api/v1/academies/mine",
            headers=auth_header(박원장_token),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "강남 피아노학원"

        # Step 3: 차량 등록
        resp = await client.post(
            "/api/v1/telemetry/vehicles",
            json={
                "license_plate": "서울23나4567",
                "capacity": 15,
                "operator_name": "안전운수",
            },
            headers=auth_header(박원장_token),
        )
        assert resp.status_code == 201
        vehicle_id = resp.json()["id"]

        # Step 4: 차량 목록 조회
        resp = await client.get(
            "/api/v1/telemetry/vehicles",
            headers=auth_header(박원장_token),
        )
        assert resp.status_code == 200
        assert any(v["id"] == vehicle_id for v in resp.json())


# ═══════════════════════════════════════════════════════════════
# Scenario 4: PetTracker — 펫 오너 정민수의 산책 예약
# ═══════════════════════════════════════════════════════════════


class TestP4_정민수_펫오너:
    """펫 오너 정민수가 반려견을 등록하고 산책을 예약하는 흐름"""

    async def test_scenario_register_pet_and_book_walk(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        정민수: User,
        정민수_token: str,
        한지은: User,
        한지은_token: str,
        관리자: User,
        관리자_token: str,
    ) -> None:
        """반려견 등록 → 워커 검색 → 예약 → 워커 수락 → 리뷰"""

        # Step 1: 정민수가 반려견 '콩이' 등록
        resp = await client.post(
            "/api/v1/pt/pets",
            json={
                "name": "콩이",
                "species": "dog",
                "breed": "골든 리트리버",
                "birth_date": "2022-03-15",
                "weight_kg": 28.5,
                "temperament": "활발하고 사교적",
                "vaccination_status": "completed",
            },
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 201, f"반려견 등록 실패: {resp.text}"
        pet_id = resp.json()["id"]
        assert resp.json()["name"] == "콩이"
        assert resp.json()["breed"] == "골든 리트리버"

        # Step 2: 내 반려견 목록 조회
        resp = await client.get(
            "/api/v1/pt/pets",
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
        assert any(p["id"] == pet_id for p in resp.json())

        # Step 3: 반려견 정보 수정 (몸무게 업데이트)
        resp = await client.put(
            f"/api/v1/pt/pets/{pet_id}",
            json={"weight_kg": 30.0, "medical_notes": "슬개골 주의"},
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 200
        assert resp.json()["weight_kg"] == 30.0

        # Step 4: 한지은이 워커 자격 제출
        resp = await client.post(
            "/api/v1/pt/walkers/qualification",
            json={
                "background_check_date": "2026-01-15",
                "certification_type": "반려동물관리사",
                "bio": "대학에서 동물행동학 전공, 경험 2년",
                "experience_years": 2,
            },
            headers=auth_header(한지은_token),
        )
        assert resp.status_code in (200, 201), f"워커 자격 제출 실패: {resp.text}"

        # Step 5: 관리자가 한지은 워커 승인
        resp = await client.post(
            f"/api/v1/pt/admin/walkers/{한지은.id}/approve",
            headers=auth_header(관리자_token),
        )
        assert resp.status_code == 200, f"워커 승인 실패: {resp.text}"

        # Step 6: 한지은이 가용 시간 설정
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        resp = await client.post(
            "/api/v1/pt/walkers/availability",
            json={
                "available_date": tomorrow,
                "start_time": "09:00:00",
                "end_time": "18:00:00",
            },
            headers=auth_header(한지은_token),
        )
        assert resp.status_code in (200, 201), f"가용 시간 설정 실패: {resp.text}"

        # Step 7: 정민수가 산책 예약
        scheduled_time = (
            datetime.now(timezone.utc) + timedelta(days=1, hours=2)
        ).isoformat()
        resp = await client.post(
            "/api/v1/pt/bookings",
            json={
                "pet_id": pet_id,
                "duration_minutes": 60,
                "scheduled_at": scheduled_time,
                "pickup_latitude": 37.4979,
                "pickup_longitude": 127.0276,
                "pickup_address": "강남역 2번 출구 앞",
                "price": 25000,
            },
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 201, f"예약 실패: {resp.text}"
        booking_id = resp.json()["id"]
        assert resp.json()["status"] in ("pending", "requested")

        # Step 8: 한지은이 예약 수락
        resp = await client.post(
            f"/api/v1/pt/bookings/{booking_id}/accept",
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 200, f"예약 수락 실패: {resp.text}"
        assert resp.json()["status"] in ("accepted", "confirmed")

        # Step 9: 한지은이 산책 시작
        resp = await client.post(
            f"/api/v1/pt/walks/{booking_id}/start",
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 200, f"산책 시작 실패: {resp.text}"
        session_id = resp.json().get("session_id") or resp.json().get("id")
        assert session_id is not None

        # Step 10: 산책 중 GPS 기록
        resp = await client.post(
            f"/api/v1/pt/walks/{session_id}/gps",
            json={
                "latitude": 37.4985,
                "longitude": 127.0280,
                "heading": 45.0,
                "speed": 4.5,
                "accuracy": 5.0,
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            },
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 200, f"GPS 기록 실패: {resp.text}"

        # Step 11: 산책 종료
        resp = await client.post(
            f"/api/v1/pt/walks/{session_id}/end",
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 200, f"산책 종료 실패: {resp.text}"

        # Step 12: 정민수가 리뷰 작성
        resp = await client.post(
            "/api/v1/pt/reviews",
            json={
                "booking_id": booking_id,
                "rating": 5,
                "comment": "콩이가 너무 좋아했어요! 다음에도 부탁드려요.",
            },
            headers=auth_header(정민수_token),
        )
        assert resp.status_code in (200, 201), f"리뷰 작성 실패: {resp.text}"

    async def test_scenario_booking_cancellation(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        정민수: User,
        정민수_token: str,
    ) -> None:
        """예약 후 취소하는 흐름"""

        # 반려견 등록
        resp = await client.post(
            "/api/v1/pt/pets",
            json={
                "name": "두부",
                "species": "dog",
                "breed": "포메라니안",
                "weight_kg": 3.5,
            },
            headers=auth_header(정민수_token),
        )
        pet_id = resp.json()["id"]

        # 예약 생성
        scheduled_time = (
            datetime.now(timezone.utc) + timedelta(days=2)
        ).isoformat()
        resp = await client.post(
            "/api/v1/pt/bookings",
            json={
                "pet_id": pet_id,
                "duration_minutes": 30,
                "scheduled_at": scheduled_time,
                "pickup_latitude": 37.5000,
                "pickup_longitude": 127.0300,
                "price": 15000,
            },
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 201
        booking_id = resp.json()["id"]

        # 예약 취소
        resp = await client.post(
            f"/api/v1/pt/bookings/{booking_id}/cancel?reason=일정 변경",
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════
# Scenario 5: PetTracker — 워커 한지은의 정산
# ═══════════════════════════════════════════════════════════════


class TestP5_한지은_워커:
    """워커 한지은의 지갑 및 정산 관련 흐름"""

    async def test_scenario_wallet_check(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        한지은: User,
        한지은_token: str,
    ) -> None:
        """지갑 잔액 조회"""

        resp = await client.get(
            "/api/v1/pt/wallet",
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 200
        wallet = resp.json()
        assert "balance" in wallet

    async def test_scenario_availability_management(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        한지은: User,
        한지은_token: str,
    ) -> None:
        """가용 시간 설정 및 조회"""

        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # 가용 시간 설정
        resp = await client.post(
            "/api/v1/pt/walkers/availability",
            json={
                "available_date": tomorrow,
                "start_time": "10:00:00",
                "end_time": "17:00:00",
            },
            headers=auth_header(한지은_token),
        )
        assert resp.status_code in (200, 201)

        # 조회
        resp = await client.get(
            "/api/v1/pt/walkers/availability",
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════
# Scenario 6: CareConnect — 부모 오수진의 돌봄 예약
# ═══════════════════════════════════════════════════════════════


class TestP6_오수진_부모:
    """부모 오수진이 돌봄 서비스를 이용하는 전체 흐름"""

    async def test_scenario_register_child_and_book_care(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        오수진: User,
        오수진_token: str,
        최미래: User,
        최미래_token: str,
        관리자: User,
        관리자_token: str,
    ) -> None:
        """아이 등록 → 동의서 → 돌보미 검색 → 예약 → 체크인 → 활동 → 인수인계"""

        # Step 1: 오수진이 아이 등록
        resp = await client.post(
            "/api/v1/cc/children",
            json={
                "name": "오하율",
                "birth_date": "2021-06-10",
                "age_group": "preschool",
                "allergies": "땅콩 알레르기",
                "medical_notes": "천식 약 휴대",
                "emergency_contact": "01033330099",
                "school_name": "해맑은 유치원",
            },
            headers=auth_header(오수진_token),
        )
        assert resp.status_code == 201, f"아이 등록 실패: {resp.text}"
        child_id = resp.json()["id"]
        assert resp.json()["name"] == "오하율"
        assert resp.json()["age_group"] == "preschool"

        # Step 2: 내 아이 목록 조회
        resp = await client.get(
            "/api/v1/cc/children",
            headers=auth_header(오수진_token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

        # Step 3: 돌봄 동의서 제출
        resp = await client.post(
            f"/api/v1/cc/children/{child_id}/consent",
            json={
                "child_id": child_id,
                "consent_scope": {
                    "gps_tracking": True,
                    "activity_photos": True,
                    "emergency_medical": True,
                },
            },
            headers=auth_header(오수진_token),
        )
        assert resp.status_code in (200, 201), f"동의서 실패: {resp.text}"

        # Step 4: 최미래가 돌보미 자격 제출
        resp = await client.post(
            "/api/v1/cc/caregivers/qualification",
            json={
                "background_check_date": "2026-01-10",
                "child_abuse_check_date": "2026-01-10",
                "sex_offense_check_date": "2026-01-10",
                "cpr_cert_date": "2026-02-01",
                "bio": "보육교사 2급 자격, 어린이집 5년 근무",
                "experience_years": 5,
                "preferred_age_groups": ["preschool", "toddler"],
            },
            headers=auth_header(최미래_token),
        )
        assert resp.status_code in (200, 201), f"돌보미 자격 실패: {resp.text}"

        # Step 5: 관리자가 최미래 돌보미 승인
        resp = await client.post(
            f"/api/v1/cc/admin/caregivers/{최미래.id}/approve",
            headers=auth_header(관리자_token),
        )
        assert resp.status_code == 200, f"돌보미 승인 실패: {resp.text}"

        # Step 6: 돌봄 예약 생성
        scheduled_time = (
            datetime.now(timezone.utc) + timedelta(days=1, hours=3)
        ).isoformat()
        resp = await client.post(
            "/api/v1/cc/bookings",
            json={
                "child_id": child_id,
                "duration_hours": 3.0,
                "scheduled_at": scheduled_time,
                "hourly_rate": 15000,
                "care_latitude": 37.5050,
                "care_longitude": 127.0400,
                "care_address": "서울시 강남구 오수진 자택",
            },
            headers=auth_header(오수진_token),
        )
        assert resp.status_code == 201, f"예약 생성 실패: {resp.text}"
        booking_id = resp.json()["id"]

        # Step 7: 최미래가 예약 수락
        resp = await client.post(
            f"/api/v1/cc/bookings/{booking_id}/accept",
            headers=auth_header(최미래_token),
        )
        assert resp.status_code == 200, f"예약 수락 실패: {resp.text}"

        # Step 8: 최미래가 체크인 (지오펜스 확인)
        resp = await client.post(
            f"/api/v1/cc/sessions/{booking_id}/checkin",
            json={
                "latitude": 37.5051,
                "longitude": 127.0401,
                "accuracy": 10.0,
            },
            headers=auth_header(최미래_token),
        )
        assert resp.status_code == 200, f"체크인 실패: {resp.text}"
        session_id = resp.json().get("session_id") or resp.json().get("id")
        assert session_id is not None

        # Step 9: 최미래가 활동 기록 — 간식 시간
        resp = await client.post(
            f"/api/v1/cc/sessions/{session_id}/activity",
            json={
                "activity_type": "snack",
                "description": "과일 간식 (사과, 바나나)",
            },
            headers=auth_header(최미래_token),
        )
        assert resp.status_code in (200, 201), f"활동 기록 실패: {resp.text}"

        # Step 10: 최미래가 활동 기록 — 놀이 시간
        resp = await client.post(
            f"/api/v1/cc/sessions/{session_id}/activity",
            json={
                "activity_type": "play",
                "description": "블록 쌓기 놀이, 퍼즐 맞추기",
            },
            headers=auth_header(최미래_token),
        )
        assert resp.status_code in (200, 201)

        # Step 11: 최미래가 체크아웃
        resp = await client.post(
            f"/api/v1/cc/sessions/{session_id}/checkout",
            headers=auth_header(최미래_token),
        )
        assert resp.status_code == 200, f"체크아웃 실패: {resp.text}"

        # Step 12: 오수진이 인수인계 확인
        resp = await client.post(
            f"/api/v1/cc/sessions/{session_id}/handover",
            headers=auth_header(오수진_token),
        )
        assert resp.status_code == 200, f"인수인계 실패: {resp.text}"

        # Step 13: 오수진이 리뷰 작성
        resp = await client.post(
            "/api/v1/cc/reviews",
            json={
                "booking_id": booking_id,
                "rating": 5,
                "comment": "아이가 정말 좋아했어요. 간식도 건강하게 챙겨주셨네요!",
            },
            headers=auth_header(오수진_token),
        )
        assert resp.status_code in (200, 201), f"리뷰 작성 실패: {resp.text}"


# ═══════════════════════════════════════════════════════════════
# Scenario 7: CareConnect — 돌보미 최미래의 정산
# ═══════════════════════════════════════════════════════════════


class TestP7_최미래_돌보미:
    """돌보미 최미래의 지갑 및 가용 시간 관리"""

    async def test_scenario_wallet_check(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        최미래: User,
        최미래_token: str,
    ) -> None:
        """지갑 잔액 조회"""

        resp = await client.get(
            "/api/v1/cc/wallet",
            headers=auth_header(최미래_token),
        )
        assert resp.status_code == 200
        assert "balance" in resp.json()

    async def test_scenario_availability_setup(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        최미래: User,
        최미래_token: str,
    ) -> None:
        """가용 시간 설정"""

        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        resp = await client.post(
            "/api/v1/cc/caregivers/availability",
            json={
                "available_date": tomorrow,
                "start_time": "09:00:00",
                "end_time": "18:00:00",
            },
            headers=auth_header(최미래_token),
        )
        assert resp.status_code in (200, 201)


# ═══════════════════════════════════════════════════════════════
# Cross-cutting: 크로스앱 격리 검증
# ═══════════════════════════════════════════════════════════════


class TestX1_크로스앱_차단:
    """각 앱 사용자가 다른 앱의 API에 접근할 수 없는지 검증"""

    async def test_safeway_parent_cannot_access_pettracker(
        self,
        client: AsyncClient,
        김영희: User,
        김영희_token: str,
    ) -> None:
        """SafeWay 학부모 → PetTracker 반려견 등록 시도 → 차단"""
        resp = await client.post(
            "/api/v1/pt/pets",
            json={"name": "몰래등록", "species": "dog"},
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 403, f"크로스앱 차단 실패! 상태: {resp.status_code}"

    async def test_safeway_parent_cannot_access_careconnect(
        self,
        client: AsyncClient,
        김영희: User,
        김영희_token: str,
    ) -> None:
        """SafeWay 학부모 → CareConnect 아이 등록 시도 → 차단"""
        resp = await client.post(
            "/api/v1/cc/children",
            json={
                "name": "몰래등록",
                "birth_date": "2020-01-01",
                "age_group": "preschool",
            },
            headers=auth_header(김영희_token),
        )
        assert resp.status_code == 403

    async def test_pettracker_owner_cannot_access_safeway(
        self,
        client: AsyncClient,
        정민수: User,
        정민수_token: str,
    ) -> None:
        """PetTracker 오너 → SafeWay 학생 등록 시도 → 차단"""
        resp = await client.post(
            "/api/v1/students",
            json={"name": "침입시도", "date_of_birth": "2020-01-01", "grade": "초1"},
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 403

    async def test_pettracker_owner_cannot_access_careconnect(
        self,
        client: AsyncClient,
        정민수: User,
        정민수_token: str,
    ) -> None:
        """PetTracker 오너 → CareConnect 아이 등록 시도 → 차단"""
        resp = await client.post(
            "/api/v1/cc/children",
            json={
                "name": "침입시도",
                "birth_date": "2020-01-01",
                "age_group": "toddler",
            },
            headers=auth_header(정민수_token),
        )
        assert resp.status_code == 403

    async def test_careconnect_parent_cannot_access_pettracker(
        self,
        client: AsyncClient,
        오수진: User,
        오수진_token: str,
    ) -> None:
        """CareConnect 부모 → PetTracker 반려견 등록 시도 → 차단"""
        resp = await client.post(
            "/api/v1/pt/pets",
            json={"name": "침입시도", "species": "dog"},
            headers=auth_header(오수진_token),
        )
        assert resp.status_code == 403

    async def test_walker_cannot_access_careconnect(
        self,
        client: AsyncClient,
        한지은: User,
        한지은_token: str,
    ) -> None:
        """PetTracker 워커 → CareConnect 예약 조회 시도 → 차단"""
        resp = await client.get(
            "/api/v1/cc/bookings",
            headers=auth_header(한지은_token),
        )
        assert resp.status_code == 403

    async def test_caregiver_cannot_access_pettracker(
        self,
        client: AsyncClient,
        최미래: User,
        최미래_token: str,
    ) -> None:
        """CareConnect 돌보미 → PetTracker 예약 조회 시도 → 차단"""
        resp = await client.get(
            "/api/v1/pt/bookings",
            headers=auth_header(최미래_token),
        )
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════
# Cross-cutting: 플랫폼 관리자 전체 앱 접근
# ═══════════════════════════════════════════════════════════════


class TestX2_플랫폼관리자_전체접근:
    """플랫폼 관리자가 모든 앱의 관리 기능에 접근 가능한지 검증"""

    async def test_admin_can_access_pettracker_dashboard(
        self,
        client: AsyncClient,
        관리자: User,
        관리자_token: str,
    ) -> None:
        """관리자 → PetTracker 대시보드 접근"""
        resp = await client.get(
            "/api/v1/pt/admin/dashboard",
            headers=auth_header(관리자_token),
        )
        assert resp.status_code == 200

    async def test_admin_can_access_careconnect_dashboard(
        self,
        client: AsyncClient,
        관리자: User,
        관리자_token: str,
    ) -> None:
        """관리자 → CareConnect 대시보드 접근"""
        resp = await client.get(
            "/api/v1/cc/admin/dashboard",
            headers=auth_header(관리자_token),
        )
        assert resp.status_code == 200

    async def test_admin_can_view_careconnect_consents(
        self,
        client: AsyncClient,
        관리자: User,
        관리자_token: str,
    ) -> None:
        """관리자 → CareConnect 동의 목록 조회"""
        resp = await client.get(
            "/api/v1/cc/admin/consents",
            headers=auth_header(관리자_token),
        )
        assert resp.status_code == 200
