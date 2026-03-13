# M4 Requirement Brief — Real-time Pipeline + PostgreSQL + VRP-TW Prototype

**Date**: 2026-03-13

## Goals
1. Complete the end-to-end real-time GPS pipeline: driver app → backend → parent app
2. Run Alembic migrations on real PostgreSQL and verify schema
3. Wire GPS buffer flush as a background task so telemetry persists to DB
4. Start VRP-TW OR-Tools prototype (parallel workstream, not blocking M4 closure)

## Non-goals
- Admin dashboard (deferred to M5+)
- Device testing as a separate milestone (continuous from now)
- Background GPS tracking (foreground only for MVP)

## Current State (from exploration)

### WebSocket — PARTIALLY EXISTS
- Route: `ws://.../api/v1/telemetry/ws/vehicles/{vehicle_id}` in `vehicle_telemetry/router.py`
- Subscribes to Redis `vehicle:{vehicle_id}:gps_updates` channel, forwards messages to client
- **Gaps**: No JWT auth, no connection manager, no heartbeat, message format may not match mobile expectations

### Redis GPS Pipeline — EXISTS
- `update_gps()` does: SET latest snapshot → PUBLISH to pub/sub → RPUSH to buffer
- `flush_gps_buffer()` — exists but **never called** (dead code)

### Mobile Expectations
- WebSocket URL: `ws://localhost:8000/api/v1/telemetry/ws/vehicles/{vehicleId}`
- Expected message shape: `{ vehicle_id, latitude, longitude, heading, speed, recorded_at }`
- Reconnection: exponential backoff 3s → 6s → 12s → max 30s

### Alembic
- Already configured for PostgreSQL (`postgresql://safeway:safeway@localhost:5432/safeway_kids`)
- 2 migrations exist (M1 initial + M2 schema updates)
- Async engine uses `postgresql+asyncpg://`

### VRP-TW
- Stub module at `routing_engine/__init__.py`
- `RoutePlan` model exists with `stops` JSON field
- `MapProvider` (Kakao Mobility) abstraction exists for distance/time queries
- `Academy` model missing lat/lon coordinates (needed as destination node)
- OR-Tools not in dependencies

## Acceptance Criteria

### AC-1: WebSocket GPS E2E
- Driver calls `POST /telemetry/gps` with position
- Parent connected via `ws://.../ws/vehicles/{vehicle_id}` receives the update
- Message matches `GpsLocation` shape expected by mobile
- WebSocket requires valid JWT token (query param or first message)

### AC-2: GPS Persistence
- GPS buffer is periodically flushed to `gps_history` table
- Background task runs every 30s (configurable)
- Flush is idempotent and handles empty buffers

### AC-3: PostgreSQL Migration
- `alembic upgrade head` runs successfully on real PostgreSQL
- All tables created with correct schema
- App starts and connects to PostgreSQL without errors

### AC-4: VRP-TW Prototype (non-blocking)
- OR-Tools dependency added
- Solver accepts: list of stops (lat/lon + time window), vehicle capacities
- Solver outputs: ordered stop sequence per vehicle, total distance/duration
- Works against synthetic test data
- Academy model gains lat/lon fields (new Alembic migration)

## Assumption Register
1. PostgreSQL is available at localhost:5432 (or Docker)
2. Redis is available at localhost:6379
3. WebSocket auth via JWT query parameter (`?token=xxx`) is acceptable for MVP
4. GPS flush interval of 30s provides adequate persistence granularity
5. VRP-TW prototype uses Euclidean distance matrix (Kakao API integration in M5)

## Open Questions
1. Should WebSocket auth use query param token or first-message handshake? → Assuming query param for simplicity
2. Should GPS flush run as FastAPI BackgroundTask, APScheduler, or separate worker? → Assuming FastAPI lifespan background task
3. Max ride time constraint for VRP-TW — not specified in SRS. → Deferred to M5 pilot feedback
