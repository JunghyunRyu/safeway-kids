# Independent Review — Production Readiness Intake (requirement-analyst)

**Reviewed by:** requirement-analyst agent
**Review date:** 2026-03-20
**Source document:** `artifacts/specs/2026-03-20-production-readiness-intake.md`
**Codebase snapshot:** verified read-only inspection of `/home/jhryu/safeway_kids/` — live test run executed, key source files read directly.

---

## 1. Requirement Restatement

The SAFEWAY KIDS platform (FastAPI backend, Expo SDK 54 mobile app, React/Vite web dashboard, React/Vite landing site) has completed its regulatory sandbox application and currently runs only in a local development environment. The project owner requires a code-only production-readiness uplift across four dimensions: (1) backend stabilization and new feature completion (PG payment integration, Excel bulk upload, legal archive, student-role finalization), (2) frontend test coverage uplift from zero tests in both mobile and web, (3) infrastructure-as-code creation (optimized Docker images, K8s manifests, GitHub Actions CI/CD pipeline), and (4) operational tooling (monitoring endpoint, real-time control-center map, statistical reports). The deliverable is verified, committed code — not a live production deployment, store submission, or cloud provisioning.

---

## 2. Missing Requirements

### MR-1 — Secrets Management Strategy Absent (Critical)

**What is missing:** Neither the goals nor the acceptance criteria address how production secrets reach the running application.

**Verified codebase evidence:**
- `backend/app/config.py` line 13: `jwt_secret_key: str = "change-me-in-production"` — hardcoded insecure default.
- `backend/app/config.py` line 35: `aes_encryption_key: str = "change-me-32-byte-key-for-prod!!"` — hardcoded insecure default.
- `backend/firebase-credentials.json` — service account credential file present in the repository root.
- `backend/app/config.py` line 41: `debug: bool = True` — debug mode on by default.

**Required addition:** A mandatory goal covering: (a) removal of committed secrets from repository and git history, (b) explicit production secret injection mechanism (K8s Secrets, AWS Secrets Manager, or equivalent), and (c) a fail-fast guard that prevents the application from starting in `environment=production` when default placeholder secret values are detected.

---

### MR-2 — Database Migration Safety for Multi-Replica Deployment Absent (Critical)

**What is missing:** No strategy is defined for running Alembic migrations safely in a K8s multi-replica environment.

**Verified codebase evidence:**
- `backend/Dockerfile` CMD: `"sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"` — migrations run on every pod startup.
- No K8s manifests exist anywhere in the repository (confirmed by directory scan).

**Required addition:** Specify whether migrations run as a K8s `Job` (pre-install hook), an `initContainer`, or a dedicated CI/CD step. The current pattern causes a migration race condition when multiple replicas start simultaneously and blocks pod startup on any migration failure.

---

### MR-3 — Frontend Test Framework Installation Not Named as a Prerequisite (High)

**What is missing:** AC-2 ("최소 10개 테스트") and AC-3 ("최소 5개 테스트") assume a test runner exists. None does.

**Verified codebase evidence:**
- `mobile/package.json` devDependencies: `{ "@expo/ngrok", "@types/react", "typescript" }` — no jest, no `jest-expo`, no `@testing-library/react-native`. No `test` script defined.
- `web/package.json` devDependencies: ESLint, Tailwind, TypeScript, Vite plugins only — no vitest, no `@testing-library/react`. No `test` script defined.
- `find mobile/src -name "*.test.*"` and `find web/src -name "*.test.*"` both return zero results.

**Required addition:** Add an explicit sub-task (or AC) for test framework installation and configuration as a prerequisite to MP-2. For mobile: `jest-expo` preset + `@testing-library/react-native` + asset mocking. For web: `vitest` + `@testing-library/react`.

---

### MR-4 — PG Webhook Endpoint Not Listed as a Functional Requirement (High)

**What is missing:** G-PROD-2 / AC-4 describe "PG 결제 연동 코드 완성 (테스트 모드 동작)" but do not name the PG confirmation webhook as an explicit requirement.

**Verified codebase evidence:**
- `backend/app/modules/billing/models.py`: `Payment` model has `transaction_ref: str | None` and `method: str` fields — but no webhook-received or PG-confirmed state.
- `backend/app/modules/billing/router.py`: No payment confirmation, webhook verification, or PG callback endpoint exists.
- No `toss`, `payment_key`, `checkout`, or `pg_confirm` references found anywhere in backend Python files.

**Required addition:** Functional requirement explicitly naming: (a) payment initiation endpoint, (b) PG confirmation webhook endpoint with signature verification, (c) idempotency key handling, and (d) refund API — as separate enumerated requirements under G-PROD-2.

---

### MR-5 — CORS Production Configuration Not Addressed (High)

**What is missing:** No acceptance criterion or requirement covers CORS origin whitelist for production.

**Verified codebase evidence:**
- `backend/app/config.py`: `kakao_redirect_uri: str = "http://localhost:8000/api/v1/auth/kakao/callback"` — hardcoded localhost URI.
- No `CORSMiddleware` configuration was found referencing a production domain or environment variable for allowed origins.

**Required addition:** Production CORS allowed-origin list tied to `A7` (domain assumption) must be a requirement, not implied.

---

### MR-6 — Static Asset Delivery Strategy for Web / Site Not Specified (Medium)

**What is missing:** G-PROD-1 mentions "인프라 코드 작성 (Docker, K8s 매니페스트, CI/CD)" but the web dashboard (`web/`) and landing site (`site/`) have no Dockerfile or deployment target.

**Required addition:** Specify whether the React SPAs are deployed to: (a) nginx containers inside K8s, (b) a CDN (S3+CloudFront), or (c) a platform like Vercel. This decision materially affects Dockerfile structure and CI/CD pipeline steps.

---

### MR-7 — Excel Bulk Upload Feature Entirely Unspecified at Schema Level (Medium)

**What is missing:** AC-10 states "엑셀 학생 일괄 업로드 API 동작" with no column schema, error handling contract, maximum row count, idempotency guarantee, or duplicate-detection behavior.

**Verified codebase evidence:**
- `backend/app/modules/student_management/router.py`: No `bulk_upload`, `excel`, or `import` endpoint found.
- `backend/pyproject.toml`: No `openpyxl`, `pandas`, or `xlrd` dependency listed.

**Required addition:** Provide a minimum Excel column schema (e.g., name, date_of_birth, guardian_phone, address), expected error response format for row-level failures, and idempotency semantics before any implementation begins.

---

### MR-8 — APScheduler in Multi-Replica K8s Not Addressed (Medium)

**What is missing:** The nightly pipeline runs via APScheduler inside the API process. In K8s with multiple replicas, each replica will independently fire the same scheduler at midnight, causing duplicate route-plan generation.

**Verified codebase evidence:**
- `backend/app/config.py`: `pipeline_cron_hour: int = 0`, `pipeline_cron_minute: int = 0` — confirms scheduled job exists.
- No distributed lock, leader-election pattern, or K8s CronJob alternative is referenced anywhere.

**Required addition:** Add a non-functional requirement for distributed scheduling safety: either a Redis-based lock, K8s CronJob extraction, or a single-replica scheduling pod.

---

### MR-9 — No Rate Limiting or DDoS Protection Requirement (Medium)

**What is missing:** No requirement covers rate limiting on authentication endpoints, webhook callbacks, or public-facing APIs — despite the service handling personal data of minors and financial transactions.

---

### MR-10 — TLS Termination Ownership Not Specified (Medium)

**What is missing:** No requirement specifies where TLS terminates (Ingress controller, AWS ALB, application-level). Assumption A7 mentions the domain but not the TLS chain.

---

### MR-11 — Kakao Mobility API Budget / Cost Control Not Specified (Low)

**What is missing:** No requirement caps the number of Kakao Mobility API calls per route optimization run or per day.

**Verified codebase evidence:**
- `backend/app/modules/routing_engine/distance.py`: `build_road_distance_matrix()` issues `n × (n-1)` HTTP calls for n nodes (O(n²) pair-wise). For 16 nodes (depot + 15 stops), that is 240 API calls per cold run.
- Redis caching with 24h TTL mitigates but does not eliminate cost on first-run or after stop changes.

---

## 3. Conflicts

### C-1 — G-PROD-3 Overstates Remaining Work: Kakao Mobility Already Implemented (Critical)

**Stated requirement:** G-PROD-3: "배차 엔진 실거리 정확도 향상 (Kakao Mobility API 연동)"

**Conflict:** The Kakao Mobility integration is **already complete** in the codebase.

**Verified evidence:**
- `backend/app/common/map_provider/kakao.py`: `KakaoMapsProvider` class with `MOBILITY_URL = "https://apis-navi.kakaomobility.com/v1/directions"`. `get_route()` method fully implemented.
- `backend/app/modules/routing_engine/distance.py`: `build_road_distance_matrix()` calls `map_provider.get_route()`, caches in Redis (24h TTL), and falls back to Euclidean if no API key or on error. Code is production-quality with logging.
- The only missing piece is a populated `kakao_maps_api_key` in the production environment — a configuration/secrets task, not a code-writing task.

**Impact:** G-PROD-3 should be re-scoped to "configure and validate Kakao Maps production API key" rather than "integrate Kakao Mobility API." Treating this as implementation work will either waste effort (re-implementing what exists) or cause false milestone closure.

---

### C-2 — G-PROD-9 / AC-9 Overstate Remaining Work: SMS/FCM Production Switching Already Implemented (High)

**Stated requirement:** G-PROD-9: "SMS/FCM 프로덕션 전환 코드 준비"; AC-9: "SMS/FCM 프로덕션 전환 환경변수 분기 구현"

**Conflict:** Environment-based switching is already implemented.

**Verified evidence:**
- `backend/app/modules/notification/providers/sms.py`: `NHNCloudSmsProvider.send_sms()` — `if settings.environment != "production": print(...); return True`. In production mode, calls NHN Cloud API using `settings.nhn_sms_app_key`, `settings.nhn_sms_secret_key`, `settings.nhn_sms_sender_number`.
- `backend/app/modules/notification/providers/fcm.py`: `FCMProvider.send_push()` and `send_topic()` — same pattern. In production, calls `firebase_admin.messaging.send()`.

**Impact:** AC-9 and G-PROD-9 should be re-scoped to: "validate NHN Cloud and Firebase production credentials are injected via environment variables (not from committed files) and that a smoke test confirms delivery in staging." This is a credentials/secrets task.

---

### C-3 — AC-13 (UserRole.STUDENT Migration) Partially Contradicts Codebase State (High)

**Stated requirement:** AC-13: "학생 역할 (백엔드 enum + 마이그레이션)" — listed as Should Have.

**Conflict:** `UserRole.STUDENT = "student"` already exists in `backend/app/modules/auth/models.py` (verified at line 14). The Python enum value is present.

**Verified evidence:**
- `backend/app/modules/auth/models.py` lines 11–16: Full `UserRole` enum including `STUDENT = "student"`.
- `mobile/src/screens/student/`: `ProfileScreen.tsx` and `ScheduleScreen.tsx` exist — student role already has some screen implementation.
- What may genuinely be missing: a Postgres `ALTER TYPE userrole ADD VALUE 'student'` migration if the DB enum predates this enum value, and a full authentication flow for student users.

**Impact:** AC-13 must distinguish between (a) the enum value (done), (b) the DB migration (may be needed), and (c) the student login flow end-to-end (scope unclear). Without this distinction, the acceptance criterion cannot be tested.

---

### C-4 — Claimed "80/82 테스트" vs. Observed Test Execution Result (Medium)

**Stated fact in intake:** "80/82 테스트 통과" (2 failures/errors).

**Conflict:** A live `pytest tests/` run during this review completed with **80 passed, 0 failures** in 186 seconds. No failures were observed.

**Possible explanations:** (a) The 2 failures were fixed between the intake being written and this review; (b) The failures are environment-specific (real PostgreSQL vs. aiosqlite + fakeredis via testcontainers); (c) The count reflects a different test configuration. G-PROD-5 may already be complete, or failures are latent.

**Impact:** Before including G-PROD-5 in MP-1 scope, run `pytest -v` under a PostgreSQL testcontainer environment and document specific failure names and tracebacks. This is necessary evidence, not an assumption.

---

### C-5 — MP-2 Serial Dependency on MP-1 Incorrect for Unit / Component Tests (Medium)

**Stated dependency:** "MP-2: 프론트엔드 품질 및 기능 보완 — 의존성: MP-1 (API 의존)"

**Conflict:** Frontend unit tests and component tests (React Testing Library, snapshot tests, hook tests) do not require a running backend. They use mocked API responses.

**Impact:** The stated dependency forces all frontend test work to block on MP-1 completion. This unnecessarily extends total calendar time. Frontend test infrastructure setup and unit/component tests can and should proceed in parallel with MP-1. Only integration/E2E tests against real API endpoints require MP-1 completion.

---

### C-6 — NG-4 (App Store 제출 제외) vs. Undefined Mobile Production Distribution Channel (Low)

**Stated non-goal:** NG-4: "앱스토어/플레이스토어 제출 (이번 범위 외)"

**Conflict:** If the production mobile delivery channel is neither an app store build nor Expo Go (which cannot use KakaoMap native SDK as noted in CLAUDE.md), then the mobile production distribution channel is undefined. `eas.json` exists with a `production` profile, but no AC covers a successful EAS build.

**Impact:** "Mobile production readiness" is undefined without specifying the delivery mechanism. For the regulatory sandbox demo with KakaoMap on a physical device, an EAS build may be required urgently.

---

## 4. Technical Risks

### TR-1 — Committed Service Account Credentials (Critical)

`backend/firebase-credentials.json` is present in the repository directory and not confirmed to be in `.gitignore`. If this repository is shared with regulators or becomes public during the sandbox review process, the Firebase service account key is exposed. Rotation is required even after removal from git history.

---

### TR-2 — Hardcoded Insecure Secret Defaults with No Fail-Fast Guard (Critical)

`config.py` has `jwt_secret_key = "change-me-in-production"` and `aes_encryption_key = "change-me-32-byte-key-for-prod!!"` as defaults. If production `.env` injection fails silently (e.g., wrong K8s secret name), the application starts with insecure keys and signs JWTs that are cryptographically predictable. No startup validation exists.

---

### TR-3 — Firebase Admin SDK Synchronous Call Inside Async Event Loop (High)

**Verified evidence:** `backend/app/modules/notification/providers/fcm.py`: `messaging.send(message)` is the synchronous Firebase Admin SDK function called inside `async def send_push()` and `async def send_topic()` without `asyncio.to_thread()` or an executor.

**Impact:** Under concurrent notification delivery (e.g., a bus arriving simultaneously triggering notifications for 20 parents), this blocks the asyncio event loop for the duration of each Firebase HTTP call, degrading all concurrent request handling.

---

### TR-4 — Dockerfile Is Not Multi-Stage and Has No Health Check (High)

**Verified evidence:** `backend/Dockerfile` is a single-stage build. No `HEALTHCHECK` directive. No `USER` directive (runs as root). No `.dockerignore` confirmed. The entire repository directory (including `test.db`, `firebase-credentials.json`, `seed.py`, `.venv` if present) will be included in the image unless explicitly excluded.

---

### TR-5 — No CI Coverage for Frontend, Docker Build, or K8s Manifest Validation (High)

**Verified evidence:** `.github/workflows/ci.yml` covers only: backend lint (`ruff`), backend type check (`mypy`, `continue-on-error: true`), and backend test (`pytest`). No frontend TypeScript build check, no `docker build` step, no `kubectl apply --dry-run` step, no EAS build trigger.

**Impact:** TypeScript errors introduced in mobile or web, broken Docker builds, and invalid K8s manifests will not be caught in CI.

---

### TR-6 — `firebase-credentials.json` Embedded in Docker Image (High)

The Dockerfile copies `.` (entire backend directory) into the image. If `firebase-credentials.json` is present and not excluded by `.dockerignore`, the service account key is embedded into every Docker image layer — and will be present in any image registry that stores it.

---

### TR-7 — PG Integration Complexity Substantially Underestimated (High)

**Verified evidence:** The billing module contains: `BillingPlan`, `Invoice`, `Payment` models; invoice generation service; billing plan CRUD routes. **No PG SDK, no payment initiation, no webhook endpoint, no idempotency key, no refund path, no PG sandbox credentials.** The scope gap between current state and "PG 결제 연동 코드 완성 (테스트 모드 동작)" is the largest single implementation delta in the entire production-readiness effort.

---

### TR-8 — SQLite Test Path May Mask PostgreSQL-Specific Failures (Medium)

**Verified evidence:** `test.db` is present in `backend/`. The conftest likely uses `aiosqlite` (listed in dev dependencies) for speed. PostgreSQL-specific behavior (UUID casting, enum types, JSONB operators, constraint deferral) may differ. The 2 alleged test failures may only manifest under real PostgreSQL.

---

### TR-9 — Kakao Mobility API O(n²) HTTP Calls Per Route Optimization (Medium)

**Verified evidence:** `distance.py` `build_road_distance_matrix()` issues `n × (n - 1)` HTTP calls. For 16 nodes: 240 calls. 24h Redis cache mitigates repeated runs but not first-run cost or cache invalidation on stop change. No budget ceiling or batching strategy defined.

---

### TR-10 — `dump.rdb` Committed in `mobile/` Directory (Low)

A Redis RDB dump file is present in the `mobile/` directory root — likely a development artifact. It has no business being in source control and should be removed and gitignored.

---

## 5. Alternative Designs

### AD-1 — K8s Migration: initContainer or Pre-Install Job Instead of CMD Startup

Extract `alembic upgrade head` from the app CMD into a Kubernetes `initContainer` (for per-pod safety) or a Helm `pre-upgrade` `Job`. This is the industry standard and eliminates the migration race condition entirely.

---

### AD-2 — Multi-Stage Dockerfile with Secrets Exclusion

Use a multi-stage Dockerfile: `builder` stage installs dependencies; `runtime` stage copies only the installed packages and application code — explicitly excluding credential files, test DB, and dev artifacts via `.dockerignore`. Add a `HEALTHCHECK` pointing to `/health` or `/api/v1/health`.

---

### AD-3 — Vitest for Web Dashboard Tests (Not Jest)

The web dashboard uses Vite. Vitest shares the same config pipeline, requires no separate Babel transform, and runs significantly faster. Selecting Jest would require additional config. This is the natural fit and saves setup time.

---

### AD-4 — jest-expo Preset for Mobile Tests

For Expo SDK 54, `jest-expo` provides the correct preset with asset mocks, native module mocks, and module name mapper. It is maintained by the Expo team and is the only supported path for Expo-managed workflows. This should be the explicit framework choice, not left as an assumption.

---

### AD-5 — PortOne (포트원) as a PG Abstraction Layer

If Q1 (PG vendor) is unresolved, PortOne (formerly Iamport) provides a unified SDK abstracting Toss Payments, KakaoPay, INICIS, and others. This reduces vendor lock-in and allows PG vendor selection to remain flexible after code is written. Worth evaluating alongside Toss Payments direct integration before committing to an architecture.

---

### AD-6 — OpenTelemetry Instead of Prometheus-Only Metrics

Rather than adding only a Prometheus `/metrics` endpoint (AC-15), instrumenting with `opentelemetry-instrumentation-fastapi` from the start allows exporting to Prometheus, Grafana Cloud, Datadog, or AWS X-Ray without future code changes. This is a broader but more future-proof observability strategy.

---

### AD-7 — Sparse Distance Matrix Instead of Full O(n²) Pairs

For the routing engine, use geographic proximity clustering to only compute distances between nodes likely to be adjacent in an optimal route, reducing API calls from O(n²) to approximately O(n log n) in practice. This could be implemented as a preprocessing step using Haversine distance to prune distant pairs before calling the API.

---

## 6. Testing Concerns

### TC-1 — Test Framework Installation Is a Blocker for All Frontend Test ACs (Critical)

AC-2 and AC-3 are unreachable until test frameworks are installed. `mobile/package.json` and `web/package.json` have no test runner. This is a multi-hour configuration task (preset selection, module mock setup, navigation provider mocking for Expo screens) that must be tracked as a prerequisite, not bundled into test-writing tasks in MP-2.

---

### TC-2 — The Two Alleged Backend Failures Are Unidentified (High)

The intake states "80/82 테스트 통과" but does not identify which tests fail or why. G-PROD-5 plans to fix them, but without knowing whether the root cause is: (a) SQLite/PostgreSQL behavioral difference requiring testcontainers, (b) a logic bug, or (c) an environment issue — the fix cannot be sized. **Required action:** Run `pytest -v` under a PostgreSQL testcontainer environment and document specific test names and failure messages before MP-1 begins.

---

### TC-3 — PG Integration Tests Require Sandbox API Credentials in CI (High)

AC-4 ("PG 결제 연동 코드 완성, 테스트 모드 동작") implies automated tests that call the Toss Payments sandbox. This requires: (a) Toss sandbox API keys provisioned, (b) a public webhook endpoint for sandbox callbacks (ngrok or a fixed CI URL), and (c) those keys stored as GitHub Actions secrets. None of this is addressed in the intake.

---

### TC-4 — AC-7 kubectl dry-run Is Insufficient K8s Validation (Medium)

`kubectl apply --dry-run=client` validates only YAML/JSON schema. It does not catch: image pull failures, resource quota violations, PodDisruptionBudget conflicts, or API version deprecations. Consider `kubeval`, `kube-score`, or `--dry-run=server` against a test cluster.

---

### TC-5 — No End-to-End Test Plan for Core Business Flow (Medium)

No acceptance criterion covers the critical path: parent enrolls → schedule generated → vehicle dispatched → GPS tracked → parent notified → invoice generated. For a regulatory sandbox demo, this flow is the primary evidence of system correctness. A manual E2E test script (at minimum) should be an explicit deliverable.

---

### TC-6 — File Upload Testing Pattern Not Established (Low)

AC-11 (legal archive with file upload) requires multipart form data testing. No existing test in `backend/tests/` uses multipart file upload. The pattern needs to be established in the test suite — `httpx.AsyncClient().post(..., files=...)`.

---

### TC-7 — No CI Requirement for Frontend Build Validation (Low)

The current CI workflow has no `npm run build` step for web or site. TypeScript errors, missing imports, or broken Vite configs will not be caught automatically. This is an omission given that TypeScript 0-error status is cited as a current-state fact.

---

## 7. Confidence Level

**Overall: MEDIUM**

**Strengths of the intake document:**
- Component boundaries and LOC counts are accurate and match the codebase.
- Goals, non-goals, milestone structure, and open questions are well-articulated and honest.
- Assumption Register correctly flags the high-uncertainty items (PG provider, cloud target, domain).

**Factors reducing confidence to MEDIUM:**

1. **Three goals are substantially overstated** (C-1: Kakao Mobility, C-2: SMS/FCM switching, C-3: UserRole.STUDENT enum). The intake appears to have been written without a full read-only codebase audit. This pattern suggests additional scope surprises may surface once implementation begins.

2. **The largest single new feature (PG integration) is blocked by Q1 (PG vendor unresolved), has no webhook requirement listed, no test credential strategy, and no refund/cancellation scope.** This is the highest-risk item in the entire effort and is currently underspecified by at least a factor of three.

3. **Frontend test ACs (AC-2, AC-3) have no implementation path** because neither mobile nor web has a test framework installed. The intake treats these as simple test-writing tasks rather than infrastructure-setup + test-writing tasks.

4. **Critical security issues** — committed credentials, hardcoded secret defaults, no fail-fast guard, no K8s migration isolation — are completely absent from all goals, non-functional requirements, and acceptance criteria.

5. **Three high-priority open questions (Q1, Q2, Q6) remain unresolved** and materially block the Final Tech Spec for MP-1 (PG design), MP-3 (infrastructure target), and overall project scoping (deadline).

---

## 8. Priority Ranking

| Rank | ID | Issue | Category | Priority |
|------|----|-------|----------|----------|
| 1 | TR-1 | `firebase-credentials.json` committed to repository — credential exposure risk | Technical Risk | **Critical** |
| 2 | TR-2 | Hardcoded insecure secret defaults with no production fail-fast guard | Technical Risk | **Critical** |
| 3 | C-1 | G-PROD-3 (Kakao Mobility integration) already fully implemented — scope overstatement | Conflict | **Critical** |
| 4 | MR-2 | No DB migration safety strategy for multi-replica K8s (migration race in Dockerfile CMD) | Missing Req | **Critical** |
| 5 | TC-1 | Zero frontend test infrastructure — test framework is a prerequisite blocker | Testing | **Critical** |
| 6 | MR-1 | No secrets management strategy in requirements | Missing Req | **High** |
| 7 | TR-7 | PG integration scope substantially underestimated — zero existing code, webhook unspecified | Technical Risk | **High** |
| 8 | MR-4 | PG webhook endpoint not listed as a functional requirement | Missing Req | **High** |
| 9 | C-2 | G-PROD-9 / AC-9 (SMS/FCM switching) already implemented — scope overstatement | Conflict | **High** |
| 10 | C-3 | AC-13 (UserRole.STUDENT enum) already in models.py — migration scope unclear | Conflict | **High** |
| 11 | TR-3 | Firebase Admin SDK synchronous call inside async event loop — event loop blocking risk | Technical Risk | **High** |
| 12 | TR-4 | Dockerfile not multi-stage, runs as root, no HEALTHCHECK, no .dockerignore confirmed | Technical Risk | **High** |
| 13 | TR-5 | No CI coverage for frontend build, Docker build, or K8s manifest validation | Technical Risk | **High** |
| 14 | TC-2 | Two backend failures unidentified — root cause unknown, G-PROD-5 scope unconfirmed | Testing | **High** |
| 15 | TC-3 | PG test-mode requires sandbox API credentials in CI — no strategy defined | Testing | **High** |
| 16 | MR-3 | Frontend test framework installation not recognized as a prerequisite task | Missing Req | **High** |
| 17 | C-4 | "80/82 tests" vs. live run showing 80 passed, 0 failures — state inconsistency | Conflict | **Medium** |
| 18 | C-5 | MP-2 serial dependency on MP-1 incorrect for unit/component tests | Conflict | **Medium** |
| 19 | MR-5 | CORS production configuration not addressed | Missing Req | **Medium** |
| 20 | MR-6 | Static asset delivery strategy for web/site SPAs not specified | Missing Req | **Medium** |
| 21 | MR-7 | Excel bulk upload schema entirely unspecified | Missing Req | **Medium** |
| 22 | MR-8 | APScheduler in multi-replica K8s — distributed scheduling race condition | Missing Req | **Medium** |
| 23 | MR-9 | No rate limiting requirement on auth/webhook endpoints | Missing Req | **Medium** |
| 24 | MR-10 | TLS termination ownership not specified | Missing Req | **Medium** |
| 25 | TR-8 | SQLite test path may mask PostgreSQL-specific failures | Technical Risk | **Medium** |
| 26 | TR-9 | Kakao Mobility O(n²) HTTP calls per run — cost risk at scale | Technical Risk | **Medium** |
| 27 | TR-6 | `firebase-credentials.json` copied into Docker image unless .dockerignore excludes it | Technical Risk | **Medium** |
| 28 | TC-4 | AC-7 kubectl dry-run=client insufficient; no server-side validation | Testing | **Medium** |
| 29 | TC-5 | No E2E test plan for core business flow (enroll→dispatch→GPS→invoice) | Testing | **Medium** |
| 30 | C-6 | Mobile production distribution channel undefined (NG-4 excludes store, Expo Go has SDK limits) | Conflict | **Medium** |
| 31 | MR-11 | Kakao Mobility API cost/budget ceiling not specified | Missing Req | **Low** |
| 32 | TC-6 | File upload test pattern not established in existing test suite | Testing | **Low** |
| 33 | TC-7 | No CI step for frontend TypeScript build validation | Testing | **Low** |
| 34 | TR-10 | `dump.rdb` (Redis dump) committed in `mobile/` directory | Technical Risk | **Low** |

---

*Review complete. Readiness verdict: **NEEDS SPEC CLARIFICATION** — items ranked Critical (1–5) and the five High-priority missing requirements (6, 8, 16, and unresolved Open Questions Q1/Q2/Q6) must be resolved before the Final Tech Spec can be drafted with confidence.*
