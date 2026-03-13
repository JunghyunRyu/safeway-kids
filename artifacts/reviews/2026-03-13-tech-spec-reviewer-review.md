---
reviewer: tech-spec-reviewer
date: 2026-03-13
scope: M0-M2 MVP Architecture
---

# Tech Spec Review: SAFEWAY KIDS Architecture Decisions

## 1. Architecture Stress Test

**Question:** Will PostgreSQL + Firebase Realtime DB + Redis handle the 1-6 PM spike (500 concurrent vehicles, GPS pings every second)?

### Traffic math

- 500 vehicles x 1 GPS ping/sec = **500 writes/sec sustained** for 5 hours
- Each ping carries: vehicle_id, lat, lng, heading, speed, timestamp (~200 bytes)
- Total: 9 million pings per peak window, ~1.8 GB raw data/day

### Assessment: VIABLE with caveats

**Redis as buffer (correct decision).** Redis easily handles 500 writes/sec — this is well within single-instance capacity (~100K ops/sec). The architecture correctly prevents GPS pings from hitting PostgreSQL directly.

**Firebase Realtime DB (concerning).** Firebase RTDB has a hard limit of **200K simultaneous connections** on the Blaze plan and **100 writes/sec per database** on a single RTDB instance. 500 vehicles writing GPS + potentially hundreds of parents reading simultaneously could hit the write ceiling. Firebase RTDB is also priced per data stored and bandwidth, not per operation — at 9M pings/day, bandwidth costs will grow aggressively.

**Risks:**
1. **Firebase RTDB write throughput.** 500 GPS writes/sec is 5x the recommended 100 writes/sec per RTDB instance. Mitigation: shard across 5-6 RTDB instances by vehicle_id range, or switch to Firebase Firestore (which has higher per-database write limits but introduces different consistency tradeoffs).
2. **Redis-to-PostgreSQL batch write window.** The architecture says Redis buffers and batch-writes to PostgreSQL for historical records. If batch writes lag during peak, the Redis memory footprint grows. Need to define: batch interval (every 5s? 30s?), max buffer size, and back-pressure behavior.
3. **Firebase fan-out to parents.** Each vehicle GPS update may fan out to 10-30 parent clients. At 500 vehicles, that is 5,000-15,000 client pushes per second. Firebase handles this via its internal infrastructure, but costs scale with connected clients and data transferred.

**Recommendation:** Benchmark Firebase RTDB write throughput with 500 concurrent writers in a load test before committing. Consider **Firestore** or a **custom WebSocket server with Redis Pub/Sub** as the real-time layer if Firebase RTDB cannot sustain the rate without sharding complexity.

---

## 2. Modular Monolith Boundaries

**Proposed modules:** auth, routing-engine, vehicle-telemetry, billing, notification

### Assessment: Good foundation, but missing critical domains

**Correct modules:**
- `auth` — Kakao Login, Phone OTP, PIPA guardian consent
- `routing-engine` — VRP-TW, route CRUD, T-map integration
- `vehicle-telemetry` — GPS ingestion, edge AI event relay
- `billing` — Subscription, usage-based, settlement
- `notification` — FCM push, in-app alerts

**Missing modules:**

| Missing Module | Rationale |
|---|---|
| **student-management** | Core entity: students, guardians, academy enrollments, schedules. This is not auth (identity) and not billing (payment). It is the central domain linking parents, academies, and vehicles. Without it, student CRUD logic will leak into auth or routing. |
| **academy-management** | Academy profiles, contracts, compliance documents, vehicle fleet registration. The SRS calls out legal documentation archival and settlement per academy — this has distinct lifecycle and access control from billing. |
| **scheduling** | Daily schedules, cancellations, one-touch parent cancellation, schedule-to-route binding. This is the bridge between student-management and routing-engine. Without explicit ownership, schedule mutation logic will be scattered. |
| **compliance / audit** | PIPA consent records, data retention/deletion enforcement, CCTV access logs, safety escort presence verification. Given the regulatory weight in this domain, compliance logic should not be scattered across modules. |
| **edge-gateway** | The interface between edge devices and cloud. Handles event ingestion from Jetson Nano (abnormal behavior flags, facial recognition results, remaining occupant alerts). This is distinct from vehicle-telemetry (GPS) — different data shapes, different security requirements (biometric data), different latency constraints. |

**Recommended revised boundary map:**

```
auth
student-management
academy-management
scheduling
routing-engine
vehicle-telemetry
edge-gateway
billing
notification
compliance
```

This gives 10 modules. For M0-M2, `compliance` and `edge-gateway` can be thin stubs, but defining the boundary early prevents cross-contamination.

---

## 3. Backend Framework Recommendation

**Current status:** "FastAPI or Django -- TBD"

### Recommendation: **FastAPI**

| Criterion | FastAPI | Django |
|---|---|---|
| **Async support** | Native async/await, built on Starlette/uvicorn. Critical for handling 500+ concurrent WebSocket/SSE connections for GPS streaming. | Django 4.x+ has async views but the ORM is still synchronously bound. `django.db` calls block the event loop unless wrapped in `sync_to_async`. |
| **Real-time workload** | First-class WebSocket support. Natural fit for vehicle telemetry ingestion and parent real-time updates. | Requires Django Channels (separate ASGI layer), which adds deployment complexity and is a less mature abstraction. |
| **Python OR-Tools integration** | Direct Python import, no framework friction. OR-Tools batch jobs can be triggered as background tasks via FastAPI's `BackgroundTasks` or Celery. | Equally good. Django management commands are natural for batch jobs. |
| **API-first design** | Auto-generated OpenAPI docs, Pydantic models for request/response validation. Excellent for mobile app team coordination. | Django REST Framework (DRF) is powerful but more boilerplate. Serializer != Pydantic model, leading to duplication. |
| **ORM / DB** | No built-in ORM. Pair with **SQLAlchemy 2.0** (async) or **Tortoise ORM**. Requires explicit choice. | Django ORM is mature, migration-friendly, and battle-tested. Strongest argument for Django. |
| **Admin panel** | No built-in admin. Must build or use third-party (e.g., SQLAdmin). | Django Admin is a significant accelerator for the Academy Dashboard prototype. |
| **Learning curve** | Smaller, focused. Team ramps up faster. | Larger framework, more conventions to learn, but more guardrails. |
| **Maturity for Korean ecosystem** | Kakao/Naver SDK libraries exist for both. No significant difference. | Same. |

**Decisive factors for FastAPI:**

1. **The core workload is real-time.** GPS ingestion, live tracking push, alert dispatch — these are async I/O-bound tasks. FastAPI's native async model avoids the Django-async impedance mismatch.
2. **VRP-TW engine is a separate process** (per AD6). The backend framework mostly handles API + real-time, not heavy computation. FastAPI is lighter for this role.
3. **Mobile-first API design.** Three separate client apps (Parent, Driver, Admin) means the backend is primarily an API server. FastAPI's OpenAPI-first approach accelerates client development.

**Mitigations for FastAPI weaknesses:**
- Use **Alembic** for database migrations (SQLAlchemy equivalent of Django migrations).
- Use **SQLAdmin** or build a minimal admin API for the Academy Dashboard — the dashboard is React.js anyway, not Django templates.
- Enforce project structure conventions manually (FastAPI does not impose directory structure like Django does). Define a clear module layout in M0.

**Risk if choosing Django:** The team will fight Django's synchronous ORM when building the telemetry and real-time notification pipeline. `sync_to_async` wrappers everywhere create subtle bugs and performance cliffs.

---

## 4. Data Model Concerns

### 4.1 The Schedule-Route Binding Problem (Hardest)

A `schedule` (student S attends academy A on Tuesdays and Thursdays at 3 PM) is a recurring intent. A `route` (vehicle V visits stops [X, Y, Z] in order at [3:05, 3:12, 3:18]) is a daily physical plan derived from many schedules. The VRP-TW engine consumes schedules and produces routes.

**Challenges:**
- Schedules change frequently (parent one-touch cancellation, new student enrollment mid-week).
- Each schedule change potentially invalidates the day's routes.
- Routes must be generated fresh daily (batch) but also recalculated on-demand (cancellation during operation).
- Historical routes must be preserved for billing and compliance audit.

**Recommendation:** Model `schedule_template` (recurring weekly intent) separately from `daily_schedule_instance` (materialized for a specific date) and `route_plan` (output of VRP-TW for a specific date). Never mutate a generated route_plan — create a new version on recalculation.

### 4.2 Multi-Academy Student Enrollment

A single child may attend multiple academies with different schedules. The contract relationship is parent-to-academy, but billing may flow through the platform. The student entity must support N:M academy relationships with per-academy schedule templates, and the billing module must handle split attribution.

### 4.3 Biometric Data Lifecycle

Facial recognition embeddings (FaceNet vectors) are biometric data under PIPA. The architecture says "not persisted beyond inference" — but the system needs *some* reference embedding to match against. The model must distinguish:
- **Reference embedding:** stored encrypted (AES-256), with explicit guardian consent, deletion on withdrawal
- **Inference frame:** ephemeral, never persisted, processed only on edge device
- **Match result:** stored as a non-biometric event log (student_id, timestamp, confidence_score, boarding/alighting)

This three-tier distinction must be explicit in the data model, not an afterthought.

### 4.4 Legal Contract Chain

The platform is a "contract intermediary." Every ride has a legal chain: parent -> academy -> platform -> charter operator -> driver. The data model must represent `contract` as a first-class entity linking these parties, with timestamps, consent records, and version history. This is not a simple foreign key — it is a compliance artifact.

---

## 5. Security Gaps (PIPA for Under-14, Biometrics, MVP)

### 5.1 Legal Guardian Consent Flow

PIPA Article 22 requires **verifiable legal guardian consent** before collecting personal information of children under 14. The architecture mentions Phone OTP for guardian verification, but the implementation must:
- Verify that the OTP recipient is actually the legal guardian (not just any adult)
- Store consent records with timestamp, consent scope, and withdrawal mechanism
- Support consent withdrawal that triggers cascading data deletion

**Gap:** No consent management data model or API is mentioned in the architecture decisions. This must be in M0, not deferred.

### 5.2 AES-256 Encryption Scope

AD7 says "AES-256 for biometric/CCTV data." Questions:
- **At rest or in transit or both?** Must be both under PIPA.
- **Key management?** Who holds the encryption keys? Cloud KMS? Per-vehicle keys? Key rotation policy?
- **Edge device key storage.** Jetson Nano devices must hold decryption keys for local inference. If a device is physically stolen, all biometric data is compromised unless keys are stored in a hardware security module (HSM) or TPM.

**Gap:** No key management architecture is documented. For MVP, at minimum: use cloud KMS (AWS KMS / GCP KMS) for server-side, and define a threat model for edge device compromise.

### 5.3 Data Retention and Deletion

PIPA requires purpose-limited retention. The architecture must define:
- GPS history: how long retained? (Billing needs ~90 days; compliance audit may need 1 year)
- Facial recognition reference embeddings: deleted within N days of service termination
- CCTV inference logs: retained for incident investigation, auto-deleted after N days
- Consent records: retained for the legally required period even after account deletion

**Gap:** No data retention policy is defined. Must be defined in M0 as it affects schema design (soft deletes, retention timestamps, automated purge jobs).

### 5.4 API Authentication and Authorization

Three user roles (parent, driver, academy admin) with very different data access rights. The architecture mentions Kakao Login and Phone OTP but does not describe:
- Token format (JWT? Opaque?)
- Role-based access control (RBAC) enforcement layer
- API rate limiting per role
- Cross-tenant data isolation (parent A must never see parent B's child data)

**Gap:** RBAC design must be in M0 scope.

---

## 6. Integration Risks

### Risk ranking (highest to lowest):

| Rank | Integration | Risk Level | Rationale |
|---|---|---|---|
| 1 | **T-map API** | **HIGH** | T-map's enterprise API pricing is opaque and negotiation-dependent. No public self-serve tier for commercial use. If negotiation fails or pricing is prohibitive, the entire driver routing experience is blocked. The abstraction layer (AD4) is a correct mitigation, but must be built from day one, not retrofitted. Additionally, T-map API rate limits for real-time route recalculation (500 vehicles x potential recalculations) must be confirmed. |
| 2 | **Kakao Login** | **MEDIUM** | Kakao Login is well-documented and widely used in Korea. Risk: Kakao's OAuth consent screen customization is limited — the PIPA guardian consent flow may need to be a separate step after Kakao login, not embedded in it. Also, Kakao account deactivation by the user does not notify your platform — orphaned accounts must be handled. |
| 3 | **Firebase Realtime DB** | **MEDIUM** | As analyzed in Section 1, throughput ceiling is a concern. Additionally, Firebase's security rules language is limited — complex RBAC (parent sees only their child's vehicle) requires careful rule design. Firebase outages (rare but not zero) would black out all real-time tracking. |
| 4 | **FCM (Push Notifications)** | **LOW-MEDIUM** | FCM is reliable but has known issues: iOS delivery can be delayed if the app is in background/killed state (APNs intermediary), Android OEM battery optimization can block FCM. For safety-critical notifications (child not picked up, abnormal behavior), FCM alone may not be sufficient. Consider a fallback SMS path for critical alerts. |
| 5 | **Kakao Maps** | **LOW** | Well-documented JavaScript/React SDK. Low integration risk for display purposes. |

### Missing integration: **SMS/LMS Gateway**

The architecture does not mention an SMS provider, but Phone OTP (AD3) requires one. Korean SMS gateways (NHN Cloud, CoolSMS, Aligo) are straightforward but need to be selected and integrated in M0.

---

## 7. Scalability Bottlenecks

### Bottleneck #1: Firebase Realtime DB write throughput

As analyzed in Section 1. First wall hit at ~100 writes/sec per RTDB instance. At 500 vehicles, this is the first component to fail.

### Bottleneck #2: VRP-TW computation time

AD6 says Google OR-Tools runs as a batch job for morning route generation. At 500 vehicles with 20-30 stops each, OR-Tools VRP-TW can take **minutes to converge** depending on constraint complexity. The SRS requires route recalculation within 30 seconds for cancellations.

**Risk:** Full re-optimization of 500 vehicles in 30 seconds is not feasible with OR-Tools on a single server. Mitigation: recalculate only the affected vehicle's route (local optimization), not the global solution.

### Bottleneck #3: Push notification fan-out during peak

500 vehicles x 30 parents per vehicle = 15,000 push notifications per GPS update cycle. If GPS updates every second, that is 15,000 pushes/sec. FCM can handle this, but the backend must batch and dispatch efficiently. A naive "loop and send" implementation will choke.

**Recommendation:** Use FCM topic messaging — subscribe each parent to their child's vehicle topic. Firebase handles the fan-out server-side.

### Bottleneck #4: PostgreSQL historical write volume

If Redis batches GPS pings to PostgreSQL every 30 seconds: 500 vehicles x 30 pings = 15,000 rows per batch. This is manageable. But if the batch interval is too short (every 1 second), PostgreSQL will see 500 inserts/sec sustained, which requires connection pooling (PgBouncer) and likely table partitioning by date within the first year.

### Bottleneck #5: Concurrent WebSocket connections

If parents use WebSocket for real-time map tracking: 500 vehicles x 30 parents = 15,000 concurrent WebSocket connections. A single FastAPI/uvicorn instance handles ~5,000-10,000 WebSocket connections. Need 2-3 instances minimum behind a load balancer, with sticky sessions or Redis-backed pub/sub for cross-instance broadcast.

### Scale ceiling summary

| Component | Comfortable limit | 500-vehicle stress | 5,000-vehicle stress |
|---|---|---|---|
| Redis | 100K ops/sec | No issue | No issue |
| Firebase RTDB (single) | ~100 writes/sec | **FAIL** | **FAIL** |
| PostgreSQL (batch) | 5K inserts/sec | OK with batching | Needs partitioning |
| VRP-TW (single node) | ~50 vehicles/30sec | Needs local-only recalc | Needs sharding by region |
| WebSocket (per instance) | ~5-10K connections | Needs 2-3 instances | Needs 15+ instances |
| FCM | High (Google infra) | OK with topics | OK with topics |

---

## 8. Top 5 Actionable Recommendations for M0 (Foundation)

### R1: Benchmark Firebase RTDB and define the real-time layer decisively

**Action:** Before writing production code, run a load test with 500 simulated vehicle writers and 5,000 simulated parent readers against Firebase RTDB. Measure: write throughput, read latency, and cost projection for 30 days. If it fails or costs are unreasonable, pivot to **Redis Pub/Sub + custom WebSocket server** for real-time GPS fan-out, keeping Firebase only for push notifications (FCM).

**Deadline:** M0, week 1-2.

### R2: Choose FastAPI and lock the backend stack

**Action:** Select FastAPI + SQLAlchemy 2.0 (async) + Alembic + Pydantic v2. Define the monorepo module directory structure with the 10-module boundary map. Create skeleton `router`, `service`, `repository` layers per module. Enforce this structure via a linter or CI check.

**Deadline:** M0, week 1.

### R3: Design the PIPA consent and data retention schema upfront

**Action:** Model `guardian_consent` (consent_id, guardian_id, child_id, scope, granted_at, withdrawn_at), `data_retention_policy` per data category, and `deletion_job` queue. Implement consent verification as middleware that blocks child-data APIs without active consent. This is not deferrable — it affects every API that touches child data.

**Deadline:** M0, week 2-3.

### R4: Build the T-map/Kakao Maps abstraction layer immediately

**Action:** Define a `MapProvider` interface with methods: `geocode()`, `reverse_geocode()`, `route()`, `eta()`, `display_url()`. Implement `TmapProvider` and `KakaoMapsProvider` behind this interface. All application code references only the interface. This protects against T-map negotiation failure and enables provider switching.

**Deadline:** M0, week 2-3.

### R5: Define the schedule-route data model with versioning

**Action:** Design and implement: `schedule_template` (recurring), `daily_schedule_instance` (materialized), `route_plan` (versioned, immutable once generated), `route_plan_version` (created on each recalculation). Write migration scripts. Validate with a walkthrough: "Parent cancels at 2:45 PM, what happens to the route, the driver app, and the billing record?"

**Deadline:** M0, week 3-4.

---

## Summary Verdict

| Area | Rating | Notes |
|---|---|---|
| Database stack | PARTIALLY VIABLE | Redis + PostgreSQL are solid. Firebase RTDB needs load testing before commitment. |
| Module boundaries | NEEDS REVISION | 5 modules insufficient. Recommend 10 with explicit student, academy, scheduling, compliance, and edge-gateway domains. |
| Backend framework | RECOMMENDATION MADE | FastAPI, for async-native real-time workload fitness. |
| Data model | HIGH RISK AREAS IDENTIFIED | Schedule-route binding, biometric lifecycle, and legal contract chain are the trickiest. |
| Security (PIPA) | GAPS EXIST | Consent management, key management, data retention, and RBAC are undocumented. Must be M0 scope. |
| Integration risk | T-MAP HIGHEST | Opaque enterprise pricing and rate limits. Abstraction layer is essential. |
| Scalability | FIREBASE IS FIRST WALL | Single RTDB instance will not sustain 500 vehicles at 1 ping/sec. |

**Overall assessment:** The architecture decisions are directionally sound — the choice of modular monolith, Redis buffering, and OR-Tools are well-reasoned. The primary risks are (1) Firebase RTDB throughput ceiling, (2) missing PIPA compliance infrastructure, and (3) insufficient module granularity. All three are addressable in M0 if prioritized now.
