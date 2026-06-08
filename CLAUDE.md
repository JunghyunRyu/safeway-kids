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

### 검증 수치 (2026-05-06 backend-dev sub-agent 실측 갱신)
- 백엔드 테스트: **207 passed / 210** (2026-05-22 P1-2 후 실측, 신규 P1-2 19건 추가, 회귀 0). Known fails: KI-2 Toss webhook 3건 (TOSS_WEBHOOK_SECRET 미설정). KI-3 health degraded / KI-4 WS teardown race는 이번 run 미발현 (flaky 카테고리)
- 모바일 테스트: **17 파일 / 71 it() 블록** (SafeWay mobile) + 9 파일 (PT mobile, apps/pettracker)
- 웹 테스트: **12 파일 / 50 it() 블록**
- TypeScript: web · site · lunenlabs **0 errors** (실측 PASS) / mobile **0 errors** (2026-05-22 PASS — `npx tsc --noEmit` from `mobile/`, typescript 5.9.3 hoisted to root node_modules)
- 총 코드 (실측 2026-05-06): 백엔드 24,936 + 모바일(SafeWay) 12,609 + 웹 10,804 + 사이트 1,361 + apps(PT+CC) 8,646 + lunenlabs 2,926 + packages 1,455 = **~62,200 LOC**
- 웹 대시보드 품질 향상 완료 (정량 측정 기준·결과 artifact 미보존 — "95점" 표현 약화)

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

> **Live pointer** — STATE.md mirror. `/session-start`·`/session-end`로 정합성 유지.

**Active workstream**: **모두의 창업 1R 결과 대기 (~7월 말)** + PT V1.0 출시 reschedule (7월 말~8월 초) + **본업 집중 (~6/15)** + 6/15까지 AI 호출 없는 인프라 골격만 슬라이스 작업
**Current phase**: **Phase 7 (Milestone Closure 대기)** — 5/15 16:00 modoo.or.kr 제출 완료 (v2.6-tight, 운영기관=프라이머). Phase 6 Verification은 1R 평가위원 채점으로 외부 위임. 6/15 본업 종료 후 Track 2 본격 ramp-up
**Priority principle**: **1R 결과 안내 대기 > 본업 (~6/15) > PT V1.0 출시 ramp-up (6/15~) > SafeWay 동결 유지 > CareConnect 보류**
**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md) (Phase 5 종료)
**신청서 제출본 (5/15 16:00 anchor)**: [`artifacts/business/fundraising/2026-05-10-modoo-pt-application-v2.6-tight.md`](artifacts/business/fundraising/2026-05-10-modoo-pt-application-v2.6-tight.md) (Q1 97 / Q2 900 / Q3 997 / Q4 992자, AI tell 제거)
**진화 기록**: v1.4(36) → v2.0(37.5) → v2.1(38.5) → v2.5(42.5/페르소나 34.4) → v2.6-humanized → **v2.6-tight (제출본)**
**운영기관 선택**: 프라이머 ★★★★★ ([`artifacts/business/fundraising/2026-05-08-modoo-operating-org-fit-analysis.md`](artifacts/business/fundraising/2026-05-08-modoo-operating-org-fit-analysis.md))
**Next gate**: **~7월 말 1R 결과 안내** → 통과 시: 사업자등록 + PortOne 계약 + OpenAI 결제 해결 + Track 2 본격 → 7월 말~8월 초 PT V1.0 출시. 미통과 시: 7월 modoo 차회 또는 별도 사업 fallback (산출물 60~70% 재사용)
**PT 출시 타깃 (재정렬)**: **2026-07월 말 ~ 8월 초** (이전 6/9 ±2d에서 reschedule)
**Latest handoff**: [`artifacts/handoffs/2026-05-22-session-final-handoff.md`](artifacts/handoffs/2026-05-22-session-final-handoff.md) (P1-1 mobile tsc 검증 PASS + P1-2 ai 모듈 스켈레톤 19/19 PASS, 회귀 0. 다음 first step = P1-3)

**User Decisions (2026-05-22 갱신)**:
- **D-1~D-5 / C-1~C-5 / UD-1~UD-4**: modoo 제출 anchor (이력 archive, 변경 없음)
- **D-6 (NEW 2026-05-22)** PT V1.0 출시 reschedule: 6/9 → **7월 말~8월 초**. 4 제약 동시 정렬 (본업 ~6/15, 1R 결과 ~7월 말, OpenAI 결제, PortOne 사업자). §4 6/9 약속 setback은 1R 통과 후 멘토링 단계에서 운영기관에 설명
- **D-7 (NEW 2026-05-22)** **SafeWay 샌드박스 동결**: 자문 메모 불만족 + 1인 개발 부담 signal. Claude proactive 작업 0
- **D-8 (NEW 2026-05-22)** **6/15까지 본업 집중**: PT는 AI 호출 없는 인프라 골격만 슬라이스 (비용 0, burnout 0)

**Blockers / Waiting On (5/22 갱신)**:
- 🟡 **1R 결과 안내 대기 (~7월 말)** — 외부 의존, action 불가
- 🟡 **OpenAI 결제 보류** — 카드 결제 실패. Track 2 LLM 실 호출 unblock 의존. 6/15 본업 종료 후 해결
- 🟡 **PortOne 사업자 계정 필요** — 1R 통과 후 사업자등록 → 계약 순서
- ✅ ~~mobile tsc 환경~~ — 5/22 P1-1 검증 PASS (npx tsc --noEmit 0 errors). 환경은 npm workspace hoisting으로 루트 node_modules의 typescript@5.9.3 사용. "lock mismatch" 진단은 오진
- ✅ **EXT-9~11** AWS·Firebase·Anthropic 보유 / **OpenAI** 결제만 / **PortOne** 사업자만
- 🔴 **D-7 SafeWay 동결** — Claude proactive 작업 0, 사용자 재진입 전 모든 SafeWay 영역 동결

**6/15까지 슬라이스 (본업 사이 가벼운 작업)**: ~~P1-1 mobile tsc 복구~~ (✅ 5/22) → ~~P1-2 LLM client + Redis cost counter 스켈레톤 (stub)~~ (✅ 5/22) → ~~P1-3 WalkPhoto 마이그 + PortOne v2~~ (✅ 6/8 — WalkPhoto 모델+마이그(`f3b9c1d27a40`)+테스트 3, tests/unit 77 passed. PortOne v2는 선행 구현 확인 → Gap Note, 범위 축소). **슬라이스 트랙 전체 종료.**

**6/15 이후 ramp-up**: P2-1 OpenAI 결제 해결 → P2-2 Track 2 T2.2~T2.4 LLM 실 구현 (사고·캡션·모더레이션·GPS) → P2-3 PT V1.0 출시 (T2.5 통합 + T2.6 EAS Build)

**Risks (5/22 갱신)**:
- **R-1 (HIGH)** §4 "6/9 출시" 약속과 실제 출시 7월 말~8월 초 시차 → 멘토링 단계 setback 사유 설명 필요
- **R-2 (MED)** 1R 미통과 시 자금 lag 4~6개월 → fallback path 보존
- **R-3 (MED)** 1인 burnout signal (SafeWay 동결 기저) → PT도 무리하면 동력 손실. 6/15까지 가벼운 슬라이스만
- **R-4 (LOW)** OpenAI 결제 해결 지연 → Track 2 LLM 슬립

**Open Gap Notes**:
- [`artifacts/gap-notes/2026-04-27-storage-contract-divergence.md`](artifacts/gap-notes/2026-04-27-storage-contract-divergence.md) — Storage FR-3.x ↔ deployed code 4 divergence (V1.1 해소)
- [`artifacts/gap-notes/2026-06-08-pt-portone-v2-already-implemented.md`](artifacts/gap-notes/2026-06-08-pt-portone-v2-already-implemented.md) — P1-3 PortOne v2는 선행 구현 완료 → 핸드오프 잔여작업 오기재, P1-3 범위 WalkPhoto로 축소 (LOW)
- [`artifacts/gap-notes/2026-06-08-pt-confirm-payment-dead-code-bug.md`](artifacts/gap-notes/2026-06-08-pt-confirm-payment-dead-code-bug.md) — ✅ **RESOLVED (2026-06-08)** PT `confirm_payment` 도달 불가 코드 버그 수정 (purge 함수 모듈 최상위 이동 + PAID 영속 복원 + PT 결제 테스트 3건 추가)

**Known Issues (출시 critical path 무관)**:
- KI-2 TOSS_WEBHOOK_SECRET 미설정 → Toss webhook 3 fail
- KI-3 health endpoint degraded → 1 fail
- KI-4 m4_websocket teardown race → 1 error

---

### Parallel Workstream — SafeWay Kids 규제 샌드박스 (**동결 — D-7**)
**Phase**: **동결 (2026-05-22 D-7 결정)** — 자문 메모(양길모 + 5/7 이의림+이학선) 수신 완료, 사용자 평가 = 불만족. 1인 개발 부담 + 규제 어려움 signal로 추진 동력 저하
**Active draft (정지)**: [`artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md`](artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md) — 911 라인, 정지 상태 보존
**Legal anchor**: 양길모 변호사 (법무법인 조율, KISED #32399, 2026-05-02 승인)
**Re-entry trigger**: 사용자 자발적 결정. Claude proactive 작업 금지

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
