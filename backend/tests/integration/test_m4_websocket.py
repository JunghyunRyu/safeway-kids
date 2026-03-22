"""M4 integration tests: WebSocket auth, GPS relay, buffer flush."""

import json
import uuid
from unittest.mock import patch

import fakeredis.aioredis
import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.database import get_db
from app.main import app
from tests.conftest import TestSessionLocal


class TestWebSocketAuth:
    """WebSocket JWT authentication tests."""

    @pytest.fixture
    def fake_redis(self):
        return fakeredis.aioredis.FakeRedis(decode_responses=True)

    async def test_ws_rejects_missing_token(  # noqa: SIM117
        self, db_session, fake_redis,
    ):
        """WebSocket without token: accepts first, then closes on auth timeout or missing token."""
        vehicle_id = uuid.uuid4()
        with (
            patch("app.modules.vehicle_telemetry.router.redis_client", fake_redis),
            patch("app.main.redis_client", fake_redis),
            TestClient(app) as tc,
        ):
            with tc.websocket_connect(
                f"/api/v1/telemetry/ws/vehicles/{vehicle_id}"
            ) as ws:
                # Send a message without token field
                ws.send_json({"no_token": True})
                # Server should close connection with 4001
                with pytest.raises(WebSocketDisconnect) as exc_info:
                    ws.receive_json()
                assert exc_info.value.code == 4001

    async def test_ws_first_message_auth_success(  # noqa: SIM117
        self, db_session, parent_user, parent_token, fake_redis,
    ):
        """WebSocket first-message auth: send token in first message."""

        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db
        vehicle_id = uuid.uuid4()
        with (
            patch(
                "app.modules.vehicle_telemetry.router.redis_client",
                fake_redis,
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
                # Send token as first message
                ws.send_json({"token": parent_token})
                resp = ws.receive_json()
                assert resp["type"] == "auth_ok"
        app.dependency_overrides.clear()

    async def test_ws_rejects_invalid_token(  # noqa: SIM117
        self, db_session, fake_redis,
    ):
        """WebSocket with invalid JWT in query param should be closed with 4001."""
        vehicle_id = uuid.uuid4()
        with (
            patch("app.modules.vehicle_telemetry.router.redis_client", fake_redis),
            patch("app.main.redis_client", fake_redis),
            TestClient(app) as tc,
            pytest.raises(WebSocketDisconnect),
        ):
            with tc.websocket_connect(
                f"/api/v1/telemetry/ws/vehicles/{vehicle_id}?token=invalid-jwt"
            ):
                pass

    async def test_ws_accepts_valid_token_query_param(  # noqa: SIM117
        self, db_session, parent_user, parent_token, fake_redis,
    ):
        """WebSocket with valid JWT in query param should be accepted (deprecated path)."""

        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db
        vehicle_id = uuid.uuid4()
        with (
            patch(
                "app.modules.vehicle_telemetry.router.redis_client",
                fake_redis,
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
                f"?token={parent_token}"
            ):
                pass  # auth succeeded, connection is open
        app.dependency_overrides.clear()


class TestGpsBufferFlush:
    """GPS buffer flush to PostgreSQL tests."""

    async def test_flush_writes_gps_history(self, db_session):
        """flush_gps_buffer should write buffered GPS data."""
        from app.modules.vehicle_telemetry.models import GpsHistory, Vehicle
        from app.modules.vehicle_telemetry.service import flush_gps_buffer

        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)

        vehicle = Vehicle(
            id=uuid.uuid4(),
            license_plate="12가3456",
            capacity=15,
        )
        db_session.add(vehicle)
        await db_session.flush()

        buffer_key = f"gps_buffer:{vehicle.id}"
        for i in range(3):
            data = json.dumps({
                "vehicle_id": str(vehicle.id),
                "latitude": 37.4979 + i * 0.001,
                "longitude": 127.0276,
                "heading": 90.0,
                "speed": 30.0,
                "recorded_at": f"2026-03-13T10:0{i}:00+00:00",
            })
            await fake_redis.rpush(buffer_key, data)

        count = await flush_gps_buffer(fake_redis, db_session, vehicle.id)
        assert count == 3

        from sqlalchemy import select

        result = await db_session.execute(
            select(GpsHistory).where(GpsHistory.vehicle_id == vehicle.id)
        )
        rows = list(result.scalars().all())
        assert len(rows) == 3
        assert rows[0].latitude == pytest.approx(37.4979, abs=0.01)

    async def test_flush_empty_buffer(self, db_session):
        """flush_gps_buffer with empty buffer returns 0."""
        from app.modules.vehicle_telemetry.service import flush_gps_buffer

        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        vehicle_id = uuid.uuid4()

        count = await flush_gps_buffer(fake_redis, db_session, vehicle_id)
        assert count == 0

    async def test_update_gps_tracks_active_vehicles(self, db_session):
        """update_gps should add vehicle to active_vehicles set."""
        from app.modules.vehicle_telemetry.schemas import GpsUpdateRequest
        from app.modules.vehicle_telemetry.service import update_gps

        fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
        vehicle_id = uuid.uuid4()

        request = GpsUpdateRequest(
            vehicle_id=vehicle_id,
            latitude=37.4979,
            longitude=127.0276,
        )
        await update_gps(fake_redis, request)

        members = await fake_redis.smembers("active_vehicles")
        assert str(vehicle_id) in members
