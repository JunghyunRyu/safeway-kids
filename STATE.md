# SafeWay Platform — Current State (Live)

> Single source of truth — "what is happening right now". `/session-start`·`/session-end`로 동기화.
> 마일스톤 이력 = `artifacts/reports/` Milestone Reports / 세션 이력 = `artifacts/handoffs/`.

**Last updated**: 2026-06-04 (v16 — **PT 모바일 UX 감사 86/86 전건 구현·검증 완료** (커밋 `d47ecc3`…`e1516c0` 11커밋) + **CLAUDE.md 316→81줄 최적화 `d4fbd48`**. 3 ux-advocate 병렬 감사→Tech Spec→8 마일스톤(프론트 26화면+백엔드 M-D)→마지막 2건(O-02 size필터: WalkerQualification.accepted_sizes+Alembic `b3d9f1a2c5e4`+search 필터 / O-21 펫편집삭제: DELETE pets+MyPets UI / O-36 펫사진: PetRegistration 업로드). 검증: PT tsc 0·jest 20/20, 백엔드 pytest 117 passed, alembic 단일head, 회귀 0. P0 10건 전부. 사용자 "모두 구현"=D-8 명시 오버라이드. 리포트: `artifacts/reports/2026-06-03-pt-mobile-ux-remediation-milestone.md`. v14 anchor: GPS/SOS 안전핵심 6건 `61b03aa`)
**Active workstream**: **모두의 창업 1R 결과 대기 (~7월 말 예상)** + PT V1.0 출시 reschedule (7월 말~8월 초) + 본업 집중 기간 (~2026-06-15) + 6/15까지 AI 호출 없는 인프라 골격만 슬라이스 작업
**Current phase**: **Phase 7 (Milestone Closure 대기)** — 5/15 16:00 modoo.or.kr 제출 완료(v2.6-tight, 운영기관=프라이머). Phase 6 Verification은 1R 평가위원 채점으로 외부 위임된 상태. 6/15까지 본업 사이 가벼운 P1 작업만, 6/15 이후 Track 2 본격 ramp-up
**Priority principle**: **1R 결과 안내 대기 > 본업 (~6/15) > PT V1.0 출시 ramp-up (6/15~) > SafeWay 동결 유지 > CareConnect 보류**
**LIVE infrastructure**: `https://www.lunenlabs.com/` + `https://www.lunenlabs.com/pet` (5/6 LIVE 유지, 변경 없음)
**PT positioning**: **강아지 일상 종합 케어 동반자** (`pt_positioning_holistic_care.md` anchor 유지)

**Active Brief**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md) (Phase 5 종료, Phase 7 진입)
**Final Tech Spec**: [`artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md`](artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md)
**신청서 제출본 (5/15 16:00 anchor)**: [`artifacts/business/fundraising/2026-05-10-modoo-pt-application-v2.6-tight.md`](artifacts/business/fundraising/2026-05-10-modoo-pt-application-v2.6-tight.md) (Q1 97 / Q2 900 / Q3 997 / Q4 992자, AI tell 제거 + 자문 시제 거짓말 회피 inject)
**진화 기록**: v1.4(36) → v2.0(37.5) → v2.1(38.5) → v2.2(39.5) → v2.3(40.5) → v2.4(41.5) → v2.5(42.5/페르소나 34.4) → v2.6-humanized → **v2.6-tight (제출본)**
**운영기관 선택**: 프라이머 ★★★★★ ([`artifacts/business/fundraising/2026-05-08-modoo-operating-org-fit-analysis.md`](artifacts/business/fundraising/2026-05-08-modoo-operating-org-fit-analysis.md))
**Portfolio Improvement Audit**: [`artifacts/reports/2026-05-08-portfolio-improvement-audit-integrated.md`](artifacts/reports/2026-05-08-portfolio-improvement-audit-integrated.md)

## User Decisions (5/22 갱신 — 신규 3건 추가)
- **D-1 = A** ~ **D-5** / **C-1 ~ C-5** / **UD-1 ~ UD-4** : modoo 제출 anchor (이력 archive, 변경 없음)
- **D-6 (NEW 2026-05-22) — PT V1.0 출시 reschedule**: 6/9 ±2d → **7월 말~8월 초**. 4 제약 동시 정렬: (1) 본업 ~6/15, (2) 1R 결과 ~7월 말, (3) OpenAI 결제 보류 해결, (4) PortOne 사업자(1R 통과 후 등록). 신청서 §4 6/9 약속 setback 사유는 1R 통과 후 멘토링 단계에서 운영기관에 설명
- **D-7 (NEW 2026-05-22) — SafeWay 샌드박스 동결**: 자문 메모 불만족 + 1인 개발 부담 signal. 사용자 자발적 재진입 전까지 Claude proactive 작업 0. SafeWay 영역 모든 P3 보류
- **D-8 (NEW 2026-05-22) — 6/15까지 본업 집중**: 그 사이 PT는 **AI 호출 없는 인프라 골격만** 슬라이스 작업 (LLM client 스켈레톤·Redis cost counter·PortOne mock·WalkPhoto 마이그). 비용 0, burnout 0 원칙
- **D-9 (NEW 2026-06-03) — GPS/SOS 결함 수정 범위 = 검증된 것 전부**: 모바일+GPS 감사 결과 사용자가 "검증된 19건 전부" 선택 + "Tech Spec 먼저". 이로 인해 **D-7 SafeWay 동결 부분 해제** (M-03·G-05/M-01·G-01 update_gps 등 SafeWay 코드 수정). ⚠️ 작업 후 재동결 여부 미결.
- **D-10 (NEW 2026-06-03) — 안전 핵심만 지금**: 19건 중 출시 차단급 6건(G-01·G-21·C-2·M-02·M-03·G-05/M-01)만 즉시 구현(커밋 `61b03aa`). 나머지(백그라운드 GPS·지오펜싱·배치·rate limit 등)는 6/15 이후. D-8 가벼운 슬라이스 원칙 유지.

## GPS/SOS Remediation (2026-06-03, D-9/D-10)
- **완료·커밋 `61b03aa`** (안전핵심 6건): G-01(검증연결: 차량 422 리젝트/도보 로그온리)·G-21(PT 세션 소유권 403)·C-2(SOS nullable)·M-02(`/pt/sos`)·M-03(dev login `__DEV__` 단독)·G-05/M-01(SOSButton (0,0)금지·실패피드백) + tz 정규화 버그수정. 회귀 0.
- **Tech Spec**: [`artifacts/specs/2026-06-03-mobile-gps-remediation-tech-spec.md`](artifacts/specs/2026-06-03-mobile-gps-remediation-tech-spec.md) (4도메인 팀 작성 + tech-spec-reviewer APPROVE WITH CHANGES)
- **감사**: [`artifacts/reviews/2026-06-03-mobile-gps-hole-audit.md`](artifacts/reviews/2026-06-03-mobile-gps-hole-audit.md) (50건 발견, 25건 검증, FP 1·강등 1)
- **6/15 이후 연기 (D-10)**: G-02 동의 fail-closed · G-03 WS dev bypass 제거 · G-06/09/10 accuracy·staleness(스키마 마이그 M1) · G-07/08 백그라운드 GPS(**EAS 빌드 필요**) · G-11 오프라인 큐+배치 · G-12 rate limit · G-13 지오펜싱(마이그 M2, pickup_lat/lng 사용) · M-04 · M-10/11
- **🔴 변호사 확인 필요 (korea-regulatory-counsel)**: OQ-2 아동 탑승차량 위치 = 아동개보법 추가동의 대상? · **OQ-5 G-03 bypass 과거 prod/staging 배포 이력 → 있었다면 위치정보법 §39 신고 의무** (사실 확인 우선)

## Critical Path (5/22 ~ 8월 초)
| 시점 | 작업 | 담당 |
|---|---|---|
| 5/22 (오늘) | P0 cleanup: untracked 산출물 push (✅ `dd4398b`) + STATE/CLAUDE 갱신 + 5/22 핸드오프 | Claude |
| 5/23 ~ 6/15 | 본업 집중 + PT 인프라 골격 슬라이스 (P1-1·P1-2·P1-3) | 사용자(본업) + Claude(슬라이스) |
| ~~~ 6/15 mobile tsc 복구 (P1-1)~~~ | ✅ 5/22 PASS (workspace hoisting, 루트 node_modules에서 tsc 해상 0 errors) | Claude |
| ~~~ 6/15 LLM client 스켈레톤 + Redis cost counter (P1-2)~~~ | ✅ 5/22 PASS (19/19 unit tests, 회귀 0, 신규 파일 7개 + config 8개 env) | Claude |
| ~~~ 6/15 WalkPhoto 모델 + 마이그 (P1-3 일부)~~~ | ✅ 5/22 PASS (마이그 `f1a3c5b7d9e2`, 8/8 tests, 라운드트립 PASS, 회귀 0, 커밋 `0d5ea26`) | Claude |
| ~ 6/15 | PortOne v2 인터페이스 mock (P1-3 잔여) | Claude |
| ~ 7월 말 | 1R 결과 안내 수신 | 운영기관(프라이머) |
| 7월 말 → | 통과 시: 사업자등록 + PortOne 계약 + OpenAI 결제 해결 + Track 2 본격 (P2-1·P2-2) | 사용자 + Claude |
| 7월 말 ~ 8월 초 | PT V1.0 출시 (T2.5 통합 테스트 + T2.6 EAS Build) (P2-3) | Claude |
| Fallback | 1R 미통과 시: 7월 modoo 차회 또는 별도 사업 path (v2.6 본문 60~70% 재사용) | 사용자 결정 |

## Blockers / Waiting On
- 🟡 **1R 결과 안내 대기 (~7월 말)** — 외부 의존, action 불가
- 🟡 **OpenAI 결제 보류** — 카드 결제 처리 실패. Track 2 T2.2~T2.3 LLM 실 호출 unblock 의존. 6/15 본업 종료 후 결제 해결 (P2-1)
- 🟡 **PortOne 사업자 계정 필요** — 1R 통과 후 사업자등록 → PortOne 계약 순서. UD-4 자격 박탈 risk 회피 path 유지
- ✅ ~~mobile tsc 환경~~ (5/22 P1-1 PASS, npm workspace hoisting으로 루트 node_modules 사용. "lock mismatch" 진단은 오진이었음)
- 🟡 **EXT-9~11 외부 계정 (AWS·Firebase·Anthropic) 이미 보유** — OpenAI만 결제 이슈 / PortOne만 사업자 의존
- 🔴 **D-7 SafeWay 동결** — Claude proactive 작업 0. 사용자 재진입 전 모든 SafeWay 영역 동결 (자문 메모·v2.2·미팅 등)

## Risks (5/22 갱신)
- **R-1 (HIGH)** 신청서 §4 "6/9 출시" 약속과 실제 출시 7월 말~8월 초 시차 → 1R 통과 후 멘토링 단계 setback 사유 설명 필요 (운영기관 신뢰 risk)
- **R-2 (MED)** 1R 미통과 시 자금 lag 4~6개월 → 7월 modoo 차회 fallback path (산출물 60~70% 재사용)
- **R-3 (MED)** 1인 burnout signal (SafeWay 동결 결정 기저) → PT도 무리하면 동력 손실 risk. 6/15까지 가벼운 슬라이스만 유지
- **R-4 (LOW)** OpenAI 결제 해결 지연 → Track 2 LLM 실 구현 지연 → 8월 초까지 슬립 가능

## Parallel: SafeWay Kids 샌드박스 — **동결 (D-7)**
- 자문 메모(양길모 + 이의림+이학선 5/7 미팅 후) 수신 완료, **사용자 평가 = 불만족**
- 1인 개발 어려움 + 규제 부담으로 추진 동력 저하
- Active draft `artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md` 정지 상태로 보존
- 재진입 시점 = 사용자 자발적 결정 (Claude proactive 작업 금지)

## Portfolio Status (5/22)
- **PetTracker**: 5/15 신청 완료 → 1R 결과 대기 → 7월 말~8월 초 출시 (reschedule)
- **SafeWay Kids**: **동결** (D-7) — 샌드박스 v2.1 정지
- **CareConnect**: 보류 — 사용자 고민 중 (PT 출시 후 + 30일 사이클은 7월 말 이후)
- **SDET Code**: 운영 중, 외국인 prospect 1건 재가동 vs 운영비 trade-off **P3 분석 대기** (#33)
- **루넨랩스**: 사업자등록 1R 통과 후 진행 / lunenlabs.com LIVE 유지

## Latest Handoff
- [`artifacts/handoffs/2026-06-04-session-handoff.md`](artifacts/handoffs/2026-06-04-session-handoff.md) — **PT UX 86/86 전건 완료 (11커밋) + CLAUDE.md 최적화**. 다음 first step = PT UX 마일스톤 종료 확정 또는 modoo 1R 대기 워크스트림 복귀 (UX 잔여 0)
- [`artifacts/handoffs/2026-06-03-session-handoff.md`](artifacts/handoffs/2026-06-03-session-handoff.md) — GPS/SOS 안전핵심 6건 커밋 `61b03aa`, 회귀 0. 다음 first step = (1)마일스톤 종료 또는 (2)OQ-5 G-03 배포이력 사실확인 또는 (3)SafeWay 재동결 결정
- [`artifacts/handoffs/2026-05-22-session-handoff-v3.md`](artifacts/handoffs/2026-05-22-session-handoff-v3.md) — P1-3 일부(WalkPhoto 모델+마이그) PASS·커밋
- [`artifacts/handoffs/2026-05-22-session-final-handoff.md`](artifacts/handoffs/2026-05-22-session-final-handoff.md) — P1-1 mobile tsc 검증 PASS + P1-2 ai 모듈 스켈레톤 19/19 PASS

## Open Gap Notes
- [`artifacts/gap-notes/2026-05-22-walkphoto-migration-sequencing.md`](artifacts/gap-notes/2026-05-22-walkphoto-migration-sequencing.md) — Tech Spec §16 "4테이블 1마이그" → WalkPhoto 분리(D-8). P2-2에 나머지 3개 테이블 이연 체크리스트 보유
- [`artifacts/gap-notes/2026-06-03-gps-speed-validation-log-only.md`](artifacts/gap-notes/2026-06-03-gps-speed-validation-log-only.md) — 스펙 §6.1 "422 reject" → PT 도보 속도/정확도는 **로그온리**(GPS 지터 false-positive 회피). 하드리젝트는 실데이터 2주 수집 후 임계 튜닝하여 활성화. 차량 200km/h는 하드리젝트 유지

## Available Skills
- `/session-start` · `/session-end` · `/sandbox-followup [email|prep|status|review]` (동결 중)

## Available Agents
- `business-operations-manager` · `korea-{regulatory-counsel,tax-accounting-advisor,fundraising-strategist}`
- `backend-dev` · `frontend-dev` · `db-architect` · `security-expert` · `product-manager` · `qa-lead` · `ux-advocate`
- `tech-spec-reviewer` · `requirement-analyst` · `verification-auditor`
