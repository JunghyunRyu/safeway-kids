"""
M1-T6: End-to-end integration test.

Full flow: parent registers student → gives consent → creates schedule template
→ admin materializes daily schedule → driver marks boarded/alighted
→ driver sends GPS update → parent queries vehicle location.
"""

import uuid
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User, UserRole
from app.modules.auth.service import create_access_token
from tests.conftest import auth_header


@pytest.fixture
async def platform_admin(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PLATFORM_ADMIN,
        phone="01000000000",
        name="플랫폼 관리자",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
def platform_admin_token(platform_admin: User) -> str:
    return create_access_token(platform_admin.id, platform_admin.role)


@pytest.fixture
async def safety_escort(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.SAFETY_ESCORT,
        phone="01055554444",
        name="안전 도우미",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


class TestEndToEndFlow:
    """Full parent-to-driver data loop."""

    async def test_full_ride_lifecycle(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        parent_user: User,
        parent_token: str,
        driver_user: User,
        driver_token: str,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        # === Step 1: Academy admin creates an academy ===
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "강남 수학학원",
                "address": "서울시 강남구 대치동 123",
                "latitude": 37.4943,
                "longitude": 127.0573,
                "phone": "0212345678",
            },
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 201
        academy_id = resp.json()["id"]

        # === Step 2: Parent registers a student ===
        resp = await client.post(
            "/api/v1/students",
            json={
                "name": "김민준",
                "date_of_birth": "2018-05-01",
                "grade": "초등1",
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 201
        student_data = resp.json()
        student_id = student_data["id"]
        assert student_data["name"] == "김민준"

        # === Step 3: Parent lists students ===
        resp = await client.get(
            "/api/v1/students",
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        students = resp.json()
        assert len(students) >= 1
        assert any(s["id"] == student_id for s in students)

        # === Step 4: Parent gives PIPA consent ===
        resp = await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": student_id,
                "consent_scope": {"location_tracking": True, "schedule_management": True},
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 201
        consent_data = resp.json()
        assert consent_data["withdrawn_at"] is None

        # === Step 5: Parent creates a schedule template (Monday, 3pm pickup) ===
        # Need a Monday date for materialization
        # 2026-03-16 is a Monday
        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 0,  # Monday
                "pickup_time": "15:00:00",
                "pickup_latitude": 37.4979,
                "pickup_longitude": 127.0276,
                "pickup_address": "강남역 2번 출구",
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 201
        template_data = resp.json()
        template_id = template_data["id"]
        assert template_data["day_of_week"] == 0
        assert template_data["is_active"] is True

        # === Step 6: Parent lists schedule templates ===
        resp = await client.get(
            f"/api/v1/schedules/templates?student_id={student_id}",
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        templates = resp.json()
        assert len(templates) == 1
        assert templates[0]["id"] == template_id

        # === Step 7: Admin materializes daily schedules for Monday ===
        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 200
        daily_instances = resp.json()
        assert len(daily_instances) == 1
        instance_id = daily_instances[0]["id"]
        assert daily_instances[0]["status"] == "scheduled"
        assert daily_instances[0]["student_id"] == student_id

        # === Step 8: Parent views daily schedule ===
        resp = await client.get(
            f"/api/v1/schedules/daily?target_date=2026-03-16&student_id={student_id}",
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["status"] == "scheduled"

        # === Step 9: Driver marks student as boarded ===
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/board",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        assert resp.json()["boarded_at"] is not None

        # === Step 10: Driver marks student as alighted ===
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/alight",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["alighted_at"] is not None

        # === Step 11: Verify final state ===
        resp = await client.get(
            f"/api/v1/schedules/daily?target_date=2026-03-16&student_id={student_id}",
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        final = resp.json()[0]
        assert final["status"] == "completed"
        assert final["boarded_at"] is not None
        assert final["alighted_at"] is not None

    async def test_schedule_cancel_flow(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        parent_user: User,
        parent_token: str,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        """Parent creates schedule then cancels it (one-touch)."""
        # Setup: academy + student + consent + template
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "청담 영어학원",
                "address": "서울시 강남구 청담동 45",
                "latitude": 37.5200,
                "longitude": 127.0510,
                "phone": "0298765432",
            },
            headers=auth_header(academy_admin_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "이서윤", "date_of_birth": "2019-01-15", "grade": "유치원"},
            headers=auth_header(parent_token),
        )
        student_id = resp.json()["id"]

        await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": student_id,
                "consent_scope": {"location_tracking": True},
            },
            headers=auth_header(parent_token),
        )

        # Create template for Tuesday
        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 1,  # Tuesday
                "pickup_time": "14:30:00",
                "pickup_latitude": 37.5170,
                "pickup_longitude": 127.0515,
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 201

        # Materialize for Tuesday 2026-03-17
        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-17",
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 200
        instance_id = resp.json()[0]["id"]

        # Parent cancels
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/cancel",
            json={"reason": "아이가 아파서"},
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

        # Cannot cancel again
        resp = await client.post(
            f"/api/v1/schedules/daily/{instance_id}/cancel",
            json={"reason": "중복 취소"},
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 409


class TestGpsFlow:
    """GPS update and retrieval via mocked Redis."""

    async def test_gps_update_and_retrieve(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        driver_user: User,
        driver_token: str,
        parent_user: User,
        parent_token: str,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        """Driver sends GPS → parent retrieves vehicle location."""
        import fakeredis.aioredis

        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)

        # Admin creates a vehicle
        resp = await client.post(
            "/api/v1/telemetry/vehicles",
            json={
                "license_plate": "서울12가3456",
                "capacity": 15,
                "operator_name": "안전운수",
            },
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 201
        vehicle_id = resp.json()["id"]

        # Driver sends GPS update (patch redis_client to use fake)
        with patch("app.modules.vehicle_telemetry.router.redis_client", fake_redis):
            resp = await client.post(
                "/api/v1/telemetry/gps",
                json={
                    "vehicle_id": vehicle_id,
                    "latitude": 37.4979,
                    "longitude": 127.0276,
                    "heading": 90.0,
                    "speed": 35.5,
                },
                headers=auth_header(driver_token),
            )
            assert resp.status_code == 200
            assert resp.json()["message"] == "위치가 업데이트되었습니다"

            # Parent retrieves vehicle location
            resp = await client.get(
                f"/api/v1/telemetry/vehicles/{vehicle_id}/location",
                headers=auth_header(parent_token),
            )
            assert resp.status_code == 200
            location = resp.json()
            assert location["vehicle_id"] == vehicle_id
            assert location["latitude"] == 37.4979
            assert location["longitude"] == 127.0276
            assert location["speed"] == 35.5

        await fake_redis.aclose()


class TestConsentBlocksSchedule:
    """Verify that schedule creation fails without consent."""

    async def test_no_consent_blocks_schedule(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        parent_user: User,
        parent_token: str,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        # Create academy and student but NO consent
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "역삼 코딩학원",
                "address": "서울시 강남구 역삼동 67",
                "latitude": 37.4987,
                "longitude": 127.0365,
                "phone": "0211112222",
            },
            headers=auth_header(academy_admin_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "박지호", "date_of_birth": "2017-08-20", "grade": "초등2"},
            headers=auth_header(parent_token),
        )
        student_id = resp.json()["id"]

        # Attempt schedule without consent → should fail
        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 2,
                "pickup_time": "15:00:00",
                "pickup_latitude": 37.4979,
                "pickup_longitude": 127.0276,
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 403  # ConsentRequiredError
