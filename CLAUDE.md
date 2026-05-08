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
- 백엔드 테스트: **178 def test_ collected** (alembic upgrade head --sql EXIT:0 PASS, 본 세션 변경분 회귀 0). Known fails: KI-2 Toss webhook 3건 / KI-3 health degraded 1건 / KI-4 WS teardown race 1건
- 모바일 테스트: **17 파일 / 71 it() 블록** (SafeWay mobile) + 9 파일 (PT mobile, apps/pettracker)
- 웹 테스트: **12 파일 / 50 it() 블록**
- TypeScript: web · site · lunenlabs **0 errors** (실측 PASS) / mobile **SKIP** (node_modules partial install — 다음 세션 npm install 후 재검증 필요)
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

**Active workstream**: 모두의 창업 2026 신청서 **5/15 16:00 무조건 강행** (Track 1, 2026-05-07 사용자 D-5 commit) + PT V1.0 출시 6/9 ±2d (Track 2, 5/16 시작). **v2.1 paste-ready 통합본 완료 — 5/12 영상·5/13 v3 freezing 대기**
**Current phase**: **Phase 5 (Implementation)** — modoo.or.kr 폼 캡처 + v2.0 paste-ready + 5 페르소나 채점(32.6/50) + v2.1 inject 3건 적용(34.7/50 추정) 완료. 5/12 영상 + 5/13 v3 + 5/9~5/10 OQ-9 경쟁사 5사 재검증 대기
**Priority principle**: **5/15 신청 > 6/9 PT 출시 > SafeWay 샌드박스** (3레벨)
**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md)
**신청서 v2.1 (현재 anchor)**: [`artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2.1.md`](artifacts/business/fundraising/2026-05-07-modoo-startup-pt-application-v2.1.md) (자체 38.5/50 / 페르소나 추정 34.7/50 / 합격선 70% 경계 -0.3)
**5 페르소나 채점**: [`artifacts/business/fundraising/2026-05-07-modoo-v2-5persona-evaluation.md`](artifacts/business/fundraising/2026-05-07-modoo-v2-5persona-evaluation.md) (KISED 34/VC 30/산업 32/회계 35/멘토 32, self-bias 효과성 -1.5)
**폼 구조 캡처**: [`artifacts/business/fundraising/2026-05-07-modoo-form-structure-capture.md`](artifacts/business/fundraising/2026-05-07-modoo-form-structure-capture.md) (4-step wizard + Q5 18 옵션 + 글자수 제약)
**D-1 Push Package**: [`artifacts/business/fundraising/2026-05-07-d-1-gate-push-package.md`](artifacts/business/fundraising/2026-05-07-d-1-gate-push-package.md)
**신청서 v1.4 (D-9 lock)**: [`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`](artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md) (36/50, 72%, 가입자 D-9 3건 → D-1 5건)
**Next gate**: ~~5/8 D-7~~ **REVOKED** → 5/8 UD-4 사업자등록 자격 박탈 회피 + 5/9~5/10 OQ-9 경쟁사 5사 재검증 → 5/11 freezing → 5/12 영상 → 5/13 v3 (목표 35.7~36.5/50) → 5/14 운영기관 + SafeWay v2.2 → **5/15 16:00 modoo.or.kr 도전신청서 무조건 제출** → 5/16 Track 2 시작
**PT 출시 타깃**: **2026-06-09 ±2d**
**Latest artifact**: v2.1 paste-ready (위 anchor 6건)
**Latest handoff**: [`artifacts/handoffs/2026-05-08-session-handoff.md`](artifacts/handoffs/2026-05-08-session-handoff.md) (5/6~5/7 누적 90 파일 origin/main 출시 완료, `3cd19eb`)

**User Decisions (Anchored)**:
- **D-1=A** 신청서 6/9 AI 5축 동작 강한 약속 (§4·영상 자막 "조건부 약속" 절충)
- **D-2=A** 영상 5/12 마감 (Hybrid: 0~25 실녹화 / 25~55 슬라이드 / 55~60 클로징)
- **D-3** Beachhead = **마포구 + 용산구**
- **D-4=C** ActivityFeed = Track 2 T2.3 후 실 API (6/8)
- **D-5 (NEW 2026-05-07)** **모두의 창업 5/15 무조건 강행 commit** (가입자 수치 무관, 게이트 분기 폐기, BORDERLINE narrative + P4 honesty 가산 default)
- **F-1=A** 5/16~6/8 placeholder ("준비 중 — 6월 정식 출시")
- **F-2=C** 영상 25~55초 슬라이드 + 본인 음성 (YouTube Unlisted)
- **UD-2 default** 영상 자막 "2026.06.09 출시 예정" / **UD-3 default** SafeWay v2.2 5/14 연기
- **UD-4 (CORRECTED 2026-05-07, 양 자문 합산)** ~~사업자등록 보유 여부 = 자격 결격 risk~~ → 방향 반전. 공고 Page 3 "예비창업자 = 공고일 미보유" → **5/8~5/14 사이 사업자등록 시 자격 박탈 (#1 risk)**. 1순위 path = 1R 통과 후 등록. 상세 [`UD-4 가이드`](artifacts/business/fundraising/2026-05-07-ud-4-business-registration-decision-guide.md)
- **C-1 (NEW 2026-05-07)** Q5 사업 분야 = **라이프스타일** (V2.0 슈퍼앱 6축 정합)
- **C-2 (NEW 2026-05-07)** Q1 시제 = "AI가 사고를 자동 처리하도록 설계된 반려견 라이프스타일 플랫폼 — 6/9 출시 예정 · 국내 최초 안전 인프라" (49자)
- **C-3 (NEW 2026-05-07)** Q7 팀원 = 미입력 (자문 narrative Q4 통합)
- **C-4 (NEW 2026-05-07)** 사진 5장 = Q2(경쟁사+시장)/Q3(앱메인)/Q4(V2.0 6축+멀티앱 시너지)
- **C-5 (NEW 2026-05-07)** **자문 실명 미사용** — Inject A 변호사 실명 제외, BEP 정의만 적용. publicly verifiable claim risk 회피

**Fallback (REVOKED — 2026-05-07 strategic pivot)**: ~~5/8 게이트 FAIL → 7월 차회 또는 별도 전환~~ 폐기. 5/15 무조건 강행 commit. 7월 차회 또는 별도 사업 전환은 5/15 합격선 미달 시 fallback으로만 보존.

**Blockers / Waiting On (v3 갱신, 2026-05-06)**:
- ✅ **CATASTROPHIC 3 + RED 17 + YELLOW 20 + 카드 6 + Round 2 잔존 4건 처리 완료**: 상세 `artifacts/reports/2026-05-06-major-issues-resolution-v{1,2,3}.md`
- ✅ **검증 수치 갱신 완료**: CLAUDE.md / 신청서 §1·§2·§4·§7·5축·평가표·정량 8건 모두 62,200 LOC / 178 collected로 통합
- ✅ **카드 #4 Student.name AES-GCM 본격 구현**: security.py compute_name_hash + models.py name_encrypted+name_hash+hybrid_property + 마이그레이션 e7a9b2c4d6f8 + Class-level SQL 5곳 정합 (scheduling/billing/admin)
- 🟡 **Round 3 환경 검증 진행 중**: pytest 정확 카운트 + alembic upgrade head + mobile lock 재생성 (backend-dev sub-agent v3 백그라운드)
- 🟡 mobile tsc 환경 제약 잔존 (typescript 모듈 lock mismatch — Round 3 처리 중)
- 🔴 **5/7~5/8 사용자 critical path (UD-4 cascade 정정 후)**: (a) **UD-4 = 5/8 모두의 창업 운영기관 또는 창업진흥원 1357+5 콜센터 전화** (사업자등록 결정 X — 운영기관 공식 확인) (b) §3-3 자문진 LOI 5/7 reminder + ID "류정현" 통일 (c) 5/7 변호사 미팅 (SafeWay 영역) (d) 5/8 18:00 가입자·LOI 수치 anchor. **5/8~5/14 사이 사업자등록 회피 = #1 priority**
- 🟡 EXT-9~12 외부 계정 (AWS·Firebase·Anthropic·OpenAI·PortOne) — Track 2 5/16 의존
- 🟡 UD-3 5/7 결정 (기본값 자동 적용 가능)

**Track 2 (5/16~6/9) — PT V1.0 출시**: T2.0 pip check → T2.1 Milestone C 잔여 (C-13/14 ✅ 2026-04-30 선행) + AI 인프라 (LLM client + Redis cost counter + WalkPhoto migration) → T2.2 사고 신고 LLM (축 A) + 모더레이션 (축 D) → T2.3 사진 캡션 + Empathic 리포트 + 컨디션 (축 B+F) → T2.4 GPS 이상 탐지 (축 E) → T2.5 통합 테스트 → T2.6 Pre-launch QA + EAS Build → **6/9 V1.0 출시**

**Risks (UD-4 cascade 정정 후 재배치, 2026-05-07)**:
- **R-D1-5 #1 (CORRECTED)** ~~사업자등록 미보유 → 자격 결격~~ → 방향 반전. **5/8~5/14 사이 사업자등록 시 예비창업자 자격 박탈 (#1 risk)**. 5/8 모두의 창업 운영기관 또는 창업진흥원 1357+5 콜센터 전화로 공식 확인
- 5/15 합격선 미달 시 자금 lag 4~6개월 → 7월 모두의 창업 차회 또는 별도 사업 fallback path 보존 (산출물 60~70% 재사용)
- 5/12 영상 제작 실패 → 이미지 5장 대체 (특히 슬롯 2 경쟁사·슬롯 5 멀티앱)
- 5/12~5/13 자원 경합 → UD-3 5/14 연기로 완화
- ~~5/8 게이트 미달~~ **REVOKED** — strategic pivot로 게이트 분기 폐기

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
