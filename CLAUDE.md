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

> **Live pointer** — STATE.md mirror. `/session-start`·`/session-end`로 정합성 유지.

**Active workstream**: 모두의 창업 2026 신청서 5/15 16:00 마감 critical path (Track 1) + PT V1.0 출시 6/9 ±2d (Track 2, 5/16 시작)
**Current phase**: **Phase 5 (Implementation)** — modoo-deadline-execution 패키지 4 산출물 구현 중
**Priority principle**: **5/15 신청 > 6/9 PT 출시 > SafeWay 샌드박스** (3레벨)
**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md)
**Final Tech Spec**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md)
**Consensus**: [`artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md`](artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md) — 4 reviewer (frontend 8 / product 7 / fundraising 7 / business 7 / 평균 7.25/10)
**Tech Spec Reviewer**: APPROVED WITH REQUIRED CHANGES (3 필수 수정 + 5 권고)
**신청서 v1**: [`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`](artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md) (36/50, 72%)
**Next gate**: **5/8 D-7 strong-go 게이트** (가입자 ≥30 + LOI ≥3) → 5/9 v2 inject → 5/10 채점 → 5/11 freezing → 5/12 영상 → 5/13 v3 (80+) → 5/14 운영기관 + SafeWay v2.2 → **5/15 16:00 K-Startup 제출** → 5/16 Track 2 시작
**PT 출시 타깃**: **2026-06-09 ±2d**
**Latest handoff**: [`artifacts/handoffs/2026-05-05-session-handoff.md`](artifacts/handoffs/2026-05-05-session-handoff.md) — **modoo-deadline-execution Phase 0~7 완료 (4 산출물 + 38/38 AC PASS + 회귀 0)**

**User Decisions (Anchored)**:
- **D-1=A** 신청서 6/9 AI 5축 동작 강한 약속 (§4·영상 자막 "조건부 약속" 절충)
- **D-2=A** 영상 5/12 마감 (Hybrid: 0~25 실녹화 / 25~55 슬라이드 / 55~60 클로징)
- **D-3** Beachhead = **마포구 + 용산구**
- **D-4=C** ActivityFeed = Track 2 T2.3 후 실 API (6/8)
- **F-1=A** 5/16~6/8 placeholder ("준비 중 — 6월 정식 출시")
- **F-2=C** 영상 25~55초 슬라이드 + 본인 음성 (YouTube Unlisted)
- **UD-2 default** 영상 자막 "2026.06.09 출시 예정" / **UD-3 default** SafeWay v2.2 5/14 연기

**Fallback (5/8 게이트 FAIL)**: 가입자 <30 OR LOI <3 → K-Startup 초기창업패키지 7월 전환, 산출물 3·4 중단, 6월 신청서 재작성. 산출물 1·2는 진행.

**Blockers / Waiting On**:
- 🔴 **5/5~5/7 사용자 critical path**: 가입자 30+·LOI 3+·LOI 마포/용산 거주자 2명 우선·카톡 50명·SNS·5/7 변호사 미팅
- 🟡 EXT-9~12 외부 계정 (AWS·Firebase·Anthropic·OpenAI·PortOne) — Track 2 5/16 의존, 본 패키지 영향 0
- 🟡 UD-3 5/7 결정 (기본값 자동 적용 가능) / UD-4 5/8 게이트 시 (루넨랩스 사업자등록 5/15 전 가능 여부)

**Track 2 (5/16~6/9) — PT V1.0 출시**: T2.0 pip check → T2.1 Milestone C 잔여 (C-13/14 ✅ 2026-04-30 선행) + AI 인프라 (LLM client + Redis cost counter + WalkPhoto migration) → T2.2 사고 신고 LLM (축 A) + 모더레이션 (축 D) → T2.3 사진 캡션 + Empathic 리포트 + 컨디션 (축 B+F) → T2.4 GPS 이상 탐지 (축 E) → T2.5 통합 테스트 → T2.6 Pre-launch QA + EAS Build → **6/9 V1.0 출시**

**Risks (Brief R-7 등급 상향: 낮음 → 중간)**:
- 5/8 게이트 미달 (자금 조달 gap, runway SDET Code B2B 의존도 검토 필요)
- 5/12 영상 제작 실패 → 이미지 5장 대체 (특히 슬롯 2 경쟁사·슬롯 5 멀티앱)
- 5/12~5/13 자원 경합 → UD-3 5/14 연기로 완화

**Open Gap Notes**:
- [`artifacts/gap-notes/2026-04-27-storage-contract-divergence.md`](artifacts/gap-notes/2026-04-27-storage-contract-divergence.md) — Storage FR-3.x ↔ deployed code 4 divergence (V1.1 해소)

**Known Issues (출시 critical path 무관, Milestone F 처리)**:
- KI-2 TOSS_WEBHOOK_SECRET 미설정 → Toss webhook 3 fail
- KI-3 health endpoint degraded → 1 fail
- KI-4 m4_websocket teardown race → 1 error (인프라 잔존)

---

### Parallel Workstream — SafeWay Kids 규제 샌드박스 (별도 진행)
**Phase**: Phase 5 — Implementation (v2.1 양길모 KISED #32399 의견서 반영 완료, 5/7 cross-check 대기)
**Active draft**: [`artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md`](artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md) — 911 라인
**Legal anchor**: 양길모 변호사 (법무법인 조율, KISED #32399, 2026-05-02 승인) — `artifacts/business/regulatory/2026-04-29-yangkilmo-legal-opinion-detailed.pdf`
**v2.1 핵심 변경**: §2.7·§4.6 "고영향 AI 미해당 + 자발적 거버넌스 이중 트랙" + §4.7 신설 (정통망법 §44의2 적용 외) + §6.1 행 E "별개 진행"
**Next gate**: 양길모 인용 동의 (5/3~5/4) → 5/7 이의림 cross-check → 5/8~5/13 페르소나 검토 → **5/14 v2.2 확정·전달 (UD-3 연기)**
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
