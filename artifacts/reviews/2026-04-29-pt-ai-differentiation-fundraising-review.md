# PT AI 차별화 — Phase 1 Independent Review (korea-fundraising-strategist)

**문서 분류**: Phase 1 Independent Review (모두의 창업 + VC 관점)
**검토 대상**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`](../specs/2026-04-29-pt-ai-differentiation-brief.md)
**검토일**: 2026-04-30
**Reviewer**: korea-fundraising-strategist agent (Claude Code)
**Confidence Score**: **7/10** (전제 조건 해소 시 8~8.5/10)

---

## 1. Requirement Restatement + 5 페르소나·평가표 매핑

PT 신청서가 P0 5건 효과 합산 후 추정 70~73점(합격선 분기점)에 머물고 있으며, AI 5축을 V1.0에 추가하고 V1.1·V1.2 3축을 약속함으로써 5 페르소나 평균 +9~13점(70~73 → 80~86) 회복 목표.

| 페르소나 | 평가 5축 매핑 | AI 차별화 기여 영역 |
|---|---|---|
| P1 KISED | 필요성·혁신성·시장성·실현가능성·팀역량 | 혁신성(5개사 AI 미보유) + 실현가능성(출시 동작) |
| P2 VC | Traction·Market·Differentiation·Defensibility | Tech Differentiation only |
| P3 산업 전문가 | 혁신성·시장성 | 한국 매칭 segment white space |
| P4 회계 | 실현가능성·자금 | LLM API 비용 재배분 정합 |
| P5 1인 멘토 | 팀역량·실현가능성 | V1.0 출시 동작 보장 |

---

## 2. Missing Fundraising Requirements

**MR-1**: 면접 데모 대체 시나리오 미존재. 모두의 창업 1R 결과 ~7월 → 면접 ~9월 → V1.0 출시(6/4) 이미 완료 상태이나, **1R 서면 평가**(5/15 제출 텍스트)는 출시 전이므로 "AI 5축 동작 스크린샷 또는 이미지 슬롯 활용" 서면 증빙 전략 필요.

**MR-2**: PIPA·위치정보보호법 정합 검토 미포함. Vision LLM 사진 처리 + GPS 이상 탐지 + 후기 모더레이션 = 개인정보·위치정보 AI 처리. P1(KISED) 실현가능성 축에서 간접 평가.

**MR-3**: 수수료 모델 변경 가능성 미반영. AI 프리미엄 수수료 vs 플랫폼 통합 vs 구독. P2(VC) ARPU 질문 답변 근거 부재.

**MR-4**: LLM API 비용 급증 안전망 신청서 본문 미서술. P4가 "초과 시 어떻게?" 질문 시 답변 부재.

**MR-5**: 글로벌 사례 인용 1차 출처 미명시. "$660M+ 글로벌 펫 AI 투자" 출처 없음. P1이 "출처가 뭐냐?" 시 답변 불가.

**MR-6**: K-Startup 후속 신청 정합 미확인. 모두의 창업 narrative가 K-Startup 초기창업패키지·TIPS·Series A 재사용 가능한지 명시 없음.

---

## 3. Conflicts with Existing Fundraising Artifacts

**CF-1**: 경쟁사 매트릭스(competitor-matrix)에 PT의 AI 기능이 행으로 표기되지 않음. 신청서에 두 자료 동시 인용 시 "AI 차별화를 표에서는 안 보여주고 서술만 한다" 이상한 구조.

**CF-2**: 자금 계획표(budget-guide-summary §9)와 Brief §5 +450만원 재배분 출처 불명확. 서버 인프라 800만 → 어디서 빠지는지 미특정.

**CF-3**: LOI 5건 이메일 본문에 AI narrative 부재. 수의사 LOI에 "산책 응급" 자문이 축 A·F와 직결되나 연결 없음.

**CF-4**: rubric-review §Top 10 약점 6번 해소 후 매트릭스에 AI 행 추가 안 됨.

---

## 4. Fundraising Risks (Top 5)

**R-1 (HIGH, -10~15점)** — V1.0 출시 시점 AI 미동작 리스크: 1R 서면 평가는 5/15 제출 텍스트만으로 이루어짐. 신청서 서술 ↔ 실 출시 시점 미동작 시 2R·3R 신뢰 손실. 가정 AI-A1(2배 capacity) 틀릴 경우 전체 narrative 붕괴.

**R-2 (HIGH, -5~8점)** — TTcare zero-cost narrative false impression: AI-A4 가정 낙관적. P3는 산업 현실 인지. TTcare는 경쟁적 사업자(공개 SDK 없음). "협력 탐색" 무접촉 명시 시 P1·P3가 "부실 계획" 판정 가능.

**R-3 (MEDIUM, -3~6점)** — 외국 카피 반론: Traini·Mars·Furbo 인용 시 P3 "외국 따라 하기?" 반론 확률 50~60%(P3가 Traini 알 경우). 방어 plan 필요.

**R-4 (MEDIUM, -2~4점)** — 자금 계획 재배분 검증: +450만원 재배분 원 항목 미특정. P4 "비정합" 감점 가능.

**R-5 (MEDIUM, -2~4점)** — 글로벌 $660M+ 출처 미확보: 시장 출처 산출물에도 없음. 한국 3개 출처는 확보, 글로벌은 별도 확보 필요.

---

## 5. Alternative Narrative Designs

### 옵션 A (현재 Brief: 글로벌 → 한국 → PT 3문단)
- 강점: 논리적 흐름
- 약점: P3 "외국 카피" 반론 노출 극대화

### 옵션 B (한국 first — 권장)
- 흐름: "한국 5개사 AI 미보유 → PT first-mover → 글로벌 동종이 검증한 방향"
- 글로벌은 "참조 사례"로만 활용
- 분량: 2문단 + 매트릭스 AI 행 추가
- **권고: 채택**

### 옵션 C (TTcare 완전 삭제)
- "국내 펫 헬스케어 AI 사업자와의 기술 협력 탐색"으로 추상화
- R-2 완전 제거
- P3 가산 -1~2점 손실
- **중간 옵션**: TTcare 1통 접촉 후 "연락 취한 상태"로 명시

### 옵션 D (Wag 반례 §리스크 활용 — 반드시 포함)
- "Wag 파산(2025-07) 후 restructured 운영" 정확 표기
- AI 매칭만으로 BEP 불가 입증 → PT 통합 narrative 강화
- §리스크 섹션 1문단 100~150자

---

## 6. Score Validation Concerns

| 페르소나 | Brief 추정 | 검증 결과 |
|---|---|---|
| P1 KISED | +3~5 | **PARTIALLY VALIDATED** — 혁신성 가산 합리적, 단 실현가능성 증빙 없으면 상쇄 가능 |
| P2 VC | +5~8 | **OVER-ESTIMATED** — VC 핵심 감점 = Traction 0.5/5(실 사용자 0). AI는 Tech Diff 1~2점만. 실제 +2~4점이 상한 |
| P3 산업 | +5~7 | **CONDITIONALLY VALIDATED** — 가산 60~70% 확률. P3가 Petdoc·핏펫·어웨이 알 경우 V1.1 narrative 약화 |
| P4 회계 | +2 | **VALIDATED** — 단 CF-2 해소 전제 |
| P5 1인 멘토 | +4~6 | **UNDER-ESTIMATED 가능성** — 출시 일정 +4d worst-case 시 P5 우려 ↑. 6/7 엄수 커밋 필요 |

**총평**: 평균 +9~13점 추정 → 현실적 +6~10점 (76~83 구간).

---

## 7. Confidence Score

**5/15 제출 합격 가능성에 미치는 영향: 7/10**

긍정 요인 (7점):
- 한국 매칭 segment AI first-mover narrative 강함
- 5개사 모두 AI 미보유 사실 검증됨
- API 기반 구현(자체 학습 X) → 실현가능성 ↑

부정 요인 (-3점):
- TTcare false impression (R-2)
- 글로벌 수치 출처 미확보 (R-5)
- V1.0 일정 +4d 위험 (R-1)

전제 해소 시: 8~8.5/10

---

## 8. Top 5 Actionable Findings + 면접 질문 5개

**AF-1 (P0)**: TTcare narrative "접촉 선행 또는 삭제" 즉시 결정 (5/8 게이트 전).
- 옵션 1: TTcare 이메일 1통 발송 → "2026.5 협력 타당성 검토 연락" 명시
- 옵션 2: 삭제 → "국내 펫 헬스케어 AI 사업자와 V1.2 단계에서 탐색"

**AF-2 (P0, D-16 내)**: 글로벌 $660M+ 1차 출처 확보. PitchBook / CB Insights / Crunchbase / AgFunder 2025 Pettech VC report. 확보 불가 시 수치 삭제 → 확인된 사례만 (TTcare TIPS, Traini $7.5M).

**AF-3 (P0)**: 경쟁사 매트릭스에 "AI 기능 보유 여부" 행 즉시 추가. 도그메이트❌ / 와요❌ / 펫플래닛❌ / 에어댕냥이❌ / 펫피❌ / PT✓(5축). 이미지 슬롯 2번 갱신.

**AF-4 (P1)**: 자금 계획 재배분 매핑 명시. "서버 인프라 800만 → 350만, LLM API 200 + AI 인프라 100 = 서버 인프라 내 재분류 / TTcare PoC 150 = 외주용역비 4,500만 내 흡수"

**AF-5 (P1)**: LOI 5건 AI 자문 영역 inject. LOI #1(수의사) "사진 컨디션 AI 임상 적합성", LOI #4(UX) "AI 캡션 수정 UI" 1~2줄 추가.

### 면접 예상 질문 TOP 5 (AI 차별화 도입 후 신규)

**Q-I-1**: "AI 기능이 틀린 결과를 냈을 때 책임은 누구에게?"
> "AI 분류는 보조 정보. 사고 신고 최종 판단은 펫시터·보호자. 자동 119 발신 없음, AI 제안 → 사람 확정. 모든 AI 결과물에 'AI 보조 의견' 라벨 + 수정·삭제 권한."

**Q-I-2**: "Traini·TTcare가 한국 진입하면?"
> "Traini wearable / PT 카메라+텍스트 = 진입 방식 차이. TTcare 헬스 진단 / PT 매칭·산책 = 수직 관계. PT는 출시 6개월 후부터 한국 산책 매칭 데이터 자산(사고·GPS·패턴) 축적 → 글로벌 진입 이전 데이터 해자."

**Q-I-3**: "AI API 비용이 예상보다 많이 나오면?"
> "월 한도 200만원. 초과 시 Claude Haiku·GPT-4o mini 저비용 tier 자동 routing. cost cap 시스템 내재화. 사용자 50명 기준 월 30만원 미만 추정. 출시 3개월 실측 후 재산정."

**Q-I-4**: "도그메이트가 인수 후 AI 도입 가능성은?"
> "도그메이트 인수 후 오프라인 시설 하이브리드 집중 → AI 우선순위 낮음. 와요는 LIVE 영상 인프라 비용 높음. 단 진입 가능성 인정. PT 출시 직후 6개월 데이터 축적이 해자."

**Q-I-5**: "1인 창업가가 AI 5축까지 정말 출시 기간 내 가능?"
> "자체 학습 없이 Claude API + OpenAI Moderation API 호출만. 가장 복잡한 사고 신고 분류 +1일, 사진 캡션+리포트 +2일, 나머지 3축 +2.5일. 총 +5.5d. 출시 6/3~6/4. 신청서 제출 시점(5/15) 핵심 3축 이상 개발 완료."

---

## 9. 한계 (Disclaimer)

1. 모두의 창업 2026 공고 실제 평가표 가중치 비공개 — 5 페르소나 모델 추정
2. TTcare(AI for Pet) 협력 가능성·SDK 공개 여부 미확인
3. 글로벌 $660M+ 1차 출처 본 review 시점 미확인
4. 다른 reviewer(BE·PM) 의견 반영 X (독립 review)
5. P2 VC 점수 추정은 본 reviewer 판단 — 실제 VC는 펀드 thesis 따라 달라짐
