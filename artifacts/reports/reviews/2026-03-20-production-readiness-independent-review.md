# Independent Review — Production Readiness Intake (tech-spec-reviewer)

**Date:** 2026-03-20
**Reviewer:** tech-spec-reviewer (subagent)
**Source document:** `artifacts/specs/2026-03-20-production-readiness-intake.md`
**Repository inspected:** `/home/jhryu/safeway_kids`

---

## 1. Requirement Restatement

The SAFEWAY KIDS platform is a children's shuttle-bus sharing system composed of four components:

- **Backend** — FastAPI + PostgreSQL + Redis, 5,559 LOC, 28+ REST APIs, WebSocket for real-time GPS, APScheduler for nightly route pipeline, 80/82 tests passing.
- **Mobile** — Expo SDK 54 / React Native, 6,472 LOC, 17 screens covering five roles (parent, driver, escort, admin, student), 0 tests.
- **Web dashboard** — React/Vite, 1,093 LOC, 6 pages (login, dashboard, students, schedules, billing, vehicles), 0 tests.
- **Landing site** — React/Vite, 3 pages (landing, privacy, terms), complete.

The project has received regulatory sandbox approval and needs to move from a local-dev state to production-deployable code without performing the actual cloud provisioning, store submissions, or third-party security audits. Concretely the intake requests:

1. Production-grade infrastructure code (Docker optimized, K8s manifests, GitHub Actions CI/CD).
2. Payment gateway integration code (Toss Payments assumed, test-mode only).
3. Real-distance accuracy in the routing engine (Kakao Mobility API).
4. Frontend test coverage from zero to meaningful minimums (10 mobile, 5 web tests).
5. Fix 2 failing backend tests.
6. Implement three missing features: student user-role, admin student-management UI (CRUD), Excel bulk-upload API.
7. Operational tools: legal-evidence archive, real-time control-center map, monthly statistics report.
8. Error-handling and UX stability improvements.
9. SMS/FCM production-mode switch.

Three milestones are proposed: MP-1 (backend), MP-2 (frontend), MP-3 (infrastructure). Seven open questions remain unresolved.

---

## 2. Missing Requirements

### MR-1 — Secrets Management Strategy Absent
**What is missing:** The intake specifies no strategy for managing production secrets (JWT secret key, AES encryption key, PG credentials, Firebase credentials, Kakao API keys, NHN SMS keys).

**Why it matters:** `config.py` defaults `jwt_secret_key = "change-me-in-production"` and `aes_encryption_key = "change-me-32-byte-key-for-prod!!"`. More critically, `firebase-credentials.json` is already committed to the repository. An SSH private key (`vmware_ubuntu.key`) is also present in the repo root. If this repository is or becomes public, all of these are immediate critical exposures.

**Required addition:** Add a mandatory secrets hygiene goal: (a) remove committed secrets from git history, (b) define how secrets reach production (AWS Secrets Manager / Kubernetes Secrets / environment injection), (c) make all sensitive default values fail-fast in production environment rather than silently accepting placeholder strings.

---

### MR-2 — Database Migration Safety Policy Absent
**What is missing:** No strategy for zero-downtime or safe DB migrations in production. The current Dockerfile runs `alembic upgrade head` on every container startup.

**Why it matters:** Running migrations on every startup is fragile in a multi-replica K8s deployment — multiple pods will race to apply the same migration. It also means any migration failure blocks the entire service from starting.

**Required addition:** Specify whether migrations run as a Kubernetes Job (pre-install hook), a separate init-container, or a CI/CD step. Add a rollback migration strategy.

---

### MR-3 — Security Hardening Requirements Missing
**What is missing:** No specification of: TLS termination ownership (app vs. ingress), HTTP security headers, CORS production origins, rate limiting, brute-force protection on auth endpoints, and token refresh security.

**Why it matters:** The service handles personal data of minors and financial transactions. `config.py` sets `debug: bool = True` as the default. CORS is not examined in the intake. Kakao OAuth redirect URI is currently hardcoded to `http://localhost:8000/...`.

**Required addition:** Add a non-functional security section covering TLS, CORS origin whitelist, rate limiting (especially `/api/v1/auth/*`), security headers (HSTS, CSP, X-Frame-Options), and `debug=False` enforcement in production.

---

### MR-4 — Personal Data of Minors / PDPA Compliance Gap
**What is missing:** The compliance module models `GuardianConsent` and `Contract`, but the intake makes no mention of a PDPA (개인정보보호법) compliance checklist for producing a service involving minors' GPS data, biometric risk, and financial data.

**Why it matters:** The regulatory sandbox context means the service is under legal scrutiny. Failure here can block sandbox approval. Student names, dates of birth, GPS coordinates, and guardian phone numbers are all collected.

**Required addition:** Add a compliance acceptance criterion verifying that data retention policies are configured, consent is captured for all new enrollments, and that the right-to-erasure path (`deleted_at` soft-delete) is end-to-end tested.

---

### MR-5 — No Rollback Strategy for Any Milestone
**What is missing:** The intake defines milestones but no rollback plan if a production deployment causes regression.

**Why it matters:** K8s manifests without a rollback strategy (e.g., `RollingUpdate` strategy, health probes, `kubectl rollout undo` procedure) are not truly production-ready.

**Required addition:** Add a rollback section to each milestone: what triggers a rollback, how it is executed, and which state (DB schema) is considered safe.

---

### MR-6 — Observability / Logging Specification Too Thin
**What is missing:** AC-15 mentions "Prometheus metrics endpoint" but there is no specification of structured logging, log aggregation destination, alert rules, or distributed tracing.

**Why it matters:** A production service with no log aggregation cannot be operated. The scheduling pipeline runs nightly (`pipeline_cron_hour = 0`); if it silently fails there is no observable signal.

**Required addition:** Specify structured JSON logging format, log output destination (stdout for K8s log scraping vs. external sink), and at least one alerting rule for critical jobs (nightly pipeline, GPS flush).

---

### MR-7 — Static Asset Delivery Strategy Missing
**What is missing:** Neither the web dashboard nor the landing site have a deployment target specified. The intake specifies K8s for the backend but says nothing about how the React SPAs are served.

**Why it matters:** Serving SPAs from a FastAPI backend or a generic nginx pod are both valid but require explicit Dockerfile and ingress configuration. Without specifying this, MP-3 will be ambiguous.

**Required addition:** Specify whether web/site are deployed to S3+CloudFront, Vercel, or as nginx containers in K8s. Affects CI/CD pipeline design.

---

### MR-8 — Excel Upload Feature Scope Undefined
**What is missing:** AC-10 ("엑셀 학생 일괄 업로드 API 동작") has no specification: file format, column mapping, error handling (partial failures), maximum row count, idempotency, duplicate detection strategy.

**Why it matters:** Without field-level specification this feature cannot be meaningfully tested or reviewed. The backend currently has no `student_management` upload router visible.

**Required addition:** Provide a schema for the expected Excel format, error response shape, and idempotency guarantee.

---

### MR-9 — Mobile Test Framework Not Installed
**What is missing:** `mobile/package.json` contains zero test dependencies (no Jest, no `@testing-library/react-native`, no `jest-expo`). AC-2 requires 10 mobile tests.

**Why it matters:** Writing 10 tests requires first setting up the test framework. This is not a trivial configuration step for Expo projects — it requires `jest-expo` preset, module name mappers for assets, and mock setup. The intake treats this as implementation work rather than setup work, but the setup is a prerequisite.

**Required addition:** Add an explicit sub-task for test infrastructure setup before any test-writing tasks in MP-2.

---

### MR-10 — Web Test Framework Not Installed
**What is missing:** Same issue as MR-9 for the web dashboard. `web/package.json` has no Vitest, Jest, or testing-library dependencies.

**Required addition:** Same as MR-9 for the web workspace.

---

### MR-11 — Database Connection Pooling Strategy Missing
**What is missing:** No specification of database connection pool size for production. The current async SQLAlchemy setup uses default pool settings.

**Why it matters:** Under K8s multi-replica deployment, each replica has its own connection pool. With default SQLAlchemy pool (5 connections) and 3 replicas, that is already 15 connections. PostgreSQL RDS's connection limit matters here.

**Required addition:** Specify target replica count and connection pool sizing, or specify PgBouncer as a sidecar.

---

## 3. Conflicts

### C-1 — G-PROD-3 Claims Kakao Mobility Is Not Yet Integrated, But Code Shows It Is
**Conflict:** Goal G-PROD-3 states "배차 엔진 실거리 정확도 향상 (Kakao Mobility API 연동)" implying this needs to be built. However, `backend/app/modules/routing_engine/distance.py` already contains a fully implemented `build_road_distance_matrix()` that calls Kakao Mobility API with Redis caching and Euclidean fallback. The `MapProvider` abstraction in `common/map_provider/kakao.py` also exists.

**Why it matters:** If the work is already done and the goal claims it is not, the milestone scope will be incorrectly sized, creating either wasted effort (re-implementing) or false milestone closure (marking done without actual work).

**Recommended resolution:** Before MP-1 begins, verify whether the Kakao API key is the only missing piece. If the integration code is complete, re-scope G-PROD-3 to "configure and validate Kakao Mobility API key in production environment" rather than "연동 구현."

---

### C-2 — AC-13 "학생 역할 (백엔드 enum + 마이그레이션)" Already Partially Exists in Code
**Conflict:** `UserRole` enum in `auth/models.py` already includes `STUDENT = "student"`. AC-13 treats this as a Should Have item to be implemented. The Student model in `student_management/models.py` is a separate entity (not a User), but the role enum entry already exists.

**Why it matters:** The migration may only need to handle the Student-as-User relationship if the intention is to allow students to log in. The intake is ambiguous about what "학생 역할" means functionally: is it (a) allowing Student-role users to authenticate and see their own screen, or (b) just adding the enum? The mobile code already has a `StudentTabNavigator` suggesting screens exist.

**Recommended resolution:** Clarify whether "학생 역할" means full authentication flow or only the model change. Audit existing `UserRole.STUDENT` migration history before scheduling new migration work.

---

### C-3 — SMS "프로덕션 전환 코드" Already Implemented
**Conflict:** G-PROD-9 and AC-9 require "SMS/FCM 프로덕션 전환 환경변수 분기 구현." The SMS provider (`notification/providers/sms.py`) already branches on `settings.environment != "production"` — in dev it prints, in prod it calls NHN Cloud API. FCM uses `firebase-admin` which reads from `firebase_credentials_path`.

**Why it matters:** Mischaracterizing already-built features as goals inflates MP-1's scope and creates milestone-closure confusion.

**Recommended resolution:** Scope G-PROD-9 / AC-9 more precisely: "validate NHN Cloud and Firebase production credentials are injected via environment, not from committed files." This is a secrets/configuration task, not a code-writing task.

---

### C-4 — MP-2 API Dependency on MP-1 May Be Incorrect For Some Frontend Work
**Conflict:** The milestone table states MP-2 (frontend tests) depends on MP-1 (API). However, frontend testing with mocked APIs does not require a running backend. Setting up Jest/Vitest, writing component unit tests, and snapshot tests can proceed in parallel with MP-1.

**Why it matters:** Serial milestones create unnecessary timeline risk. If MP-1 runs long, all frontend test work is blocked.

**Recommended resolution:** Split MP-2 into: (a) test infrastructure setup + unit/component tests (no MP-1 dependency), (b) integration tests against real API (MP-1 dependency). Allow (a) to run in parallel with MP-1.

---

### C-5 — Non-Goal NG-4 (앱스토어 제출) vs. Acceptance Criteria Requiring EAS Build
**Conflict:** NG-4 excludes App Store/Play Store submission. But A6 assumes EAS Build, and the intake implicitly requires native builds work (the Expo Go SDK 54 limitation noted in CLAUDE.md means production KakaoMap SDK requires native build). There is no acceptance criterion for a successful EAS build.

**Why it matters:** "Mobile production ready" is undefined if neither an EAS build is verified nor store submission is attempted. The mobile app cannot use KakaoMap native SDK on Expo Go.

**Recommended resolution:** Either add AC for "EAS preview build succeeds" or explicitly acknowledge that the mobile app's production distribution method is Expo Go (with its SDK/feature limitations) and document which features will not work without native build.

---

## 4. Technical Risks

### TR-1 — Committed Secrets Are a Critical Security Risk (CRITICAL)
`firebase-credentials.json` is present in the repository. `vmware_ubuntu.key` (SSH private key) is in the repo root. `.env` is present in `backend/`. These must be removed from git history before any production operation. Rotating the Firebase project credentials and SSH key is required even after removal.

---

### TR-2 — Dockerfile Is Dev-Grade (HIGH)
The production Dockerfile:
- Mounts source directory as a volume (in docker-compose), meaning `.env` and `firebase-credentials.json` are volume-mounted into the container.
- Runs `alembic upgrade head` at container startup (migration race condition in K8s).
- Runs as root (no `USER` directive).
- Copies all files including `.env`, test files, `.venv` (if present), and dev artifacts.
- Has no `HEALTHCHECK` directive.
- Uses `pip install --no-cache-dir .` without pinning a lockfile.

---

### TR-3 — PG SDK Integration Has No Implementation (HIGH)
The `billing` module generates invoices internally but has no payment gateway code. Toss Payments integration requires a webhook endpoint for payment confirmation, idempotency key handling, payment cancellation flows, and PCI-DSS-adjacent considerations. This is the most complex new feature in MP-1 and has zero specification beyond "PG SDK 연동 코드."

---

### TR-4 — Redis Persistence Risk for GPS Data (MEDIUM)
`vehicle_telemetry` module flushes GPS data every 30 seconds to Redis. The `docker-compose.yml` maps Redis data to a volume but the production Redis configuration (persistence mode, AOF, RDB) is unspecified. If Redis restarts between flushes, GPS data since last flush is lost.

---

### TR-5 — Kakao Mobility API Rate Limits and Cost (MEDIUM)
The distance matrix builder makes O(n²) API calls for n route stops. With default 24h Redis cache, a cold start for a route with 20 stops generates 380 API calls. The Kakao Mobility API has rate limits and per-call costs that are not addressed in the intake.

---

### TR-6 — APScheduler in K8s Multi-Replica Environment (MEDIUM)
`scheduler.py` uses APScheduler for the nightly pipeline. In a K8s deployment with multiple replicas, all replicas will independently trigger the same scheduler job. The intake does not address distributed locking (Redis-based lock, K8s CronJob, or leader election).

---

### TR-7 — SQLite Test DB vs. PostgreSQL Production DB (MEDIUM)
A6 acknowledges SQLite-to-PostgreSQL test migration risk. `test.db` is present in the backend directory. Tests using `aiosqlite` may pass for logic that fails on PostgreSQL-specific behavior (e.g., case-sensitive LIKE, constraint deferral, UUID handling). This is the likely source of the 2 failing tests.

---

### TR-8 — Mobile WebView KakaoMap in Expo Go (LOW for MVP, HIGH for production)
`mapHtml.ts` suggests KakaoMap is rendered via WebView. This works in Expo Go but KakaoMap's native SDK requires a native build. If the regulatory sandbox demo requires the map feature on a real device, an EAS build may be required urgently.

---

## 5. Alternative Designs

### AD-1 — Use Kubernetes CronJob for Nightly Pipeline Instead of APScheduler
Instead of running APScheduler inside the API process, extract the nightly routing pipeline into a standalone K8s CronJob. Benefits: no distributed locking problem, independently scalable, restartable on failure, observable via `kubectl get jobs`.

---

### AD-2 — GitHub Actions Matrix Build Over Separate Dockerfiles
Rather than one Dockerfile with a CMD that includes migrations, use:
- `Dockerfile.api` — uvicorn only
- `Dockerfile.migrate` — alembic upgrade head
- K8s init-container using `Dockerfile.migrate` before the API pod starts

This is standard practice and avoids the migration race condition.

---

### AD-3 — Vitest for Web Tests (Not Jest)
The web dashboard already uses Vite. Vitest is the natural choice — faster, same config, same transform pipeline. Using Jest would require a separate Babel config. This is a simple recommendation that saves setup time.

---

### AD-4 — Toss Payments Webhook-First Architecture
For the PG integration, implement a webhook receiver as the primary truth source (payment confirmed/cancelled events from Toss Payments) rather than relying on client-side callbacks. This is more resilient to network drops and is required for production compliance with Toss Payments API guidelines.

---

### AD-5 — External Secrets Operator or AWS Secrets Manager for K8s Secrets
Rather than encoding secrets in K8s Secret manifests (base64, not encrypted at rest by default), use AWS Secrets Manager with External Secrets Operator. This is especially important given the existing secret-leakage pattern in the repository.

---

## 6. Testing Concerns

### TC-1 — Mobile Test Framework Setup Is a Blocker, Not a Task
AC-2 requires 10 mobile tests, but the mobile workspace has no Jest, `jest-expo`, `@testing-library/react-native`, or any test configuration. Setup alone (package installs, preset config, asset mocking, navigation mocking) will consume significant time and should be tracked as a prerequisite task, not bundled into "write tests."

---

### TC-2 — What Are the 2 Failing Backend Tests?
The intake states "80/82 테스트 통과" but does not identify which 2 are failing or why. This is critical information before planning. If both failures are due to PostgreSQL-vs-SQLite incompatibility (TR-7), they may require testcontainers setup. If they are logic errors, they may be quick fixes.

**Required:** Run `pytest -v` and document the specific failure names and stack traces before finalizing MP-1 scope.

---

### TC-3 — No Integration Test Coverage for Critical Flows
The integration tests exist for individual APIs but there is no end-to-end test for the core business flow: enroll student → generate schedule → dispatch vehicle → GPS track → generate invoice. This is the highest-value test and is not in the acceptance criteria.

---

### TC-4 — No Tests for Billing PG Integration (New Code)
AC-4 requires PG integration in test mode. There is no acceptance criterion for automated test coverage of the new PG code. Toss Payments provides a sandbox environment; webhook delivery testing requires a public endpoint (ngrok in dev). The test strategy for this feature is absent.

---

### TC-5 — kubectl dry-run Is Not a Meaningful K8s Validation
AC-7 requires `kubectl apply --dry-run` to pass. `--dry-run=client` only validates YAML structure, not actual K8s API server compatibility, resource quota compliance, or image availability. Consider requiring `--dry-run=server` against a test cluster, or at minimum `kubeval`/`kube-score` static analysis.

---

### TC-6 — No Regression Test Strategy for MP-2 and MP-3
When MP-2 adds frontend tests and MP-3 adds CI/CD, there is no stated requirement that the existing 80 backend tests must continue to pass in the CI pipeline. The acceptance criteria do not require CI green on all PRs.

---

## 7. Confidence Level

**MEDIUM**

**Justification:**

The intake is well-structured and accurately captures the platform's component boundaries. The milestone sequencing is logical. Goals are differentiated from non-goals. Open questions are honestly listed.

However, confidence is reduced for the following reasons:

1. **Multiple claimed-missing features already partially exist in code** (Kakao Mobility integration, SMS/FCM prod-switch, UserRole.STUDENT). This pattern suggests the intake was written without full code audit, which may cause additional scope surprises mid-milestone.

2. **Critical security issues are not addressed** (committed credentials, default placeholder secrets). These are blocking issues for any production deployment.

3. **Seven open questions remain open**, three of which are HIGH priority and affect core architecture decisions (PG provider, cloud target, deployment timeline). These should be resolved before tech spec finalization.

4. **Acceptance criteria are too coarse** for the most complex new features (PG integration, Excel upload, K8s manifests). Without detailed specifications, implementation correctness cannot be verified.

5. **The mobile and web test setup from zero** is a nontrivial prerequisite that the intake treats as implementation work rather than infrastructure setup.

---

## 8. Priority Ranking

| ID | Issue | Priority |
|----|-------|----------|
| TR-1 | Committed secrets (firebase-credentials.json, SSH key, .env) in repository | **CRITICAL** |
| MR-1 | No secrets management strategy for production | **CRITICAL** |
| C-1 | G-PROD-3 goal already implemented — scope mismatch | **HIGH** |
| C-3 | G-PROD-9 / AC-9 already partially implemented — scope mismatch | **HIGH** |
| C-2 | AC-13 UserRole.STUDENT already in enum — migration scope unclear | **HIGH** |
| TR-2 | Dev-grade Dockerfile (root user, migration on start, volume mount) | **HIGH** |
| TR-3 | PG payment gateway integration entirely unspecified beyond goal statement | **HIGH** |
| MR-2 | No DB migration safety strategy for multi-replica K8s | **HIGH** |
| MR-3 | No security hardening spec (CORS, rate limiting, debug=False, TLS) | **HIGH** |
| TC-2 | 2 failing backend tests unidentified — must be diagnosed before MP-1 | **HIGH** |
| MR-9 | Mobile test framework not installed — setup is a prerequisite blocker | **HIGH** |
| MR-10 | Web test framework not installed — setup is a prerequisite blocker | **HIGH** |
| TR-6 | APScheduler runs in all K8s replicas — distributed scheduling conflict | **HIGH** |
| C-4 | MP-2 serial dependency on MP-1 unnecessarily blocks independent test work | **MEDIUM** |
| C-5 | EAS Build vs. Expo Go ambiguity for production mobile distribution | **MEDIUM** |
| MR-4 | PDPA compliance for minors' personal data not addressed | **MEDIUM** |
| MR-5 | No rollback strategy for any milestone | **MEDIUM** |
| MR-6 | Observability / structured logging specification absent | **MEDIUM** |
| MR-7 | Static asset delivery strategy for web/site not specified | **MEDIUM** |
| MR-8 | Excel upload feature has no format/schema specification | **MEDIUM** |
| TR-4 | Redis persistence configuration for GPS data unspecified | **MEDIUM** |
| TR-5 | Kakao Mobility API rate limits and cost at O(n²) call volume | **MEDIUM** |
| TR-7 | SQLite test DB vs. PostgreSQL behavioral differences | **MEDIUM** |
| TC-1 | Mobile test framework setup must be treated as separate milestone task | **MEDIUM** |
| TC-3 | No end-to-end integration test for core business flow | **MEDIUM** |
| TC-4 | No test strategy for new PG billing code | **MEDIUM** |
| TC-5 | kubectl --dry-run=client is insufficient K8s validation | **MEDIUM** |
| MR-11 | Connection pool sizing for multi-replica K8s not specified | **MEDIUM** |
| TC-6 | No requirement that CI enforces existing 80 backend tests on every PR | **LOW** |
| TR-8 | KakaoMap native SDK incompatibility with Expo Go | **LOW** |
| AD-1 | K8s CronJob instead of APScheduler for nightly pipeline | **LOW** |
| AD-3 | Vitest preferred over Jest for web dashboard testing | **LOW** |

---

*Review complete. Seven CRITICAL/HIGH items should be resolved before the Final Tech Spec is approved.*
