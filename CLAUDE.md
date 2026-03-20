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
- PG사 가맹점 계약 — 사업팀 필요 (코드는 완료)
- 실서버 K8s 프로비저닝 — DevOps 필요 (매니페스트는 완료)
- 앱스토어/플레이스토어 제출 — 사업팀 + DevOps

### 최신 아티팩트
- 최신 마일스톤 보고서: `artifacts/reports/2026-03-20-dashboard-final-milestone.md`
- 최신 핸드오프: `artifacts/handoffs/2026-03-20-session-final-handoff.md`
- 진행 현황 보고서: `artifacts/reports/2026-03-20-project-progress-report.md`

## References
- `@docs/framework-reference.md`
- `@docs/customization.md`
- `@docs/architecture.md`
- `@docs/platform-roadmap.md`
