import uuid
from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.student_management.models import Student
from tests.conftest import auth_header


@pytest.fixture
async def student(db_session: AsyncSession, parent_user: User) -> Student:
    student = Student(
        id=uuid.uuid4(),
        guardian_id=parent_user.id,
        name="테스트 학생",
        date_of_birth=date(2018, 5, 1),
    )
    db_session.add(student)
    await db_session.commit()
    return student


class TestGuardianConsent:
    @pytest.mark.asyncio
    async def test_create_consent(
        self, client: AsyncClient, parent_token: str, student: Student
    ) -> None:
        response = await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": str(student.id),
                "consent_scope": {
                    "service_terms": True,
                    "privacy_policy": True,
                    "child_info_collection": True,
                    "location_tracking": True,
                    "push_notification": True,
                },
                "consent_method": "phone_otp",
            },
            headers=auth_header(parent_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["child_id"] == str(student.id)
        assert data["consent_scope"]["location_tracking"] is True
        assert data["withdrawn_at"] is None

    @pytest.mark.asyncio
    async def test_list_consents(
        self, client: AsyncClient, parent_token: str, student: Student
    ) -> None:
        # Create consent first
        await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": str(student.id),
                "consent_scope": {"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True},
                "consent_method": "phone_otp",
            },
            headers=auth_header(parent_token),
        )

        # List
        response = await client.get(
            "/api/v1/compliance/consents",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    @pytest.mark.asyncio
    async def test_withdraw_consent(
        self, client: AsyncClient, parent_token: str, student: Student
    ) -> None:
        # Create
        create_resp = await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": str(student.id),
                "consent_scope": {"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True},
                "consent_method": "phone_otp",
            },
            headers=auth_header(parent_token),
        )
        consent_id = create_resp.json()["id"]

        # Withdraw
        withdraw_resp = await client.post(
            f"/api/v1/compliance/consents/{consent_id}/withdraw",
            json={"reason": "서비스 해지"},
            headers=auth_header(parent_token),
        )
        assert withdraw_resp.status_code == 200
        assert withdraw_resp.json()["withdrawn_at"] is not None

    @pytest.mark.asyncio
    async def test_duplicate_consent_rejected(
        self, client: AsyncClient, parent_token: str, student: Student
    ) -> None:
        consent_data = {
            "child_id": str(student.id),
            "consent_scope": {"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True},
            "consent_method": "phone_otp",
        }

        # First consent succeeds
        resp1 = await client.post(
            "/api/v1/compliance/consents",
            json=consent_data,
            headers=auth_header(parent_token),
        )
        assert resp1.status_code == 201

        # Duplicate is rejected
        resp2 = await client.post(
            "/api/v1/compliance/consents",
            json=consent_data,
            headers=auth_header(parent_token),
        )
        assert resp2.status_code == 409

    @pytest.mark.asyncio
    async def test_driver_cannot_create_consent(
        self, client: AsyncClient, driver_token: str, student: Student
    ) -> None:
        response = await client.post(
            "/api/v1/compliance/consents",
            json={
                "child_id": str(student.id),
                "consent_scope": {"service_terms": True, "privacy_policy": True, "child_info_collection": True, "location_tracking": True},
                "consent_method": "phone_otp",
            },
            headers=auth_header(driver_token),
        )
        assert response.status_code == 403
