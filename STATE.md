# SafeWay Platform — Current State (Live)

> This file is the **single source of truth** for "what is happening right now".
> Updated by `/session-start` and `/session-end` skills.
> For point-in-time milestone snapshots see `artifacts/reports/`.
> For historical session records see `artifacts/handoffs/`.

**Last updated**: 2026-05-03 (오전 — 모두의 창업 cross-check + 신청서 본문 v1 D-15 사전 작성 / 오후 — **SafeWay Kids 샌드박스 v2.1 양길모 변호사 KISED #32399 의견서 반영 완료** — 911 라인 / 13개 patch / "고영향 AI 미해당 + 자발적 거버넌스 이중 트랙" frame 전환)
**Current phase**: Phase 4 → Phase 5 진입 직전 (**Track 1 신청서 v1 사전 완성 (4/30~5/15)**, Track 2 AI 구현 (5/16~6/9))
**Active workstream**: PetTracker V1.0 출시 준비 + 모두의 창업 2026 신청 (Track 1 + Track 2 분리)
**Active brief**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`](artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md) (AI 차별화) + [`artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md`](artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md) (PT V1.0 baseline)
**Final Tech Spec**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md`](artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md) — D-1=5축 / D-2=추상화 / D-7=출처 삭제 + Consensus 자동 반영 15건
**Todo Plan**: [`artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md`](artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md) — Track 1 (4/30~5/15 신청서) + Track 2 (5/16~6/9 AI 구현)
**Consensus matrix**: [`artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md`](artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md) — 3 reviewer (backend-dev 6/10 / product-manager 6/10 / korea-fundraising-strategist 7/10)
**보강 산출물**: [`artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md`](artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md) — 차별화 3 layer + Moat 5종 + BMC 9 blocks + Unit Economics 3 시나리오
**Cross-check (5/3 신규)**: [`artifacts/business/fundraising/2026-04-30-modoo-eval-guide-crosscheck.md`](artifacts/business/fundraising/2026-04-30-modoo-eval-guide-crosscheck.md) — modoo.or.kr `/intro` + 공고문 PDF + 공식 FAQ 답변 1차 출처 100% / 평가 5축 (가능성·구체성·기대효과·차별성·효과성) / cross-check 5변경 / 신청서 inject 가이드
**신청서 본문 v1 (5/3 신규)**: [`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`](artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md) — 26KB / 362행 / 본문 ~2,967자 / 5축 매트릭스 30/30 / 자체 채점 36/50 (72%) / placeholder 6건 (가입자 1 + LOI 5명) / 약점 Top 3 보강 가이드
**Next gate**: **Track 1 — 5/8 D-7 strong-go/no-go 게이트** (가입자 ≥30 + LOI ≥3 + 5/7 변호사 미팅 회수) → **5/9 placeholder 6건 inject로 v2 즉시 생성** → 5/10 1차 채점 (evaluator-rubric-reviewer 5 페르소나) → 5/13 v3 80점 목표 → 5/14 운영기관 최종 선택 (서울 AC 5개) → **5/15 16:00 K-Startup 포털 제출** → 5/16 Track 2 AI 구현 시작 (T2.0 pip check 첫 단계)
**PT 출시 타깃**: **2026-06-09 ±2d** (옵션 A 반영, 기존 6/4 → 6/9, AI 5축 +5d 사용 후)
**Open Gap Notes**:
- [`artifacts/gap-notes/2026-04-27-storage-contract-divergence.md`](artifacts/gap-notes/2026-04-27-storage-contract-divergence.md) — Storage spec FR-3.x ↔ deployed contract 4 divergence (V1.1 해소)

## Blockers / Waiting On

### 코드 진행 (Phase 5 Implementation)
- ✅ ~~Phase 0 Baseline~~ → 145 passed (known-issue 3 파일 제외), TS/jest/vitest all pass
- ✅ ~~Milestone A 잔여 5건~~ → 보험 UI / Handover 데이터 / 신원조회 stub 완료, 145 passed (회귀 0)
- ✅ ~~Milestone B 모바일 테스트 인프라~~ → PT jest 7 suites · 12 tests, Firebase Auth 미들웨어 + Alembic firebase_uid 완료
- ✅ ~~Milestone C-Pay~~ → C-4 PtPayment 모델 + manual Alembic, C-5 `/pt/payments/{prepare,confirm,{id}/cancel}`, C-6 `/billing/webhook/portone` (HMAC fail-closed). 145 passed.
- ✅ ~~Milestone C-Storage 백엔드~~ → C-7 storage 모듈 (S3/Local fallback), `/api/v1/storage/upload-url` endpoint
- ✅ ~~Milestone C-WS 백엔드~~ → C-11 `ws_auth.py` (JWT+Firebase 듀얼, DI 주입), C-12 `/pt/ws/walks/{session_id}` (Redis pubsub `pt:walk:{id}:updates`). 145 passed.
- ✅ ~~Milestone C-9 useImageUpload~~ → core-mobile hook + PT jest 3 cases. presigned PUT 흐름 + FR-3.3 prefix 합성 + 에러 캡처. 15 passed (회귀 0).
- ✅ ~~Milestone C-10 PT 사진 업로드 UI~~ → WalkerProfileScreen (프로필 사진) + WalkScreen (산책 중 사진) 통합. picker→hook→download_url 표시. 백엔드 persistence는 Gap Note D-3/D-4 (V1.1 이연).
- 🟡 **Milestone C 모바일 통합 잔여**: C-13 useWebSocket → C-14 OwnerWalkTrackingScreen 산책 실시간 추적 UI (다음 세션 첫 단계)
- 🟡 Milestone D: 사고 신고 (P0, 법적 의무 연계)
- 🟡 Milestone E: V1.1 트러스트 (즐겨찾기·정기예약·산책 리포트)
- 🟡 Milestone F: 백엔드 통합 테스트 + 회귀 매트릭스 (KI-4 teardown race 정비 포함)
- 🟡 Milestone G: Pre-launch QA + EAS Build

### 외부 작업 (사용자)
- 🟡 **변호사 자문 5건 (Q-L1~Q-L5)** — Milestone D 시작 전 회신 필요. K-Startup 일반상담 / 9988 / 대한상공회의소 무료 트랙
- 🟡 AWS 계정 + IAM 사용자 + S3 버킷 생성 (Milestone C-8)
- 🟡 Firebase 프로젝트 생성 + Admin SDK service account JSON (Milestone B-9)
- 🟡 PortOne 가맹점 계약 + API Key/Secret (Milestone C 실 결제)
- 🟡 Backend dev 환경 변수 설정 (KI-2 `TOSS_WEBHOOK_SECRET` 등)

### Track 1 — 신청서 (4/30~5/15, D-15) + Track 2 — AI 구현 (5/16~6/9, D-25)

> 상세 일정·작업 분해는 Phase 4 Todo Plan 참조: [`artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md`](artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md)

**Track 1 결정 게이트**:
- 🟡 **5/3~5/7 critical path 6건** (사용자): 가입자 모집·LOI 회수·카톡 50명·SNS 활성화·5/7 변호사 미팅
- 🔴 **5/8 D-7 strong-go/no-go 게이트**: 가입자 ≥30 + LOI ≥3 미달 시 K-Startup 초기창업패키지(7월) 전환
- ✅ ~~5/9 신청서 본문 v1~~ → **5/3 D-12 사전 작성 완료** (`korean-grant-application-writer`, 26KB / 362행 / 5축 30/30 / 자체 36/50)
- 🟡 **5/9 v2 즉시 생성** (placeholder 6건 inject만)
- 🟡 5/10 1차 채점 (목표 70+) → 5/13 v3 (목표 80+) → 5/14 운영기관 최종 선택 → 5/15 16:00 제출
- 🔴 **5/15 16:00 K-Startup 포털 제출**

**Track 2 시작 (5/16)**:
- T2.0 `pip check` 의존성 호환 검증 (anthropic + openai + firebase-admin + aioboto3) — **첫 단계 의무**
- 그 후 Milestone C 잔여 + AI 인프라 → D + 축 A·D → B·F → E → F → G

**P0 5건 산출물 (4/29 완료, Track 1 inject 자료)**: budget-guide-summary / market-citations / competitor-matrix / loi-templates / campaign-assets

**경쟁사 정정 (4/29 완료)**: ❌ 케어독·댕댕워크·우프 → ✅ 펫플래닛·에어댕냥이·펫피

### Known Issues (PT 출시 critical path 무관)
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정 → Toss webhook 3 fail (Milestone F 처리)
- KI-3 health endpoint `degraded` → 1 fail (Milestone F 처리)
- KI-4 m4_websocket teardown race → 1 error (test_ws_accepts_valid_token_query_param). C-11 refactor로 1 error는 해소, 잔존 1 error는 pytest unraisable hook 캡처(테스트 인프라). Milestone F에서 정비.

## Latest Handoff
- [`artifacts/handoffs/2026-05-03-session-final-handoff.md`](artifacts/handoffs/2026-05-03-session-final-handoff.md) — **SafeWay Kids 샌드박스 v2.1 양길모 변호사 KISED #32399 의견서 반영 (13 patch / 911 라인 / 이중 트랙 frame 전환)**
- [`artifacts/handoffs/2026-05-03-session-handoff.md`](artifacts/handoffs/2026-05-03-session-handoff.md) — **(같은 날 오전) modoo.or.kr 평가 가이드 cross-check + 신청서 본문 v1 D-15 사전 작성 (5축 anchor 30/30 / placeholder 6건 / 자체 36/50 / +9일 buffer 확보)**
- (이전) [`artifacts/handoffs/2026-04-30-session-end-handoff.md`](artifacts/handoffs/2026-04-30-session-end-handoff.md) — **오후 후속 / 모두의 창업 2026 동기 174건 + 추가 8 키워드 분석 + V2.0 6축 white space + T1.2-1 matrix §11 신설 + 사용자 결정 4건 처리**
- (이전 오전) [`artifacts/handoffs/2026-04-30-session-handoff.md`](artifacts/handoffs/2026-04-30-session-handoff.md) — **AI 차별화 Phase 0~4 완료 + 차별화·Moat·BM 보강 + 옵션 A 신청서 우선 채택, 점수 79~86 진입 + PT 출시 6/4 → 6/9 ±2d**
- (이전) [`artifacts/handoffs/2026-04-29-session-final-handoff.md`](artifacts/handoffs/2026-04-29-session-final-handoff.md) — D-18 P0 5건 산출물 + 메모리 정정 (케어독 → 펫플래닛·에어댕냥이·펫피)
- (이전) [`artifacts/handoffs/2026-04-29-session-handoff.md`](artifacts/handoffs/2026-04-29-session-handoff.md) — 트랙션 매핑 4 산출물 + 5 페르소나 채점
- (이전) [`artifacts/handoffs/2026-04-27-session-handoff.md`](artifacts/handoffs/2026-04-27-session-handoff.md)
- (이전) [`artifacts/handoffs/2026-04-24-session-handoff.md`](artifacts/handoffs/2026-04-24-session-handoff.md)
- (이전) [`artifacts/handoffs/2026-04-19-session-handoff.md`](artifacts/handoffs/2026-04-19-session-handoff.md) (SafeWay 샌드박스)

## Active Artifacts (PT 워크스트림)
| 파일 | 용도 |
|---|---|
| `artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md` | **Final Tech Spec** — 사용자 결정 6건 + 18 섹션 (FR/NFR/architecture/code impact map) |
| `artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md` | Phase 0 + Milestone A~G todo (27 영업일) |
| `artifacts/reviews/2026-04-24-pt-cc-consensus-matrix.md` | 3 reviewer 합의 + 일정 재산정 (V2) |
| `artifacts/verification/2026-04-24-baseline-summary.md` | Phase 0 baseline (174→145 passed) |
| `artifacts/verification/2026-04-24-milestone-a-verification.md` | A 마일스톤 검증 |
| `artifacts/verification/2026-04-24-milestone-b-verification.md` | B 마일스톤 검증 |
| `artifacts/verification/2026-04-24-milestone-c-pay-storage-verification.md` | C-Pay + C-Storage 백엔드 검증 (145 passed) |
| `artifacts/verification/2026-04-27-milestone-c-ws-backend-verification.md` | C-WS 백엔드 검증 (145 passed, KI-4 부분 fix) |
| `artifacts/verification/2026-04-27-c9-c10-mobile-verification.md` | C-9 hook + C-10 PT 모바일 통합 검증 (15 jest passed, TS 0 errors × 3 패키지) |
| `artifacts/gap-notes/2026-04-27-storage-contract-divergence.md` | Storage FR-3.x divergence 4건 + V1.1 해소 계획 |
| `packages/core-mobile/hooks/useImageUpload.ts` | 공용 사진 업로드 hook (PT/CC/SafeWay 재사용 가능) |
| `backend/app/middleware/firebase_auth.py` | Firebase Auth dependency (PT/CC HTTP 라우터용) |
| `backend/app/middleware/ws_auth.py` | WS 듀얼 verifier (JWT + Firebase) + negotiate_ws_auth |
| `backend/app/modules/billing/providers/{base,portone}.py` | PG provider 추상화 + PortOne v2 |
| `backend/app/modules/storage/{base,s3,local,factory,router}.py` | Storage 모듈 (S3 + Local fallback + presigned URL endpoint) |
| `backend/app/apps/pettracker/models.py` | +PtPayment, PtPaymentStatus |
| `backend/app/apps/pettracker/router.py` | +`/pt/payments/*` endpoint, +`/pt/ws/walks/{session_id}` WebSocket |
| `backend/migrations/versions/c4b1f5e7a8d2_create_pt_payments.py` | manual 작성 (autogenerate drop 회피) |
| `backend/app/modules/compliance/sex_offender_check.py` | 돌봄사 신원조회 stub (CC 사이클 직전 실 API 통합) |

## Active Artifacts (모두의 창업 2026 트랙)
| 파일 | 용도 |
|---|---|
| `artifacts/business/traction/2026-04-27-pt-traction-inventory.md` | Raw 트랙션 인벤토리 50개 + Gap 13개 + 신뢰도 라벨링 (재사용 자산 — TIPS·VC IR 재투입) |
| `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-traction-mapping.md` | 5축 평가표 매핑 + 자금 사용 계획 1억원 + 8 페르소나 답변 + D-18 일정 |
| `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-multiapp-narrative.md` | 멀티앱 시너지 정량화 (백엔드 87% / 모바일 50%) + 회계 7 답변 + Assumption Register |
| `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-rubric-review.md` | 5 페르소나 사전 채점 (KISED 52.3 / VC 40.0 / 산업 55.0 / 회계 66.7 / 멘토 50.0 = 평균 52.8) + Top 10 약점 + D-18 P0~P2 |
| `artifacts/business/fundraising/2026-04-27-modoo-startup-business-reg-conflict-check.md` | BOM 충돌 점검 (사업자등록 보류 → 무결제 출시 결정) |
| `artifacts/business/regulatory/2026-04-27-sandbox-modoo-conflict-legal-counsel.md` | KRC 자문 (SafeWay-PT 자격 충돌, 진행 중) |
| **`artifacts/business/fundraising/2026-04-29-modoo-startup-budget-guide-summary.md`** | **공고 별첨 (Task #1) — 공고 PDF 29p 추출 + 사용자 plan 정합성 + 1억 자금 배분표** |
| **`artifacts/business/fundraising/2026-04-29-modoo-startup-pt-market-citations.md`** | **시장 출처 (Task #2 / P0-3) — 농식품부/KB금융/KPMG + TAM/SAM/SOM 3시나리오 + 시장성 +5~7** |
| **`artifacts/business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md`** | **경쟁사 (Task #3 / P0-4) — 5개사 14축 + PT 차별화 3축 + 혁신성 +3~5** |
| **`artifacts/business/fundraising/2026-04-29-modoo-startup-pt-loi-templates.md`** | **LOI 5건 (Task #4 / P0-2) — 5명 이메일 + 한국어 양식 + 팀역량 +7~9** |
| **`artifacts/business/fundraising/2026-04-29-modoo-startup-pt-campaign-assets.md`** | **캠페인 자산 (Task #5 / P0-1) — 랜딩/카페/SNS 8개 + 시장성 +8~10** |
| `artifacts/business/fundraising/_scratch/extract_pdf.py` | PDF 추출 스크립트 (재사용 가능) |
| `artifacts/business/fundraising/_scratch/modoo-2026-275-extracted.txt` | 공고 PDF 29 페이지 텍스트 (54KB) |
| **`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`** | **Phase 0 — AI 차별화 Brief (8축 + 사례 7건 + 5 결정 게이트)** |
| **`artifacts/reviews/2026-04-29-pt-ai-differentiation-{backend,product,fundraising}-review.md`** | **Phase 1 — Independent Review 3건 (BE 6/10 + PM 6/10 + KFS 7/10)** |
| **`artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md`** | **Phase 2 — Consensus Matrix (자동 반영 15건 + 사용자 결정 3건)** |
| **`artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md`** | **Phase 3 — Final Tech Spec (D-1=5축 / D-2=추상화 / D-7=출처 삭제 + 18 섹션)** |
| **`artifacts/plans/2026-04-30-pt-ai-differentiation-todo-plan.md`** | **Phase 4 — Todo Plan (Track 1 신청서 + Track 2 AI 구현)** |
| **`artifacts/business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md`** | **사업 narrative 보강 (차별화 3 layer + Moat 5종 + BMC + LTV/CAC 6.16 + 면접 답변 4건)** |
| **`artifacts/business/competitive/2026-04-30-modoo-startup-2026-pet-applicants-analysis.md`** | **모두의 창업 2026 동기 신청자 분석 (174건 + 추가 8 키워드 / Tier 1 직접 경쟁자 7건 / V2.0 6축 white space 6/6 / 신청서 inject 3섹션 / 4/30 오후 후속 산출물)** |
| (보강) `artifacts/business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md` §11 | **§11 신설 (4/30 오후) — 동기 신청자 비교 + AI 기능 보유 표 + V2.0 6축 white space + §혁신성 V2.0 narrative** |
| **`artifacts/business/fundraising/2026-04-30-modoo-eval-guide-crosscheck.md`** | **modoo.or.kr 평가 가이드 cross-check (5/3 신규) — 1차 출처 100% (`/intro` + 공고문 PDF + 공식 FAQ 답변) / 평가 5축 매트릭스 / cross-check 5변경 / 신청서 7개 항목별 inject 가이드 / 5/8 게이트 보강** |
| **`artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`** | **신청서 본문 v1 (5/3 신규) — 26KB / 362행 / 본문 ~2,967자 / 5축 매트릭스 30/30 / 자체 채점 36/50 (72%) / placeholder 6건 / 약점 Top 3 / 운영기관 후보 5개 / 영상·이미지 시나리오** |

---

## Parallel Workstream — SafeWay Kids 규제 샌드박스

> 본 워크스트림은 별도 진행 중이며, **2026-05-03 세션에서 양길모 변호사 의견서 KISED #32399 반영 v2.1 patch 완료**.
> 마지막 업데이트: 2026-05-03. 다음 미팅: 2026-05-07.

**Phase**: Phase 5 — Implementation (v2.1 양길모 변호사 KISED #32399 의견서 반영 완료, cross-check 대기)
**Active draft**: [`artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md`](artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md) — v2.1 (911 라인 / 110KB / +29% from v2.0.4)
**Previous draft (보존)**: [`artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md`](artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md) — v2.0.4
**Legal opinion anchor (NEW)**:
- 의견서 본문 12p: [`artifacts/business/regulatory/2026-04-29-yangkilmo-legal-opinion-detailed.pdf`](artifacts/business/regulatory/2026-04-29-yangkilmo-legal-opinion-detailed.pdf)
- 자문서 요약: [`artifacts/business/regulatory/2026-04-29-yangkilmo-consultation-summary.pdf`](artifacts/business/regulatory/2026-04-29-yangkilmo-consultation-summary.pdf)
- 양길모 변호사 (법무법인 조율, 010-8787-4033) / KISED 자문 #32399 / 2026-05-02 승인 / 자문료 1,000,000원

**v2.1 변경 요약 (2026-05-03)**:
- §1.5 학원 파일럿: 시행령 §3의2 1의2 학원 미명시 발견 → 실증특례 필요성 강화 근거로 활용
- §2.3 규제 공백 #2: 시행령 §3의2 1의2 + 춘천지법 2016구합51632 + 양길모 결론 anchor 3종 추가 → "유권해석 공백" → "1차 anchor 확보 + 정부 공식 해석으로 격상" frame
- §2.7·§4.6 REWRITE: "고영향 AI 해당 가정" → "고영향 AI 미해당 + 자발적 거버넌스 이중 트랙" frame 전환
- §4.7 신설: 정통망법 §44의2 적용 외 anchor (헌재 2016헌마275)
- §6.1 행 E: "통합 처리" → "별개 진행 + 자발적 §33 확인 요청 본 신청 후 30일 내 별도 제출"
- §11.4 참고문헌: 시행령 §3의2 1의2 / 정통망법 §44의2 / 정통융합법 §38의2 / 춘천지법 2016구합51632 / 헌재 2016헌마275 / 양길모 의견서 6건 추가

**Next gate (샌드박스)**:
- 🟡 양길모 변호사 인용 사전 동의 통화 (010-8787-4033, 1분, 5/3~5/4) — 신청서 본문 paraphrase 인용 가능 확인
- 🟡 5/7 대한상공회의소 이의림 변호사 cross-check 미팅 — 양길모 의견서 검토, 일치 시 v2.1 anchor 강화 / 불일치 시 보수적 의견 통합
- 🟡 5/8~5/13 평가위원·심사관 페르소나 검토 (`evaluator-rubric-reviewer` 5 페르소나)
- 🟡 5/13 v2.2 최종 확정
- 🟡 5/14 운영기관 사전 전달

**최근 핸드오프 (샌드박스)**: [`artifacts/handoffs/2026-05-03-session-final-handoff.md`](artifacts/handoffs/2026-05-03-session-final-handoff.md) — v2.1 양길모 의견서 반영 13 patch 완료. 직전 샌드박스 핸드오프: [`2026-04-19-session-handoff.md`](artifacts/handoffs/2026-04-19-session-handoff.md) (v2.0.4)

---

## Portfolio Status
- **PetTracker**: V1.0 출시 준비 (PT 우선 워크스트림 active — Milestone C 진행 중)
- **CareConnect**: PT 안정화 후 별도 사이클 (V1.0-CC, 추정 PT 출시 +30일)
- **SafeWay Kids**: 규제 샌드박스 심사 대기 (병렬 워크스트림)
- **SDET Code**: 운영 중 (B2B 해외)
- **루넨랩스**: 사업자등록 진행 중 (일반과세자 필수)

## Available Skills (fast lane)
- `/session-start` — 세션 시작 시 상태 복원
- `/session-end` — 세션 종료 시 핸드오프 강제
- `/sandbox-followup [email|prep|status|review]` — 샌드박스 워크플로우 (5명 페르소나 내장)

## Available Agents (specialist pool)
- `business-operations-manager` — 사업 전반 (CFO+COO+CSO)
- `korea-regulatory-counsel` — 한국 규제·법무 1차 자문
- `korea-tax-accounting-advisor` — 한국 세무·회계
- `korea-fundraising-strategist` — 정부지원사업 + 초기 VC IR
- `backend-dev`, `frontend-dev`, `db-architect`, `security-expert`, `product-manager`, `qa-lead`, `ux-advocate` (Tech Spec 리뷰·구현용)
- `tech-spec-reviewer`, `requirement-analyst`, `verification-auditor` (워크플로우 게이트용)
