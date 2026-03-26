"""Edge Gateway API 통합 테스트."""

import pytest
from httpx import AsyncClient


class TestEdgeGateway:
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
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] in ("REMAINING_PASSENGER", "remaining_passenger")
        assert data["details"]["passenger_count"] == 2

    @pytest.mark.asyncio
    async def test_list_edge_events(self, client: AsyncClient) -> None:
        """이벤트 목록 조회."""
        # 이벤트 생성
        await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생A", "confidence": 0.9},
            },
        )
        await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "abnormal_behavior",
                "details": {"behavior_type": "falling", "confidence": 0.8},
            },
        )

        # 전체 조회
        response = await client.get("/api/v1/edge/events")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["events"]) >= 2

    @pytest.mark.asyncio
    async def test_list_edge_events_filtered(self, client: AsyncClient) -> None:
        """이벤트 유형별 필터 조회."""
        await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "face_recognized",
                "details": {"student_name": "원생B", "confidence": 0.85},
            },
        )

        response = await client.get(
            "/api/v1/edge/events",
            params={"event_type": "face_recognized"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        for event in data["events"]:
            assert event["event_type"] in ("FACE_RECOGNIZED", "face_recognized")

    @pytest.mark.asyncio
    async def test_invalid_event_type(self, client: AsyncClient) -> None:
        """잘못된 이벤트 유형."""
        response = await client.post(
            "/api/v1/edge/events",
            json={
                "event_type": "invalid_type",
                "details": {},
            },
        )
        assert response.status_code == 422
