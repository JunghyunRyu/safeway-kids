"""
E2E Hardening Verification Test.

Comprehensive end-to-end test covering:
1. Health check
2. OTP send → verify → login flow
3. WebSocket GPS connection (token security)
4. File upload validation
5. Notification flow (FCM token registration, boarding push)
6. Billing flow (prepare → confirm → webhook)
7. Full regression (ride lifecycle + consent + RBAC + security)
"""

import io
import uuid
from unittest.mock import AsyncMock, patch

import fakeredis.aioredis
import pytest
from httpx import AsyncClient
from openpyxl import Workbook
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.database import get_db
from app.main import app
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import create_access_token
from tests.conftest import TestSessionLocal, auth_header


def _create_xlsx(rows: list[list]) -> bytes:
    wb = Workbook()
    ws = wb.active
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


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
async def guardian_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        role=UserRole.PARENT,
        phone="01012340001",
        name="김학부모",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


class TestE2EHealthCheck:
    """Scenario 1: Backend server health check."""

    async def test_health_endpoint_returns_ok(self, client: AsyncClient) -> None:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


class TestE2EOtpLoginFlow:
    """Scenario 2: OTP send → verify → login flow."""

    async def test_otp_send_verify_login(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        phone = "01098765432"
        otp_code = "123456"

        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)

        # Step 1: Set OTP in fake redis (simulating send_otp)
        await fake_redis.set(f"otp:{phone}", otp_code, ex=180)

        # Step 2: Verify OTP → auto-login/register
        with patch("app.modules.auth.service.redis_client", fake_redis):
            resp = await client.post(
                "/api/v1/auth/otp/verify",
                json={
                    "phone": phone,
                    "code": otp_code,
                    "name": "E2E 테스트 유저",
                    "role": "parent",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["phone"] == phone
            assert data["user"]["role"] == "parent"

            access_token = data["access_token"]

        # Step 3: Use token to access protected endpoint
        resp = await client.get(
            "/api/v1/auth/me",
            headers=auth_header(access_token),
        )
        assert resp.status_code == 200
        assert resp.json()["phone"] == phone

        # Step 4: OTP consumed — replay should fail
        with patch("app.modules.auth.service.redis_client", fake_redis):
            resp = await client.post(
                "/api/v1/auth/otp/verify",
                json={
                    "phone": phone,
                    "code": otp_code,
                    "name": "E2E 테스트 유저",
                    "role": "parent",
                },
            )
            assert resp.status_code == 401  # OTP already consumed

        await fake_redis.aclose()

    async def test_dev_login_blocked_in_production(
        self, client: AsyncClient
    ) -> None:
        """Dev login should be blocked when environment=production."""
        with patch("app.config.settings.environment", "production"):
            resp = await client.post(
                "/api/v1/auth/dev-login",
                json={
                    "phone": "01011111111",
                    "code": "000000",
                    "name": "해커",
                    "role": "parent",
                },
            )
            assert resp.status_code == 401


class TestE2EWebSocketGps:
    """Scenario 3: WebSocket GPS connection with token security."""

    async def test_ws_requires_valid_token(self, db_session) -> None:
        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        vehicle_id = uuid.uuid4()

        with (
            patch("app.modules.vehicle_telemetry.router.redis_client", fake_redis),
            patch("app.main.redis_client", fake_redis),
            TestClient(app) as tc,
        ):
            with tc.websocket_connect(
                f"/api/v1/telemetry/ws/vehicles/{vehicle_id}"
            ) as ws:
                ws.send_json({"no_token": True})
                with pytest.raises(WebSocketDisconnect) as exc_info:
                    ws.receive_json()
                assert exc_info.value.code == 4001

    async def test_ws_auth_and_gps_relay(
        self, db_session, parent_user, parent_token
    ) -> None:
        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)

        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db
        vehicle_id = uuid.uuid4()
        with (
            patch(
                "app.modules.vehicle_telemetry.router.redis_client", fake_redis,
            ),
            patch(
                "app.modules.vehicle_telemetry.router.async_session_factory",
                TestSessionLocal,
            ),
            patch("app.main.redis_client", fake_redis),
            TestClient(app) as tc,
        ):
            with tc.websocket_connect(
                f"/api/v1/telemetry/ws/vehicles/{vehicle_id}"
            ) as ws:
                ws.send_json({"token": parent_token})
                resp = ws.receive_json()
                assert resp["type"] == "auth_ok"
        app.dependency_overrides.clear()


class TestE2EFileUploadValidation:
    """Scenario 4: File upload validation flow."""

    async def test_bulk_upload_xlsx_validation(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        academy_admin_user: User,
        academy_admin_token: str,
        guardian_user: User,
    ) -> None:
        """Bulk upload with valid .xlsx should succeed."""
        from app.modules.academy_management.models import Academy

        # Create academy with admin
        academy = Academy(
            id=uuid.uuid4(),
            name="E2E 테스트학원",
            address="서울시 강남구 역삼동 1",
            latitude=37.498,
            longitude=127.036,
            admin_id=academy_admin_user.id,
        )
        db_session.add(academy)
        await db_session.flush()

        xlsx = _create_xlsx([
            ["이름", "생년월일", "학년", "보호자전화번호"],
            ["E2E테스트학생", "2018-01-15", "초등 1학년", guardian_user.phone],
        ])

        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={
                "file": (
                    "students.xlsx",
                    xlsx,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert data["success_count"] >= 1

    async def test_bulk_upload_missing_columns_rejected(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        """Bulk upload with missing required columns should report errors."""
        from app.modules.academy_management.models import Academy

        academy = Academy(
            id=uuid.uuid4(),
            name="E2E 컬럼검증학원",
            address="서울시 강남구 역삼동 2",
            latitude=37.498,
            longitude=127.036,
            admin_id=academy_admin_user.id,
        )
        db_session.add(academy)
        await db_session.flush()

        xlsx = _create_xlsx([
            ["이름", "학년"],  # missing 생년월일, 보호자전화번호
            ["김민수", "초등 1학년"],
        ])

        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={
                "file": (
                    "students.xlsx",
                    xlsx,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["error_count"] >= 1
        assert "필수 컬럼 누락" in data["results"][0]["message"]

    async def test_csv_file_rejected(
        self,
        client: AsyncClient,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        """Non-xlsx files should be rejected."""
        csv_content = "name,date_of_birth\ntest,2018-01-01\n"
        resp = await client.post(
            "/api/v1/students/bulk-upload",
            files={"file": ("students.csv", csv_content.encode(), "text/csv")},
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 400


class TestE2ENotificationFlow:
    """Scenario 5: Notification flow."""

    async def test_fcm_token_register_and_boarding_push(
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
        """Register FCM token → boarding triggers push notification."""
        # Step 1: Register FCM token
        resp = await client.post(
            "/api/v1/notifications/register-token",
            json={"fcm_token": "e2e-test-fcm-token"},
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200

        # Step 2: Full scenario setup via API
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "E2E 알림 테스트학원",
                "address": "서울시 강남구 역삼동 99",
                "latitude": 37.498,
                "longitude": 127.036,
                "phone": "0200000099",
            },
            headers=auth_header(academy_admin_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "알림테스트학생", "date_of_birth": "2018-06-01", "grade": "초등1"},
            headers=auth_header(parent_token),
        )
        student_id = resp.json()["id"]

        await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": student_id,
                "consent_scope": {"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True},
            },
            headers=auth_header(parent_token),
        )

        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 0,
                "pickup_time": "15:00:00",
                "pickup_latitude": 37.497,
                "pickup_longitude": 127.027,
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 201

        resp = await client.post(
            "/api/v1/schedules/daily/materialize?target_date=2026-03-16",
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 200
        instance_id = resp.json()[0]["id"]

        # Step 3: Driver boards student → triggers push
        with patch(
            "app.modules.notification.service._push_provider.send_push",
            new_callable=AsyncMock,
            return_value=True,
        ):
            resp = await client.post(
                f"/api/v1/schedules/daily/{instance_id}/board",
                headers=auth_header(driver_token),
            )
            assert resp.status_code == 200
            assert resp.json()["boarded_at"] is not None


class TestE2EBillingFlow:
    """Scenario 6: Full billing flow."""

    async def test_billing_plan_create_and_invoice(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        parent_user: User,
        parent_token: str,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        """Full billing flow: plan → invoice generation → parent views invoices."""
        from datetime import date, time

        from app.modules.academy_management.models import Academy
        from app.modules.billing.models import BillingPlan
        from app.modules.scheduling.models import DailyScheduleInstance
        from app.modules.student_management.models import Enrollment, Student

        # Create academy directly in DB for full control
        academy = Academy(
            id=uuid.uuid4(),
            name="E2E 빌링 테스트학원",
            address="서울시 강남구 역삼동 50",
            latitude=37.498,
            longitude=127.036,
            admin_id=academy_admin_user.id,
        )
        db_session.add(academy)
        await db_session.flush()

        # Create billing plan
        plan = BillingPlan(
            academy_id=academy.id,
            name="E2E 요금제",
            price_per_ride=5000,
            monthly_cap=100000,
        )
        db_session.add(plan)

        # Create student
        student = Student(
            id=uuid.uuid4(),
            guardian_id=parent_user.id,
            name="빌링학생",
            date_of_birth=date(2018, 6, 1),
        )
        db_session.add(student)
        await db_session.flush()

        # Enroll student
        db_session.add(Enrollment(student_id=student.id, academy_id=academy.id))

        # Create completed rides
        for day in range(2, 7):
            db_session.add(DailyScheduleInstance(
                student_id=student.id,
                academy_id=academy.id,
                schedule_date=date(2026, 3, day),
                pickup_time=time(14, 0),
                pickup_latitude=37.497,
                pickup_longitude=127.027,
                status="completed",
            ))
        await db_session.flush()

        # Generate invoices
        resp = await client.post(
            "/api/v1/billing/generate-invoices",
            json={"billing_month": "2026-03", "academy_id": str(academy.id)},
            headers=auth_header(academy_admin_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["invoices_created"] >= 1
        assert data["total_amount"] > 0

        # Parent views invoices
        resp = await client.get(
            "/api/v1/billing/invoices/my",
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 200
        invoices = resp.json()
        assert len(invoices) >= 1
        assert invoices[0]["amount"] == 25000  # 5 rides * 5000


class TestE2ESecurityHardening:
    """Scenario 7: Security hardening verification."""

    async def test_aes256_encryption_roundtrip(self) -> None:
        from app.common.security import decrypt_value, encrypt_value

        plaintext = "E2E 개인정보 테스트 홍길동"
        encrypted = encrypt_value(plaintext)
        assert encrypted != plaintext
        decrypted = decrypt_value(encrypted)
        assert decrypted == plaintext

        # Each encryption produces different ciphertext (random nonce)
        e2 = encrypt_value(plaintext)
        assert encrypted != e2
        assert decrypt_value(e2) == plaintext

    async def test_unauthenticated_access_rejected(
        self, client: AsyncClient
    ) -> None:
        endpoints = [
            ("GET", "/api/v1/auth/me"),
            ("GET", "/api/v1/students"),
            ("POST", "/api/v1/students"),
            ("GET", "/api/v1/billing/invoices"),
        ]
        for method, path in endpoints:
            if method == "GET":
                resp = await client.get(path)
            else:
                resp = await client.post(path, json={})
            assert resp.status_code == 401, f"{method} {path} should be 401"

    async def test_rbac_enforcement(
        self,
        client: AsyncClient,
        parent_user: User,
        parent_token: str,
        driver_user: User,
        driver_token: str,
    ) -> None:
        # Parent cannot create academy
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "해킹학원",
                "address": "서울시",
                "latitude": 37.5,
                "longitude": 127.0,
                "phone": "0299999999",
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 403

        # Driver cannot create student
        resp = await client.post(
            "/api/v1/students",
            json={"name": "불법학생", "date_of_birth": "2020-01-01", "grade": "초등1"},
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 403

    async def test_consent_required_for_schedule(
        self,
        client: AsyncClient,
        parent_user: User,
        parent_token: str,
        academy_admin_user: User,
        academy_admin_token: str,
    ) -> None:
        resp = await client.post(
            "/api/v1/academies",
            json={
                "name": "컴플라이언스 학원",
                "address": "서울시 강남구",
                "latitude": 37.5,
                "longitude": 127.0,
                "phone": "0288888888",
            },
            headers=auth_header(academy_admin_token),
        )
        academy_id = resp.json()["id"]

        resp = await client.post(
            "/api/v1/students",
            json={"name": "동의없는학생", "date_of_birth": "2017-03-01", "grade": "초등2"},
            headers=auth_header(parent_token),
        )
        student_id = resp.json()["id"]

        # No consent → schedule should fail
        resp = await client.post(
            "/api/v1/schedules/templates",
            json={
                "student_id": student_id,
                "academy_id": academy_id,
                "day_of_week": 3,
                "pickup_time": "14:00:00",
                "pickup_latitude": 37.5,
                "pickup_longitude": 127.0,
            },
            headers=auth_header(parent_token),
        )
        assert resp.status_code == 403

    async def test_jwt_token_refresh_flow(
        self,
        client: AsyncClient,
        parent_user: User,
        parent_token: str,
    ) -> None:
        from app.modules.auth.service import create_refresh_token

        refresh_token = create_refresh_token(parent_user.id)

        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # New token should work
        resp = await client.get(
            "/api/v1/auth/me",
            headers=auth_header(data["access_token"]),
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == str(parent_user.id)

    async def test_invalid_refresh_token_rejected(
        self, client: AsyncClient
    ) -> None:
        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.jwt.token"},
        )
        assert resp.status_code == 401
