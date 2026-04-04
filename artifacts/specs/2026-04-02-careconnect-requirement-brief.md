# Requirement Brief - CareConnect

Date: 2026-04-02
Author: Requirement Analyst
Status: DRAFT

---

## 1. Objective

Build CareConnect, a Korean childcare matching platform connecting parents with
verified caregivers (babysitters, nannies), providing real-time visit check-in
verification, automated payment via Toss Payments, and stricter compliance with
child personal data protection law (guardian consent mandatory for under-14).
The platform reuses the safeway_kids backend infrastructure while introducing
a caregiver/parent domain with heightened legal obligations.

---

## 2. In Scope

- Parent and Caregiver registration (phone OTP + Kakao OAuth)
- Caregiver qualification: background check (mandatory), CPR cert, identity
  verification, service areas
- Child profile management: name, birth date, allergies, medical notes,
  emergency contact, school info
- Service booking flow: Parent posts request, Caregiver accepts, booking confirmed
- Real-time visit check-in/check-out with GPS location verification (Caregiver
  must check in within 200 m of registered care address)
- Care session lifecycle: check-in, activity log updates, check-out, summary
- Caregiver availability calendar (daily and weekly recurring slots)
- Proximity-based matching: distance, rating, verification status; 5 km default
- 20% platform commission via Toss Payments
- Premium subscription 9,900 KRW/month for Parent and Caregiver tiers
- FCM push notifications plus NHN Cloud SMS fallback
- Admin dashboard: user management, commission reports, compliance audit, disputes
- Child data compliance: guardian consent mandatory for children under 14
- Caregiver rating and review system post-session
- In-app messaging between Parent and Caregiver per booking
- Government care service integration stub (API placeholder for MVP)

---

## 3. Out of Scope

- Full government care service API integration (stub only for MVP)
- Medical diagnosis or health monitoring integration
- School schedule import
- CCTV or smart home device integration
- Native builds beyond Expo Go SDK 54 for MVP
- Multi-language support (Korean only)
- KakaoMap native SDK (Expo Go constraint)
- safeway_kids academy, student, and vehicle domain
- PetTracker domain (separate brief)
- Legal registration as care service intermediary (code ready; license pending)

---

## 4. Functional Requirements

FR-CC-01: User registration via phone OTP or Kakao OAuth for PARENT and CAREGIVER
roles. JWT access/refresh tokens issued.

FR-CC-02: Caregiver submits background check date (mandatory), CPR certification,
identity document URL, and service areas. Admin approves before Caregiver appears
in search.

FR-CC-03: Parent creates child profiles (name, birth date, allergies, medical notes,
emergency contact, school info). Children under 14 require guardian consent record
before any caregiver can access child data.

FR-CC-04: Parent creates booking request specifying child(ren), care type, datetime,
duration, and care address lat/lon plus text.

FR-CC-05: System returns ranked available Caregivers within configurable radius
(default 5 km) sorted by distance, rating, completion rate, and verification tier.

FR-CC-06: Caregiver accepts booking within 30-minute timeout. Status: pending to
confirmed.

FR-CC-07: Care session check-in -- Caregiver triggers check-in on app. Backend
records GPS coordinates and verifies Caregiver is within 200 m of care address.
Parent receives FCM notification on successful check-in.

FR-CC-08: Caregiver submits activity log updates during session (text + optional
photo URL).

FR-CC-09: Care session check-out -- Caregiver triggers check-out. Backend records
end timestamp and total session duration.

FR-CC-10: Session end triggers Toss Payments charge (duration x hourly rate).
80% credited to Caregiver wallet, 20% platform commission.

FR-CC-11: Caregiver wallet ledger visible in app. Payout to bank account on demand
(D+1) or weekly auto.

FR-CC-12: Parent submits 1-5 star rating and text review within 48 hours.
Review is public on Caregiver profile.

FR-CC-13: FCM push for booking events (confirmed, declined, check-in, check-out,
activity update). SMS fallback on FCM failure.

FR-CC-14: Parent-Caregiver text chat per booking. Archived 30 days post-session.

FR-CC-15: Premium subscription billed monthly via Toss recurring.
Parent Premium: priority matching + session history export + 90-day photo archive.
Caregiver Premium: featured listing + analytics + qualification badge.

FR-CC-16: Platform Admin views all users and bookings, adjusts commission,
suspends users, exports billing and compliance reports.

FR-CC-17: Guardian consent: for children under 14, a ConsentRecord linked to
(child_id, caregiver_id, booking_id) must be created and consent granted before
session starts. Consent can be withdrawn.

FR-CC-18: Activity photos retained 30 days (free) or 90 days (premium). Purge
cron deletes expired photos. Purge event is logged.

FR-CC-19: Location data purged after 180 days. Access log retained 180 days.
Caregiver consent recorded before GPS check-in activates per Articles 15/16 of
Korean Location Information Act.

FR-CC-20: Audit log for all child profile data accesses (who, what, when) stored
for 1 year per Korean Personal Information Protection Act.

---

## 5. Non-Functional Requirements

NFR-CC-01: Check-in GPS verification must complete within 2 seconds.
NFR-CC-02: Non-GPS API p95 response at most 300 ms.
NFR-CC-03: 99.5% monthly uptime.
NFR-CC-04: JWT HS256; no child PII in JWT payload.
NFR-CC-05: Toss Payments order_id idempotent per booking.
NFR-CC-06: React Native / Expo SDK 54, iOS and Android.
NFR-CC-07: Python / FastAPI / SQLAlchemy async / PostgreSQL / Redis.
NFR-CC-08: Monorepo under apps/careconnect/ with packages/core-backend/ and
  packages/core-mobile/.
NFR-CC-09: >= 80% unit test coverage on child, booking, care_session, wallet,
  consent service modules.
NFR-CC-10: Privacy policy, location terms, and child data processing terms
  accepted at registration.
NFR-CC-11: Child data must not appear in plain text in application logs.
  Masking required (first char + asterisks).

---

## 6. Codebase Touchpoints

All paths relative to repository root. All files verified during this analysis.

backend/app/modules/auth/models.py
  UserRole StrEnum (line 11) currently has PARENT (for safeway_kids guardians).
  CareConnect needs PARENT and CAREGIVER roles. If PARENT is shared, a safeway_kids
  parent JWT would grant access to CareConnect parent endpoints -- critical RBAC
  risk. See OQ-CC-02.

backend/app/modules/auth/service.py
  otp_login_or_register and kakao_login directly portable. Role assignment at
  registration must distinguish CareConnect context from safeway_kids.

backend/app/middleware/auth.py
  get_current_user directly portable. Role guards need CAREGIVER recognised.

backend/app/modules/vehicle_telemetry/service.py
  log_location_access and purge_old_gps_data pattern reused for check-in GPS
  verification log. Full GPS streaming is NOT used for CareConnect MVP -- only
  a point-in-time GPS check per check-in event.

backend/app/modules/vehicle_telemetry/models.py
  LocationAccessLog pattern reused for check-in event. GpsHistory NOT reused
  (only point-in-time coordinates stored, not a continuous stream).
  DataRetentionPolicy: reusable as-is.

backend/app/modules/billing/models.py
  Payment: directly portable. BillingPlan coupled to academy_id. Invoice coupled
  to academy_id and student_id. New CareSessionInvoice model needed.

backend/app/modules/billing/providers/toss_payments.py
  Directly reusable for one-time payment confirm. Recurring billing key for
  subscription may need extension.

backend/app/modules/notification/service.py
  FCM + SMS pattern directly portable. Notification type names renamed.

backend/app/modules/compliance/models.py
  GuardianConsent is the analogue for child consent but has FK to safeway_kids
  students table. A new ChildConsent model with FK to CareConnect children
  table is needed. DataRetentionPolicy: reusable as-is.

backend/app/modules/admin/models.py
  AuditLog verified (line 44): entity_type, entity_id, action, details (JSON),
  ip_address. Directly reusable for FR-CC-20 child data access audit trail.
  Use entity_type = child convention.

backend/app/modules/messaging/models.py
  Message model verified: sender_id, receiver_id, content, retention_expires_at,
  academy_id (nullable). Reusable with academy_id = NULL for CareConnect chat.
  Same long-term caveat as PetTracker -- BookingMessage table cleaner.

backend/migrations/
  New Alembic migration(s) needed for: children, bookings, care_sessions,
  caregiver_qualifications, child_consents, caregiver_wallets, activity_logs,
  caregiver_location_consents.

---

## 7. Assumption Register

A-CC-01: Shared PostgreSQL instance with table-prefix or schema separation. UNCONFIRMED.

A-CC-02: CareConnect uses PARENT as an overloaded role or introduces PARENT_CC to avoid
  collision with safeway_kids PARENT. Not confirmed -- see OQ-CC-02.

A-CC-03: Children under 14 always require guardian consent. Non-waivable.
  Children 14+ can self-consent (out of MVP scope).

A-CC-04: GPS check-in uses a single coordinate point per check-in event, not continuous
  streaming. Walker-style GPS streaming is not required for MVP.

A-CC-05: Caregiver wallet is a platform-internal ledger table. No third-party wallet for MVP.

A-CC-06: Background check is self-declared by Caregiver with document upload.
  Platform Admin manually approves.

A-CC-07: Government care service integration is a stub API endpoint returning
  placeholder data for MVP.

A-CC-08: Activity photos stored in S3 or equivalent object storage. The app stores
  photo URL in the database, not binary data.

A-CC-09: Child data access audit log reuses the existing AuditLog table and log_audit
  function from admin/service.py with entity_type = child.

---

## 8. Open Questions

OQ-CC-01: Shared PostgreSQL DB or separate instance for CareConnect?
  Impact: Same as PetTracker -- determines users table strategy.

OQ-CC-02: How to handle PARENT role collision with safeway_kids?
  Option A: One user can serve both apps with same PARENT role; RBAC must be
    app-context-aware.
  Option B: Separate PARENT_CC role added to UserRole enum.
  Option C: app_context column on users to distinguish domain.
  Impact: Critical. A safeway_kids parent JWT granting access to CareConnect
    parent endpoints is a security risk. Must be resolved before Tech Spec.

OQ-CC-03: Maximum number of children per Parent account?

OQ-CC-04: Is GPS check-in mandatory for every session or optional?
  Impact: Determines whether Caregiver must enable location permissions.

OQ-CC-05: Which care types are in MVP scope?
  Options: hourly babysitting only; hourly + daily; hourly + daily + overnight.
  Impact: Sizes the booking model and pricing logic.

OQ-CC-06: Activity log photo uploads -- mandatory or optional?
  Impact: Determines whether S3 integration is required for MVP launch.

OQ-CC-07: Consent withdrawal -- does it cancel the current booking or only
  block future bookings with that caregiver?

OQ-CC-08: Target launch date for CareConnect MVP?

OQ-CC-09: Admin dashboard -- extend existing web/ or build separately?

OQ-CC-10: Child data masking scope -- required in API responses or only in logs?

---

## 9. Acceptance Criteria Draft

AC-CC-01: Parent registers, creates a child profile for a child under 14, and system
  requires guardian consent record before booking can be placed. Booking attempt
  without consent returns a validation error.

AC-CC-02: Caregiver registers, qualification approved by Admin, appears in Parent
  search results, accepts a booking.

AC-CC-03: Caregiver check-in GPS verification: if Caregiver is within 200 m of
  care address, check-in succeeds and Parent receives FCM notification. If more
  than 200 m away, check-in returns a validation error.

AC-CC-04: Session end triggers Toss Payments charge matching (duration x hourly rate).
  Caregiver wallet shows 80%. Commission record shows 20%. Both verifiable in Admin
  billing report.

AC-CC-05: AuditLog records every access to child profile data with user_id, timestamp,
  entity_type = child, and entity_id. Log is queryable by Admin.

AC-CC-06: Activity photos older than 30 days (free) or 90 days (premium) are deleted
  by purge cron. Purge event logged with photo count.

AC-CC-07: Child name does not appear in plain text in application log output.
  Masking (first char + asterisks) verified by running test session and checking logs.

AC-CC-08: Withdrawing guardian consent blocks new booking creation for that
  child-caregiver pair. Existing confirmed bookings flagged for Admin review.

AC-CC-09: Backend unit tests pass with >= 80% branch coverage on child, booking,
  care_session, wallet, and consent service modules.

AC-CC-10: Suspended Caregiver receives HTTP 401 on next authenticated API call
  and does not appear in Parent search results.

---

## 10. Risks / Unknowns

Risk: PARENT role collision with safeway_kids
Severity: HIGH
Notes: safeway_kids already has UserRole.PARENT. A CareConnect parent using the
  same phone number would receive the same role. Current RBAC middleware checks role
  without app context, so a safeway_kids parent JWT would grant access to CareConnect
  parent endpoints. Role disambiguation or app_context logic required before
  any cross-app deployment.

Risk: Child consent legal requirement
Severity: HIGH
Notes: Korean Personal Information Protection Act and Child Welfare Act require
  explicit guardian consent for processing personal data of children under 14.
  Consent must record method, timestamp, and IP address. The existing GuardianConsent
  in safeway_kids is the closest analogue but is FK-coupled to safeway_kids students
  table. Missing or invalid consent exposes the platform to regulatory fines.

Risk: UserRole enum extension (same risk as PetTracker)
Severity: HIGH
Notes: If both PetTracker and CareConnect extend the same UserRole enum without
  migration ordering coordination, ALTER TYPE migrations will conflict. Must be
  treated as a single coordinated migration.

Risk: Caregiver GPS consent (Location Information Act Article 15)
Severity: HIGH
Notes: Caregiver location is collected at check-in. Explicit consent required
  before any GPS data collection. A CaregiverLocationConsent model analogous to
  safeway_kids DriverLocationConsent is needed.

Risk: S3 or object storage dependency
Severity: MEDIUM
Notes: Activity photo URLs require an object storage bucket. safeway_kids does not
  have S3 integration in the verified codebase. This is a new infrastructure
  dependency that must be provisioned before MVP launch.

Risk: Audit log volume and query performance
Severity: LOW-MEDIUM
Notes: Every child profile access generates an audit_logs row. Index on
  (entity_type, entity_id, created_at) and partitioning strategy should be
  planned from the first migration.

---

## 11. Readiness Verdict

NEEDS SPEC CLARIFICATION

Blockers before Tech Spec can be drafted:
  1. OQ-CC-01 and OQ-CC-02: database sharing and PARENT role collision are the
     most critical unresolved decisions. A safeway_kids parent JWT granting
     access to CareConnect endpoints is a security and RBAC correctness risk.
  2. OQ-CC-04: GPS check-in mandatory vs optional determines Caregiver location
     permission requirements and consent flow scope.
  3. OQ-CC-05: MVP care types determine the booking state machine scope.

Recommendation: Resolve OQ-CC-01/02 jointly with PetTracker OQ-PT-01/02 since
both apps face the same shared-users architectural decision.
