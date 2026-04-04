# Requirement Brief - PetTracker

Date: 2026-04-02
Author: Requirement Analyst
Status: DRAFT

---

## 1. Objective

Build PetTracker, a Korean pet-care matching platform pairing pet owners with
professional walkers/pet-sitters, providing real-time GPS walk tracking,
auto-payment via Toss Payments, and compliance-aligned location data management.
The platform reuses the safeway_kids backend infrastructure (auth, GPS pipeline,
billing, FCM, Redis buffering) as a shared core while adding a new pet/walker
domain layer.

---

## 2. In Scope

- Pet Owner and Walker registration (phone OTP + Kakao OAuth)
- Walker qualification records: background check, certification, service area
- Pet profile management: species, breed, age, medical notes, vaccination records
- Service booking flow: Owner posts request, Walker accepts, booking confirmed
- Real-time GPS walk tracking via WebSocket (Walker streams, Owner views)
- Walk session lifecycle: start, GPS active, end, summary with route replay
- Walker availability calendar (daily slots)
- Proximity-based matching: distance, rating, availability; 3 km default radius
- 15% platform commission via Toss Payments
- Premium subscription 4,900 KRW/month for Owner and Walker tiers
- FCM push notifications plus NHN Cloud SMS fallback
- Admin dashboard: user management, commission reports, dispute resolution
- GPS compliance: 6-month retention, access log, purge cron
- Walker rating and review system post-walk
- In-app messaging between Owner and Walker per booking

---

## 3. Out of Scope

- Veterinary telemedicine or vet booking
- IoT collar or hardware GPS devices (Walker phone is the GPS source)
- Insurance claim processing
- Native builds beyond Expo Go SDK 54 for MVP
- Multi-language support (Korean only for MVP)
- KakaoMap native SDK due to Expo Go constraint
- safeway_kids academy, student, and vehicle domain
- CareConnect domain (separate brief)

---

## 4. Functional Requirements

FR-PT-01: User registration via phone OTP or Kakao OAuth for PET_OWNER and WALKER
roles. JWT access/refresh tokens issued on success.

FR-PT-02: Walker submits background check date, certification type, and service
areas. Platform Admin approves qualification before Walker appears in search.

FR-PT-03: Owner creates pet profiles with species, breed, birth date, weight,
vaccination status, medical notes, and photo URL.

FR-PT-04: Owner creates booking request specifying pet(s), service type
(walk, drop-in, boarding), datetime, duration, and pickup location lat/lon.

FR-PT-05: System returns ranked available Walkers within configurable radius
(default 3 km) sorted by distance, rating, and completion rate.

FR-PT-06: Walker accepts booking within 15-minute configurable timeout.
Status transitions: pending to confirmed.

FR-PT-07: Walk GPS streaming -- Walker app sends GPS updates; Owner subscribes
via WebSocket. Reuses Redis buffer-flush pattern from vehicle_telemetry module.
Key schema changes from vehicle:{id}:gps to walk_session:{id}:gps.

FR-PT-08: WalkSession records start/end timestamps, total distance computed from
GPS history, and route polyline stored as JSON.

FR-PT-09: Walk end triggers Toss Payments charge. 85% credited to Walker wallet,
15% retained as platform commission.

FR-PT-10: Walker wallet ledger visible in app. Payout to bank account on demand
(D+1) or weekly auto-payout.

FR-PT-11: Owner submits 1-5 star rating and text review within 48 hours of walk
end. Review is public on Walker profile.

FR-PT-12: FCM push for booking events (confirmed, declined, walk-start, walk-end).
SMS fallback if FCM fails.

FR-PT-13: Owner-Walker text chat per booking. Archived 30 days post-walk.

FR-PT-14: Premium subscription billed monthly via Toss recurring.
Owner Premium: priority matching + history export.
Walker Premium: featured listing + analytics.

FR-PT-15: Platform Admin views all users and bookings, adjusts commission rate,
suspends users, exports billing reports.

FR-PT-16: Location data purged after 180 days. Access log retained 180 days.
Owner consent recorded before GPS activates per Articles 15/16 of Korean
Location Information Act.

---

## 5. Non-Functional Requirements

NFR-PT-01: GPS Owner-visible latency at most 3 s p95 under 500 concurrent sessions.
NFR-PT-02: Non-GPS API p95 response at most 300 ms.
NFR-PT-03: 99.5% monthly uptime.
NFR-PT-04: JWT HS256; no PII beyond user_id and role in payload.
NFR-PT-05: Toss Payments order_id idempotent per booking.
NFR-PT-06: React Native / Expo SDK 54, iOS and Android.
NFR-PT-07: Python / FastAPI / SQLAlchemy async / PostgreSQL / Redis.
NFR-PT-08: Monorepo under apps/pettracker/ with packages/core-backend/ and packages/core-mobile/.
NFR-PT-09: >= 80% unit test coverage on pet, booking, walk_session, wallet.
NFR-PT-10: Privacy policy and location terms accepted at registration.

---

## 6. Codebase Touchpoints

All paths relative to repository root. All files verified by reading during this analysis.

backend/app/modules/auth/models.py
  UserRole StrEnum (line 11): PARENT, DRIVER, STUDENT, SAFETY_ESCORT, ACADEMY_ADMIN,
  PLATFORM_ADMIN. PET_OWNER and WALKER values must be added. Central architectural risk.

backend/app/modules/auth/service.py
  otp_login_or_register, kakao_login, create_token_response, send_otp, verify_otp
  directly portable. OTP lockout (5 failures, 15-minute lock) is production-ready.

backend/app/middleware/auth.py
  get_current_user (line 16) directly portable. Role guards must recognise
  PET_OWNER and WALKER.

backend/app/modules/vehicle_telemetry/service.py
  update_gps, flush_gps_buffer, purge_old_gps_data, log_location_access reusable
  with GPS subject changed from vehicle to walk session. check_vehicle_access
  must be replaced by check_walk_session_access.

backend/app/modules/vehicle_telemetry/models.py
  GpsHistory FK to vehicles.id (line 87): must change to walk_sessions.id.
  LocationAccessLog FK to vehicles.id (line 73): same change required.
  DataRetentionPolicy: reusable as-is.

backend/app/modules/billing/models.py
  Payment: directly portable. BillingPlan coupled to academy_id.
  Invoice coupled to academy_id and student_id. New WalkInvoice and
  CommissionRecord models needed.

backend/app/modules/billing/providers/toss_payments.py
  Directly reusable for one-time payment confirm. Recurring billing key flow
  for premium subscriptions is not verified in this file.

backend/app/modules/notification/service.py
  FCM + SMS dispatch and fallback directly portable. Notification type names
  (boarding, alighting) must be renamed for pet domain.

backend/app/modules/compliance/models.py
  GuardianConsent is the analogue for GPS consent but has FK to students table.
  A new WalkerLocationConsent model is needed. DataRetentionPolicy reusable as-is.

backend/app/modules/escort/models.py
  EscortAvailability (date + time slot + status) maps to WalkerAvailability.

backend/app/modules/messaging/models.py
  Message model verified: sender_id, receiver_id, content, is_read,
  retention_expires_at, academy_id (nullable). academy_id can be NULL for
  PetTracker. MVP reuse valid; BookingMessage table cleaner long-term.

backend/app/modules/admin/models.py
  AuditLog verified: entity_type, entity_id, action, details, ip_address.
  Directly reusable for Admin actions on PetTracker entities.

backend/migrations/
  New Alembic migration(s) needed for: pets, walk_sessions,
  walker_qualifications, walker_wallets, bookings, walker_reviews,
  walker_availability, walker_location_consents.

---

## 7. Assumption Register

A-PT-01: Shared PostgreSQL instance with table-prefix or schema separation between apps.
  Not a separate database per app. UNCONFIRMED.

A-PT-02: UserRole enum extended with PET_OWNER and WALKER in the shared users table.
  UNCONFIRMED -- depends on OQ-PT-02.

A-PT-03: Walker wallet is a platform-internal ledger table. No third-party wallet for MVP.

A-PT-04: Matching uses Haversine distance in Python or PostGIS plus rating sort. No ML.

A-PT-05: Background check is self-declared by Walker with document upload.
  Platform Admin manually approves.

A-PT-06: GPS sent every 5 seconds from Walker phone (same as safeway_kids driver).

A-PT-07: messaging/models.py Message model reusable with academy_id = NULL for
  PetTracker in-app chat. Confirmed by reading the model in this analysis.

A-PT-08: Premium subscription uses Toss recurring billing key per user. One-time
  payment is confirmed implemented; recurring key flow assumed available in Toss
  API but not yet in toss_payments.py.

---

## 8. Open Questions

OQ-PT-01: Shared PostgreSQL DB or separate instance for PetTracker?
  Impact: Determines whether the users table is shared or forked.

OQ-PT-02: UserRole extension strategy?
  Option A: Add PET_OWNER and WALKER to existing StrEnum via ALTER TYPE migration.
  Option B: Add app_context column to users to distinguish domain.
  Option C: Separate pettracker_users table with its own role enum.
  Impact: Cascades into every module and JWT middleware. Must be resolved before Tech Spec.

OQ-PT-03: Maximum number of pets per Owner? (DB constraint and UX limit)

OQ-PT-04: Which service types are in MVP scope?
  Options: walk only; walk + drop-in; walk + drop-in + boarding.
  Impact: Sizes the booking state machine and pricing model.

OQ-PT-05: Walker payout timing: D+1 on-demand, weekly auto, or both?
  Impact: Wallet service design and Toss payout API scope.

OQ-PT-06: Matching radius: per Walker (custom service area polygon) or platform-wide?

OQ-PT-07: Booking timeout behavior: auto-assign to next ranked Walker or
  notify Owner to re-search?

OQ-PT-08: Subscription billing: recurring Toss billing key per user or monthly one-time?

OQ-PT-09: Target launch date for PetTracker MVP?

OQ-PT-10: Admin dashboard: extend existing web/ or build separate app?

---

## 9. Acceptance Criteria Draft

AC-PT-01: Pet Owner registers via phone OTP, creates a pet profile, posts a walk
  request, and receives a booking confirmation. No errors at any step.

AC-PT-02: Walker registers, qualification approved by Admin, appears in Owner
  search results, accepts booking, starts walk with GPS streaming, ends walk,
  and Walker wallet credited 85% of the charge.

AC-PT-03: During active walk, Owner app receives GPS position updates within 3
  seconds of Walker phone sending them (verified with simulated coordinates).

AC-PT-04: Walk end triggers Toss Payments charge equal to duration x rate.
  Walker ledger shows 85%. Commission record shows 15%. Both verifiable in Admin
  billing report.

AC-PT-05: GPS purge cron deletes GpsHistory records older than 180 days.
  Location access log records past retention_until are deleted. Verified against
  test data.

AC-PT-06: Walker with is_qualified = False does not appear in any Owner search
  result for any service type.

AC-PT-07: FCM notification sent to Owner on walk start. When FCM returns failure
  in a mock, SMS sent to Owner registered phone number.

AC-PT-08: Owner submits rating. Walker average_rating updated and returned
  correctly in the same request cycle.

AC-PT-09: Platform Admin suspends user. That user receives HTTP 401 on next
  authenticated API call.

AC-PT-10: pytest reports >= 80% branch coverage on pet, booking, walk_session,
  and wallet service modules.

---

## 10. Risks / Unknowns

Risk: UserRole enum extension in shared PostgreSQL
Severity: HIGH
Notes: PostgreSQL ALTER TYPE ADD VALUE is non-transactional. Alembic must use
  a non-transactional migration step. If PetTracker and CareConnect both add roles
  without coordination, migration ordering conflicts occur.

Risk: GPS Redis key namespace collision with safeway_kids
Severity: MEDIUM
Notes: If apps share Redis, vehicle:{id}:gps and walk_session:{id}:gps must not
  overlap. A Redis key prefix policy must be established before deployment.

Risk: Toss recurring billing not yet implemented
Severity: MEDIUM
Notes: toss_payments.py handles one-time payment confirm only. Recurring billing
  key enrollment and monthly charge is a separate Toss API flow.

Risk: Walker GPS consent (Location Information Act Article 15)
Severity: HIGH
Notes: Walker is the GPS data subject during a walk. Explicit consent required
  before GPS collection begins. Existing DriverLocationConsent is the analogue
  but has safeway_kids users FK. A WalkerLocationConsent model is needed.

Risk: PostGIS availability
Severity: LOW-MEDIUM
Notes: Proximity matching needs PostGIS ST_DWithin or Haversine Python fallback.
  Confirm PostGIS enabled on the PostgreSQL instance before Tech Spec.

Risk: Messaging model schema semantics
Severity: LOW
Notes: Using Message with academy_id = NULL is valid MVP shortcut but misleading.
  A BookingMessage table is recommended for long-term clarity.

---

## 11. Readiness Verdict

NEEDS SPEC CLARIFICATION

Blockers before Tech Spec can be drafted:
  1. OQ-PT-01 and OQ-PT-02: database sharing and UserRole extension strategy.
     These affect every module and the JWT middleware.
  2. OQ-PT-04: MVP service types determine the booking state machine scope.

All other open questions can be resolved by the implementor with stated defaults
in the Assumption Register.
