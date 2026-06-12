# SafeWay Platform — Current State (Live)

> Single source of truth — "what is happening right now". `/session-start`·`/session-end`로 동기화.
> 마일스톤 이력 = CLAUDE.md "프로젝트 진행 현황" / 세션 이력 = `artifacts/handoffs/`.

**Last updated**: 2026-06-11 (v14 — **PT 결제+가입 마일스톤 완료** (사용자 지시, D-8 예외). 백엔드 240/247 회귀 0 + 모바일 3앱 tsc 0 + PT 30/30·SK 71/71 jest. 선재 HIGH 버그 confirm_payment 두 동강 수정. 보고서: [`artifacts/reports/2026-06-11-pt-payment-signup-milestone.md`](artifacts/reports/2026-06-11-pt-payment-signup-milestone.md). v13 anchor: P1-3 완료)
**Active workstream**: **1R 탈락 → fallback 경로 결정 대기 (사용자)** + 본업 집중 기간 (~2026-06-15). 6/15 슬라이스 + **PT 결제·가입 시스템 (6/11 사용자 지시)** 완료 — fallback 결정 전 Claude proactive 코드 작업 없음
**Current phase**: **Phase 7 종료 (modoo 워크스트림 closure — 결과 = 1R 탈락)** — 다음 워크스트림은 fallback 결정 후 Phase 0 재진입. 결정 전까지 D-8 슬라이스(P1-3)만 유효
**Priority principle**: **본업 (~6/15) > fallback 경로 결정 (사용자) > PT V1.0 출시 계획 재검토 > SafeWay 동결 유지 > CareConnect 보류**
**Next gate**: **fallback 경로 사용자 결정** — ① 7월 modoo 차회 재신청 (v2.6 60~70% 재사용) ② 타 정부지원사업 ③ 자비 소규모 출시 (개인사업자→PortOne) ④ 보류/재평가. 급하지 않음 — 6/15 본업 종료 후 결정 가능
**LIVE infrastructure**: `https://www.lunenlabs.com/` + `https://www.lunenlabs.com/pet` (5/6 LIVE 유지, 변경 없음)
**PT positioning**: **강아지 일상 종합 케어 동반자** (`pt_positioning_holistic_care.md` anchor 유지)

**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md) (Phase 5 종료, Phase 7 진입)
**Final Tech Spec**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md)
**신청서 제출본 (5/15 16:00 anchor)**: [`artifacts/business/fundraising/2026-05-10-modoo-pt-application-v2.6-tight.md`](artifacts/business/fundraising/2026-05-10-modoo-pt-application-v2.6-tight.md) (Q1 97 / Q2 900 / Q3 997 / Q4 992자, AI tell 제거 + 자문 시제 거짓말 회피 inject)
**진화 기록**: v1.4(36) → v2.0(37.5) → v2.1(38.5) → v2.2(39.5) → v2.3(40.5) → v2.4(41.5) → v2.5(42.5/페르소나 34.4) → v2.6-humanized → **v2.6-tight (제출본)**
**운영기관 선택**: 프라이머 ★★★★★ ([`artifacts/business/fundraising/2026-05-08-modoo-operating-org-fit-analysis.md`](artifacts/business/fundraising/2026-05-08-modoo-operating-org-fit-analysis.md))
**Portfolio Improvement Audit**: [`artifacts/reports/2026-05-08-portfolio-improvement-audit-integrated.md`](artifacts/reports/2026-05-08-portfolio-improvement-audit-integrated.md)

## User Decisions (6/11 갱신 — D-9 추가)
- **D-9 (NEW 2026-06-11) — PT 결제 UI·회원가입 즉시 구현**: 가입 = **Firebase 기반 + 소셜 로그인** (Kakao config-gate, OTP 기본 경로 유지), 착수 = 즉시 (D-8 예외). 결제 범위는 무응답 → 추천안(플로우 전체, dev-mock 채널) 채택 (A-4)

- **D-1 = A** ~ **D-5** / **C-1 ~ C-5** / **UD-1 ~ UD-4** : modoo 제출 anchor (이력 archive, 변경 없음)
- **D-6 (NEW 2026-05-22) — PT V1.0 출시 reschedule**: 6/9 ±2d → **7월 말~8월 초**. 4 제약 동시 정렬: (1) 본업 ~6/15, (2) 1R 결과 ~7월 말, (3) OpenAI 결제 보류 해결, (4) PortOne 사업자(1R 통과 후 등록). 신청서 §4 6/9 약속 setback 사유는 1R 통과 후 멘토링 단계에서 운영기관에 설명
- **D-7 (NEW 2026-05-22) — SafeWay 샌드박스 동결**: 자문 메모 불만족 + 1인 개발 부담 signal. 사용자 자발적 재진입 전까지 Claude proactive 작업 0. SafeWay 영역 모든 P3 보류
- **D-8 (NEW 2026-05-22) — 6/15까지 본업 집중**: 그 사이 PT는 **AI 호출 없는 인프라 골격만** 슬라이스 작업 (LLM client 스켈레톤·Redis cost counter·PortOne mock·WalkPhoto 마이그). 비용 0, burnout 0 원칙

## Critical Path (5/22 ~ 8월 초)
| 시점 | 작업 | 담당 |
|---|---|---|
| 5/22 (오늘) | P0 cleanup: untracked 산출물 push (✅ `dd4398b`) + STATE/CLAUDE 갱신 + 5/22 핸드오프 | Claude |
| 5/23 ~ 6/15 | 본업 집중 + PT 인프라 골격 슬라이스 (P1-1·P1-2·P1-3) | 사용자(본업) + Claude(슬라이스) |
| ~~~ 6/15 mobile tsc 복구 (P1-1)~~~ | ✅ 5/22 PASS (workspace hoisting, 루트 node_modules에서 tsc 해상 0 errors) | Claude |
| ~~~ 6/15 LLM client 스켈레톤 + Redis cost counter (P1-2)~~~ | ✅ 5/22 PASS (19/19 unit tests, 회귀 0, 신규 파일 7개 + config 8개 env) | Claude |
| ~~~ 6/15 WalkPhoto 마이그 + PortOne v2 (P1-3)~~~ | ✅ 6/11 완료 — WalkPhoto `f7c2d4a91b3e` (실 PG 검증) + PortOne 테스트 7건 (구현은 4월에 이미 존재 — gap-note 6/11). 신규 KI-5 발견 | Claude |
| ~~~ 7월 말 1R 결과~~~ | ❌ **6/10 조기 탈락 통보** — 통과 전제 행(사업자등록·PortOne·P2-1~P2-3 일정) 무효화, fallback 결정 후 재계획 | 운영기관(프라이머) |
| 6/10 → | **Fallback 경로 결정**: ① modoo 차회 ② 타 지원사업 ③ 자비 출시 ④ 보류 (v2.6 본문 60~70% 재사용 가능) | **사용자 결정 대기** |
| 결정 후 | PT V1.0 출시 타깃(7월 말~8월 초)·Track 2 ramp-up 재계획 (Phase 0 재진입) | 사용자 + Claude |

## Blockers / Waiting On
- 🔴 **fallback 경로 사용자 결정 대기** — ❌ 1R 탈락 (6/10 통보, 사유 미제공). modoo 후속·출시 재계획 모두 이 결정에 종속
- 🟡 **EXT-12 Kakao 콘솔 등록** (사용자) — 앱 생성 + redirect URI 등록 → `app.json extra.kakaoRestApiKey/kakaoRedirectUri` 설정 시 카카오 버튼 활성 (미설정 시 OTP만, 기능 정상)
- 🟡 **EXT-13 Firebase web config** (사용자) — 콘솔 웹 앱 추가 + service account → `extra.firebaseWebConfig` 설정 시 Firebase 세션 브리지 활성 (미설정 시 JWT 단독, 기능 정상)
- 🟡 **OpenAI 결제 보류** — 카드 결제 처리 실패. Track 2 LLM 실 호출 unblock 의존. 6/15 본업 종료 후 결제 해결 (1R 무관, 유지)
- 🟡 **PortOne 사업자 계정 필요** — 기존 "1R 통과 후 사업자등록" 전제 무효. fallback 경로(자비 진행 시 개인사업자 등록 등)에 따라 재정의
- ✅ ~~mobile tsc 환경~~ (5/22 P1-1 PASS, npm workspace hoisting으로 루트 node_modules 사용. "lock mismatch" 진단은 오진이었음)
- 🟡 **EXT-9~11 외부 계정 (AWS·Firebase·Anthropic) 이미 보유** — OpenAI만 결제 이슈 / PortOne만 사업자 의존
- 🔴 **D-7 SafeWay 동결** — Claude proactive 작업 0. 사용자 재진입 전 모든 SafeWay 영역 동결 (자문 메모·v2.2·미팅 등)

## Risks (6/10 갱신)
- ~~R-1~~ **소멸** — 1R 탈락으로 멘토링 단계 자체가 없음 (§4 출시 약속 setback 설명 불필요)
- **R-2 (현실화)** 1R 탈락 → 자금 lag 4~6개월 시나리오 진입. fallback path로 완화 (산출물 60~70% 재사용)
- **R-3 (MED→HIGH 주시)** 1인 burnout signal — 탈락이 동력 손실로 이어질 risk. 6/15까지 가벼운 슬라이스만 유지, fallback 결정 재촉 금지
- **R-4 (LOW)** OpenAI 결제 해결 지연 → Track 2 LLM 실 구현 지연 (1R 무관, 유지)

## Parallel: SafeWay Kids 샌드박스 — **동결 (D-7)**
- 자문 메모(양길모 + 이의림+이학선 5/7 미팅 후) 수신 완료, **사용자 평가 = 불만족**
- 1인 개발 어려움 + 규제 부담으로 추진 동력 저하
- Active draft `artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md` 정지 상태로 보존
- 재진입 시점 = 사용자 자발적 결정 (Claude proactive 작업 금지)

## Portfolio Status (6/10)
- **PetTracker**: 5/15 modoo 신청 → ❌ **1R 탈락 (6/10)** → fallback 경로 결정 대기. 출시 타깃(7월 말~8월 초) 재검토 필요
- **SafeWay Kids**: **동결** (D-7) — 샌드박스 v2.1 정지
- **CareConnect**: 보류 — 사용자 고민 중 (PT 출시 후 + 30일 사이클은 7월 말 이후)
- **SDET Code**: 운영 중, 외국인 prospect 1건 재가동 vs 운영비 trade-off **P3 분석 대기** (#33)
- **루넨랩스**: 사업자등록 — 기존 "1R 통과 후" 전제 무효, fallback 경로에 따라 재결정 / lunenlabs.com LIVE 유지

## Latest Handoff
- [`artifacts/handoffs/2026-06-11-session-handoff.md`](artifacts/handoffs/2026-06-11-session-handoff.md) — 1R 탈락 반영 + P1-3 완주 + PT 결제·가입 마일스톤 (D-9). 다음 = fallback 결정(사용자) / EXT-12·13 설정
- [`artifacts/handoffs/2026-05-22-session-final-handoff.md`](artifacts/handoffs/2026-05-22-session-final-handoff.md) — P1-1·P1-2 anchor
- [`artifacts/handoffs/2026-05-22-session-handoff.md`](artifacts/handoffs/2026-05-22-session-handoff.md) — 5/11~5/22 12일 갭 acknowledgement + 3대 결정(PT reschedule·SafeWay 동결·본업 집중) anchor

## Available Skills
- `/session-start` · `/session-end` · `/sandbox-followup [email|prep|status|review]` (동결 중)

## Available Agents
- `business-operations-manager` · `korea-{regulatory-counsel,tax-accounting-advisor,fundraising-strategist}`
- `backend-dev` · `frontend-dev` · `db-architect` · `security-expert` · `product-manager` · `qa-lead` · `ux-advocate`
- `tech-spec-reviewer` · `requirement-analyst` · `verification-auditor`
