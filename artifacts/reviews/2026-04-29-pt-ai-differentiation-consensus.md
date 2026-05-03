# PT AI 차별화 — Phase 2 Consensus Matrix

**문서 분류**: Phase 2 Consensus Matrix
**검토 대상**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`](../specs/2026-04-29-pt-ai-differentiation-brief.md)
**작성일**: 2026-04-30
**입력 review 3건**:
- [`2026-04-29-pt-ai-differentiation-backend-review.md`](2026-04-29-pt-ai-differentiation-backend-review.md) (backend-dev, confidence 6/10)
- [`2026-04-29-pt-ai-differentiation-product-review.md`](2026-04-29-pt-ai-differentiation-product-review.md) (product-manager, confidence 6/10)
- [`2026-04-29-pt-ai-differentiation-fundraising-review.md`](2026-04-29-pt-ai-differentiation-fundraising-review.md) (korea-fundraising-strategist, confidence 7/10)

**Consensus Confidence (3 reviewer 평균)**: **6.3/10** (전제 해소 시 8/10 진입 가능)

---

## 1. Reviewer 입장 요약 (one-line each)

| Reviewer | 한 줄 요약 | 주요 우려 |
|---|---|---|
| backend-dev | "5축 기술적으로 가능하지만 +5d 추정은 낙관적, 실제 +7~8.5d. 사고 신고 LLM은 반드시 비동기" | NFR-5 위반·비용 cap 부재·WalkPhoto 모델 부재 |
| product-manager | "V1.0 5축은 너무 많다. A·B·D 3축으로 축소 + E·F를 V1.1로 미루면 confidence 8/10" | 환각 처리 UX 부재·모더레이션 false positive·V1.1 +30일 약속 |
| korea-fundraising-strategist | "한국 first-mover narrative 강함. 점수 회복 +9~13 → 현실 +6~10. TTcare는 접촉 또는 추상화 필수" | TTcare false impression·글로벌 출처 미확보·P2 과대 추정 |

---

## 2. Convergence (3/3 또는 2/3 합의 영역) — Final Tech Spec 자동 반영

> 다수 reviewer가 명시 동의하거나 반대하지 않은 항목. Phase 3 Final Tech Spec에 자동 inject.

### CV-1 (3/3 — HIGH PRIORITY) 약속-동작 정합 리스크 인정 + 일정 보정

**Status**: VERIFIED — 3 reviewer 모두 일정 추정의 낙관성 지적

- BE: +5.0d → +7.0~8.5d (보고서·LLM mock·GPS state)
- PM: +4d → +6~8d (state 재설계, C-14 미완)
- KFS: P5 페르소나 우려, R-1 출시 일정 worst-case

**Final Tech Spec 결정**: 일정 추정을 **+7~8.5d** 로 갱신 (Brief §7 표 update). PT 출시 6/4 → 6/7로 반영 (margin ±3 → +2~3d 사용).

### CV-2 (2/3 — HIGH PRIORITY) AI 환각·오류 UX 3-layer 안전장치

**Status**: PARTIALLY VERIFIED — PM 명시, KFS 면접 답변에서 동조, BE 반대 X

3-layer:
1. Disclaimer 라벨: "AI 생성 캡션 — 펫시터가 수정할 수 있습니다"
2. 펫시터 1-tap 수정·삭제 권한
3. 보호자 부적절 신고 버튼 (운영자 큐로)

**Final Tech Spec 결정**: 3-layer를 모든 AI 결과물(축 A·B·D·F)에 의무 적용. UI spec에 명시.

### CV-3 (3/3 — CRITICAL) 사고 신고 LLM은 비동기 (BackgroundTasks)

**Status**: VERIFIED — BE 명시 권고, KFS·PM 반대 X

- 동기 호출 시 V1.0 NFR-5 (99.9% incident submission) **명백 위반**
- 30s timeout = walker UX 파괴

**Final Tech Spec 결정**: `POST /pt/walks/{id}/incident` 즉시 201 반환 → BackgroundTasks → 10s timeout → 결과 PtIncidentClassification UPDATE → push 알림. Fallback `severity=medium`, `type=other`, `action=contact_owner`.

### CV-4 (3/3 — HIGH) WalkPhoto 모델 추가

**Status**: VERIFIED — BE 명시, PM 다수 사진 state 충돌 지적, KFS 반대 X

`WalkPhoto(id, session_id, s3_key, caption, caption_status, created_at)` 신규 모델.
PtAiInsight FK → WalkPhoto.
Alembic 1개 추가 migration.

**Final Tech Spec 결정**: WalkPhoto 모델 추가 + Alembic migration 1건 명시.

### CV-5 (2/3 — HIGH) 비용 cap Redis counter 구현

**Status**: PARTIALLY VERIFIED — BE 명시, KFS 면접 Q-I-3 답변에서 동조, PM 반대 X

- `pt:ai:cost:{YYYY}:{MM}` Redis key INCRBYFLOAT
- 80% threshold → Haiku/gpt-4o-mini tier 자동 routing
- 100% cap → cached fallback 또는 운영자 알림

**Final Tech Spec 결정**: Redis 기반 cost counter 구현. `PT_LLM_MONTHLY_COST_CAP_KRW = 2,000,000` (Brief 3,000,000 → 자금 계획 정합 위해 200만원). 0.5d 작업 명시.

### CV-6 (2/3 — HIGH) 글로벌 사례 인용 출처 확보 또는 수정

**Status**: VERIFIED — KFS 명시 (R-5), BE·PM 반대 X

- "$660M+ 글로벌 펫 AI 투자" 출처 미확보 → 사용자 외부 작업 또는 삭제
- TTcare TIPS·Traini $7.5M·Mars Petcare는 명확한 1차 출처 보유

**Final Tech Spec 결정**: $660M+ 수치는 **사용자 1차 출처 확보 또는 삭제** (외부 작업 등록). Traini·TTcare·Mars 수치는 신청서 인용 가능.

### CV-7 (2/3 — MEDIUM) V1.1 약속 +30일 → +45일

**Status**: PARTIALLY VERIFIED — PM 명시 (F-5), KFS 면접 답변에서 동조, BE 일정 무관

- 1인 창업가 V1.0 출시 + QA + 초기 운영 안정화 + V1.1 3축은 +30일 비현실적
- "+45일" 또는 "+45~60일" 신청서 narrative 수정

**Final Tech Spec 결정**: 신청서 §혁신성에서 "V1.0 +45일" 명시. 자체 V1.1 todo plan은 +60일 buffer.

### CV-8 (3/3 — HIGH) Wag 파산 §리스크 narrative 포함

**Status**: VERIFIED — KFS 옵션 D 명시, BE·PM 반대 X

- Wag 2025-07 파산 후 restructured 운영 정확 표기
- "AI 매칭만으로 BEP 불가 입증 → PT 통합 narrative 강화"
- §리스크 100~150자 1문단

**Final Tech Spec 결정**: 신청서 §리스크에 inject.

### CV-9 (2/3 — MEDIUM) 경쟁사 매트릭스에 AI 행 추가

**Status**: VERIFIED — KFS 명시 (AF-3), 다른 reviewer 반대 X

- competitor-matrix §2 표에 "AI 기능 보유 여부" 행 추가
- 도그메이트❌ / 와요❌ / 펫플래닛❌ / 에어댕냥이❌ / 펫피❌ / PT✓
- 이미지 슬롯 2번 갱신

**Final Tech Spec 결정**: competitor-matrix 산출물 갱신을 사용자 외부 작업으로 등록.

### CV-10 (3/3 — MEDIUM) 점수 회복 추정 보수화

**Status**: VERIFIED — KFS 명시 (P2 과대 추정), BE·PM 묵시 동조

- Brief +9~13점 평균 → 현실 **+6~10점** (76~83 구간)
- P2 VC: +5~8 → +2~4 (Traction 0.5/5 = AI로 회복 불가)
- P5 1인 멘토: 일정 +4d 시 -1~3 페널티 가능

**Final Tech Spec 결정**: 점수 추정을 +6~10점 범위로 표기. 신청서 narrative에 점수 추정은 미포함 (내부 추정만).

---

## 3. Divergence (이견 영역) — 사용자 결정 필요

### DV-1 (HIGHEST PRIORITY) V1.0 AI 축 갯수: 3축 vs 5축 vs 절충

| Reviewer | 입장 | 근거 |
|---|---|---|
| BE | 5축 가능, 단 +7~8.5d 일정 위험 | 기술적 가능 + 일정 부담 (간접 우려) |
| PM | **3축 강력 권고 (A·B·D)** | E·F 임계값 검증 불가 + V1.0 품질 리스크 |
| KFS | 5축 점수 회복 narrative 유지 | 신청서 점수 효과 (단 약속-동작 정합 우려) |

**핵심 trade-off**:
- 3축: 일정 안정 + 품질 보증 + 점수 회복 +6~8 (PM 권고)
- 5축: 점수 회복 +9~13 가능성 + 일정 +6~8d 위험 + 환각·false alarm 리스크
- 절충 (4축, A·B·D + E or F): 점수 회복 +7~10 + 일정 +5~6d

**사용자 결정 게이트 D-1**: 3축 / 4축 (+E) / 4축 (+F) / 5축 중 선택

### DV-2 (HIGHEST PRIORITY) TTcare narrative 처리

| Reviewer | 입장 |
|---|---|
| BE | 미언급 (구현 무관) |
| PM | V2.0 이연 표만 |
| KFS | 접촉 선행 OR 추상화 OR 삭제 3옵션 (P0 결정 필요) |

**KFS 분석 (R-2 HIGH 리스크)**:
- TTcare는 경쟁적 사업자 (공개 SDK 없음, 협력 미접촉 시 부실 계획 판정 가능)
- 옵션 1: TTcare 1통 이메일 발송 → "협력 타당성 검토 연락" 명시
- 옵션 2: 추상화 → "국내 펫 헬스케어 AI 사업자와 V1.2 단계 탐색"
- 옵션 3: 완전 삭제

**사용자 결정 게이트 D-2**: 옵션 1 / 2 / 3 중 선택. **5/8 게이트 전 결정 필수**.

### DV-3 (MEDIUM) GPS 이상 탐지 위치 (Q-5 답변)

| Reviewer | 입장 |
|---|---|
| BE | **백엔드 WS handler + Redis ZSET** (배터리·감사·tamper-resistance) |
| PM | V1.1 이연 권고 (V1.0에 미포함) |
| KFS | 미언급 |

**합의 트랙**:
- 만약 V1.0에 포함(DV-1에서 4축+E 또는 5축 선택) → BE의 백엔드 WS handler 위치 채택
- 만약 V1.1로 이연(DV-1에서 3축 또는 4축+F 선택) → 본 결정 무관

**사용자 결정 게이트 D-3 (DV-1 종속)**: 백엔드 WS handler 위치 채택 (BE F-4)

### DV-4 (MEDIUM) Empathic tone 기준 (Open Question Q-3)

| Reviewer | 입장 |
|---|---|
| BE | 미언급 |
| PM | **상한선: "잔디밭에서 활발하게 뛰었어요"** (1인칭 주어, 이모지 max 1개, 감탄사 금지, 1~2문장) |
| KFS | 미언급 |

**사용자 결정 게이트 D-4**: PM F-4 권고 채택 또는 별도 톤 기준 제시

---

## 4. 사용자 결정 게이트 (D-1 ~ D-7)

> Phase 3 Final Tech Spec 작성 진입 전 사용자 답변 필요. 게이트는 **5/8 strong-go/no-go 이전** 닫혀야 함.

| ID | 결정 사항 | 권장 (consensus) | 사용자 답변 |
|---|---|---|---|
| **D-1** | V1.0 AI 축 갯수 | (1) 3축 (A·B·D) — PM 권고 / (2) 4축 (+E 또는 F) / (3) 5축 (Brief 원안) | _대기_ |
| **D-2** | TTcare narrative | (1) 1통 접촉 후 명시 / (2) 추상화 / (3) 완전 삭제 | _대기_ |
| **D-3** | 사고 신고 LLM 동기/비동기 | **비동기 BackgroundTasks 의무** (NFR-5 위반 회피) | auto-accept (CV-3) |
| **D-4** | V1.1 약속 기간 | "+45일" (PM·KFS 합의) | auto-accept (CV-7) |
| **D-5** | LLM API monthly cap | 200만원 (Brief 명시 가깝게) | auto-accept (CV-5) |
| **D-6** | Empathic tone 기준 | PM F-4 권고 채택 (제한적 emotional) | auto-accept (DV-4 기본) |
| **D-7** | 글로벌 $660M+ 출처 | (1) 사용자 1차 출처 확보 (PitchBook 등) / (2) 수치 삭제, "Traini $7.5M + TTcare TIPS"만 인용 | _대기_ |

**auto-accept 항목 4건** (D-3·D-4·D-5·D-6): 사용자 명시 반대 없으면 Final Tech Spec에 반영.

**사용자 답변 필요 항목 3건** (D-1·D-2·D-7): 답변 받은 후 Phase 3 진행.

---

## 5. Final Tech Spec 자동 반영 사항 (사용자 결정 무관)

> Phase 3 작성 시 본 항목은 사용자 결정 없이 즉시 반영.

| # | 사항 | 출처 |
|---|---|---|
| 1 | 일정 추정 +7~8.5d (PT 출시 6/7 ±2~3d) | CV-1 |
| 2 | AI 결과물 3-layer UX (disclaimer + 수정 + 신고) | CV-2 |
| 3 | 사고 신고 LLM 비동기 BackgroundTasks (NFR-5 보호) | CV-3 |
| 4 | WalkPhoto 모델 신규 + Alembic migration | CV-4 |
| 5 | Redis cost counter `pt:ai:cost:{YYYY}:{MM}` + 200만원 cap + Haiku tier auto-routing | CV-5 |
| 6 | $660M+ 출처 확보 또는 삭제 (사용자 외부 작업 D-7로 등록) | CV-6 |
| 7 | V1.1 narrative "+45일" | CV-7 |
| 8 | Wag 파산 §리스크 narrative inject | CV-8 |
| 9 | competitor-matrix AI 행 추가 (사용자 외부 작업) | CV-9 |
| 10 | 점수 회복 추정 +6~10점 (보수) | CV-10 |
| 11 | GPS 이상 탐지 백엔드 WS handler + Redis ZSET (DV-1=4축+E 또는 5축 시 적용) | DV-3 |
| 12 | OpenAI Moderation API only for 축 D (Claude 미사용) | BE AD-5 |
| 13 | 사진 캡션 = `POST /api/v1/storage/confirm` hook (신규 endpoint 미추가) | BE AD-4 |
| 14 | 모더레이션 false positive 자동 재검토 (운영자 큐 최소화) | PM F-3 |
| 15 | 의존성 conflict 사전 검증 (`pip check`) — 첫 단계 | BE F-5 |

---

## 6. 면접 예상 질문 (KFS 제공)

본 AI 차별화 도입 후 면접에서 추가될 5개 질문 + 30초 답변 가이드는 [`fundraising-review §8`](2026-04-29-pt-ai-differentiation-fundraising-review.md)에 수록. Final Tech Spec §15 (외부 narrative 자료) 참조 처리.

---

## 7. 사용자 외부 작업 (Phase 3 이전 또는 병렬)

| ID | 작업 | 마감 | 우선순위 |
|---|---|---|---|
| **EXT-1** | TTcare 1통 접촉 이메일 발송 (D-2 옵션 1 선택 시) | 5/8 게이트 전 | P0 |
| **EXT-2** | 글로벌 $660M+ 1차 출처 확보 (D-7 옵션 1) | 5/9 신청서 본문 v1 전 | P0 |
| **EXT-3** | competitor-matrix 산출물 AI 행 추가 + 이미지 슬롯 갱신 | 5/9 신청서 본문 v1 전 | P0 |
| **EXT-4** | 자금 계획 재배분 매핑 명시 (서버 인프라 800 → 350, 외주용역비 4,500 내 TTcare 150) | 5/9 신청서 본문 v1 전 | P1 |
| **EXT-5** | LOI 5건 AI 자문 영역 inject (LOI #1 수의사·#4 UX) | 5/8 게이트 전 | P1 |

---

## 8. 점수 회복 재추정 (Consensus)

| 페르소나 | Brief 추정 | KFS 검증 | Consensus 채택 |
|---|---|---|---|
| P1 KISED | +3~5 | PARTIALLY VALIDATED | **+3~5** (Brief 유지) |
| P2 VC | +5~8 | OVER-ESTIMATED → +2~4 | **+2~4** (KFS 채택) |
| P3 산업 | +5~7 | CONDITIONALLY VALIDATED | **+4~6** (60~70% 가산 확률 반영) |
| P4 회계 | +2 | VALIDATED | **+2** (Brief 유지) |
| P5 1인 멘토 | +4~6 | UNDER-ESTIMATED 가능성 ↔ 일정 +4d worst-case | **+3~5** (양면 반영) |
| **5 페르소나 평균** | **+9~13** | — | **+6~9** |

**P0 5건 효과 합산 후 4/29 baseline 70~73 + AI 차별화 +6~9 = 76~82 구간**.

합격선 70 대비 strong-go 진입 가능, 80점 안정권은 D-1=5축 + R-1·R-2·R-5 모두 해소 시 가능.

---

## 9. 일정 재추정 (Consensus, DV-1별)

| DV-1 선택 | V1.0 AI 추가 일수 | PT 출시 일자 | margin 잔여 | 점수 회복 |
|---|---|---|---|---|
| 3축 (A·B·D) | +3.0~4.0d | 6/4 ±2d | ±2d | +5~7 |
| 4축 (+E) | +5.0~6.0d | 6/6 ±2d | ±1d | +6~8 |
| 4축 (+F) | +3.5~4.5d | 6/4~6/5 ±2d | ±2d | +5~8 |
| 5축 (Brief 원안) | +7.0~8.5d | 6/7~6/9 ±2d | -1~+1d | +6~9 (max) |

**Consensus 권장**: **3축 또는 4축 (+F)**. PM의 V1.0 품질 보증 + KFS의 점수 회복 균형.

---

## 10. Verification of this Consensus

| 항목 | 상태 |
|---|---|
| 3 reviewer 입장 명시 | VERIFIED |
| Convergence 항목 10건 (각 출처 명시) | VERIFIED |
| Divergence 항목 4건 + 사용자 결정 게이트 매핑 | VERIFIED |
| 사용자 결정 게이트 7건 (D-1~D-7) | VERIFIED |
| Final Tech Spec auto-accept 15건 | VERIFIED |
| 사용자 외부 작업 5건 (EXT-1~EXT-5) | VERIFIED |
| 점수·일정 재추정 (consensus) | VERIFIED |
| Phase 3 진입 조건 = D-1·D-2·D-7 사용자 답변 + auto-accept 4건 묵시 동의 | VERIFIED |

---

## 11. 다음 단계 (Phase 3 진입 조건)

1. **사용자 결정 받기 (D-1·D-2·D-7)** — 본 Consensus 보고 직후
2. **D-3·D-4·D-5·D-6 묵시 동의 확인** — 사용자가 명시 반대 안 하면 자동 진행
3. **Phase 3 Final Tech Spec 작성** — `artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md`, 18 섹션
4. **Phase 4 Todo Plan** — Final Tech Spec 완성 후 Milestone D~G inject + 신청서 본문 inject 분리
5. **EXT-1~EXT-5 사용자 외부 작업 병렬 시작** — 5/8 strong-go 게이트 전 완료
