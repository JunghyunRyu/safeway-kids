# PT AI 차별화 — Phase 1 Independent Review (product-manager)

**문서 분류**: Phase 1 Independent Review (product-manager 관점)
**검토 대상**: [`artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`](../specs/2026-04-29-pt-ai-differentiation-brief.md)
**검토일**: 2026-04-30
**Reviewer**: product-manager agent (Claude Code)
**Confidence Score**: **6/10** (3축 집중 시 8/10)

---

## 1. Requirement Restatement

PetTracker V1.0은 2026-06-04 출시 예정인 한국 반려동물 산책 매칭 앱이다. 현재 모두의 창업 2026 신청서 점수가 70~73점 구간(합격선 70 분기점)에 머물러 있으며, 기술 차별화 항목의 추가 가산 여지가 미확보 상태다. 본 Brief는 AI 5축을 V1.0에 추가하고 V1.1·V1.2 3축을 약속함으로써 신청서 점수를 80~86점으로 끌어올리는 것을 목표로 한다.

### 사용자 페르소나별 가치 매핑

| 페르소나 | 핵심 불안 | AI 8축 중 직접 가치 축 |
|---|---|---|
| 보호자 (자주 외출형, 주 3회+) | "내 강아지가 지금 뭐하는지 실시간으로 알고 싶다" + "사고 나면 어떻게 되지?" | 축 B(자동 캡션·리포트), 축 E(GPS 이상 탐지), 축 F(컨디션 추정) |
| 보호자 (가끔 외출형, 월 1~2회) | "처음 쓰는 서비스인데 믿을 수 있나?" | 축 D(후기 모더레이션 신뢰 보증), 축 A(사고 신고 자동화) |
| 펫시터 (전업) | "수입 안정성 + 사고 났을 때 나도 보호받는가?" | 축 A(사고 신고 자동 기록 = 펫시터 면책 증거), 축 D(내 프로필·후기가 공정하게 관리되는가) |
| 펫시터 (부업) | "간편하게 할 수 있는가? 복잡한 게 없어야 한다" | 축 B(사진 올리면 자동 캡션 = 내가 글 안 써도 됨), 축 D(부적절 후기 자동 필터) |

---

## 2. Missing Requirements

**MR-1**: 펫시터의 AI 캡션 수정 흐름이 명시되지 않았다. WalkScreen.tsx 현재 구조와 어떻게 통합되는지 핵심 UX gap.
**MR-2**: 보호자가 AI 캡션·컨디션 결과를 "수신하는 화면"이 정의되지 않았다. OwnerWalkTrackingScreen이 미구현(C-14)인 상태.
**MR-3**: 보호자 리포트 delivery 방식 미결정 (push 알림 in-app vs 이메일 vs 카카오 메시지). 한국 사용자는 카카오채널 알림이 표준.
**MR-4**: GPS 이상 탐지의 "정상 판단 기준"(임계값) 미정의. 정지 지속 시간, 이탈 반경, 페이스 변화 표준편차.
**MR-5**: 산책 종료 후 리포트 생성 실패 시 UX 부재. "리포트 생성 중" / "생성 실패" 상태 표시.
**MR-6**: 모더레이션 결과 펫시터 고지 + 이의 신청 UI 부재.

---

## 3. Conflicts with Existing UX

**CF-1**: WalkScreen.tsx 현재 `state === 'ended'` 흐름과 AI 캡션 삽입 시점 충돌. WalkSummaryScreen 신규 추가 필요하나 routing 관계 미명시.

**CF-2**: 사진 업로드 flow와 AI 캡션 타이밍 경합. 현재 단일 사진 상태(`photoUri`, `photoDownloadUrl`)이나 AI 5축은 다수 사진 + 다수 캡션을 요구. State 구조 전면 재설계 필요. C-10 완료 후 추가 수정 = 회귀 리스크.

**CF-3**: WalkerProfileScreen에 자기소개 텍스트 필드 부재. 모더레이션 대상이 입력될 화면 자체가 없음.

---

## 4. Product Risks (Top 5)

**RISK-1 (HIGH) — 약속-동작 불일치**: +4d 추정이 +6~8d로 늘어날 위험. WalkScreen state 재설계 + C-14 미완 + AI 축 B/E 삽입이 겹치면 margin 완전 소진. 면접 단계 "약속 = 신뢰 0" 페널티.

**RISK-2 (HIGH) — Vision LLM 환각**: 배경 다른 동물·낮은 화질에서 "다른 개가 공격적으로 달려들었어요" 류 false-alarm 가능. 보호자가 사실로 받아들이면 펫시터 분쟁. AI-A5 가정만으로는 부족. 초기 10~20명 중 1건 false-alarm → SNS 확산 → reputation 훼손.

**RISK-3 (HIGH) — 모더레이션 false positive**: OpenAI Moderation API 한국어 정확도 영어 대비 낮음. "귀엽다 미쳤다" 류 긍정적 비속어 오분류. 1인 운영에서 이의 처리 큐 처리 여력 없음 → 펫시터 공급 이탈 → 보호자 매칭 성사율 하락.

**RISK-4 (MEDIUM) — GPS false alarm**: 터널·지하철역·대형 건물 음영 = 일상적 GPS 손실. "sudden stop" 오탐 → 이어폰·운전 중 무응답 → 보호자 긴급 알림 → 시스템 신뢰 하락. false alarm 2회 이상 시 NPS -20.

**RISK-5 (MEDIUM) — V1.1 +30일 약속 미달성**: V1.0 5축 + 출시 QA + 초기 운영 안정화 동시 진행되는 시기에 V1.1 3축 추가 구현은 1인 창업가 현실에서 매우 어려움. 신청서 명시 시 면접 검증 대상.

---

## 5. Alternative Product Designs

### Option A (권장): V1.0을 3축으로 축소

**V1.0**: 축 A(사고 신고 LLM 분류) + 축 B(사진 자동 캡션, 단일 사진·수정 가능) + 축 D(후기 모더레이션)
**V1.1 (+45일)**: 축 E(GPS 이상 탐지) + 축 F(컨디션 추정) — 실 데이터 누적 후 임계값 튜닝

근거: A는 Milestone D 기존, B 단일 사진 = 최소 충돌, D는 등록 시점 only(실시간 dependency 없음). E·F는 실 데이터 기반 튜닝이 더 품질 높음.

일정 영향: +4d → +2d. Margin ±3d 복구.

### Option B: 5축 모두 V1.0 + "실험적" 배너

각 AI 기능에 "AI 도우미 (실험적)" 배너. 사용자 기대치 낮춤. 단, 한국 보호자 UX는 카카오 수준 완성도 기대.

### Option C: V1.0 축 A만, 나머지 V1.1~V1.3 분산

가장 보수적. 점수 회복폭 +5~7점 그칠 수 있음.

### ICE 우선순위 재배열

| 축 | Impact | Confidence | Ease | ICE | V1.0 권장 |
|---|---|---|---|---|---|
| A. 사고 신고 LLM 분류 | 9 | 8 | 8 | 25 | **예 (필수)** |
| B. 사진 자동 캡션 (단일) | 8 | 7 | 6 | 21 | **예 (단일 사진 scope)** |
| D. 후기 모더레이션 | 7 | 8 | 9 | 24 | **예** |
| E. GPS 이상 탐지 | 8 | 5 | 5 | 18 | 아니오 → V1.1 |
| F. 컨디션 추정 베타 | 6 | 5 | 7 | 18 | 아니오 → V1.1 |
| C. 자연어 매칭 | 7 | 6 | 4 | 17 | V1.1 |
| H. 수의사 챗봇 | 7 | 5 | 3 | 15 | V1.2 |
| G. TTcare 통합 | 6 | 3 | 2 | 11 | V2.0 |

---

## 6. Testing Concerns

**TC-1**: AI 캡션 환각 테스트 전략 부재. 20장 산책 사진 다양 조도·배경·견종 → false/misleading 비율 측정. Pass 기준 미정.
**TC-2**: 모더레이션 한국어 검증 절차 없음. 50개 한국어 후기 샘플 (정상 30 + 비정상 20) → false positive < 5% (AI-A7) 실측 검증 계획 부재.
**TC-3**: GPS 이상 탐지 시뮬레이션 환경 없음. 실 산책 데이터 없이 false alarm 율 검증 불가 → V1.1 이연 추가 근거.
**TC-4**: OwnerWalkTrackingScreen(C-14) 미구현 상태에서 AI UI 설계 → C-14 완료 후 충돌 위험.
**TC-5**: 보호자 10명 사용자 테스트 계획 없음. NPS 측정 정성 증거 부재.

---

## 7. Confidence Score

**AI 차별화가 V1.0 출시 후 사용자 신뢰·NPS에 미치는 영향: 6/10**

근거 (FACT):
- 축 A는 5개 경쟁사 미보유 + 법적 의무 연계 = 단독으로도 차별화 narrative 가능
- 축 B는 보호자(자주 외출형) 명확한 가치 ("산책 리포트 자동 수신"). 단 캡션 품질 보증 없으면 역효과
- 축 D는 인프라 성격 (직접 체감 가치 약함, 신뢰 기반 형성)

근거 (ASSUMPTION):
- 8축 모두 V1.0 = 일정 리스크 → 품질 낮은 출시 가능성. "있는데 오작동" > "없음" 해로움
- 3축(A·B·D) 집중 시 confidence 8/10

---

## 8. Top 5 Actionable Findings

**F-1 (CRITICAL)**: V1.0 AI 축 5개 → 3개로 축소 (A·B·D만). 축 E·F는 V1.1(+45일)로 이연. 신청서 narrative는 "V1.0 3축 동작, V1.1 +6주 2축 추가"로 재표현.

**F-2 (HIGH)**: AI 캡션 UX 3-layer 안전장치. (1) Disclaimer "AI 생성 - 펫시터 수정 가능", (2) 펫시터 1-tap 편집, (3) 보호자 부적절 신고 버튼. False alarm 1건이 SNS 확산 = 신뢰 훼손.

**F-3 (HIGH)**: 모더레이션 이의 제기 자동화 설계. 자동 flag → "수정 제안 + 자동 재검토" → 수정 후에도 flag 시에만 운영자 큐. 1인 운영 30분/일 한도.

**F-4 (MEDIUM)**: Empathic tone 기준 명문화. 한국 보호자 UX 권장: 1인칭 주어("뛰었어요" 아닌 "공원에서 신나게 뛰었습니다"), 이모지 max 1개/캡션, 감탄사 금지("와!" X), 1~2문장 max. "잔디밭에서 활발하게 뛰었어요"가 상한선.

**F-5 (MEDIUM)**: V1.1 "+30일" → "+45~60일"로 수정. 1인 창업가 현실 + 면접 검증 회피. 신청서 점수 동일 가산 효과.

---

## Relevant File Paths

- `artifacts/specs/2026-04-29-pt-ai-differentiation-brief.md`
- `artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`
- `artifacts/business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md`
- `apps/pettracker/mobile/src/screens/walker/WalkScreen.tsx`
- `apps/pettracker/mobile/src/screens/walker/WalkerProfileScreen.tsx`
