# Final Tech Spec: M0 — Foundation

**Date:** 2026-03-13
**Status:** FINAL
**Scope:** Project scaffolding, database schema, auth, CI/CD, module structure

---

## 1. Problem Statement

No codebase exists for SAFEWAY KIDS. Before any feature development (M1-M2), we need a solid foundation: monorepo structure, database schema, authentication, CI/CD pipeline, and modular architecture boundaries. Decisions made in M0 affect every subsequent milestone.

## 2. Goals

| ID | Goal |
|----|------|
| G1 | Establish monorepo with 10-module modular monolith structure |
| G2 | Design and migrate the core PostgreSQL schema (users, students, academies, vehicles, schedules, contracts, consent) |
| G3 | Implement authentication (Kakao Login + Phone OTP) with RBAC |
| G4 | Implement PIPA guardian consent management |
| G5 | Set up Redis for caching/pub-sub |
| G6 | Set up Firebase integration (Realtime DB + FCM) with abstraction layer |
| G7 | Set up CI/CD (GitHub Actions) and Docker development environment |
| G8 | Build map provider abstraction layer (Kakao Maps implementation) |
| G9 | Establish i18n framework for Korean localization |
| G10 | Define data retention policy and implement soft-delete patterns |

## 3. Non-Goals

- No mobile app code (M1-M2)
- No web dashboard code (M2)
- No VRP-TW engine (M5)
- No edge AI integration (M6)
- No payment/billing logic (M7)
- No T-map integration (M3)

## 4. Tech Stack (Locked)

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Python | 3.12+ |
| Web Framework | FastAPI | 0.110+ |
| ASGI Server | Uvicorn | 0.29+ |
| ORM | SQLAlchemy 2.0 (async) | 2.0+ |
| Migrations | Alembic | 1.13+ |
| Validation | Pydantic v2 | 2.6+ |
| Primary DB | PostgreSQL | 16+ |
| Cache/Pub-sub | Redis | 7+ |
| Real-time DB | Firebase Realtime DB (with pivot plan) | - |
| Push Notifications | Firebase Cloud Messaging (FCM) | - |
| SMS Gateway | NHN Cloud SMS | - |
| Maps (display) | Kakao Maps API | - |
| Containerization | Docker + docker-compose | - |
| CI/CD | GitHub Actions | - |
| Testing | pytest + pytest-asyncio + httpx | - |
| Linting | ruff | - |
| Type Checking | mypy (strict) | - |

## 5. Monorepo Structure

```
safeway_kids/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app factory
│   │   ├── config.py                  # Settings (pydantic-settings)
│   │   ├── database.py                # SQLAlchemy async engine + session
│   │   ├── redis.py                   # Redis client
│   │   ├── firebase.py                # Firebase Admin SDK init
│   │   ├── dependencies.py            # FastAPI dependency injection
│   │   ├── middleware/
│   │   │   ├── auth.py                # JWT verification middleware
│   │   │   ├── consent.py             # PIPA consent check middleware
│   │   │   └── rbac.py                # Role-based access control
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py         # Pydantic models
│   │   │   │   └── models.py          # SQLAlchemy models
│   │   │   ├── student_management/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   ├── academy_management/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   ├── scheduling/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   ├── vehicle_telemetry/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   ├── routing_engine/
│   │   │   │   └── __init__.py        # Stub for M5
│   │   │   ├── edge_gateway/
│   │   │   │   └── __init__.py        # Stub for M6
│   │   │   ├── billing/
│   │   │   │   └── __init__.py        # Stub for M7
│   │   │   ├── notification/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── providers/
│   │   │   │       ├── base.py        # Abstract notification provider
│   │   │   │       ├── fcm.py         # Firebase Cloud Messaging
│   │   │   │       └── sms.py         # NHN Cloud SMS
│   │   │   └── compliance/
│   │   │       ├── router.py
│   │   │       ├── service.py
│   │   │       ├── repository.py
│   │   │       ├── schemas.py
│   │   │       └── models.py
│   │   └── common/
│   │       ├── exceptions.py
│   │       ├── pagination.py
│   │       ├── security.py            # AES-256 encryption utils
│   │       ├── i18n.py                # Korean localization
│   │       └── map_provider/
│   │           ├── base.py            # Abstract MapProvider interface
│   │           └── kakao.py           # Kakao Maps implementation
│   ├── migrations/
│   │   └── versions/                  # Alembic migration files
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── unit/
│   │   ├── integration/
│   │   └── factories/                 # Test data factories
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── docker-compose.yml
├── mobile/                            # React Native (M1-M2)
│   └── .gitkeep
├── web/                               # React.js Dashboard (M2)
│   └── .gitkeep
├── docs/
│   └── srs/
├── artifacts/
└── .github/
    └── workflows/
        ├── ci.yml                     # Lint + test on PR
        └── cd.yml                     # Deploy (placeholder)
```

## 6. Database Schema (Core Tables)

### 6.1 Users and Auth

```sql
-- User roles: parent, driver, safety_escort, academy_admin, platform_admin
CREATE TYPE user_role AS ENUM ('parent', 'driver', 'safety_escort', 'academy_admin', 'platform_admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    kakao_id VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- soft delete
);
```

### 6.2 Guardian Consent (PIPA)

```sql
CREATE TABLE guardian_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL REFERENCES users(id),
    child_id UUID NOT NULL REFERENCES students(id),
    consent_scope JSONB NOT NULL,  -- { "location_tracking": true, "facial_recognition": false, ... }
    consent_method VARCHAR(50) NOT NULL,  -- 'phone_otp', 'written'
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Students

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    grade VARCHAR(20),
    profile_photo_url VARCHAR(500),  -- encrypted reference
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### 6.4 Academies

```sql
CREATE TABLE academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone VARCHAR(20),
    admin_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- N:M student-academy enrollment
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    academy_id UUID NOT NULL REFERENCES academies(id),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    UNIQUE(student_id, academy_id)
);
```

### 6.5 Vehicles and Drivers

```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    operator_name VARCHAR(200),  -- charter bus operator
    insurance_expiry DATE,
    registration_expiry DATE,
    safety_inspection_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    safety_escort_id UUID REFERENCES users(id),  -- Se-rim Act
    assigned_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.6 Contracts (Legal Intermediary)

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id),
    operator_name VARCHAR(200) NOT NULL,  -- charter bus operator
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    contract_type VARCHAR(50) NOT NULL,  -- 'charter_transport'
    effective_from DATE NOT NULL,
    effective_until DATE NOT NULL,
    terms JSONB,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.7 Schedules (Template + Instance)

```sql
-- Recurring weekly template
CREATE TABLE schedule_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    academy_id UUID NOT NULL REFERENCES academies(id),
    day_of_week SMALLINT NOT NULL,  -- 0=Mon, 6=Sun
    pickup_time TIME NOT NULL,
    pickup_latitude DOUBLE PRECISION NOT NULL,
    pickup_longitude DOUBLE PRECISION NOT NULL,
    pickup_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized daily instance
CREATE TABLE daily_schedule_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES schedule_templates(id),
    student_id UUID NOT NULL REFERENCES students(id),
    academy_id UUID NOT NULL REFERENCES academies(id),
    schedule_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    pickup_latitude DOUBLE PRECISION NOT NULL,
    pickup_longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, cancelled, completed, no_show
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    boarded_at TIMESTAMPTZ,
    alighted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.8 Route Plans (Versioned, Immutable)

```sql
CREATE TABLE route_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    plan_date DATE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    stops JSONB NOT NULL,  -- ordered array of { stop_id, lat, lng, eta, student_ids, type: pickup|dropoff }
    total_distance_km DOUBLE PRECISION,
    total_duration_min DOUBLE PRECISION,
    generated_by VARCHAR(50),  -- 'vrp_engine', 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vehicle_id, plan_date, version)
);
```

### 6.9 Data Retention Policy

```sql
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_category VARCHAR(100) NOT NULL UNIQUE,  -- 'gps_history', 'cctv_inference', 'consent_records', etc.
    retention_days INTEGER NOT NULL,
    legal_basis TEXT,
    auto_purge BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default retention values:**
- GPS history: 90 days
- Boarding/alighting logs: 365 days
- Consent records: retained until 3 years after account deletion
- Facial recognition embeddings: deleted within 7 days of service termination
- CCTV inference logs: 30 days

## 7. Authentication and RBAC

### 7.1 Auth Flow

```
Parent Registration:
  1. Kakao Login → get kakao_id + profile
  2. Phone OTP verification → link phone number
  3. PIPA Guardian Consent form → store consent record
  4. Issue JWT (access_token: 1h, refresh_token: 7d)

Driver / Academy Admin Registration:
  1. Phone OTP verification
  2. Role assignment (by platform admin)
  3. Issue JWT
```

### 7.2 JWT Structure

```json
{
  "sub": "user_uuid",
  "role": "parent",
  "iat": 1710300000,
  "exp": 1710303600
}
```

### 7.3 RBAC Permission Matrix

| Resource | parent | driver | safety_escort | academy_admin | platform_admin |
|----------|--------|--------|---------------|---------------|----------------|
| Own profile | RW | RW | RW | RW | RW |
| Own children | RW | - | - | - | R |
| Child location (own) | R | - | - | - | R |
| Vehicle GPS (assigned) | R (own child's vehicle) | RW | R | R (own academy) | R |
| Boarding roster | - | R | R | RW | R |
| Schedule (own child) | RW | R | - | R | R |
| Academy management | - | - | - | RW | RW |
| Contracts | - | - | - | R | RW |
| Consent records | R (own) | - | - | - | R |

## 8. Real-time Layer Architecture

### 8.1 Abstraction (Firebase with pivot plan)

```python
# Abstract interface — swap implementation without touching business logic
class RealtimeProvider(ABC):
    async def publish_vehicle_location(self, vehicle_id: str, location: GeoPoint) -> None: ...
    async def subscribe_vehicle_location(self, vehicle_id: str, callback: Callable) -> None: ...
    async def publish_alert(self, alert: Alert) -> None: ...

class FirebaseRealtimeProvider(RealtimeProvider): ...
class RedisWebSocketProvider(RealtimeProvider): ...  # Pivot implementation
```

### 8.2 GPS Data Flow

```
Driver App → POST /api/v1/telemetry/gps
  → Redis PUBLISH vehicle:{id}:gps
  → Firebase RTDB /vehicles/{id}/location (for parent app subscription)
  → Redis batch buffer → PostgreSQL gps_history (every 30s)
```

## 9. Map Provider Abstraction

```python
class MapProvider(ABC):
    async def geocode(self, address: str) -> GeoPoint: ...
    async def reverse_geocode(self, point: GeoPoint) -> str: ...
    async def get_route(self, origin: GeoPoint, destination: GeoPoint, waypoints: list[GeoPoint]) -> Route: ...
    async def get_eta(self, origin: GeoPoint, destination: GeoPoint) -> timedelta: ...

class KakaoMapsProvider(MapProvider): ...
class TmapProvider(MapProvider): ...  # M3
```

## 10. i18n Strategy

- Use `gettext` / `.po` files for backend error messages
- Korean is the default and only locale for M0-M2
- All API error messages return Korean-friendly codes: `{"code": "CONSENT_REQUIRED", "message": "법정대리인 동의가 필요합니다"}`
- Frontend i18n handled by React Native / React.js i18n libraries (M1-M2)

## 11. CI/CD Pipeline

### GitHub Actions — `ci.yml`
```yaml
on: [push, pull_request]
jobs:
  lint:
    - ruff check
    - mypy --strict
  test:
    - pytest with PostgreSQL + Redis test containers
    - Coverage >= 80%
```

### Docker Compose (Local Dev)
```yaml
services:
  api:       FastAPI (uvicorn, hot-reload)
  db:        PostgreSQL 16
  redis:     Redis 7
  firebase:  Firebase emulator (or mock)
```

## 12. Testing Strategy

| Layer | Tool | Target |
|-------|------|--------|
| Unit | pytest | Service layer logic, schema validation |
| Integration | pytest + testcontainers | DB operations, Redis, Firebase emulator |
| API | httpx + pytest | Endpoint contracts, auth, RBAC |
| Coverage | pytest-cov | >= 80% |

## 13. Edge Cases

| Case | Handling |
|------|----------|
| Kakao Login revoked externally | On next API call, JWT verification fails → prompt re-login |
| Guardian withdraws consent | Cascade: deactivate child's schedules, remove from future routes, send notification to academy |
| Phone number changed | Re-verify via OTP, update user record, maintain history |
| Duplicate student registration | Unique constraint on (guardian_id, name, date_of_birth) — prompt if exists |
| Concurrent schedule mutations | Optimistic locking on daily_schedule_instances (version column) |

## 14. Failure Handling

| Failure | Response |
|---------|----------|
| PostgreSQL down | Health check fails → 503, no writes accepted |
| Redis down | Fallback: direct Firebase write (skip buffer), log degradation |
| Firebase down | Fallback: WebSocket from Redis Pub/Sub (if pivot provider implemented) |
| Kakao API down | Phone OTP still available as auth fallback |
| SMS gateway down | Log failure, retry with exponential backoff, surface to admin dashboard |

## 15. Acceptance Criteria (M0)

| ID | Criterion | Verification |
|----|-----------|-------------|
| M0-AC1 | Monorepo with 10-module structure exists and all modules importable | `python -c "from app.modules.auth import router"` for each module |
| M0-AC2 | PostgreSQL schema applied via Alembic migration | `alembic upgrade head` succeeds, all tables exist |
| M0-AC3 | Kakao Login endpoint returns JWT on valid kakao auth code | Integration test with mocked Kakao API |
| M0-AC4 | Phone OTP send + verify endpoints work | Integration test with mocked SMS gateway |
| M0-AC5 | RBAC blocks parent from accessing academy-admin endpoints | API test: 403 response |
| M0-AC6 | Guardian consent CRUD endpoints work | API test: create, read, withdraw |
| M0-AC7 | Redis connection established and pub/sub works | Integration test |
| M0-AC8 | Firebase SDK initialized (or emulator connected) | Integration test |
| M0-AC9 | `docker-compose up` starts all services successfully | Smoke test |
| M0-AC10 | CI pipeline (lint + test) passes on GitHub Actions | Green CI run |
| M0-AC11 | Map provider abstraction with Kakao implementation passes geocode test | Unit test |
| M0-AC12 | All API error messages include Korean text | Assertion in test suite |

## 16. Code Impact Map

| Area | Files Created | Estimated Lines |
|------|--------------|-----------------|
| Project scaffolding | ~15 config files | ~500 |
| Database models | 10 model files | ~600 |
| Auth module | 5 files | ~400 |
| RBAC middleware | 3 files | ~200 |
| Compliance module | 5 files | ~300 |
| Notification abstractions | 4 files | ~200 |
| Map provider abstraction | 3 files | ~150 |
| Common utilities | 5 files | ~250 |
| Migrations | 1 initial migration | ~200 |
| Tests | ~15 test files | ~800 |
| CI/CD + Docker | 4 files | ~150 |
| **Total** | **~70 files** | **~3,750** |

## 17. Rollback Strategy

M0 is greenfield — rollback = `git revert` to pre-M0 state. No production systems affected.

## 18. Out of Scope

- Mobile app code
- Web dashboard code
- VRP-TW engine implementation
- Edge AI anything
- Payment gateway integration
- T-map API integration
- Load testing (M1)
- Production deployment (M8)
