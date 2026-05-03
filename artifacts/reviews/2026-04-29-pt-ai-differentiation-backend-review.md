# PT AI 차별화 — Phase 1 Independent Review (backend-dev)

**문서 분류**: Phase 1 Independent Review (backend-dev 관점)
**검토 대상**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`](../specs/2026-04-29-pt-ai-differentiation-brief.md)
**검토일**: 2026-04-30
**Reviewer**: backend-dev agent (Claude Code)
**Confidence Score**: **6/10**

---

## 1. Requirement Restatement

The Brief asks to inject a 5-axis AI layer into PT V1.0 before the 2026-06-04 launch, with the dual purpose of (a) making a 신청서 score jump from 70-73 to 80-86 points and (b) having all five AI features actually working at launch time. The five axes are: incident LLM classification (A), walk-photo auto-caption + empathic report (B), review/bio moderation (D), GPS anomaly detection + walker auto check-in (E), and photo condition estimation beta (F). The non-AI constraint is that existing backend test counts (145 pytest, 15 jest PT, TS 0 errors) must not regress. The implementation budget is +5.0 to +5.5 additional business days on top of the already-planned C-13/14 → D → E → F → G sequence, funded by a 클라우드 -450만원 reallocation.

My understanding: this is a greenfield `backend/app/modules/ai/` module with a wrapper client, six sub-modules, three new DB tables, and roughly six new `/pt/ai/*` endpoints, all landing inside Milestone D and between milestones E and F of the existing Todo Plan.

---

## 2. Missing Requirements

**MR-1 — Rate limiting on LLM endpoints.** The existing router pattern has no per-user rate limiting on any endpoint. AI endpoints (caption, condition estimation, incident classification) have per-call cost. The Brief mentions a monthly cap in KRW but does not specify a per-request or per-user-per-minute limit. Without this, a single user uploading 200 photos in a burst will blow the monthly cap before the cap enforcement middleware fires.

**MR-2 — Async LLM client contract.** The Brief lists `anthropic >= 0.40.0` and `openai >= 1.40.0` but does not specify whether the wrapper uses the async client (`AsyncAnthropic`, `AsyncOpenAI`) or the sync client wrapped in `run_in_executor`. The existing `s3.py` uses `run_in_executor(None, lambda: ...)` with boto3, which is the correct pattern for a sync SDK in an async context. The `firebase_auth.py` does the same. The LLM brief must specify the same pattern to stay consistent.

**MR-3 — `PtAiInsight` FK reference ambiguity.** The Brief mentions three new tables (`PtAiInsight`, `PtIncidentClassification`, `PtModerationFlag`) but does not clarify whether `PtAiInsight` FK points to `walk_sessions.id` or `walk_gps_history.id`. Walk photos are not currently persisted with a FK in `walk_sessions`; `WalkSession.arrival_photo_url` is a single URL and `route_polyline` is JSON. There is no `photo_urls` array column on `WalkSession` at present.

**MR-4 — Alembic sequencing with existing heads.** The existing spec already defines 7 Alembic migrations. The Brief adds 3 more. The ordering constraint is not specified.

**MR-5 — `PT_LLM_MONTHLY_COST_CAP_KRW` enforcement point.** The variable is listed in §11-4 but no enforcement mechanism is described. There is no middleware, no ledger table, no Redis counter.

**MR-6 — Walk report delivery mechanism.** Brief §4-1 axis B says "산책 종료 시 PDF/HTML 리포트 자동 발송." The existing codebase has no PDF/HTML generation library in `requirements.txt`. Neither `weasyprint`, `jinja2` + HTML render, nor any report generation library is mentioned in §11-3.

**MR-7 — GPS anomaly detection state management.** Axis E requires server-side state (60-second non-response timer). The Brief does not specify whether this state lives in Redis or in-memory.

---

## 3. Conflicts with Existing Spec/Code

**CF-1 — JWT vs Firebase auth dependency.** The existing PT router uses `get_current_user` (JWT). Milestone B-6 swaps to `get_current_user_firebase` but may not yet be complete. New `/pt/ai/*` endpoints using `get_current_user_firebase` will be inconsistent with existing JWT endpoints.

**CF-2 — `s3.py` uses sync `boto3`, not `aioboto3`.** Spec mandates `aioboto3` but deployed code uses sync boto3 + `run_in_executor`. The AI module must consciously resolve this.

**CF-3 — `WalkPhoto` model does not exist.** `WalkSession` has `arrival_photo_url: String(500)` (single URL). For per-photo captions, no FK target exists.

**CF-4 — Milestone E "일부 prepone" breaks the existing Todo Plan ordering.** Brief §7 claims E is reduced from 5.0d to 3.0d but no specific task move is defined.

---

## 4. Technical Risks

**TR-1 (HIGH) — Walk report PDF/HTML generation underestimated.** WeasyPrint requires libpango/libcairo (non-trivial Docker additions). Jinja2 HTML email feasible but no template engine in current codebase. 2.0d estimate likely needs +0.5~1.0d.

**TR-2 (HIGH) — LLM API latency on incident critical path.** Synchronous LLM in `POST /pt/walks/{id}/incident` violates V1.0 NFR-5 (99.9% incident submission success). 30s timeout = walker waits 30s for form submission. **Must decouple via BackgroundTasks**.

**TR-3 (HIGH) — Cost cap implementation gap.** Env var declared, no enforcement. No `pt_ai_cost_ledger` table or Redis counter. Runaway usage undetectable.

**TR-4 (MEDIUM) — GPS anomaly detection multi-worker state.** In-memory timer per gunicorn worker = inconsistent across workers. Redis required.

**TR-5 (MEDIUM) — Three new Alembic migrations conflict risk.** Single-head rule + parallel C/D work = high collision risk.

---

## 5. Alternative Designs

**AD-1 (strongly recommended) — Fire-and-forget LLM classification.** Submit incident → return 201 → background task classifies → push notification only after classification or on `severity=medium` fallback. Removes LLM latency from user-facing critical path.

**AD-2 — Redis cost counter.** `INCRBYFLOAT pt:ai:cost:{year}:{month}` with monthly TTL. ~0.5d implementation. Lightweight, consistent with existing GPS pubsub pattern.

**AD-3 — GPS anomaly detection as WS server-side event.** Subscribe to existing `pt:walk:{session_id}:updates` channel. Maintain `pt:walk:{session_id}:gps_history` as Redis ZSET (5-min window). Publish `{"type": "anomaly"}` back to channel. Avoids multi-worker state problem.

**AD-4 — Walk photo caption as storage confirm hook.** Trigger from existing `POST /api/v1/storage/confirm` when `entity_type=walk_photo`. Background task captioning. Avoids new endpoint.

**AD-5 — OpenAI Moderation API only for axis D (no Claude).** Free, well-tested for content safety. Reserve Claude for axes A and B.

---

## 6. Testing Concerns

**TC-1** — Anthropic SDK mock with `respx` or `unittest.mock.AsyncMock`. +0.5d overhead.
**TC-2** — Redis cost counter cleanup fixture missing.
**TC-3** — GPS anomaly test harness needs `freezegun` or parameterized timestamps.
**TC-4** — LLM non-determinism: mock at `llm_client.py` wrapper level via FastAPI Depends.
**TC-5** — Dependency conflict risk: `anthropic + openai + firebase-admin + aioboto3`. **Run `pip check` first**.

---

## 7. Confidence Score

**6 / 10** for "AI 5축 + 6/4 출시 achievable under +5.0~5.5d estimate".

Rationale:
- 5-axis scope technically sound, module structure mirrors existing patterns
- BUT: report generation underestimated, incident path synchronous LLM violates NFR-5, GPS multi-worker state unaccounted, `WalkPhoto` model missing, `E -2.0d prepone` ungrounded
- Revised realistic estimate: **+7.0~8.5d** rather than +5.0~5.5d
- Under 2x capacity → ~3.5~4.25 effective days → 6/4 achievable but full margin consumed
- Single external slip (dep conflict, Firebase regression) pushes past margin

---

## 8. Top 5 Actionable Findings

**Finding 1 (CRITICAL — must fix before Final Tech Spec)**: Decouple LLM from incident submission critical path. Incident POST returns 201 immediately after DB insert. LLM classification runs as `BackgroundTasks` with 10s timeout. Fallback: `severity=medium`, `type=other`, `action=contact_owner`. **Non-negotiable: violates NFR-5 otherwise.**

**Finding 2 (HIGH — schema design)**: Add `WalkPhoto` model. `WalkPhoto(id, session_id, s3_key, caption, created_at)` that `PtAiInsight` FKs to. Adds one Alembic migration but architecturally cleaner than JSON array.

**Finding 3 (HIGH — cost control)**: Implement Redis-based cost counter `pt:ai:cost:{YYYY}:{MM}`. 80% threshold → Haiku tier. 100% cap → cached fallback responses. **0.5d task, must precede any AI endpoint deployment.**

**Finding 4 (MEDIUM — architecture decision for Q-5)**: GPS anomaly detection on **backend WS handler**, not mobile. Battery/audit/tamper-resistance reasons. Maintain `pt:walk:{session_id}:gps_history` Redis ZSET (5-min window). Publish anomaly to existing pubsub channel. Mobile `useGpsAnomalyDetection.ts` is pure UI hook.

**Finding 5 (MEDIUM — dependency validation)**: Run `pip check` with `anthropic + openai + firebase-admin + aioboto3` **before** writing any AI code. httpx/pydantic version constraints. 10-minute check, must be first step. Record in verification artifact.

---

## Relevant File Paths

- `artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`
- `artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`
- `artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md`
- `backend/app/apps/pettracker/router.py` (lines 41-42: JWT dependency conflict; line 562: WS handler pattern for AD-3)
- `backend/app/apps/pettracker/models.py` (lines 159, 160: no `photo_urls` array — CF-3)
- `backend/app/modules/storage/s3.py` (lines 38-43: sync boto3 + run_in_executor pattern)
- `backend/app/modules/billing/providers/portone.py` (lines 32-149: provider abstraction pattern AI module should mirror)
- `backend/app/middleware/firebase_auth.py` (lines 64-74: `run_in_executor` async wrap pattern)
