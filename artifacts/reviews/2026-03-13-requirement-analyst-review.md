---
reviewer: requirement-analyst
date: 2026-03-13
scope: M0-M2 MVP
---

# Independent Review: SAFEWAY KIDS M0-M2 MVP

## 1. Requirement Restatement

SAFEWAY KIDS is an AI-powered children's shuttle bus sharing platform for the Korean private education market, operating as a legal contract intermediary between academies and charter bus operators. The M0-M2 MVP scope covers project scaffolding (monorepo, CI/CD, DB schema, auth), core backend APIs (users, academies, vehicles, schedules), a minimal Driver App (GPS broadcasting, manual boarding check-in/out), a Parent App MVP (real-time map tracking, boarding/alighting push notifications), and a skeleton Admin Dashboard (academy login, student roster upload). The goal is to prove a complete end-to-end real-time data loop: driver location broadcasts flow through the backend to the parent app as live tracking and event notifications.

## 2. Missing Requirements

The following items appear in the SRS but are not adequately addressed in the Requirement Brief or Architecture Decisions for M0-M2:

| # | SRS Requirement | Gap |
|---|-----------------|-----|
| MR1 | **Legal guardian consent flow (PIPA, children under 14)** — SRS Section 8.1 mandates guardian consent at registration. The Requirement Brief mentions PIPA encryption but neither document specifies the consent UX, data fields, or age-verification mechanism for M2 registration. | Blocking for Parent App registration |
| MR2 | **Se-rim Act safety escort assignment** — SRS Section 4.3 requires mandatory safety escort presence. AD5 MVP scope includes a Driver App but makes no mention of a safety escort role, even as a data field. | At minimum, the data model should support a safety escort assignment per trip |
| MR3 | **Contract intermediary data model** — SRS Sections 4.1-4.2 detail that the platform must facilitate and document N:N electronic contracts between academy directors and charter bus operators. No data model or API for contracts is mentioned in M0-M1. | Core to the legal operating model; even MVP should have a contracts table |
| MR4 | **Vehicle registration and compliance tracking** — SRS Section 4.2 lists vehicle registration requirements (yellow paint, insurance, institution registration). AD7 lists no compliance-related data or API. | Academy Dashboard skeleton should at minimum display compliance status |
| MR5 | **WebSocket or real-time push architecture** — SRS Section 5.1 and the data flow diagram show WebSocket for frontend real-time integration. Architecture Decisions mention Firebase Realtime DB but do not specify how clients subscribe (WebSocket, Firebase SDK, SSE). | Needs explicit decision for M2 Parent App |
| MR6 | **One-touch schedule cancellation** — SRS Section 7.1 lists this as a Parent App feature. Not mentioned in AD5 MVP scope. | May be deferred, but should be explicitly stated |
| MR7 | **Concurrent vehicle scalability target** — SRS specifies 500 initial vehicles. No load/capacity targets are set for MVP. | Should define MVP scale (e.g., 10 vehicles for pilot) |
| MR8 | **Edge AI simulation strategy** — Open Question Q6 asks how edge AI will be simulated. No answer is recorded in the Architecture Decisions. | Not blocking for M0-M2 if AI features are deferred, but the brief lists AC5/AC6 (abnormal behavior, facial recognition) as acceptance criteria, creating ambiguity |

## 3. Conflicts

| # | Conflict | Documents | Severity |
|---|----------|-----------|----------|
| C1 | **Acceptance criteria vs. MVP scope mismatch** — The Requirement Brief lists AC5 (abnormal behavior detection alerts) and AC6 (facial recognition >=95%) as acceptance criteria, but AD5 explicitly excludes edge AI from M0-M2. These ACs cannot be met by M2. | Brief AC5/AC6 vs. AD5 | HIGH — must clarify which ACs apply to M0-M2 vs. later milestones |
| C2 | **Backend framework undecided** — AD7 lists "Python (FastAPI or Django) -- TBD" but M0 is supposed to scaffold the project. This decision must be made before M0 begins. | AD7 vs. M0 scope | MEDIUM — blocking for M0 |
| C3 | **Milestone numbering overlap** — The SRS uses Phase 0-4 with month-based durations; the Requirement Brief uses M0-M8 with different boundaries. AD5 redefines M0-M2 to include a minimal Driver App, which the original M0-M2 in the Requirement Brief did not include (M3 was Driver App MVP). | Brief Section 9 vs. AD5 | MEDIUM — the AD5 definition should be treated as authoritative since it is user-approved, but the Brief's milestone table needs updating |
| C4 | **CI/CD undecided** — AD7 lists CI/CD as "TBD" but M0 scope includes CI/CD pipeline setup. | AD7 vs. AD5/M0 | LOW — can be resolved during M0 |

## 4. Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| TR1 | **Real-time GPS pipeline latency under load** — Redis -> Firebase RTDB -> client chain introduces multiple hops. If any link degrades during 1-6 PM peak, parents lose live tracking. | MEDIUM | HIGH | Define latency budget per hop early; build a load test harness in M1; set a fallback polling interval |
| TR2 | **Kakao Maps + T-map dual integration complexity** — Two separate map providers with different SDKs, coordinate systems, and rate limits in the same app ecosystem increases integration surface. | MEDIUM | MEDIUM | Build the abstraction layer (per AD4) in M1 before any map UI work; define a single internal geo format |
| TR3 | **React Native performance for real-time map tracking** — Continuous GPS rendering on React Native can cause frame drops and battery drain on lower-end Android devices common in Korea. | MEDIUM | MEDIUM | Profile early on a budget Android device; consider native map view bridge if RN MapView is insufficient |
| TR4 | **Firebase Realtime DB cost and scaling unpredictability** — Firebase RTDB pricing is per-connection and per-data-transferred. With 500 vehicles broadcasting GPS every second and many parent clients subscribed, costs can spike unexpectedly. | MEDIUM | HIGH | Model cost projections for 50/500/5000 vehicle scenarios before committing; consider Firestore or a self-hosted alternative if projections are unfavorable |
| TR5 | **PIPA compliance for children's data from day one** — Storing children's names, photos, schedules, and location data requires strict PIPA compliance. A data breach during MVP/pilot would be catastrophic. | LOW | CRITICAL | Implement encryption, access logging, and consent flows in M0-M1 (not deferred); engage a privacy review before pilot |

## 5. Alternative Designs

| # | Alternative | Trade-off | Recommendation |
|---|------------|-----------|----------------|
| ALT1 | **Replace Firebase RTDB with a self-hosted WebSocket server (e.g., Socket.io on FastAPI)** for GPS and alerts | More control over cost and latency; more ops burden | Consider if Firebase cost modeling (TR4) is unfavorable. For MVP, Firebase is faster to ship. |
| ALT2 | **Start with Kakao Maps only (drop T-map for MVP)** — Use Kakao Maps for both parent display and driver routing | Reduces integration surface by 50%; Kakao routing is less accurate for turn-by-turn | Recommended for M0-M2. Add T-map in M3 (Driver App full) when routing accuracy matters more. |
| ALT3 | **FastAPI over Django for backend** | FastAPI: async-native, better for real-time workloads, lighter. Django: richer ORM, admin panel, mature ecosystem. | FastAPI is the stronger fit given the real-time, API-first nature of this platform. Django admin is not needed since a React dashboard exists. |
| ALT4 | **Use Supabase (PostgreSQL + Realtime) instead of Firebase RTDB** | Unified PostgreSQL backend; built-in realtime subscriptions; avoids Google vendor lock-in. Slightly less mature mobile SDK. | Worth evaluating. Would simplify the data stack by removing a separate database. |
| ALT5 | **Defer Admin Dashboard from M2 to M3** and focus M2 entirely on the Parent-Driver data loop | Tighter MVP focus; academy onboarding becomes manual. | The AD5 scope already limits Dashboard to a skeleton. Keep it minimal but present — academy login + roster upload is essential for seeding test data. |

## 6. Testing Concerns

### What can be tested in M0-M2

- **Unit tests:** Backend API logic (auth, CRUD, schedule management), data validation, notification dispatch logic.
- **Integration tests:** PostgreSQL read/write, Redis caching, Firebase RTDB event propagation, FCM push delivery.
- **API contract tests:** OpenAPI spec validation, request/response schema enforcement.
- **Basic E2E:** Parent App registration -> add child -> view map (with mocked GPS data).

### What is hard to test

| Concern | Difficulty | Mitigation |
|---------|-----------|------------|
| **Real-time GPS tracking accuracy** — Requires actual moving vehicles or sophisticated GPS simulation | HIGH | Build a GPS replay tool that feeds recorded coordinates through the driver app's broadcast endpoint |
| **Push notification timing (<=3 seconds SLA)** — Depends on FCM infrastructure and device state | MEDIUM | Measure in controlled environment; document that real-world latency depends on FCM and device OS |
| **Multi-device concurrent load** — 1-6 PM traffic spike simulation | HIGH | Use k6 or Locust to simulate concurrent WebSocket/Firebase connections; define MVP load target (e.g., 10 vehicles, 100 parents) |
| **Korean localization completeness** — All UI strings must be in Korean | LOW | Use i18n framework from M0; automated lint check for missing translation keys |
| **Cross-platform React Native behavior** — iOS vs. Android rendering and notification differences | MEDIUM | Require testing on both platforms in CI; define a minimum device matrix (e.g., Galaxy A series, iPhone SE) |

### Testing strategy recommendation

Adopt a **test pyramid** approach: heavy unit tests (M0), API integration tests (M1), and a thin E2E smoke suite (M2). Defer load testing to M3-M4 when the driver app is more complete and realistic traffic patterns can be simulated.

## 7. Confidence

**MEDIUM**

Rationale:

- **Strengths:** The architecture decisions are well-reasoned and pragmatic (modular monolith, proven tech stack, clear MVP scope redefinition in AD5). The end-to-end data loop focus is the right MVP strategy.
- **Concerns:** (1) Several blocking open questions remain unresolved (backend framework, edge AI simulation, CI/CD tooling). (2) The acceptance criteria conflict (C1) must be resolved before M0 begins to avoid scope creep. (3) PIPA/legal compliance requirements are significant and cannot be deferred -- they affect the data model from M0. (4) The dual map provider strategy adds unnecessary complexity for MVP.
- **Overall:** M0-M2 as scoped in AD5 is achievable within a reasonable timeline (estimated 3-4 months for a small team), provided the blocking decisions are resolved first and the acceptance criteria are re-scoped to match the actual MVP deliverables. The risk is not in technical feasibility but in scope discipline and compliance readiness.

---

*Review produced by: requirement-analyst*
*Source documents: Requirement Brief (2026-03-13), Architecture Decisions (2026-03-13), SRS v1.0*
