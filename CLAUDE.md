# Claude Code Platform Charter

This repo is a **Claude Code plugin**: a repeatable operating framework that converts requests into verified outcomes through a 9-phase workflow (intake → review → consensus → spec → plan → implement → verify → closure → handoff).

> Keep this file lean. Live project state lives in `STATE.md`; framework detail lives in `docs/framework-reference.md`. Both are read on demand, not duplicated here.

## Non-negotiable rules
1. Treat the user's explicit instruction as the top priority.
2. Never fabricate tool results, review outputs, test results, or repository state.
3. No file-writing implementation until a Final Tech Spec exists — read-only exploration excepted.
4. Record assumptions in an Assumption Register; unresolved ambiguities in Open Questions.
5. When spec and code conflict, stop writing, create a Gap Note, update spec/plan, then continue.
6. Never claim completion without evidence; never infer prior state without a verified artifact.
7. Keep diffs minimal and traceable.
8. Every completed milestone ends with a Milestone Report and a Session Handoff Packet.

## Decision precedence
User instruction → approved Final Tech Spec → real codebase constraints → passing verification evidence → existing architecture/conventions → reviewer opinions.

## Verified-state rule
If no verified artifact exists, report exactly: `NO VERIFIED PRIOR STATE`.
Verified artifacts = latest approved Tech Spec · latest Milestone Report · latest Session Handoff Packet. (Tool/MCP discovery is NOT proof of completed work.)

## 9-phase workflow (summary — full detail in `docs/framework-reference.md` §3)
0. **Intake** → Requirement Brief, Goals/Non-goals, Assumption Register, Open Questions, Acceptance Criteria
1. **Independent Review** → restatement, missing requirements, conflicts, risks, alternatives, testing concerns, confidence
2. **Consensus** → Consensus Matrix; resolve disagreements explicitly
3. **Final Tech Spec** → problem, goals, scenarios, FR/NFR, constraints, architecture, interfaces, edge cases, failure handling, testing strategy, rollback, acceptance, out-of-scope, code impact map
4. **Todo Plan** → milestone-based todos
5. **Implementation** → single-writer; keep Change Summary, Gap Notes, Decision Log
6. **Verification** → unit / integration / regression / smoke / E2E as available
7. **Milestone Closure** → state what's complete, what's unverified, residual risks
8. **Session Handoff** → status, changed files, commands run, test outcomes, open issues, next exact first step

## Required artifacts
Types: Requirement Brief · Consensus Matrix · Final Tech Spec · Todo Plan · Change Summary · Verification Report · Milestone Report · Session Handoff Packet.
Paths & naming → `.claude/rules/artifact-paths.md`. Artifact schemas → `docs/framework-reference.md` §4.

## Verification discipline (full: `.claude/rules/verification-rules.md`)
Evidence-first: list files changed, commands run, actual results, and any failures/skips. Use labels VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / FAILED — never collapse unverified work into a pass. Prefer project-native checks; call out flaky tests and missing E2E explicitly.

## State & status reporting
1. Never infer current phase/milestone/status without a verified artifact or explicit user instruction.
2. Separate facts, assumptions, and recommendations.
3. If a reviewer or integration is unavailable, say so — never simulate it.
4. `STATE.md` (root) is the single source of truth for "what's happening now"; keep its 5 critical fields mirrored in **Active Work** below. (Rules: `.claude/rules/state-tracking.md`, `.claude/rules/safety-rules.md`.)

## Delegation policy
Plugin agents: `requirement-analyst` (readiness) · `tech-spec-reviewer` (spec stress-test) · `verification-auditor` (evidence-first closure).
Plugin skills: `/claude-forge:{bootstrap,review,test,gap-note,milestone-report,session-handoff}`.
Specialist pool (user-level): `business-operations-manager` · `korea-{regulatory-counsel,tax-accounting-advisor,fundraising-strategist}` · `backend-dev` · `frontend-dev` · `db-architect` · `security-expert` · `product-manager` · `qa-lead` · `ux-advocate`.

## 개발 환경 실행 가이드
**백엔드** (포트 8000): `cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000`
**웹 관리자** (`localhost:5173`): `cd web && npm run dev` — 플랫폼/학원 관리자 로그인. 시드: 로그인 후 사이드바 "시드 데이터" → 생성.
**랜딩 사이트**: `cd site && npm run dev`
**모바일** (Expo Go on iPhone): `cd mobile && ./start-dev.sh` — Metro + 리버스 프록시 + ngrok 터널을 한번에 시작하고 QR 출력. 수동 절차는 `mobile/start-dev.sh` 참조.

> 모바일 quirks: iPhone Expo Go는 **SDK 54**까지 → 프로젝트도 SDK 54. 무료 ngrok 터널 1개 제한 → `proxy.js`로 Metro(8081)+Backend(8000)를 포트 9000으로 합침. QR URL은 `exp://<ngrok-domain>` (`:8081` 미부착). KakaoMap 네이티브 SDK는 Expo Go 미지원.
> **검증 cwd 주의**: 루트 tsconfig는 careconnect navigator 사전 타입에러를 냄 → 앱별 tsc/jest는 반드시 해당 앱 디렉토리(예: `apps/pettracker/mobile`)로 cd 후 실행.

## Active Work (mirror of `STATE.md` — 5 critical fields only)
> 결정(D-#)·리스크·블로커·갭노트·검증수치 상세는 모두 `STATE.md`와 최신 Milestone Report에 있다. 여기서 추측하지 말고 그 파일들을 읽어라.

- **Active workstream**: 모두의 창업 2차 결과 대기 (2026-09-16 20:19 제출 완료, PetTracker → 동물보호소 대상 재도전. 1차는 탈락)
- **Current phase**: Phase 7 (Milestone Closure 대기)
- **Active brief**: `artifacts/business/fundraising/2026-09-14-modoo-2nd-shelter-first-rewrite.md` (제출 원문은 modoo.or.kr 「내 지원서 → 2차」가 기준)
- **Next gate**: 2차 결과 발표(발표일 미확인) → 통과 시 사업자등록 + 보호소 1곳 확보
- **Blockers**: 2차 결과 대기 · 협회 인용 허락 회신 대기 · ⚪ OpenAI 결제·PortOne·D-7 SafeWay 동결은 6/4 이후 미확인
- **Latest handoff / 이력**: `artifacts/handoffs/` 최신 파일 · 마일스톤 이력·검증수치는 `artifacts/reports/` 최신 Milestone Report

## Session bootstrap
| 시점 | 명령 |
|---|---|
| 새 세션 시작 | `/session-start` 또는 "작업 이어갈게" |
| 세션 종료 | `/session-end` 또는 "마무리하자" |
| 샌드박스 작업(동결 중) | `/sandbox-followup [email\|prep\|status\|review]` |
| 상세 상태 | `STATE.md` (루트) |

## References
Read on demand (not auto-loaded): `docs/framework-reference.md` (9-phase·schemas·failure modes) · `docs/customization.md` · `docs/architecture.md` · `docs/platform-roadmap.md` · `.claude/rules/{artifact-paths,safety-rules,state-tracking,verification-rules}.md`.
