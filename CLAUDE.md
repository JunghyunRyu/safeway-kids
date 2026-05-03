# Claude Code Platform Charter

This repository is a **Claude Code plugin** providing a high-quality operating framework for repeatable development work.

## Objective
Convert user requests into verified implementation outcomes through a consistent workflow:
requirements analysis → independent review → consensus → tech spec → todo plan → implementation → verification → milestone closure → session handoff.

## Non-negotiable rules
1. Treat the user's explicit instruction as the top priority.
2. Never fabricate tool results, review outputs, test results, or repository state.
3. Do not start file-writing implementation until a Final Tech Spec exists, except for read-only exploration.
4. Record assumptions in an Assumption Register.
5. Record unresolved ambiguities in Open Questions.
6. When spec and code conflict, stop writing, create a Gap Note, update the spec or plan, then continue.
7. Never claim completion without evidence.
8. Never infer prior project state without a verified artifact.
9. Keep diffs minimal and traceable.
10. Every completed milestone must end with a Milestone Report and a Session Handoff Packet.

## Decision precedence
1. User instruction
2. Approved Final Tech Spec
3. Real codebase constraints
4. Passing verification evidence
5. Existing architecture and repository conventions
6. Reviewer opinions

## Verified-state rule
If no verified artifact exists, report exactly:

`NO VERIFIED PRIOR STATE`

Verified artifacts include:
- latest approved Tech Spec
- latest Milestone Report
- latest Session Handoff Packet

## 9-phase workflow
### Phase 0 — Intake
Produce:
- Requirement Brief
- Goals / Non-goals
- Assumption Register
- Open Questions
- Acceptance Criteria draft

### Phase 1 — Independent Review
Request independent review from available reviewers (subagents, MCP, or both).
Collect:
- requirement restatement
- missing requirements
- conflicts
- technical risks
- alternative designs
- testing concerns
- confidence

### Phase 2 — Consensus
Create a Consensus Matrix.
Resolve disagreements explicitly.

### Phase 3 — Final Tech Spec
Produce a Final Tech Spec containing:
- problem statement
- goals / non-goals
- user scenarios
- functional requirements
- non-functional requirements
- constraints
- architecture / data flow
- interfaces / CLI / AppState / event flow
- edge cases
- failure handling
- testing strategy
- rollback strategy
- acceptance criteria
- out-of-scope
- code impact map

### Phase 4 — Todo Plan
Convert the Final Tech Spec into milestone-based Todo items.

### Phase 5 — Implementation
Use single-writer discipline for code edits.
Keep:
- Change Summary
- Gap Notes
- Decision Log

### Phase 6 — Verification
Run relevant verification such as:
- unit tests
- integration tests
- regression checks
- smoke checks
- E2E checks, when available

### Phase 7 — Milestone Closure
Decide whether the current milestone is ready to close.
State:
- what is complete
- what remains unverified
- residual risks

### Phase 8 — Session Handoff
Before ending a session, produce a handoff packet with:
- current status
- changed files
- commands executed
- tests and outcomes
- open issues
- next exact first step

## Required artifacts
Default artifact paths:
- `artifacts/specs/`
- `artifacts/plans/`
- `artifacts/reviews/`
- `artifacts/reports/`
- `artifacts/handoffs/`
- `artifacts/gap-notes/`
- `artifacts/verification/`

Required artifact types:
- Requirement Brief
- Consensus Matrix
- Final Tech Spec
- Todo Plan
- Change Summary
- Verification Report
- Milestone Report
- Session Handoff Packet

## Delegation policy
Use plugin agents when appropriate:
- `requirement-analyst` for requirement breakdown and readiness
- `tech-spec-reviewer` for spec stress-testing
- `verification-auditor` for evidence-first closure checks

Use plugin skills when appropriate:
- `/claude-forge:bootstrap` for environment readiness and next-step guidance
- `/claude-forge:review` for orchestrated multi-review flow
- `/claude-forge:test` for structured verification execution
- `/claude-forge:gap-note` when spec and implementation drift
- `/claude-forge:milestone-report` at milestone closure
- `/claude-forge:session-handoff` before session end

## State and status reporting rules
1. Never infer the current project phase, prior milestone, or task status unless it is explicitly supported by:
   - the latest Milestone Report
   - the latest Session Handoff Packet
   - explicit user instruction
2. Tool discovery does not prove work completion.
3. MCP availability does not imply any review has already been performed.
4. Separate facts, assumptions, and recommendations.
5. If a reviewer or integration is unavailable, state that explicitly. Do not simulate missing reviewers.

## 개발 환경 실행 가이드

### 모바일 앱 테스트 (Expo Go on iPhone)
VMware 환경에서 iPhone Expo Go로 앱을 테스트하려면:
```bash
cd mobile && ./start-dev.sh
```
이 스크립트가 Metro, 리버스 프록시, ngrok 터널을 한번에 시작하고 QR 코드를 출력한다.

수동으로 실행해야 할 경우:
1. 백엔드 실행 확인 (포트 8000)
2. Metro 시작: `EXPO_PACKAGER_PROXY_URL=<ngrok_url> BROWSER=none npx expo start --host lan --port 8081`
3. 프록시 시작: `node proxy.js` (포트 9000, `/api/*` → 8000, 나머지 → 8081)
4. ngrok 시작: `~/.config/ngrok/ngrok http 9000`
5. QR 코드의 URL 형식: `exp://<ngrok-domain>` (`:8081` 포트 붙이지 않음)

**주의사항:**
- iPhone App Store Expo Go는 SDK 54까지 지원 → 프로젝트는 SDK 54로 설정되어 있음
- 무료 ngrok은 터널 1개 제한 → proxy.js로 Metro + Backend를 한 포트로 합침
- KakaoMap 네이티브 SDK는 Expo Go에서 미지원

### 백엔드 서버
```bash
cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000
```

### 웹 관리자 대시보드
```bash
cd web && npm run dev
```
- `http://localhost:5173` 접속
- "플랫폼 관리자 로그인" → 전체 시스템 관리 (학원/사용자/차량/청구/컴플라이언스/감사로그/관제센터)
- "학원 관리자 로그인" → 개별 학원 관리 (학생/스케줄/차량/청구)
- 시드 데이터: 로그인 후 사이드바 "시드 데이터" → "시드 데이터 생성" 클릭

### 랜딩 사이트
```bash
cd site && npm run dev
```

## 프로젝트 진행 현황 (2026-03-20 기준)

### 완료된 마일스톤
| 마일스톤 | 상태 | 날짜 |
|----------|------|------|
| M0 Foundation | COMPLETE | 2026-03-13 |
| M1 Core Backend | COMPLETE | 2026-03-13 |
| M2 Parent/Driver App | COMPLETE | 2026-03-13 |
| M3 Compliance/Notifications | COMPLETE | 2026-03-13 |
| M4 Real-time WebSocket | COMPLETE | 2026-03-13 |
| M5 Operational Loop | COMPLETE | 2026-03-13 |
| M6 Production Hardening | COMPLETE | 2026-03-13 |
| M7 Billing System | COMPLETE | 2026-03-13 |
| M8 Academy Web Dashboard | COMPLETE | 2026-03-13 |
| M9 Safety Escort Matching | COMPLETE | 2026-03-13 |
| Design System Redesign | COMPLETE | 2026-03-17 |
| WebSocket Connection Fix | COMPLETE | 2026-03-17 |
| 프로덕션 배포 준비 | COMPLETE | 2026-03-20 |
| 플랫폼 운영자 대시보드 | COMPLETE | 2026-03-20 |
| 웹 대시보드 품질 95점 달성 | COMPLETE | 2026-03-20 |

### 검증 수치 (최신)
- 백엔드 테스트: **95 passed, 0 failed**
- 모바일 테스트: **10 suites, 36 passed**
- 웹 테스트: **12 suites, 50 passed**
- TypeScript: **0 errors** (모바일, 웹, 사이트 전체)
- 총 코드: 백엔드 6,543 + 모바일 7,292 + 웹 4,000+ + 사이트 736 = **~18,500+ LOC**

### 코드로 해결 불가능한 남은 항목
- 엣지 AI 하드웨어 (NVIDIA Jetson, CCTV, 스마트 미러) — 하드웨어 필요
- 규제 샌드박스 심사 대응 — 법무팀 필요 (신청은 완료)
- PG사 가맹점 계약 — 코드는 완료, 계약 진행 가능
- 실서버 K8s 프로비저닝 — 매니페스트 완료, 프로비저닝 진행 가능
- 앱스토어/플레이스토어 제출 — EAS Build/Submit으로 진행 가능

### 최신 아티팩트
- 최신 마일스톤 보고서: `artifacts/reports/2026-03-20-dashboard-final-milestone.md`
- 최신 핸드오프: `artifacts/handoffs/2026-03-20-session-final-handoff.md`
- 진행 현황 보고서: `artifacts/reports/2026-03-20-project-progress-report.md`

## Active Work (Live)

> **Live pointer** — 이 섹션은 "지금 무엇이 진행 중인가"의 human-readable mirror.
> 기계 판독용 상태는 루트의 `STATE.md`에 있고, 두 파일은 `/session-start`·`/session-end` 스킬로 정합성이 유지된다.
> 상단 "프로젝트 진행 현황 (2026-03-20 기준)"은 **과거 스냅샷**이고, 이 섹션은 **현재 라이브 포인터**다. 혼동 금지.

**Active workstream**: PetTracker V1.0 출시 + 모두의 창업 2026 신청 (Track 1 신청서 + Track 2 AI 구현 분리)
**Current phase**: **Phase 4 → Phase 5 진입 직전** (Track 1 신청서 우선 4/30~5/15, Track 2 AI 구현 5/16~6/9)
**Active brief**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`](artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md) (AI 차별화 8축) + [`artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md`](artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md) (PT V1.0 baseline)
**Final Tech Spec**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md`](artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md) — 21 섹션, 사용자 결정 D-1=5축 / D-2=TTcare 추상화 / D-7=글로벌 출처 삭제 + Consensus 자동 반영 15건
**Todo Plan**: [`artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md`](artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md) — Track 1 (4/30~5/15 신청서) + Track 2 (5/16~6/9 AI 5축 구현)
**Consensus matrix**: [`artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md`](artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md) — 3 reviewer (backend-dev 6/10 / product-manager 6/10 / korea-fundraising-strategist 7/10), 점수 회복 +9~13 → **79~86점 진입**
**보강 산출물**: [`artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md`](artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md) — 차별화 3 layer + Moat 5종 + BMC 9 blocks + Unit Economics 3 시나리오 (LTV/CAC 6.16 기본) + 면접 답변 4건
**Cross-check (5/3 신규)**: [`artifacts/business/fundraising/2026-04-30-modoo-eval-guide-crosscheck.md`](artifacts/business/fundraising/2026-04-30-modoo-eval-guide-crosscheck.md) — 1차 출처 100% (`/intro` + 공고문 PDF + 공식 FAQ 답변) / 평가 5축 (가능성·구체성·기대효과·차별성·효과성) / cross-check 5변경 / 신청서 7개 항목별 inject 가이드
**신청서 본문 v1 (5/3 신규)**: [`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`](artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md) — 26KB / 362행 / 본문 ~2,967자 / 5축 매트릭스 30/30 cell / 자체 채점 36/50 (72%) / placeholder 6건 (가입자 1 + LOI 5명) / 약점 Top 3 보강 가이드 / D-15 사전 작성 +9일 buffer
**Latest verification**: [`artifacts/verification/2026-04-30-c14-livetrack-ws-verification.md`](artifacts/verification/2026-04-30-c14-livetrack-ws-verification.md) — C-13/C-14 선행 완료. PT jest **20 passed** (15 → 20, +5 useWebSocket), TS **0 errors** (PT/core-mobile 동시), 전체 persona 시나리오 **22 passed in 4.83s**. C-13: `packages/core-mobile/hooks/useWebSocket.ts` (지수 백오프 재연결 + first-message auth). C-14: `LiveTrackScreen.tsx` WS 통합 + polling fallback. Gap-fix: `record_gps`에 Redis publish 추가 (1초 timeout fail-soft).
**Next gate**: **Track 1 — 5/8 D-7 strong-go/no-go 게이트** (가입자 ≥30 + LOI ≥3 + 5/7 변호사 미팅 회수) → **5/9 placeholder 6건 inject로 v2 즉시 생성** (가입자 1 + LOI 5명) → 5/10 1차 채점 (`evaluator-rubric-reviewer` 5 페르소나) → 5/13 v3 80점 목표 → 5/14 운영기관 최종 선택 (서울 AC 5개) → **5/15 16:00 K-Startup 포털 제출** → 5/16 Track 2 시작 (T2.0 `pip check` 첫 단계)
**Latest handoff**: [`artifacts/handoffs/2026-05-03-session-handoff.md`](artifacts/handoffs/2026-05-03-session-handoff.md) — **modoo.or.kr 평가 가이드 cross-check + 신청서 본문 v1 D-15 사전 작성 완료 (5축 anchor 30/30 / 자체 36/50 / placeholder 6건 / +9일 buffer)** (이전: 4/30 오후 — 동기 174건 + V2.0 6축 / 4/30 오전 — AI 차별화 Phase 0~4 + 옵션 A 채택). (이전: 4/29 P0 5건 / 4/27 트랙션 매핑 / 4/24 베이스라인)
**PT 출시 타깃**: **2026-06-09 ±2d** (옵션 A: 신청서 우선 → AI 5축 5/16부터 시작, 기존 6/4 → 6/9)
**Open Gap Notes**:
- [`artifacts/gap-notes/2026-04-27-storage-contract-divergence.md`](artifacts/gap-notes/2026-04-27-storage-contract-divergence.md) — Storage FR-3.x ↔ deployed code 4 divergence (V1.1 해소)

**Blockers / Waiting On (PT 워크스트림)**:
- ✅ ~~Phase 0 Baseline~~ → 145 passed, TS/jest/vitest all pass
- ✅ ~~Milestone A 잔여 5건~~ → 보험 UI / Handover 데이터 / 신원조회 stub 완료, 145 passed (회귀 0)
- ✅ ~~Milestone B 모바일 테스트 인프라~~ → PT jest 7 suites · 12 tests, Firebase Auth 미들웨어 + Alembic firebase_uid 완료
- ✅ ~~Milestone C-1/3 PG provider 추상화 + PortOne v2 provider~~ → import smoke OK
- ✅ ~~Milestone C-Pay~~ → C-4 PtPayment 모델 + manual Alembic, C-5 `/pt/payments/{prepare,confirm,{id}/cancel}`, C-6 `/billing/webhook/portone` (HMAC fail-closed). 145 passed.
- ✅ ~~Milestone C-Storage 백엔드~~ → C-7 storage 모듈 (S3/Local fallback) + `/api/v1/storage/upload-url`
- ✅ ~~Milestone C-WS 백엔드~~ → C-11 `ws_auth.py` (DI 주입), C-12 `/pt/ws/walks/{session_id}` (`pt:walk:{id}:updates`)
- ✅ ~~Milestone C-9 useImageUpload~~ → core-mobile hook + PT jest 3 cases (presigned PUT + FR-3.3 prefix). 15 passed.
- ✅ ~~Milestone C-10 PT 사진 업로드 UI~~ → WalkerProfileScreen + WalkScreen 통합. 백엔드 persistence는 Gap Note D-3/D-4 (V1.1 이연).
- 🟡 **Track 2 AI 구현 트랙 (5/16 시작)** — Phase 4 Todo Plan T2.0~T2.6:
  - T2.0 `pip check` 의존성 호환 검증 (anthropic+openai+firebase-admin+aioboto3) — **첫 단계 의무**
  - T2.1 Milestone C 잔여 (C-13/14 ✅ **2026-04-30 선행 완료**) + AI 인프라 (LLM client + Redis cost counter + WalkPhoto migration 잔여)
  - T2.2 Milestone D + 축 A 사고 신고 LLM 분류 (비동기 BackgroundTasks, NFR-5 보호) + 축 D 모더레이션
  - T2.3 축 B 사진 자동 캡션 + Empathic 리포트 + 축 F 컨디션 (B에 통합)
  - T2.4 축 E GPS 이상 탐지 (Redis ZSET + 워커 자동 check-in)
  - T2.5 Milestone F 통합 테스트 + 회귀 매트릭스 (백엔드 165+ / PT jest 22+ / TS 0 errors)
  - T2.6 Milestone G Pre-launch QA + EAS Build → **6/9 V1.0 출시**

**External (사용자 작업 필요)** — Track 1·2 분리:

**Track 1 (4/30~5/15 신청서 critical path)**:
- 🔴 **4/30 critical path 6건 (5.5h)**: 랜딩·인센티브·PIPA·LOI 4건·카톡 50명·SNS 활성화
- 🔴 **5/8 D-7 strong-go 게이트**: 가입자 ≥30 + LOI ≥3 (미달 시 K-Startup 초기창업패키지 7월 전환)
- 🟡 **EXT-6 변호사 자문 Q-L2·Q-L3** (보험사 가맹 가능성) — 5/8 게이트 전 회신 권장
- 🔴 **5/15 16:00 K-Startup 포털 제출**

**Track 2 (5/16 시작 AI 구현 외부 작업)**:
- 🟡 EXT-9 AWS 계정 + IAM + S3 버킷 (Track 2 시작 전)
- 🟡 EXT-10 Firebase 프로젝트 + Admin SDK service account JSON
- 🟡 EXT-11 Anthropic API key + OpenAI API key (Track 2 T2.0 전)
- 🟡 EXT-12 PortOne 가맹점 계약 + API key/secret (Track 2 T2.5 전)
- 🟡 EXT-7 보험사 가맹 1차 접촉 (출시 +1~2개월), EXT-8 Beachhead 지역 결정 (5/15 후)

**완료**: ✅ ~~모두의 창업 2026 P0 5건 산출물 작성~~ (4/29) — `artifacts/business/fundraising/2026-04-29-modoo-startup-pt-*.md` + `budget-guide-summary.md`

**Known Issues (PT 출시 critical path 무관)**:
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정 → Toss webhook 3 fail (Milestone F 처리)
- KI-3 health endpoint `degraded` → 1 fail (Milestone F 처리)
- KI-4 m4_websocket teardown race → 1 error (test_ws_accepts_valid_token_query_param). C-11 refactor로 1 error 해소, 잔존 1은 pytest unraisable hook 캡처 (인프라). Milestone F.

---

### Parallel Workstream — SafeWay Kids 규제 샌드박스 (별도 진행)
**Phase**: Phase 5 — Implementation (v2.1 양길모 변호사 KISED #32399 의견서 반영 완료, 5/7 cross-check 대기)
**Active draft**: [`artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md`](artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md) — v2.1 (911 라인 / 110KB)
**Legal opinion anchor**: [`artifacts/business/regulatory/2026-04-29-yangkilmo-legal-opinion-detailed.pdf`](artifacts/business/regulatory/2026-04-29-yangkilmo-legal-opinion-detailed.pdf) — 양길모 변호사 (법무법인 조율, KISED #32399, 2026-05-02 승인)
**v2.1 핵심 변경**: §2.3 변호사 의견 anchor + §2.7·§4.6 "고영향 AI 미해당 + 자발적 거버넌스 이중 트랙" + §4.7 신설 (정통망법 §44의2 적용 외) + §6.1 행 E "별개 진행"
**Next gate (샌드박스)**: 양길모 인용 사전 동의 통화 (5/3~5/4) → 5/7 이의림 변호사 cross-check → 5/8~5/13 페르소나 검토 → 5/13 v2.2 확정 → 5/14 운영기관 사전 전달
**Last handoff (샌드박스)**: [`artifacts/handoffs/2026-04-19-session-handoff.md`](artifacts/handoffs/2026-04-19-session-handoff.md)
**Next meeting**: 2026-05-07 (대한상공회의소 이의림 변호사)

### Session bootstrap
| 시점 | 명령 |
|---|---|
| 새 세션 시작 | `/session-start` 또는 자연어 "작업 이어갈게" |
| 세션 종료 | `/session-end` 또는 자연어 "마무리하자" |
| 샌드박스 상세 작업 | `/sandbox-followup [email\|prep\|status\|review]` |
| 상세 상태 파일 | `STATE.md` (루트) |

### Specialist pool (user-level agents)
- `business-operations-manager` — 사업 전반 (CFO+COO+CSO 통합)
- `korea-regulatory-counsel` — 한국 규제·법무 1차 자문
- `korea-tax-accounting-advisor` — 한국 세무·회계
- `korea-fundraising-strategist` — 정부지원사업 + 초기 VC IR

## References
- `@docs/framework-reference.md`
- `@docs/customization.md`
- `@docs/architecture.md`
- `@docs/platform-roadmap.md`
