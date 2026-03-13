# SAFEWAY KIDS — Consensus Matrix

**Date:** 2026-03-13
**Reviewers:** requirement-analyst (RA), tech-spec-reviewer (TSR)

---

## Resolution Summary

| # | Topic | RA Position | TSR Position | Agreement? | Resolution |
|---|-------|-------------|-------------|------------|------------|
| 1 | **AC5/AC6 vs MVP scope** | AC5/AC6 reference edge AI excluded from M0-M2 — conflict | Not directly addressed | N/A | **RESOLVED: Defer AC5/AC6 to M6 (Edge AI milestone). M0-M2 acceptance criteria rewritten below.** |
| 2 | **Backend framework** | Recommends FastAPI (ALT3) | Recommends FastAPI with detailed rationale | AGREE | **RESOLVED: FastAPI + SQLAlchemy 2.0 (async) + Alembic + Pydantic v2** |
| 3 | **Firebase RTDB risk** | Flags cost unpredictability (TR4) | Flags 100 writes/sec ceiling — single instance fails at 500 vehicles | AGREE on risk | **RESOLVED: M0 week 1-2 load test. If fails → pivot to Redis Pub/Sub + WebSocket for GPS, keep FCM for push. Design abstraction layer from day one.** |
| 4 | **Module boundaries** | Not addressed directly | 5 modules insufficient → recommends 10 | N/A | **RESOLVED: Adopt 10-module structure. `compliance` and `edge-gateway` are thin stubs for M0-M2.** |
| 5 | **PIPA compliance in M0** | Flags guardian consent as MR1 (blocking) | Flags consent, key mgmt, retention, RBAC as M0 scope | AGREE | **RESOLVED: PIPA infrastructure (consent model, RBAC, retention policy) is M0 scope, not deferred.** |
| 6 | **Maps: dual provider for MVP** | ALT2: Kakao-only for MVP, add T-map in M3 | R4: Build abstraction layer in M0 for both | PARTIALLY AGREE | **RESOLVED: Build map abstraction layer in M0. Implement Kakao Maps only for M0-M2. Add T-map provider in M3 after enterprise contract negotiation.** |
| 7 | **SMS gateway** | Not mentioned | Flags missing SMS provider for Phone OTP | N/A | **RESOLVED: Select NHN Cloud SMS (widely used in Korean enterprise) for M0.** |
| 8 | **Se-rim Act escort data** | MR2: data model should support escort per trip | Not directly addressed | N/A | **RESOLVED: Add `safety_escort` field to trip/vehicle assignment model in M0. Full matching logic deferred.** |
| 9 | **Contract intermediary model** | MR3: core to legal model, needs contracts table | Flags legal contract chain as data model concern | AGREE | **RESOLVED: `contract` as first-class entity in M0 schema — links academy, charter operator, platform.** |
| 10 | **Schedule-route data model** | Not detailed | R5: Detailed 3-table versioned model | N/A | **RESOLVED: Adopt `schedule_template` + `daily_schedule_instance` + `route_plan` (immutable, versioned) model.** |
| 11 | **CI/CD tooling** | Flags as undecided (C4) | Not addressed | N/A | **RESOLVED: GitHub Actions (standard, free for open/private repos). Docker + docker-compose for local dev.** |
| 12 | **MVP scale target** | MR7: define MVP scale | Scale ceiling table provided | AGREE | **RESOLVED: MVP target = 10 vehicles, 100 parents, 5 academies (pilot district). 500 vehicles = Phase 3 target.** |
| 13 | **One-touch cancellation** | MR6: should be explicit | Not addressed | N/A | **RESOLVED: Include in M2 (Parent App MVP). It's a schedule mutation + notification — core to the data loop.** |
| 14 | **Biometric data lifecycle** | Not detailed | 3-tier model: reference/inference/result | N/A | **RESOLVED: Adopt 3-tier model. Deferred to M6 implementation but schema placeholders in M0.** |
| 15 | **Push notification fallback** | Not addressed | FCM insufficient for safety-critical; suggests SMS fallback | N/A | **RESOLVED: Critical alerts (child not picked up, abnormal behavior) use FCM + SMS dual path. Standard alerts (boarding/alighting) use FCM only.** |

---

## Revised M0-M2 Acceptance Criteria

| ID | Criterion | Milestone |
|----|-----------|-----------|
| AC1 | Parent can register via Kakao Login, complete guardian consent (PIPA), and add children | M1-M2 |
| AC2 | Driver can log in via Phone OTP and broadcast GPS location | M1-M2 |
| AC3 | Parent app shows real-time bus location on Kakao Maps | M2 |
| AC4 | Driver app shows boarding roster and allows manual check-in/check-out per student | M2 |
| AC5 | System sends push notification (FCM) for boarding/alighting within 3 seconds | M2 |
| AC6 | Parent can cancel a scheduled ride with one tap; driver route updates accordingly | M2 |
| AC7 | Academy admin can log in, upload student roster, and view schedule | M2 |
| AC8 | All user-facing UI is in Korean (i18n framework in place) | M0-M2 |
| AC9 | RBAC enforces data isolation: parent sees only their children's data | M1 |
| AC10 | Guardian consent records are stored with timestamp, scope, and withdrawal mechanism | M1 |

**Deferred acceptance criteria (not M0-M2):**
- Edge AI abnormal behavior detection → M6
- Facial recognition >=95% → M6
- VRP-TW route optimization <=30 seconds → M5
- System availability >=99.95% → M8

---

## Unresolved Items (None Blocking)

All blocking items have been resolved. The following are noted for future milestones:
- T-map enterprise contract negotiation (before M3)
- Firebase RTDB load test may force architecture pivot (M0 week 1-2)
- Edge device key management / HSM strategy (before M6)
