# DB Schema Review — Multi-App Architecture (PetTracker + CareConnect)

Date: 2026-04-03
Author: DB Architect
Status: REVIEW COMPLETE

---

## 0. Review Scope

This review covers:
1. Schema migration plan for `app_context` on the `users` table
2. New table designs for PetTracker, CareConnect, and shared tables
3. Index strategy for proximity search, availability, GPS, and bookings
4. Data isolation assessment between apps
5. Retention and compliance policy design
6. Performance considerations at scale

**Files reviewed:**
- `backend/app/modules/auth/models.py` — User, UserRole, DriverQualification
- `backend/app/modules/vehicle_telemetry/models.py` — Vehicle, GpsHistory, LocationAccessLog
- `backend/app/modules/billing/models.py` — BillingPlan, Invoice, Payment
- `backend/app/modules/escort/models.py` — EscortAvailability, EscortShift
- `backend/app/modules/compliance/models.py` — GuardianConsent, DriverLocationConsent, DataRetentionPolicy
- `backend/app/modules/messaging/models.py` — Message
- `backend/app/modules/admin/models.py` — AuditLog, SupportTicket
- `backend/app/modules/student_management/models.py` — Student, Enrollment
- `backend/app/database.py` — Base, engine, session config
- `backend/migrations/env.py` — Alembic model discovery
- `artifacts/specs/2026-04-03-architecture-decisions.md` — AD-01 through AD-06
- `artifacts/specs/2026-04-02-pettracker-requirement-brief.md`
- `artifacts/specs/2026-04-02-careconnect-requirement-brief.md`

---

## 1. Schema Migration Plan — `app_context` + UserRole Enum Extension

### 1.1 Current State

```python
class UserRole(enum.StrEnum):
    PARENT = "parent"
    DRIVER = "driver"
    STUDENT = "student"
    SAFETY_ESCORT = "safety_escort"
    ACADEMY_ADMIN = "academy_admin"
    PLATFORM_ADMIN = "platform_admin"
```

The `users` table uses a PostgreSQL ENUM type (`userrole`) for the `role` column. Per AD-01, three new roles must be added: `PET_OWNER`, `WALKER`, `CAREGIVER`. Additionally, an `app_context` column must be added to distinguish which app a user registration belongs to.

### 1.2 PostgreSQL ALTER TYPE Problem

**Critical issue:** `ALTER TYPE ... ADD VALUE` is **non-transactional** in PostgreSQL. It cannot run inside a `BEGIN/COMMIT` block. Alembic by default wraps each migration in a transaction, so a naive `op.execute("ALTER TYPE userrole ADD VALUE 'pet_owner'")` will fail.

### 1.3 Recommended Migration Strategy

**Migration 1: Add `app_context` column and extend enum (single coordinated migration)**

```python
"""add_app_context_and_new_roles

Revision ID: <auto>
Revises: <latest_head>
"""
from alembic import op
import sqlalchemy as sa

# IMPORTANT: This migration must NOT run inside a transaction
# because ALTER TYPE ADD VALUE is non-transactional in PostgreSQL.


def upgrade():
    # Step 1: Add new enum values outside transaction
    # Alembic's autocommit mode handles this via connection.execution_options
    connection = op.get_bind()
    
    # Must commit any pending transaction before ALTER TYPE
    connection.execute(sa.text("COMMIT"))
    
    # Add all three new roles in one migration to avoid ordering conflicts
    connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'pet_owner'"))
    connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'walker'"))
    connection.execute(sa.text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'caregiver'"))
    
    # Step 2: Re-enter transaction for DDL
    connection.execute(sa.text("BEGIN"))
    
    # Step 3: Add app_context column with default for existing rows
    # AppContext as a VARCHAR, not enum — easier to extend for future apps
    op.add_column('users', sa.Column(
        'app_context',
        sa.String(30),
        nullable=False,
        server_default='safeway_kids'
    ))
    
    # Step 4: Index on app_context for filtered queries
    op.create_index('ix_users_app_context', 'users', ['app_context'])
    
    # Step 5: Composite index for role + app_context RBAC lookups
    op.create_index('ix_users_role_app_context', 'users', ['role', 'app_context'])


def downgrade():
    op.drop_index('ix_users_role_app_context')
    op.drop_index('ix_users_app_context')
    op.drop_column('users', 'app_context')
    # NOTE: PostgreSQL does not support DROP VALUE from enum types.
    # Downgrade cannot remove enum values. This is acceptable —
    # unused enum values cause no harm.
```

### 1.4 Key Decisions

| Decision | Rationale |
|----------|-----------|
| `app_context` as `VARCHAR(30)` not ENUM | Avoids the same ALTER TYPE problem when adding future apps. String comparison cost is negligible with index. |
| `IF NOT EXISTS` on ALTER TYPE | Idempotent — safe to re-run if migration partially failed. |
| `COMMIT` before ALTER TYPE | Required because ALTER TYPE ADD VALUE cannot run in a transaction block. |
| All three roles in one migration | Prevents ordering conflicts if PetTracker and CareConnect migrations run independently. |
| `server_default='safeway_kids'` | All existing users are SafeWay Kids users. Backfill is automatic. |

### 1.5 Rollback Strategy

- **Forward-only for enum values**: PostgreSQL cannot remove enum values. The new values `pet_owner`, `walker`, `caregiver` will persist even on rollback. This is harmless — they are unused strings in the type catalog.
- **`app_context` column**: Fully reversible via `DROP COLUMN`.
- **Risk level**: MEDIUM. The `COMMIT` + `BEGIN` pattern breaks Alembic's transaction safety net. Test on staging first.

### 1.6 User Model Changes

```python
class AppContext(enum.StrEnum):
    SAFEWAY_KIDS = "safeway_kids"
    PETTRACKER = "pettracker"
    CARECONNECT = "careconnect"

class UserRole(enum.StrEnum):
    # Existing
    PARENT = "parent"
    DRIVER = "driver"
    STUDENT = "student"
    SAFETY_ESCORT = "safety_escort"
    ACADEMY_ADMIN = "academy_admin"
    PLATFORM_ADMIN = "platform_admin"
    # New
    PET_OWNER = "pet_owner"
    WALKER = "walker"
    CAREGIVER = "caregiver"
```

The `User` model gains:
```python
app_context: Mapped[str] = mapped_column(
    String(30), nullable=False, server_default="safeway_kids", index=True
)
```

### 1.7 Multi-App User Identity

Per AD-01, one person (same phone) can exist in multiple app contexts. This means:
- The current `UNIQUE` constraint on `users.phone` **must change** to a composite unique constraint: `UNIQUE(phone, app_context)`.
- Migration must alter this constraint carefully: drop old unique, add new composite unique.

```python
# In the same migration:
op.drop_constraint('users_phone_key', 'users', type_='unique')
op.create_unique_constraint('uq_users_phone_app_context', 'users', ['phone', 'app_context'])
```

**Impact**: A user with phone `010-1234-5678` can now have separate rows for `safeway_kids`, `pettracker`, and `careconnect`. Each row has its own UUID, role, and JWT. This is the cleanest isolation model.

Similarly for `kakao_id`:
```python
op.drop_constraint('users_kakao_id_key', 'users', type_='unique')
op.create_unique_constraint('uq_users_kakao_id_app_context', 'users', ['kakao_id', 'app_context'])
```

---

## 2. New Table Designs

### 2.1 PetTracker Tables

#### 2.1.1 `pets`

```sql
CREATE TABLE pets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,
    species         VARCHAR(30) NOT NULL,        -- dog, cat
    breed           VARCHAR(100),
    birth_date      DATE,
    weight_kg       NUMERIC(5,1),                -- e.g. 12.5 kg
    vaccination_status VARCHAR(30) DEFAULT 'unknown',  -- unknown, up_to_date, overdue
    medical_notes   TEXT,
    photo_url       VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    
    CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX ix_pets_owner_id ON pets(owner_id);
```

**Design notes:**
- `weight_kg` as `NUMERIC(5,1)` not `FLOAT` — avoids floating-point rounding for display.
- No max-pets-per-owner constraint in DB (enforce in application layer per OQ-PT-03).
- Soft delete via `deleted_at`.
- `species` as VARCHAR not ENUM — future-proofs for additional pet types.

#### 2.1.2 `walker_qualifications`

```sql
CREATE TABLE walker_qualifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id),
    background_check_date   DATE,
    background_check_clear  BOOLEAN DEFAULT FALSE,
    certification_type  VARCHAR(100),             -- 반려동물행동지도사, etc.
    certification_url   VARCHAR(500),             -- uploaded document URL
    service_area_lat    DOUBLE PRECISION,         -- center of service area
    service_area_lon    DOUBLE PRECISION,
    service_radius_km   NUMERIC(4,1) DEFAULT 3.0, -- default 3 km
    is_qualified        BOOLEAN DEFAULT FALSE,    -- admin-approved
    approved_at         TIMESTAMPTZ,
    approved_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_walker_qual_user_id ON walker_qualifications(user_id);
CREATE INDEX ix_walker_qual_qualified ON walker_qualifications(is_qualified) WHERE is_qualified = TRUE;
CREATE INDEX ix_walker_qual_service_area ON walker_qualifications(service_area_lat, service_area_lon) WHERE is_qualified = TRUE;
```

**Design notes:**
- `service_area_lat/lon` stored as the center point of the walker's operating area.
- Partial index on `is_qualified = TRUE` — only qualified walkers participate in search queries.
- `approved_by` FK to `users` for audit trail of who approved the qualification.

#### 2.1.3 `pt_bookings` (PetTracker bookings)

```sql
CREATE TABLE pt_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    walker_id       UUID REFERENCES users(id),       -- NULL until accepted
    pet_id          UUID NOT NULL REFERENCES pets(id),
    service_type    VARCHAR(20) NOT NULL DEFAULT 'walk',  -- walk (MVP only)
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending → confirmed → in_progress → completed
        -- pending → cancelled
        -- pending → expired (timeout)
        -- confirmed → cancelled
    scheduled_at    TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,               -- 30 or 60
    pickup_lat      DOUBLE PRECISION NOT NULL,
    pickup_lon      DOUBLE PRECISION NOT NULL,
    pickup_address  VARCHAR(500),
    price_amount    INTEGER NOT NULL,                -- KRW (원)
    commission_rate NUMERIC(4,2) DEFAULT 15.00,      -- 15%
    timeout_at      TIMESTAMPTZ,                     -- auto-expire if not accepted
    cancelled_by    UUID REFERENCES users(id),
    cancel_reason   VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_pt_bookings_owner ON pt_bookings(owner_id);
CREATE INDEX ix_pt_bookings_walker ON pt_bookings(walker_id);
CREATE INDEX ix_pt_bookings_status ON pt_bookings(status);
CREATE INDEX ix_pt_bookings_scheduled ON pt_bookings(scheduled_at);
CREATE INDEX ix_pt_bookings_status_scheduled ON pt_bookings(status, scheduled_at);
```

**Design notes:**
- `price_amount` in INTEGER (원) per project convention — never FLOAT/DECIMAL for money.
- `commission_rate` as `NUMERIC(4,2)` — allows platform to adjust per AD-06.
- `timeout_at` for the 15-minute acceptance window (FR-PT-06).
- Single pet per booking for MVP. Multi-pet bookings would require a junction table (V1.1).

#### 2.1.4 `walk_sessions`

```sql
CREATE TABLE walk_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES pt_bookings(id),
    walker_id       UUID NOT NULL REFERENCES users(id),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    total_distance_m INTEGER,                        -- meters, computed from GPS
    route_polyline  JSONB,                           -- GeoJSON LineString
    summary_notes   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_walk_sessions_walker ON walk_sessions(walker_id);
CREATE INDEX ix_walk_sessions_started ON walk_sessions(started_at);
```

**Design notes:**
- 1:1 with `pt_bookings` (UNIQUE on `booking_id`).
- `route_polyline` as JSONB — supports GeoJSON format and allows indexing if needed.
- `total_distance_m` in meters as INTEGER for precision.

#### 2.1.5 `walk_gps_history`

```sql
CREATE TABLE walk_gps_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES walk_sessions(id),
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    heading         DOUBLE PRECISION,
    speed           DOUBLE PRECISION,
    recorded_at     TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions (create programmatically)
CREATE TABLE walk_gps_history_2026_04 PARTITION OF walk_gps_history
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE walk_gps_history_2026_05 PARTITION OF walk_gps_history
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
-- ... etc, created by monthly cron

CREATE INDEX ix_walk_gps_session_time ON walk_gps_history(session_id, recorded_at);
```

**Design notes:**
- **Separate table from `gps_history`** — avoids polluting SafeWay Kids vehicle GPS data.
- **Partitioned by month** on `recorded_at` — enables efficient 180-day retention purge by dropping old partitions.
- Index on `(session_id, recorded_at)` for route replay queries.
- No FK to `vehicles` — this is walker phone GPS, not vehicle telemetry.

#### 2.1.6 `walker_wallets`

```sql
CREATE TABLE walker_wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
    balance         INTEGER NOT NULL DEFAULT 0,      -- KRW
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_withdrawn INTEGER NOT NULL DEFAULT 0,
    bank_name       VARCHAR(50),
    bank_account    VARCHAR(50),                     -- encrypted at app layer
    account_holder  VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### 2.1.7 `walker_reviews`

```sql
CREATE TABLE walker_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES pt_bookings(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),  -- pet owner
    walker_id       UUID NOT NULL REFERENCES users(id),
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    review_deadline TIMESTAMPTZ NOT NULL             -- 48 hours after walk end
);

CREATE INDEX ix_walker_reviews_walker ON walker_reviews(walker_id);
CREATE INDEX ix_walker_reviews_rating ON walker_reviews(walker_id, rating);
```

#### 2.1.8 `walker_availabilities`

```sql
CREATE TABLE walker_availabilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    walker_id       UUID NOT NULL REFERENCES users(id),
    available_date  DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    status          VARCHAR(20) DEFAULT 'available',  -- available, booked, cancelled
    created_at      TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT uq_walker_date_time UNIQUE (walker_id, available_date, start_time)
);

CREATE INDEX ix_walker_avail_date_status ON walker_availabilities(available_date, status);
CREATE INDEX ix_walker_avail_walker ON walker_availabilities(walker_id);
```

**Design notes:**
- Pattern borrowed from `escort_availabilities` but with `start_time` in the unique constraint to allow multiple slots per day.

---

### 2.2 CareConnect Tables

#### 2.2.1 `cc_children`

```sql
CREATE TABLE cc_children (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,           -- PII: must be masked in logs
    date_of_birth   DATE NOT NULL,
    allergies       TEXT,                             -- PII
    medical_notes   TEXT,                             -- PII
    emergency_contact VARCHAR(20),                    -- PII
    school_name     VARCHAR(100),
    school_address  VARCHAR(500),
    care_address_lat    DOUBLE PRECISION,             -- registered care address
    care_address_lon    DOUBLE PRECISION,
    care_address_text   VARCHAR(500),
    photo_url       VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    
    CONSTRAINT uq_cc_child UNIQUE (parent_id, name, date_of_birth)
);

CREATE INDEX ix_cc_children_parent ON cc_children(parent_id);
```

**Design notes:**
- Separate from `students` table — CareConnect children have different fields (care address, no grade/enrollment).
- `care_address_lat/lon` — the registered address used for 200m geofence check-in verification (AD-04).
- PII columns annotated in comments for 개인정보보호법 compliance documentation.
- Mirrors the `students` table pattern: `UNIQUE(parent_id, name, date_of_birth)`.

#### 2.2.2 `caregiver_qualifications`

```sql
CREATE TABLE caregiver_qualifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id),
    background_check_date   DATE NOT NULL,           -- mandatory for CareConnect
    background_check_clear  BOOLEAN DEFAULT FALSE,
    identity_document_url   VARCHAR(500),
    cpr_certification       BOOLEAN DEFAULT FALSE,
    cpr_cert_expiry         DATE,
    service_area_lat        DOUBLE PRECISION,
    service_area_lon        DOUBLE PRECISION,
    service_radius_km       NUMERIC(4,1) DEFAULT 5.0,  -- CareConnect default 5 km
    is_qualified            BOOLEAN DEFAULT FALSE,
    approved_at             TIMESTAMPTZ,
    approved_by             UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_cg_qual_user_id ON caregiver_qualifications(user_id);
CREATE INDEX ix_cg_qual_qualified ON caregiver_qualifications(is_qualified) WHERE is_qualified = TRUE;
CREATE INDEX ix_cg_qual_service_area ON caregiver_qualifications(service_area_lat, service_area_lon) WHERE is_qualified = TRUE;
```

**Design notes:**
- `background_check_date` is `NOT NULL` — mandatory for CareConnect per FR-CC-02.
- Structurally similar to `walker_qualifications` but separate table — different validation rules and different default radius.

#### 2.2.3 `cc_bookings` (CareConnect bookings)

```sql
CREATE TABLE cc_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID NOT NULL REFERENCES users(id),
    caregiver_id    UUID REFERENCES users(id),       -- NULL until accepted
    child_id        UUID NOT NULL REFERENCES cc_children(id),
    care_type       VARCHAR(30) NOT NULL DEFAULT 'visit',  -- visit (MVP only)
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending → confirmed → in_progress → completed
        -- pending → cancelled
        -- pending → expired
        -- confirmed → cancelled
    scheduled_at    TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    care_address_lat    DOUBLE PRECISION NOT NULL,
    care_address_lon    DOUBLE PRECISION NOT NULL,
    care_address_text   VARCHAR(500),
    price_amount    INTEGER NOT NULL,                -- KRW
    hourly_rate     INTEGER NOT NULL,                -- KRW per hour
    commission_rate NUMERIC(4,2) DEFAULT 20.00,      -- 20%
    timeout_at      TIMESTAMPTZ,                     -- 30-min acceptance window
    cancelled_by    UUID REFERENCES users(id),
    cancel_reason   VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_cc_bookings_parent ON cc_bookings(parent_id);
CREATE INDEX ix_cc_bookings_caregiver ON cc_bookings(caregiver_id);
CREATE INDEX ix_cc_bookings_child ON cc_bookings(child_id);
CREATE INDEX ix_cc_bookings_status ON cc_bookings(status);
CREATE INDEX ix_cc_bookings_status_scheduled ON cc_bookings(status, scheduled_at);
```

#### 2.2.4 `care_sessions`

```sql
CREATE TABLE care_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES cc_bookings(id),
    caregiver_id    UUID NOT NULL REFERENCES users(id),
    check_in_at     TIMESTAMPTZ,
    check_in_lat    DOUBLE PRECISION,
    check_in_lon    DOUBLE PRECISION,
    check_in_verified BOOLEAN DEFAULT FALSE,         -- within 200m geofence
    check_out_at    TIMESTAMPTZ,
    actual_duration_minutes INTEGER,                 -- computed at check-out
    summary_notes   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_care_sessions_caregiver ON care_sessions(caregiver_id);
CREATE INDEX ix_care_sessions_checkin ON care_sessions(check_in_at);
```

**Design notes:**
- GPS coordinate stored at check-in only (not continuous streaming per A-CC-04).
- `check_in_verified` — Boolean result of the 200m geofence check.
- `actual_duration_minutes` computed at check-out for billing accuracy.

#### 2.2.5 `care_activity_logs`

```sql
CREATE TABLE care_activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES care_sessions(id),
    caregiver_id    UUID NOT NULL REFERENCES users(id),
    activity_text   TEXT NOT NULL,
    photo_url       VARCHAR(500),                    -- optional, S3 URL
    photo_expires_at TIMESTAMPTZ,                    -- 30 days (free) or 90 days (premium)
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_care_activity_session ON care_activity_logs(session_id);
CREATE INDEX ix_care_activity_photo_expiry ON care_activity_logs(photo_expires_at)
    WHERE photo_url IS NOT NULL;
```

**Design notes:**
- Partial index on `photo_expires_at WHERE photo_url IS NOT NULL` — only rows with photos need expiry scanning.
- Photo retention: 30 days free, 90 days premium (FR-CC-18).

#### 2.2.6 `caregiver_wallets`

```sql
CREATE TABLE caregiver_wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
    balance         INTEGER NOT NULL DEFAULT 0,
    total_earned    INTEGER NOT NULL DEFAULT 0,
    total_withdrawn INTEGER NOT NULL DEFAULT 0,
    bank_name       VARCHAR(50),
    bank_account    VARCHAR(50),                     -- encrypted at app layer
    account_holder  VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### 2.2.7 `caregiver_reviews`

```sql
CREATE TABLE caregiver_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES cc_bookings(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),  -- parent
    caregiver_id    UUID NOT NULL REFERENCES users(id),
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    review_deadline TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_cg_reviews_caregiver ON caregiver_reviews(caregiver_id);
CREATE INDEX ix_cg_reviews_rating ON caregiver_reviews(caregiver_id, rating);
```

#### 2.2.8 `caregiver_availabilities`

```sql
CREATE TABLE caregiver_availabilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id    UUID NOT NULL REFERENCES users(id),
    available_date  DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    status          VARCHAR(20) DEFAULT 'available',
    created_at      TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT uq_caregiver_date_time UNIQUE (caregiver_id, available_date, start_time)
);

CREATE INDEX ix_cg_avail_date_status ON caregiver_availabilities(available_date, status);
CREATE INDEX ix_cg_avail_caregiver ON caregiver_availabilities(caregiver_id);
```

#### 2.2.9 `child_consents`

```sql
CREATE TABLE child_consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID NOT NULL REFERENCES users(id),
    child_id        UUID NOT NULL REFERENCES cc_children(id),
    caregiver_id    UUID REFERENCES users(id),       -- NULL = blanket consent
    booking_id      UUID REFERENCES cc_bookings(id), -- NULL = not booking-specific
    consent_scope   JSONB NOT NULL,                  -- {"data_types": ["name","medical","photo"]}
    consent_method  VARCHAR(50) NOT NULL,            -- app_tap, sms_confirmation
    granted_at      TIMESTAMPTZ DEFAULT now(),
    withdrawn_at    TIMESTAMPTZ,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_child_consents_child ON child_consents(child_id);
CREATE INDEX ix_child_consents_parent ON child_consents(parent_id);
CREATE INDEX ix_child_consents_active ON child_consents(child_id, caregiver_id)
    WHERE withdrawn_at IS NULL;
```

**Design notes:**
- Pattern adapted from `guardian_consents` but FK references `cc_children` instead of `students`.
- `consent_scope` as JSONB — flexible for different consent types.
- Partial index on active (non-withdrawn) consents for fast lookup during booking creation.
- Per FR-CC-17: consent must exist before session starts. Application layer enforces this.

---

### 2.3 Shared Tables (New)

#### 2.3.1 `wallet_transactions`

```sql
CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_type     VARCHAR(20) NOT NULL,            -- walker, caregiver
    wallet_id       UUID NOT NULL,                   -- FK enforced at app layer (polymorphic)
    user_id         UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(30) NOT NULL,
        -- earning, commission, withdrawal, payout, refund, subscription
    amount          INTEGER NOT NULL,                -- KRW, positive for credit, negative for debit
    balance_after   INTEGER NOT NULL,                -- running balance snapshot
    reference_type  VARCHAR(30),                     -- pt_booking, cc_booking, subscription
    reference_id    UUID,                            -- booking or subscription ID
    description     VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'completed', -- completed, pending, failed
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_wallet_tx_wallet ON wallet_transactions(wallet_type, wallet_id);
CREATE INDEX ix_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX ix_wallet_tx_created ON wallet_transactions(created_at);
CREATE INDEX ix_wallet_tx_ref ON wallet_transactions(reference_type, reference_id);
```

**Design notes:**
- Polymorphic design: `wallet_type` + `wallet_id` points to either `walker_wallets` or `caregiver_wallets`.
- `balance_after` — immutable running balance snapshot for audit trail. Critical for financial reconciliation.
- `amount` is signed: positive = credit (earning), negative = debit (withdrawal/commission).
- No FK on `wallet_id` — polymorphic reference validated at application layer.

#### 2.3.2 `location_consents` (Unified)

```sql
CREATE TABLE location_consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    app_context     VARCHAR(30) NOT NULL,            -- pettracker, careconnect
    consent_granted BOOLEAN DEFAULT TRUE,
    granted_at      TIMESTAMPTZ DEFAULT now(),
    withdrawn_at    TIMESTAMPTZ,
    ip_address      VARCHAR(45),
    
    CONSTRAINT uq_location_consent UNIQUE (user_id, app_context)
);
```

**Design notes:**
- Replaces `driver_location_consents` pattern for new apps.
- One consent per user per app — `UNIQUE(user_id, app_context)`.
- Existing `driver_location_consents` table remains unchanged for SafeWay Kids.

#### 2.3.3 `subscriptions`

```sql
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    app_context     VARCHAR(30) NOT NULL,
    plan_type       VARCHAR(30) NOT NULL,            -- owner_premium, walker_premium, parent_premium, caregiver_premium
    price_amount    INTEGER NOT NULL,                -- KRW monthly
    billing_key     VARCHAR(200),                    -- Toss recurring billing key
    status          VARCHAR(20) DEFAULT 'active',    -- active, cancelled, expired, past_due
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT uq_subscription UNIQUE (user_id, app_context, plan_type)
);

CREATE INDEX ix_subscriptions_user ON subscriptions(user_id);
CREATE INDEX ix_subscriptions_status ON subscriptions(status) WHERE status = 'active';
CREATE INDEX ix_subscriptions_renewal ON subscriptions(current_period_end, status)
    WHERE status = 'active';
```

#### 2.3.4 `commission_records`

```sql
CREATE TABLE commission_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_context     VARCHAR(30) NOT NULL,
    booking_type    VARCHAR(20) NOT NULL,            -- pt_booking, cc_booking
    booking_id      UUID NOT NULL,
    provider_id     UUID NOT NULL REFERENCES users(id),  -- walker or caregiver
    total_amount    INTEGER NOT NULL,                -- total charge KRW
    commission_rate NUMERIC(4,2) NOT NULL,           -- 15.00 or 20.00
    commission_amount INTEGER NOT NULL,              -- platform keeps
    provider_amount INTEGER NOT NULL,                -- provider receives
    settled         BOOLEAN DEFAULT FALSE,
    settled_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_commission_app ON commission_records(app_context);
CREATE INDEX ix_commission_provider ON commission_records(provider_id);
CREATE INDEX ix_commission_unsettled ON commission_records(settled) WHERE settled = FALSE;
```

---

## 3. Index Strategy

### 3.1 Proximity Search (Lat/Lon Within Radius)

**Query pattern:** Find walkers/caregivers within N km of a given point, filtered by `is_qualified = TRUE`.

**Without PostGIS (Haversine fallback):**
```sql
SELECT wq.user_id, wq.service_area_lat, wq.service_area_lon
FROM walker_qualifications wq
WHERE wq.is_qualified = TRUE
  AND wq.service_area_lat BETWEEN :min_lat AND :max_lat
  AND wq.service_area_lon BETWEEN :min_lon AND :max_lon;
-- Then compute Haversine distance in Python for final filtering
```

**Required index:**
```sql
CREATE INDEX ix_walker_qual_bbox ON walker_qualifications(service_area_lat, service_area_lon)
    WHERE is_qualified = TRUE;
```

The bounding-box pre-filter narrows candidates; Python Haversine does exact distance. At 10K walkers with partial index, this query scans ~100-500 rows — well under 10ms.

**With PostGIS (recommended for V1.1):**
```sql
-- Add a geography column
ALTER TABLE walker_qualifications ADD COLUMN service_area_geog GEOGRAPHY(Point, 4326);
CREATE INDEX ix_walker_qual_geog ON walker_qualifications USING GIST(service_area_geog);

-- Query
SELECT user_id FROM walker_qualifications
WHERE is_qualified = TRUE
  AND ST_DWithin(service_area_geog, ST_MakePoint(:lon, :lat)::geography, :radius_m);
```

**Recommendation:** Start with Haversine + bounding box for MVP. Migrate to PostGIS when daily bookings exceed 1K or radius queries exceed 50ms p95.

### 3.2 Walker/Caregiver Availability Lookup

**Query pattern:** Find available slots for a given date, with status = 'available'.

```sql
CREATE INDEX ix_walker_avail_date_status ON walker_availabilities(available_date, status);
CREATE INDEX ix_cg_avail_date_status ON caregiver_availabilities(available_date, status);
```

Composite index on `(available_date, status)` supports the most common query: "who is available on date X?"

### 3.3 GPS History Queries by Session

**Query pattern:** Retrieve all GPS points for a walk session, ordered by time (route replay).

```sql
CREATE INDEX ix_walk_gps_session_time ON walk_gps_history(session_id, recorded_at);
```

This covering index supports `WHERE session_id = ? ORDER BY recorded_at` with an index-only scan.

### 3.4 Booking Status Queries

**Query pattern:** Dashboard queries for bookings by status, filtered by date range.

```sql
CREATE INDEX ix_pt_bookings_status_scheduled ON pt_bookings(status, scheduled_at);
CREATE INDEX ix_cc_bookings_status_scheduled ON cc_bookings(status, scheduled_at);
```

Composite index supports: `WHERE status = 'pending' AND scheduled_at > now()`.

### 3.5 Full Index Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | `ix_users_app_context` | B-tree | App-filtered queries |
| `users` | `ix_users_role_app_context` | B-tree | RBAC + app context |
| `users` | `uq_users_phone_app_context` | Unique | Multi-app identity |
| `pets` | `ix_pets_owner_id` | B-tree | Owner's pets list |
| `walker_qualifications` | `ix_walker_qual_bbox` | Partial B-tree | Proximity pre-filter |
| `walker_availabilities` | `ix_walker_avail_date_status` | B-tree | Date availability |
| `pt_bookings` | `ix_pt_bookings_status_scheduled` | B-tree | Dashboard + timeout |
| `walk_gps_history` | `ix_walk_gps_session_time` | B-tree | Route replay |
| `walk_sessions` | `ix_walk_sessions_walker` | B-tree | Walker history |
| `walker_reviews` | `ix_walker_reviews_rating` | B-tree | Rating aggregation |
| `cc_bookings` | `ix_cc_bookings_status_scheduled` | B-tree | Dashboard + timeout |
| `care_sessions` | `ix_care_sessions_caregiver` | B-tree | Caregiver history |
| `care_activity_logs` | `ix_care_activity_photo_expiry` | Partial B-tree | Photo purge scan |
| `child_consents` | `ix_child_consents_active` | Partial B-tree | Active consent check |
| `wallet_transactions` | `ix_wallet_tx_wallet` | B-tree | Wallet ledger |
| `commission_records` | `ix_commission_unsettled` | Partial B-tree | Settlement batch |
| `subscriptions` | `ix_subscriptions_renewal` | Partial B-tree | Renewal cron |
| `audit_logs` | `ix_audit_entity_type_time` (**new**) | B-tree | Child data audit (FR-CC-20) |

**New index needed on existing `audit_logs` table:**
```sql
CREATE INDEX ix_audit_entity_type_time ON audit_logs(entity_type, entity_id, created_at);
```

---

## 4. Data Isolation Assessment

### 4.1 Cross-App Query Risk

**Question:** Can a PetTracker query accidentally join to CareConnect data?

**Answer: NO**, by design. The app-specific tables are completely separate:

| PetTracker table | CareConnect table | Overlap? |
|------------------|-------------------|----------|
| `pets` | `cc_children` | None — different FKs, different domains |
| `pt_bookings` | `cc_bookings` | None — FK to `pets` vs `cc_children` |
| `walk_sessions` | `care_sessions` | None — FK to `pt_bookings` vs `cc_bookings` |
| `walker_qualifications` | `caregiver_qualifications` | None — separate tables |
| `walker_wallets` | `caregiver_wallets` | None |
| `walker_reviews` | `caregiver_reviews` | None — FK to `pt_bookings` vs `cc_bookings` |

A PetTracker query `SELECT * FROM pt_bookings JOIN pets ...` cannot accidentally pull CareConnect data because `pets.id` is never referenced by `cc_bookings`.

### 4.2 Shared Table Access Patterns

Tables shared across apps:

| Table | Access pattern | Isolation mechanism |
|-------|---------------|---------------------|
| `users` | All apps read/write | `app_context` column + composite unique on `(phone, app_context)` |
| `wallet_transactions` | Both wallets write | `wallet_type` discriminator column |
| `commission_records` | Both apps write | `app_context` column |
| `subscriptions` | Both apps write | `app_context` column |
| `location_consents` | Both apps write | `app_context` column |
| `messages` | Both apps write | `academy_id = NULL` for new apps; `booking_type` in content context |
| `audit_logs` | All apps write | `entity_type` discriminator |
| `notification_logs` | All apps write | No isolation needed (operational data) |

### 4.3 RBAC Isolation

**Critical safeguard:** The JWT must include `app_context` alongside `role`. RBAC middleware must validate **both**:

```python
# WRONG — role alone is insufficient
@require_role(UserRole.PARENT)

# CORRECT — role + app_context
@require_role(UserRole.PARENT, app_context=AppContext.CARECONNECT)
# or
@require_role(UserRole.PET_OWNER, app_context=AppContext.PETTRACKER)
```

Without this, a SafeWay Kids `PARENT` JWT could access CareConnect parent endpoints. This is the highest-priority security concern.

### 4.4 Foreign Key Boundary Enforcement

All app-specific tables use FKs that form a closed graph:

```
PetTracker:    users → pets → pt_bookings → walk_sessions → walk_gps_history
CareConnect:   users → cc_children → cc_bookings → care_sessions → care_activity_logs
```

There is **no FK path** from a PetTracker entity to a CareConnect entity. The only shared FK target is `users(id)`, which is the intentional join point.

### 4.5 Residual Risk

| Risk | Severity | Mitigation |
|------|----------|------------|
| Admin query joins across apps via `users` | LOW | Admin endpoints filter by `app_context` in WHERE clause |
| `wallet_transactions` shows cross-app transactions | LOW | Filter by `wallet_type` in application layer |
| `messages` table has no `app_context` column | MEDIUM | Add `app_context` column to `messages` table, or use booking-scoped messaging |

**Recommendation:** Add `app_context VARCHAR(30)` to the `messages` table in the migration. This prevents a message sent in PetTracker context from appearing in CareConnect chat.

---

## 5. Retention & Compliance

### 5.1 Retention Schedule

| Data category | Retention | Legal basis | Purge method |
|---------------|-----------|-------------|--------------|
| GPS walk history (`walk_gps_history`) | 180 days | 위치정보법 제16조 | DROP PARTITION for months > 6 months old |
| GPS check-in coordinates (`care_sessions.check_in_lat/lon`) | 180 days | 위치정보법 제16조 | UPDATE SET NULL on rows older than 180 days |
| Location access logs | 180 days | 위치정보법 제16조 | DELETE WHERE retention_until < now() |
| Messages | 6 months | 통신비밀보호법 | DELETE WHERE retention_expires_at < now() |
| Activity photos | 30 days (free) / 90 days (premium) | Platform policy | DELETE from S3 + UPDATE photo_url = NULL |
| Child data audit logs | 1 year | 개인정보보호법 | DELETE WHERE created_at < now() - INTERVAL '1 year' AND entity_type = 'child' |
| Walker/caregiver reviews | Indefinite | Business need | Soft delete only |
| Wallet transactions | 5 years | 전자금융거래법 | No auto-purge |
| Commission records | 5 years | 세법 (tax law) | No auto-purge |

### 5.2 Child Data Special Handling (개인정보보호법)

For children under 14, the following rules apply:

1. **Consent required before data processing**: `child_consents` record must exist with `withdrawn_at IS NULL` before any caregiver can access child data.
2. **Audit trail**: Every read of `cc_children` data by a caregiver must create an `audit_logs` entry with `entity_type = 'child'`.
3. **Log masking**: Child name must never appear in plain text in application logs. Use `name[0] + '***'` pattern.
4. **Data minimization**: Caregiver API response includes only fields needed for the care session (name, allergies, emergency_contact). Full medical notes only visible to parent.

### 5.3 Auto-Purge Cron Job Design

```
┌─────────────────────────────────────────────────────────────────┐
│ Daily Purge Cron — runs at 02:00 KST (17:00 UTC previous day) │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GPS Partition Drop (walk_gps_history)                       │
│     IF partition for (now - 181 days).month exists:             │
│       DROP TABLE walk_gps_history_YYYY_MM;                      │
│     Log: "Dropped partition walk_gps_history_YYYY_MM, N rows"   │
│                                                                 │
│  2. Care Session GPS Nullify                                    │
│     UPDATE care_sessions                                        │
│     SET check_in_lat = NULL, check_in_lon = NULL                │
│     WHERE check_in_at < now() - INTERVAL '180 days'            │
│       AND check_in_lat IS NOT NULL;                             │
│     Log: "Nullified N care session GPS records"                 │
│                                                                 │
│  3. Location Access Log Purge                                   │
│     DELETE FROM location_access_logs                             │
│     WHERE retention_until < CURRENT_DATE;                       │
│                                                                 │
│  4. Message Purge                                               │
│     DELETE FROM messages                                        │
│     WHERE retention_expires_at < now();                         │
│                                                                 │
│  5. Activity Photo Purge                                        │
│     SELECT id, photo_url FROM care_activity_logs                │
│     WHERE photo_expires_at < now() AND photo_url IS NOT NULL;   │
│     -- For each: delete from S3, then UPDATE photo_url = NULL   │
│     Log: "Purged N activity photos"                             │
│                                                                 │
│  6. Child Audit Log Purge                                       │
│     DELETE FROM audit_logs                                      │
│     WHERE entity_type = 'child'                                 │
│       AND created_at < now() - INTERVAL '1 year';              │
│                                                                 │
│  7. Monthly Partition Creation (walk_gps_history)               │
│     IF partition for (now + 30 days).month does not exist:      │
│       CREATE TABLE walk_gps_history_YYYY_MM ...                 │
│     (Create next month's partition proactively)                  │
│                                                                 │
│  8. DataRetentionPolicy sync check                              │
│     Verify retention_days in data_retention_policies table      │
│     matches cron job configuration. Log discrepancies.          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**New `data_retention_policies` rows to insert:**

```sql
INSERT INTO data_retention_policies (data_category, retention_days, legal_basis, auto_purge) VALUES
('walk_gps_history', 180, '위치정보법 제16조', TRUE),
('care_session_gps', 180, '위치정보법 제16조', TRUE),
('care_activity_photos_free', 30, 'Platform policy', TRUE),
('care_activity_photos_premium', 90, 'Platform policy', TRUE),
('child_audit_logs', 365, '개인정보보호법', TRUE),
('wallet_transactions', 1825, '전자금융거래법', FALSE),
('commission_records', 1825, '세법', FALSE);
```

---

## 6. Performance Considerations

### 6.1 Table Partitioning Strategy

| Table | Partition? | Strategy | Rationale |
|-------|-----------|----------|-----------|
| `walk_gps_history` | **YES** | Range by `recorded_at` (monthly) | Enables fast 180-day purge via `DROP TABLE partition`. At 500 concurrent sessions x 12 points/min = 360K rows/hour. Monthly partitions keep each partition manageable (~260M rows/month at peak). |
| `gps_history` (existing) | Leave as-is | — | SafeWay Kids vehicle GPS already working. Partition if it grows beyond 100M rows. |
| `audit_logs` | Consider | Range by `created_at` (quarterly) | With child data auditing, audit_logs could grow 10x. Partition when >50M rows. |
| `pt_bookings` / `cc_bookings` | **NO** | — | At 1K daily bookings, 365K rows/year. B-tree indexes sufficient for 5+ years. |
| `wallet_transactions` | **NO** | — | 5-year retention mandated. At 2K daily transactions, ~3.6M rows/5 years. Manageable without partitioning. |

### 6.2 Connection Pooling for Multi-App

Current config (`backend/app/config.py:68-69`):
```python
db_pool_size: int = 20
db_max_overflow: int = 10
```

**Assessment at 10K users across 3 apps:**
- SafeWay Kids: ~5 concurrent DB connections (existing workload)
- PetTracker: ~8 concurrent (GPS flush + booking queries)
- CareConnect: ~5 concurrent (check-in + booking queries)
- Admin dashboard: ~2 concurrent

**Total estimated peak:** ~20 concurrent connections

**Recommendation:** Current `pool_size=20, max_overflow=10` is adequate for MVP. If all three apps share one FastAPI process, the pool is shared. If deployed as separate processes, each needs its own pool — coordinate to stay under PostgreSQL's `max_connections` (default 100).

For multi-process deployment:
```
SafeWay Kids:  pool_size=8,  max_overflow=4
PetTracker:    pool_size=8,  max_overflow=4
CareConnect:   pool_size=8,  max_overflow=4
Admin:         pool_size=4,  max_overflow=2
─────────────────────────────────────────────
Total:         28 base + 14 overflow = 42 max
```

Consider PgBouncer if deploying on Kubernetes with multiple replicas.

### 6.3 Expected Table Sizes at Scale

Projections for 10K registered users, 1K daily bookings:

| Table | Rows/day | Rows/year | Row size (avg) | Storage/year |
|-------|----------|-----------|----------------|--------------|
| `users` | ~30 new | ~11K total | ~500 B | ~5.5 MB |
| `pets` / `cc_children` | ~20 new | ~7K total | ~400 B | ~2.8 MB |
| `pt_bookings` + `cc_bookings` | ~1,000 | ~365K | ~300 B | ~110 MB |
| `walk_sessions` + `care_sessions` | ~800 | ~292K | ~200 B | ~58 MB |
| `walk_gps_history` | ~4.3M * | ~1.6B * | ~80 B | ~125 GB * |
| `wallet_transactions` | ~2,000 | ~730K | ~200 B | ~146 MB |
| `walker_reviews` + `caregiver_reviews` | ~500 | ~182K | ~200 B | ~36 MB |
| `audit_logs` (with child auditing) | ~5,000 | ~1.8M | ~300 B | ~540 MB |
| `messages` | ~3,000 | ~1.1M | ~500 B | ~540 MB |

\* GPS history is the dominant table. At 500 concurrent walk sessions, 12 points/min, 30 min average:
- Per session: 360 rows
- Per day: 500 sessions x 360 = 180K rows (but peak burst = 4.3M if all 1K bookings are walks)
- 180-day retention limits storage to ~32.4M rows / ~2.6 GB at any time

**Verdict:** Storage is manageable. The GPS partition strategy is essential — without it, a single 1.6B-row table would degrade query performance severely.

### 6.4 Redis Key Namespace

Per risk assessment, Redis keys must be namespaced by app to avoid collisions:

```
SafeWay Kids:  vehicle:{id}:gps          (existing, unchanged)
PetTracker:    pt:walk_session:{id}:gps  (new)
CareConnect:   (no Redis GPS — point-in-time only)
```

**Recommendation:** Establish a Redis key prefix policy:
- `sk:` — SafeWay Kids
- `pt:` — PetTracker
- `cc:` — CareConnect

Apply to all new Redis keys (GPS buffers, rate limiters, session caches).

---

## 7. Summary of Recommendations

### Priority 1 (Must-have for migration)

| # | Recommendation | Risk if skipped |
|---|---------------|-----------------|
| R1 | Coordinated single migration for all 3 enum values + `app_context` column | Migration ordering conflicts |
| R2 | Change `users.phone` unique → composite `UNIQUE(phone, app_context)` | Multi-app registration blocked |
| R3 | Change `users.kakao_id` unique → composite `UNIQUE(kakao_id, app_context)` | Same as R2 |
| R4 | JWT must include `app_context`; RBAC must validate role + app_context | Cross-app privilege escalation |
| R5 | Add `app_context` column to `messages` table | Cross-app message leakage |

### Priority 2 (Must-have for launch)

| # | Recommendation | Risk if skipped |
|---|---------------|-----------------|
| R6 | Partition `walk_gps_history` by month from day one | Purge becomes DELETE of millions of rows |
| R7 | Create `child_consents` table with enforcement in booking flow | 개인정보보호법 violation |
| R8 | Add `ix_audit_entity_type_time` index on `audit_logs` | Child data audit queries slow at scale |
| R9 | Implement location consent for walkers and caregivers | 위치정보법 violation |
| R10 | Set up auto-purge cron for all retention categories | Legal non-compliance |

### Priority 3 (Recommended for V1.1)

| # | Recommendation |
|---|---------------|
| R11 | Migrate proximity search to PostGIS |
| R12 | Partition `audit_logs` by quarter |
| R13 | Add PgBouncer for multi-replica K8s deployment |
| R14 | Multi-pet booking junction table (`pt_booking_pets`) |
| R15 | Replace `messages` reuse with app-specific `booking_messages` table |

---

## 8. Alembic env.py Update Required

New models must be imported in `backend/migrations/env.py` for Alembic autogenerate to detect them:

```python
# PetTracker models
from app.modules.pettracker.models import (  # noqa: F401
    Pet, WalkerQualification, PtBooking, WalkSession,
    WalkGpsHistory, WalkerWallet, WalkerReview, WalkerAvailability,
)

# CareConnect models
from app.modules.careconnect.models import (  # noqa: F401
    CcChild, CaregiverQualification, CcBooking, CareSession,
    CareActivityLog, CaregiverWallet, CaregiverReview,
    CaregiverAvailability, ChildConsent,
)

# Shared models
from app.modules.shared.models import (  # noqa: F401
    WalletTransaction, LocationConsent, Subscription, CommissionRecord,
)
```

Module paths are tentative — adjust to actual project structure.

---

## 9. Entity Relationship Summary

```
                    ┌──────────────┐
                    │    users     │
                    │ + app_context│
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │ SafeWay Kids│ │ PetTracker  │ │ CareConnect │
    ├─────────────┤ ├─────────────┤ ├─────────────┤
    │ students    │ │ pets        │ │ cc_children  │
    │ academies   │ │ pt_bookings │ │ cc_bookings  │
    │ vehicles    │ │ walk_session│ │ care_sessions│
    │ gps_history │ │ walk_gps_*  │ │ activity_logs│
    │ invoices    │ │ walker_qual │ │ cg_qual      │
    │ enrollments │ │ walker_avail│ │ cg_avail     │
    │ guardian_   │ │ walker_     │ │ caregiver_   │
    │   consents  │ │   wallets   │ │   wallets    │
    │ driver_loc_ │ │ walker_     │ │ caregiver_   │
    │   consents  │ │   reviews   │ │   reviews    │
    └─────────────┘ └─────────────┘ │ child_       │
                                    │   consents   │
                                    └──────────────┘
    
    Shared tables:
    ├── wallet_transactions
    ├── commission_records
    ├── subscriptions
    ├── location_consents (new apps)
    ├── messages (+ app_context)
    ├── audit_logs
    ├── notification_logs
    └── data_retention_policies
```

---

## 10. Review Verdict

| Area | Assessment |
|------|-----------|
| Schema migration safety | MEDIUM RISK — ALTER TYPE non-transactional requires careful handling |
| Data isolation | STRONG — separate table graphs per app, shared only at `users` level |
| Index coverage | ADEQUATE for MVP — PostGIS upgrade path clear for V1.1 |
| Compliance | REQUIRES IMPLEMENTATION — purge cron and consent tables are mandatory |
| Performance at scale | MANAGEABLE — GPS partitioning is the critical path item |
| Overall readiness | READY FOR TECH SPEC with the 5 Priority-1 items addressed in the migration |

---

*Review completed by DB Architect, 2026-04-03*
