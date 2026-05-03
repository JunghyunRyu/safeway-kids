# Session Handoff — 2026-04-30

**세션 주제**: PetTracker AI 차별화 Phase 0~4 + 차별화·Moat·BM 보강 + 옵션 A 신청서 우선 결정
**세션 길이**: 약 5~6 시간 (분석·탐색·산출물 작성 통합)
**다음 세션 부트스트랩**: `/session-start`

---

## Current Status

PT 모두의 창업 2026 신청서 점수 회복을 위한 AI 차별화 트랙이 **Phase 0 Brief → Phase 1 Independent Review × 3 → Phase 2 Consensus Matrix → Phase 3 Final Tech Spec → Phase 4 Todo Plan + 차별화·Moat·BM 보강**까지 단일 세션에서 closed-loop으로 완성됐다. 사용자 결정 3건(D-1=5축 / D-2=TTcare 추상화 / D-7=글로벌 출처 삭제)과 시간 분배 옵션 A(신청서 우선)가 모두 결정되어 Phase 5 Implementation 진입 직전 상태. 점수 회복 추정은 +6~9 (Consensus 보수) → +9~13 (보강 산출물 합산) = **79~86점 구간 진입** 가능. PT 출시 타깃은 옵션 A 반영 시 6/4 → **6/9 ±2d**로 조정. 다음 세션은 사용자 4/30 critical path 6건(외부 작업, 5.5h) 완료 직후 T1.2 AI 차별화 자료 통합(Claude, ~3 영업일)으로 진입.

---

## Changed Files

### 신규 (Created, 8건)
- `artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md` — Phase 0 Brief, 8축 차별화 + 사례 7건 + 5 결정 게이트 + Assumption Register 10건 + Open Questions 10건
- `artifacts/reviews/2026-04-29-pt-ai-differentiation-backend-review.md` — Phase 1 BE review (6/10), Top 5 findings: 사고 신고 비동기 / WalkPhoto 모델 / Redis cost counter / GPS 백엔드 WS / pip check
- `artifacts/reviews/2026-04-29-pt-ai-differentiation-product-review.md` — Phase 1 PM review (6/10), Top 5 findings: V1.0 5축→3축 / 3-layer UX / 모더레이션 자동 재검토 / Empathic tone 명문화 / V1.1 +30→+45일
- `artifacts/reviews/2026-04-29-pt-ai-differentiation-fundraising-review.md` — Phase 1 KFS review (7/10), Top 5: TTcare narrative / 글로벌 출처 / competitor matrix AI 행 / 자금 재배분 매핑 / LOI AI inject
- `artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md` — Phase 2 Consensus, 자동 반영 15건 + Divergence 4건 + 사용자 결정 게이트 7건
- `artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md` — Phase 3 Final Tech Spec, 21 섹션 (FR/NFR/architecture/edge cases/code impact/cost estimation/신청서 inject 매핑)
- `artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md` — 차별화 3 layer + Moat 5종 + BMC 9 blocks + Unit Economics 3 시나리오 (LTV/CAC 6.16) + 면접 답변 4건 + VC IR narrative 2건
- `artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md` — Phase 4 Todo Plan, Track 1 (4/30~5/15 신청서) + Track 2 (5/16~6/9 AI 구현)

### 수정 (Modified, 2건)
- `STATE.md` — Last updated 4/30, Current phase Phase 4 → 5 직전, Track 1·2 분리, 신규 6 산출물 등록, PT 출시 6/4 → 6/9 ±2d, Next gate 5/8 D-7 게이트 → 5/15 제출 → 5/16 Track 2
- `CLAUDE.md` — Active Work (Live) 섹션 mirror update, Track 2 AI 구현 분해 (T2.0~T2.6), External 사용자 작업 Track 1·2 분리

---

## Commands Executed

- `WebSearch × 6` — Rover/Wag AI / dog walking computer vision / pet health LLM chatbot / Petcube Furbo / AI pet sitter LLM / pet care GenAI report → **TTcare(한국 AI for Pet) + Traini $7.5M + Mars Petcare AI + Wag 파산 + Furbo + Edge AI GPS + AgentiveAIQ** 7 사례 발견
- `WebSearch × 6 (2차)` — TTcare 상세 / Tails AI 기능 / Korea pet AI startup / dog walk GPS anomaly / pet emotion recognition / Traini funding → **Traini $7.5M (NVIDIA·Anthropic·Google·Meta 임원 LP), AI for Pet 한국 첫 SaMD 인증, Pawchi $4.5M Series A** 등 추가 검증
- `Agent (subagent_type=backend-dev)` — Phase 1 BE review, confidence 6/10, 영업일 +5 → 실제 +7~8.5d, NFR-5 위반 위험 + WalkPhoto 모델 부재 발견
- `Agent (subagent_type=product-manager)` — Phase 1 PM review, confidence 6/10 (3축 집중 시 8/10), V1.0 축 5→3 권고
- `Agent (subagent_type=korea-fundraising-strategist)` — Phase 1 KFS review, confidence 7/10, P2 VC 점수 +5~8 → +2~4 OVER-ESTIMATED 정정
- `Agent (subagent_type=business-operations-manager, background)` — 차별화·Moat·BM 보강 분석, 5 페르소나 평균 +9~13 추가 회복
- `Read × 다수` — STATE.md, CLAUDE.md, 5 P0 산출물, baseline Tech Spec, Phase 1 reviews
- `Write × 8` — 신규 산출물 8건
- `Edit × 5` — STATE.md (Active Work top + 모두의 창업 트랙 단순화 + Active Artifacts 추가) + CLAUDE.md (Active Work mirror + External 트랙 분리 + Track 2 분해)
- `TaskCreate × 9, TaskUpdate × 다수` — Phase 0~4 + 보강 + STATE/CLAUDE update task 추적

---

## Tests and Outcomes

본 세션은 코드 미변경 (Phase 0~4 = 문서 작성만). 기존 baseline 유지:
- 백엔드 pytest: **145 passed** (변경 없음)
- PT jest: **15 passed** (변경 없음)
- TS 0 errors (PT/core-mobile/CC mobile, 변경 없음)
- 본 세션의 verification artifact: **N/A** (Track 2 코드 구현 시 작성 예정 → `2026-05-16-ai-deps-check.md` 첫 단계)

---

## Decisions Made

- **D-1 = V1.0 AI 5축 채택** (A·B·D·E·F 모두 V1.0 출시 시점 동작) — 사용자 capacity 2x self-report 신뢰. PM의 3축 권고 reject. PT 출시 6/4 → 6/9 ±2d로 조정.
- **D-2 = TTcare narrative 추상화** — 실 접촉 부재로 "협력 명시"는 R-2 false impression 위험. "국내 펫 헬스케어 AI 사업자와 V1.2 단계 탐색"으로 일반화.
- **D-7 = 글로벌 $660M+ 출처 삭제** — PitchBook/CB Insights 유료 + 5/15 마감 부담. 확인된 사례(Traini $7.5M, TTcare TIPS, Mars 자체 도입)만 인용.
- **시간 분배 옵션 A = 신청서 우선** — 4/30~5/15 신청서·외부 작업·게이트 / 5/16~6/9 AI 구현. 컨텍스트 스위칭 비용 0 + 양 deadline 모두 보호.
- **사고 신고 LLM = 비동기 BackgroundTasks** (NFR-5 99.9% incident submission 보호) — 동기 호출 시 spec 위반.
- **AI 결과물 3-layer UX 의무 적용** — disclaimer + 펫시터 1-tap 수정 + 보호자 부적절 신고. 모든 AI 결과(축 A·B·D·F).
- **WalkPhoto 모델 신규 추가** — 다수 사진 + 개별 캡션 FK. Alembic 1건 추가 migration.
- **Redis cost counter `pt:ai:cost:{YYYY}:{MM}` 200만/월 cap** — 80% threshold Haiku/gpt-4o-mini auto-routing.
- **GPS 이상 탐지 = 백엔드 WS handler + Redis ZSET** — 모바일 배터리·tamper 회피. LLM 미사용 (통계 알고리즘).
- **OpenAI Moderation API only for 축 D** — Claude 미사용 (free + 한국어 룰 보강).
- **점수 회복 추정 보수화: +9~13 → 76~83 / 79~86 (보강 합산)** — KFS의 P2 VC 과대 추정 지적 반영.

---

## Open Issues / Blockers

### Track 1 (4/30 ~ 5/15 신청서)
- 🔴 **4/30 critical path 6건 (사용자 5.5h)** — 랜딩·인센티브·PIPA·LOI 4건·카톡 50명·SNS 활성화
- 🔴 **5/8 D-7 strong-go 게이트** — 가입자 ≥30 + LOI ≥3 미달 시 K-Startup 초기창업패키지(7월) 전환
- 🟡 **EXT-6 변호사 자문 Q-L2·Q-L3** — 보험사 가맹 가능성 (5/8 게이트 전 회신 권장, AS-R1 검증)
- 🟡 **T1.2 AI 차별화 자료 통합 (Claude, ~3 영업일)** — competitor-matrix AI 행 / budget 재배분 / LOI #1·#4 AI inject
- 🔴 **5/9 신청서 본문 v1** — `korean-grant-application-writer` 호출 + 10건 inject 매핑 (Final Tech Spec §18.2 + 보강 §1-4·§2-4·§3-5) 입력
- 🟡 5/10 1차 채점 (목표 70+) → 5/13 2차 채점 (목표 80+)
- 🔴 **5/15 16:00 K-Startup 포털 제출**

### Track 2 (5/16 ~ 6/9 AI 구현)
- 🟡 **EXT-9·EXT-10·EXT-11 외부 자원** — AWS 계정 + Firebase project + Anthropic·OpenAI API key (Track 2 시작 전 5/15까지)
- 🟡 EXT-12 PortOne 가맹점 계약 (T2.5 전)
- 🟡 T2.0~T2.6 25.0d sequenced (Final Tech Spec §18.1 + Todo Plan)

### Known Issues (PT 출시 critical path 무관)
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정 (Milestone F 처리)
- KI-3 health endpoint `degraded` (Milestone F 처리)
- KI-4 m4_websocket teardown race (Milestone F 처리)

---

## Next Exact First Step

**다음 세션 첫 단계**: 사용자가 4/30 critical path 6건 (5.5h 외부 작업)을 완료한 직후, Claude는 **T1.2-1: `artifacts/business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md`에 "AI 기능 보유 여부" 행 추가** (도그메이트❌ / 와요❌ / 펫플래닛❌ / 에어댕냥이❌ / 펫피❌ / PetTracker✓ V1.0 5축).

이어 T1.2-2 budget-guide-summary 자금 재배분 매핑 (서버 800→350, LLM 200, AI 인프라 100), T1.2-3 LOI 5건 AI inject (#1 수의사 "사진 컨디션 임상 적합성", #4 UX "AI 캡션 수정 UI") 순으로 진행.

`/session-start` 호출 시 본 핸드오프 + STATE.md + Phase 4 Todo Plan T1.2 항목으로 0초 복원 가능.

---

## Residual Risks

- **R-1 (HIGH)**: D-1=5축 결정으로 V1.0 잔여 25.0d → effective 12.5d (사용자 2x capacity 가정) → 출시 6/9 ±2d (margin -1~+1d). 사용자 capacity 가정이 틀릴 경우 6/12+ 가능. **Mitigation**: Phase 4 Todo Plan §Rollback에 5/27 시점 진척 < 50% 시 축 E·F V1.1 이연 결정.
- **R-2 (MEDIUM)**: Vision LLM 캡션 환각 (false 부정 사건) → 보호자 분쟁. **Mitigation**: 3-layer UX (disclaimer + 펫시터 수정 + 보호자 신고) + 출시 전 사용자 테스트 5~10명.
- **R-3 (MEDIUM)**: 한국어 모더레이션 false positive > 5% 가능성. **Mitigation**: 출시 전 50건 샘플 검증 + 자동 재검토 흐름 + 운영자 큐 fallback.
- **R-4 (MEDIUM)**: GPS 이상 탐지 false alarm (터널·이어폰). **Mitigation**: V1.0 베타 라벨 + 펫시터·보호자 1-tap dismiss + 출시 후 1개월 임계값 튜닝.
- **R-5 (MEDIUM)**: TTcare 추상화로 P3 산업 페르소나 가산 -1~2점 손실 가능. **Mitigation**: 차별화·Moat 보강(영역 1·2)으로 P3 별도 +3~4 회복.
- **R-6 (LOW)**: 의존성 충돌 (anthropic + firebase-admin httpx 버전) → T2.0 첫 단계 차단 가능. **Mitigation**: T2.0 `pip check` 의무 + 호환 버전 매트릭스 fallback.
- **R-7 (LOW)**: P0 5건 외부 작업(가입자 30·LOI 3) 미달 시 5/8 strong-go 게이트 fail → K-Startup 초기창업패키지(7월) 전환. **Mitigation**: Track 1 점수 효과(76~83)는 외부 작업 충족 전제.

---

## References

- Final Tech Spec: [`artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md`](../specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md)
- 차별화·Moat·BM 보강: [`artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md`](../business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md)
- Phase 4 Todo Plan: [`artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md`](../plans/2026-04-30-pt-ai-differentiation-todo-plan.md)
- Consensus Matrix: [`artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md`](../reviews/2026-04-29-pt-ai-differentiation-consensus.md)
- 이전 핸드오프: [`2026-04-29-session-final-handoff.md`](2026-04-29-session-final-handoff.md) — D-18 P0 5건 산출물 완료
