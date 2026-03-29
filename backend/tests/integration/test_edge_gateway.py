"""Edge Gateway API 통합 테스트."""

import pytest
from httpx import AsyncClient

from app.config import settings
from app.modules.auth.models import User
from tests.conftest import auth_header

# 테스트용 Edge API 키
TEST_EDGE_API_KEY = "test-edge-api-key-for-integration"


def edge_auth_header() -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_EDGE_API_KEY}"}


@pytest.fixture(autouse=True)
def _set_edge_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """모든 테스트에서 edge_api_key를 설정."""
    monkeypatch.setattr(settings, "edge_api_key", TEST_EDGE_API_KEY)


class TestEdgeGatewayPost:
    """POST /api/v1/edge/events 테스트 (API 키 인증)."""

    @pytest.mark.asyncio
    async def test_create_edge_event(self, client: AsyncClient) -> None:
        """Edge AI 이벤트 생성 테스트."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {
                    "student_name": "테스트원생",
                    "confidence": 0.95,
                },
            },
            headers=edge_auth_header(),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] in ("FACE_RECOGNIZED", "face_recognized")
        assert data["details"]["student_name"] == "테스트원생"
        assert data["id"] is not None

    @pytest.mark.asyncio
    async def test_create_abnormal_behavior_event(self, client: AsyncClient) -> None:
        """이상 행동 감지 이벤트 생성."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "abnormal_behavior",
                "details": {
                    "behavior_type": "standing",
                    "confidence": 0.87,
                },
            },
            headers=edge_auth_header(),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] in ("ABNORMAL_BEHAVIOR", "abnormal_behavior")

    @pytest.mark.asyncio
    async def test_create_remaining_passenger_event(self, client: AsyncClient) -> None:
        """잔류 인원 감지 이벤트 생성."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "remaining_passenger",
                "details": {
                    "passenger_count": 2,
                    "confidences": [0.92, 0.88],
                },
            },
            headers=edge_auth_header(),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] in ("REMAINING_PASSENGER", "remaining_passenger")
        assert data["details"]["passenger_count"] == 2

    @pytest.mark.asyncio
    async def test_invalid_event_type(self, client: AsyncClient) -> None:
        """잘못된 이벤트 유형."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "invalid_type",
                "details": {},
            },
            headers=edge_auth_header(),
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_post_without_api_key_returns_401(self, client: AsyncClient) -> None:
        """API 키 없이 POST → 401."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생", "confidence": 0.9},
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_post_with_wrong_api_key_returns_401(self, client: AsyncClient) -> None:
        """잘못된 API 키로 POST → 401."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생", "confidence": 0.9},
            },
            headers={"Authorization": "Bearer wrong-key"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_dev_bypass_when_no_key_configured(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """개발 환경 + 키 미설정 → 인증 없이 허용."""
        monkeypatch.setattr(settings, "edge_api_key", "")
        monkeypatch.setattr(settings, "environment", "development")
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생", "confidence": 0.9},
            },
        )
        assert response.status_code == 201


class TestEdgeGatewayGet:
    """GET /api/v1/edge/events 테스트 (플랫폼 관리자 JWT 인증)."""

    @pytest.mark.asyncio
    async def test_list_edge_events(
        self, client: AsyncClient, platform_admin_token: str
    ) -> None:
        """이벤트 목록 조회."""
        # 이벤트 생성
        await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생A", "confidence": 0.9},
            },
            headers=edge_auth_header(),
        )
        await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "abnormal_behavior",
                "details": {"behavior_type": "falling", "confidence": 0.8},
            },
            headers=edge_auth_header(),
        )

        # 플랫폼 관리자 JWT로 조회
        response = await client.get(
            "/api/v1/edge/events",
            headers=auth_header(platform_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["events"]) >= 2

    @pytest.mark.asyncio
    async def test_list_edge_events_filtered(
        self, client: AsyncClient, platform_admin_token: str
    ) -> None:
        """이벤트 유형별 필터 조회."""
        await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생B", "confidence": 0.85},
            },
            headers=edge_auth_header(),
        )

        response = await client.get(
            "/api/v1/edge/events",
            params={"event_type": "face_recognized"},
            headers=auth_header(platform_admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        for event in data["events"]:
            assert event["event_type"] in ("FACE_RECOGNIZED", "face_recognized")

    @pytest.mark.asyncio
    async def test_list_without_auth_returns_401(self, client: AsyncClient) -> None:
        """인증 없이 GET → 401/403."""
        response = await client.get("/api/v1/edge/events")
        assert response.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_list_with_non_admin_returns_403(
        self, client: AsyncClient, parent_token: str
    ) -> None:
        """일반 사용자(학부모)로 GET → 403."""
        response = await client.get(
            "/api/v1/edge/events",
            headers=auth_header(parent_token),
        )
        assert response.status_code == 403
