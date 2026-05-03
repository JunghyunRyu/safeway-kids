# PT AI 차별화 — Requirement Brief

**문서 분류**: Phase 0 Intake / Requirement Brief
**작성일**: 2026-04-29
**작성자**: Claude Code (Opus 4.7)
**관련 워크스트림**: PetTracker V1.0 출시 준비 + 모두의 창업 2026 신청
**상위 spec**: [`artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`](2026-04-24-pt-quality-uplift-final-tech-spec.md)
**Active brief**: [`artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md`](2026-04-24-pettracker-careconnect-quality-uplift-plan.md)
**Decision precedence**: 사용자 결정(2026-04-29 "지금 당장 진행") > 본 Brief

---

## 0. 한 줄 요약

**PT V1.0에 AI 도메인 통합 5축(사고 신고 LLM 분류 / 산책 사진 자동 캡션 + Empathic 리포트 / GPS 이상 탐지 + 워커 자동 check-in / 후기·자기소개 LLM 모더레이션 / 사진 → 컨디션 추정 베타)을 도입하고, V1.1·V1.2에 추가 3축(자연어 매칭 / LLM 수의사 챗봇 / TTcare SDK 통합 협력)을 약속하여, 모두의 창업 2026 신청서 점수를 70~73점 → 80~86점으로 끌어올린다.**

---

## 1. Problem Statement

### 1-1. 사업 문제

PT(PetTracker)의 모두의 창업 2026 신청서는 4/29 시점 P0 5건 산출물 작성 완료 후 사전 채점 추정 70~73점 (5 페르소나 평균)으로 합격선(70) 분기점에 머물러 있다. 5/8 strong-go/no-go 게이트에서 트랙션·LOI 외부 작업이 미흡할 경우 **합격 가능성 30~50% 구간**에 갇힐 위험이 있다.

평가위원 5 페르소나 사전 채점 결과:
- P1 KISED 52.3 / P2 VC 40.0 / P3 산업 55.0 / P4 회계 66.7 / P5 1인 멘토 50.0 → 평균 52.8

P0 5건 효과 합산 후 추정 70~73 구간이지만, **혁신성·기술 차별화 영역의 추가 가산 여지 +5~10점**이 미확보 상태다. 특히 P3(산업 전문가, 전 도그메이트·와요 임원 가정)의 "5개 메이저 경쟁사 대비 PT만의 기술 차별화가 무엇인가?" 질문에 대한 답이 정형 매칭·사고 신고 자동화 수준에 머물러 있다.

### 1-2. 기술·시장 문제

5개 한국 메이저 경쟁사(도그메이트·와요·펫플래닛·에어댕냥이·펫피)는 모두 정형 매칭(거리·평점·가격)에 의존하며, 산책 사진/사고/후기/매칭 데이터에 AI 추론 레이어가 없다. 한국 펫 AI 생태계는 헬스케어 진단(TTcare/Pawzmedi) + 보험(Pawchi) 도메인에 집중되어 있고, **매칭·산책 segment는 white space**다.

글로벌은 Traini ($7.5M 투자, NVIDIA·Anthropic·Google·Meta 임원 LP), Mars Petcare(자체 AI 도입), Furbo(가정 AI 모니터링)가 펫 AI 시장을 활성화하고 있으며 2025년 VC $660M+ 투입된 high-momentum segment다.

### 1-3. 시간 제약

- **D-16 (5/15)**: 모두의 창업 2026 신청서 제출 마감
- **D-36 (6/4)**: PT V1.0 출시 타깃 (±3일 margin)
- **현재 잔여**: Milestone C-13/14 (모바일 통합) + D (사고 신고) + E (V1.1 트러스트) + F (통합 테스트) + G (Pre-launch QA + EAS Build)

신청서에서 약속한 AI 기능은 V1.0 출시 시점에 **실제 동작**해야 한다. 약속 ↔ 동작 불일치 시 면접 단계 P5(1인 창업가 멘토) "약속 = 신뢰 0" 페널티 발생.

---

## 2. Goals / Non-goals

### 2-1. Goals (이 프로젝트가 달성해야 하는 것)

**G-1**: 신청서 점수 추정 70~73점 → **80~86점** 진입 (5 페르소나 평균 +9~13점 회복)
**G-2**: V1.0 출시 시점(6/4)에 **AI 5축 동작 시연 가능** 상태 확보 (사고 신고 LLM / 자동 캡션 / GPS 이상 탐지 / 후기 모더레이션 / 사진 컨디션 추정)
**G-3**: V1.1·V1.2 약속 3축(자연어 매칭 / 수의사 챗봇 / TTcare 협력)을 신청서·면접 narrative에 명시
**G-4**: 자금 사용 계획 1억원 내에서 LLM API + AI 인프라 + TTcare 협력 PoC 비용 흡수 (총 변경 0원)
**G-5**: PT 출시 일정 +3 영업일 이내로 critical path 영향 제어 (margin ±3일 → +6일 한도)
**G-6**: 백엔드 145 passed + PT jest 15 passed + TS 0 errors **회귀 0** 유지

### 2-2. Non-goals (이 프로젝트가 하지 않는 것)

**NG-1**: 자체 AI 모델 학습·fine-tuning. Foundation Model API(Claude/GPT-4o/OpenAI Embedding) + Moderation API 호출만 사용. 직접 학습은 V2.0 TIPS 단계로 미룬다.
**NG-2**: 펫 wearable 하드웨어 통합 (Traini Cognitive Smart Collar 같은 형태). 카메라+GPS+텍스트만 입력으로 사용.
**NG-3**: TTcare SDK 실제 통합 (V1.0~V1.1). V1.2/V2.0 단계의 협력 탐색·PoC만 본 프로젝트 범위.
**NG-4**: 5개 한국 경쟁사와의 직접 기능 동등성 추구 (LIVE 영상·가정집 위탁·합격률 10% 등). PT는 lean + AI 차별화 segment에 집중.
**NG-5**: V1.1 자연어 매칭의 V1.0 prepone. V1.0 critical path 보호 우선.
**NG-6**: AI 기능의 다국어 지원 (영어). V1.0~V1.2는 한국어 한정.

---

## 3. 글로벌·한국 펫 AI 사례 7건 (인용 baseline)

> 신청서 §혁신성·§시장 차별화·면접 narrative에서 인용 가능한 검증된 사례.

| # | 사례 | 국가 | 펀딩·검증 | PT 적용 패턴 |
|---|---|---|---|---|
| 1 | **AI for Pet / TTcare** | 한국 (휴은아) | TIPS R&D + $500K, 한국 첫 AI 동물 의료기기 SW 승인 (2020-10), 1.4M 스캔 95% 정확도 | TTcare SDK 통합 협력 (V1.2/V2.0) — 헬스 진단 모듈 제3자 신뢰 흡수 |
| 2 | **Traini / PEBI** | 미국 실리콘밸리 (Arvin Sun, OpenAI·Chewy·ByteDance 출신) | $7.5M (2025-12, NVIDIA·Anthropic·Google·Meta 임원 + Banyan Tree·Silver Capital), 94% 감정 통역, 120 견종, 200만 마리 학습 | 사진+짖음 → 감정·컨디션 1줄 요약 (PT V1.1, wearable 없는 lean 버전) |
| 3 | **Mars Petcare** | 글로벌 펫 푸드 1위 | GREENIES Canine Dental Check (사진 1장 → 치아·잇몸), IAMS Poopscan (변 사진 → 소화 분석) | "사진 1장 → 결과 1줄" UX 패턴 (PT 산책 사진 자동 캡션) |
| 4 | **Wag** | 미국 | AI matchmaking 채택 후 2025-07 파산 → restructured 운영 | "AI 매칭만으로는 부족" 반례 → PT의 통합 narrative(매칭+사고+보험+신원) 강화 |
| 5 | **Furbo / Petcube** | 글로벌 펫 카메라 1·2위 | Furbo 360° + Furbo Nanny, 정상 패턴 학습 + 이탈 알림, 짖음 인식 | 산책 누적 데이터 → 활동량 이상 감지 (PT V1.2) |
| 6 | **Edge AI GPS 이상 탐지** | 글로벌 dog walking 트렌드 | sudden stop / 경로 이탈 / 페이스 급변 → 워커 in-app check-in 자동 발송, Edge-Computing Pods | PT V1.0 신규 차별화 축 E (5개 한국 경쟁사 미보유) |
| 7 | **AgentiveAIQ / DocsBot / Petriage** | 글로벌 수의사 LLM | RAG + Knowledge Graph 기반 수의사 챗봇, 증상 트리아지, 약품 dose 계산 | PT V1.1 산책 후 "다리 절어요" → 응급도+병원+자가케어 가이드 |

### 3-1. 한국 시장 white space (PT의 first-mover narrative)

| 도메인 | 한국 활성 사업자 | 한국 AI 적용 | PT 포지셔닝 |
|---|---|---|---|
| 헬스 진단 | AI for Pet (TTcare) | ✓ (TIPS+SaMD 인증) | 향후 통합 협력 (V1.2) |
| 펫 보험 | Pawchi (Series A $4.5M) | △ (보험 알고리즘) | 향후 가맹 협력 |
| 매칭·산책 (5개 메이저) | 도그메이트·와요·펫플래닛·에어댕냥이·펫피 | ❌ (정형 매칭만) | **PT first-mover** |
| 펫 행동 분석 | 일부 학술 (논문 단계) | △ | PT V1.1 사진 컨디션 |
| 수의사 챗봇 | 미발견 | ❌ | PT V1.1 |

---

## 4. 차별화 8축 (high-level, 디테일은 Final Tech Spec에서)

### 4-1. V1.0 약속 + 동작 (5축)

| 축 | 기능 요약 | 경쟁사 비교 | 추가 영업일 | LLM API 비용 (월) |
|---|---|---|---|---|
| **A. 사고 신고 LLM 분류** | 사고 텍스트+사진 → severity·type·action 자동 분류 → 119/병원/보호자 분기 | 5개 모두 사고 신고 자체 미지원 | +1.0d | <1만원 (호출 ~100건/월) |
| **B. 산책 사진 자동 캡션 + Empathic 리포트** | Vision LLM이 사진별 캡션 + 산책 종료 시 PDF/HTML 리포트 자동 생성 | 와요 LIVE 영상은 능동 시청 필요, 자동 리포트 5개사 미지원 | +2.0d | ~7천원 (Vision $0.005/사진×5사진×200산책) |
| **D. 후기·자기소개 LLM 모더레이션** | 펫시터 자기소개·후기 → 부적절 표현·가짜 후기·spam 자동 flag | 5개사 휴먼 검토 의존 | +1.0d | 무료 (OpenAI Moderation) 또는 ~5천원 (Haiku) |
| **E. GPS 이상 탐지 + 워커 자동 check-in** | sudden stop·경로 이탈·페이스 급변 → 워커에게 in-app check-in 자동 발송, 무응답 시 보호자 알림 | 5개 한국 메이저 미보유 (글로벌 dog walking 트렌드) | +1.5d | 0원 (자체 알고리즘, LLM 미사용) |
| **F. 사진 → 펫 컨디션 추정 (베타)** | 산책 사진 1장 → "활기·갈증·이상 행동" 1줄 요약 (베타 라벨) | 5개사 미지원 | V1.0 baseline에 +0.5d (B와 통합) | B에 통합 |

**V1.0 합계**: +5.0d ~ +5.5d. PT 출시 ±3d margin → **+5d 가산 후 ±2d 위험**. Milestone E(V1.1 트러스트) 일부 prepone으로 순증가 ~+3d 제어.

### 4-2. V1.1 약속 (3축, 출시 +30일)

| 축 | 기능 | 영감 |
|---|---|---|
| **C. 자연어 매칭 추천** | 보호자 자유 입력 + 펫시터 프로필·후기 → embedding cosine similarity ranking | 글로벌 LLM matching 트렌드 |
| **F+. 다중 모달 컨디션 추정** | 사진 + 짖음 사운드 + 행동 → 감정·컨디션 통합 분석 | Traini PEBI (lean wearable-less 버전) |
| **H. LLM 수의사 자가 진단 챗봇** | 산책 후 "다리를 절어요" → 응급도+병원+자가 케어 RAG | Petriage·AgentiveAIQ |

### 4-3. V1.2 / V2.0 약속 (협력)

| 축 | 기능 | 단계 |
|---|---|---|
| **G. TTcare SDK 통합 협력** | AI for Pet과 협력 탐색 → 산책 중 사진을 TTcare SDK에 통과시켜 헬스 인사이트 표시 | V1.2 PoC / V2.0 정식 통합 (TIPS 자금) |

---

## 5. 신청서 본문 변경안 (요약)

§혁신성에 다음 3문단 추가:

1. **글로벌 펫 AI 트렌드** — Traini $7.5M·Mars Petcare·Furbo + 2025년 $660M+ VC 투입
2. **한국 펫 AI 생태계 + matching white space** — TTcare·Pawchi 활성, 매칭 segment first-mover 기회
3. **PT V1.0 5축 동작 + V1.1·V1.2 약속** — 출시 시점에 실제 동작하는 5축 + 단계별 약속

§리스크에 추가:
- "Wag 파산은 AI 매칭만으로는 BEP 불가능 입증 → PT는 매칭+사고신고+보험+신원조회 통합 narrative"

§자금 사용 계획에 추가:
- LLM API 비용 6개월 200만원 + AI 인프라(Vector Store) 100만원 + TTcare 협력 PoC 150만원 = +450만원 (기존 클라우드 인프라 -450만원 재배분, 총 1억원 변경 0원)

(상세 narrative는 Final Tech Spec §15에서 작성)

---

## 6. 점수 회복 추정 재산출

| 페르소나 | 4/29 추정 (P0 5건) | AI 5축 V1.0 + 협력 narrative 후 | 변화 |
|---|---|---|---|
| P1 KISED | 60~63 | **63~68** | +3~5 |
| P2 VC | 47~50 | **52~58** | +5~8 |
| P3 산업 전문가 | 60~63 | **65~70** | +5~7 |
| P4 회계 | 68~70 | **70~72** | +2 |
| P5 1인 멘토 | 53~56 | **57~62** | +4~6 |
| **5 페르소나 평균** | **57~60 (P0만)** → **70~73 (P0 효과 합산)** | **80~86** | **+9~13** |

`*` P0 5건 산출물 효과는 이전 채점과 별개로 합산 적용. 본 Brief의 +9~13 효과는 4/29 baseline(70~73) 대비 추가 가산.

---

## 7. PT 출시 일정 영향

| Milestone | 기존 | AI 5축 V1.0 후 | 차이 |
|---|---|---|---|
| C-13/14 (잔여 모바일) | 2.5d | 2.5d | 0 |
| D (사고 신고 + AI 축 A) | 4.0d | 5.0d | +1.0 |
| AI 축 B 신규 (산책 사진 캡션 + 리포트) | 0 | 2.0d | +2.0 |
| AI 축 D 신규 (후기 모더레이션) | 0 | 1.0d | +1.0 |
| AI 축 E 신규 (GPS 이상 탐지) | 0 | 1.5d | +1.5 |
| Milestone E (V1.1 트러스트 → 일부 prepone) | 5.0d | 3.0d | -2.0 |
| F (통합 테스트) | 3.0d | 3.5d | +0.5 |
| G (Pre-launch QA + EAS) | 2.5d | 2.5d | 0 |
| **합계 잔여** | 17.0d | 21.0d | **+4.0d** |

**PT 출시 D-36(6/4 ±3d) → 출시 D-32(5/30) 달성 후 4d 버퍼 사용 → 6/3 출시 가능**. ±3d margin은 +1d로 축소되지만 출시 가능.

---

## 8. Assumption Register

| ID | 가정 | 근거 | 검증 방법 |
|---|---|---|---|
| AI-A1 | 사용자(1인 창업가)의 AI 구현 capacity가 일반 1인 대비 ~2배 | 사용자 self-report 4/29 ("AI 도메인 정도라면 구현하기 쉽다") | Phase 1 backend-dev review에서 영업일 추정 검증 |
| AI-A2 | LLM API 호출 평균 레이턴시 < 3초 (사고 신고 critical path) | Claude Haiku/Sonnet 일반 응답 1~3초 | Final Tech Spec 단계 fallback timeout 30s 설정 |
| AI-A3 | LLM API 비용 월 30만원 미만 (V1.0 사용자 50명, 산책 200건/월) | OpenAI/Anthropic 공개 가격표 + 사용량 추정 | 출시 후 1개월 실측, 200% 초과 시 Haiku tier로 강제 routing |
| AI-A4 | TTcare 협력 narrative는 zero-cost로도 평가위원 P3 가산 가능 | "협력 탐색"만 명시, 실 체결 약속 없음 | korea-fundraising-strategist Phase 1 review에서 검증 |
| AI-A5 | Vision LLM 사진 캡션 정확도가 환각 없이 보호자 친화적 | Claude 4.x / GPT-4o 일반 capability | Final Tech Spec 단계 펫시터 수정·삭제 권한 + disclaimer 명시 |
| AI-A6 | GPS 이상 탐지 알고리즘이 LLM 없이 구현 가능 (5분 이동 평균 + 표준편차) | 글로벌 Edge AI dog walking 트렌드 | backend-dev review에서 알고리즘 적정성 검증 |
| AI-A7 | 모더레이션 false positive < 5% (펫시터 정상 후기를 spam으로 오분류) | OpenAI Moderation API 일반 정확도 | 출시 후 1개월 실측, false positive >10% 시 운영자 큐로 fallback |
| AI-A8 | Milestone E V1.1 트러스트의 일부(즐겨찾기) prepone 시 V1.1 일정 지연 < 5d | 즐겨찾기는 단순 CRUD, 핵심 V1.1 트러스트(정기예약·산책 리포트)는 그대로 V1.1 | product-manager review에서 검증 |
| AI-A9 | LLM API 호출 실패율 < 0.5% (provider availability) | Claude/OpenAI SLA 99.5%+ | fallback (사고 신고 medium 분류·캡션 빈 문자열) 설계 |
| AI-A10 | 사용자가 "지금 당장 진행" = 6개 task 모두 (Phase 0~3) 진행 동의 | 사용자 4/29 명시 발화 | 본 Brief 작성 후 사용자 confirm 받기 (Phase 1 시작 직전) |

---

## 9. Open Questions

> 사용자 또는 reviewer 답변이 필요한 미해결 항목.

| ID | 질문 | 분류 | 답변 필요 시점 |
|---|---|---|---|
| Q-1 | LLM provider primary는 Anthropic Claude vs OpenAI vs 둘 다 듀얼? | 결정 | Final Tech Spec 작성 전 |
| Q-2 | 사고 신고 LLM 분류의 critical 분기(119 자동 발신)에서 휴먼 confirm 단계를 두는가? | 안전·법적 | korea-regulatory-counsel 자문 (D-15 변호사 5건 자문에 추가) |
| Q-3 | 산책 사진 자동 캡션의 "Empathic" tone은 어디까지 허용? (감정 표현·이모지 사용 등) | UX | product-manager review |
| Q-4 | TTcare 협력 outreach를 본 Brief 진행과 별도 트랙으로 즉시 시작할 것인지? | 사용자 결정 | 본 Brief 승인 직후 (Phase 1 시작 시) |
| Q-5 | GPS 이상 탐지 알고리즘은 백엔드 vs 모바일 클라이언트 어디서 실행? (배터리·레이턴시 trade-off) | 아키텍처 | backend-dev review |
| Q-6 | LLM API 비용이 자금계획 200만원 + 클라우드 -450만원 재배분 시, 출시 후 사용자 급증 시 cap 정책은? | 재무 | korea-tax-accounting-advisor 자문 (선택) |
| Q-7 | 펫시터 후기 모더레이션의 false positive(정상 후기 차단) 시 펫시터 이의 제기 절차는? | UX·법무 | product-manager + korea-regulatory-counsel |
| Q-8 | V1.1 자연어 매칭의 embedding store는 Redis Vector vs Pinecone vs PostgreSQL pgvector 어디로? | 아키텍처 | Final Tech Spec 단계 |
| Q-9 | 신청서 §혁신성에서 Traini·Mars 등 글로벌 사례를 인용 시 평가위원이 "외국 카피냐?" 반론을 제기할 가능성? | 신청서 narrative | korea-fundraising-strategist review |
| Q-10 | 사고 신고 자동 분류의 medium severity fallback에서 운영자 큐를 둘지(1인 창업가 = 사용자 본인 phone alert)? | 운영 | product-manager review |

---

## 10. Acceptance Criteria draft

### 10-1. 본 Brief의 acceptance (Phase 0 완료 조건)

- [x] Goals / Non-goals 명시
- [x] 글로벌·한국 사례 7건 인용 (출처 포함)
- [x] 8축 차별화 spec (V1.0 / V1.1 / V1.2 분리)
- [x] 신청서·자금·일정 영향 미리보기
- [x] Assumption Register 10건
- [x] Open Questions 10건
- [x] 본 Brief는 사용자 승인 또는 reviewer pass 후 Phase 1 진입

### 10-2. 본 프로젝트 전체 Acceptance Criteria draft (Final Tech Spec에서 확정)

**A-1**: V1.0 출시 시점(6/4 ±3d) AI 5축 동작
- A-1-1: 사고 신고 텍스트+사진 → severity·type·action JSON 응답 (95% 호출 < 5초)
- A-1-2: 산책 사진 업로드 시 자동 캡션 생성 (펫시터 수정 가능, disclaimer 표기)
- A-1-3: 산책 종료 시 보호자 리포트 PDF/HTML 자동 발송 (사진 N장 + 캡션 + GPS + 시간 + 거리)
- A-1-4: 펫시터 자기소개·후기 등록 시 모더레이션 자동 실행 (flag 시 운영자 큐)
- A-1-5: GPS 이상 탐지 발생 시 워커 push 알림 (60초 무응답 → 보호자 알림)
- A-1-6: 산책 사진 1장 → 컨디션 1줄 요약 (베타 라벨, 보호자 화면에 표시)

**A-2**: 백엔드 145 passed + PT jest 15 passed + TS 0 errors **회귀 0**

**A-3**: PT 출시 일정 6/4 ±3d (출시 D-36 → +4d 가산 후 D-32 달성 + 4d 버퍼)

**A-4**: 신청서 §혁신성·§리스크·§자금에 narrative 3문단·인용 7건·자금 재배분 표 inject

**A-5**: 자금 사용 계획 1억원 그대로 (LLM API 200만원 + AI 인프라 100만원 + TTcare PoC 150만원 = +450만원, 클라우드 -450만원 재배분)

**A-6**: 5 페르소나 사전 채점 평균 80~86점 (D-7 게이트 5/8 strong-go 진입)

**A-7**: V1.1 약속 3축의 spec 초안 작성 (출시 +30일 동작 보장)

**A-8**: TTcare 협력 outreach 1차 이메일 발송 (별도 트랙, Q-4 답변에 따라)

---

## 11. Code Impact Map (high-level)

> 디테일은 Final Tech Spec §17에서 확정.

### 11-1. 백엔드 신규/변경

```
backend/app/modules/ai/                       # 신규 모듈
├── __init__.py
├── llm_client.py                              # Claude/OpenAI wrapper + fallback + cost cap
├── incident_classifier.py                     # 축 A: 사고 신고 분류
├── photo_caption.py                           # 축 B: 산책 사진 캡션
├── walk_report_generator.py                   # 축 B: 산책 종료 리포트 (PDF/HTML)
├── moderation.py                              # 축 D: 후기·자기소개 모더레이션
├── gps_anomaly_detector.py                    # 축 E: GPS 이상 탐지 (LLM 미사용)
└── condition_estimator.py                     # 축 F (베타): 사진 컨디션 추정

backend/app/apps/pettracker/router.py          # +/pt/ai/* endpoint 6개
backend/app/apps/pettracker/models.py          # +PtAiInsight, PtIncidentClassification, PtModerationFlag
backend/migrations/versions/<new>.py           # 새 테이블 3개
```

### 11-2. 모바일 신규/변경

```
packages/core-mobile/hooks/
├── useAiCaption.ts                            # 축 B
├── useGpsAnomalyDetection.ts                  # 축 E (클라이언트 측 사전 필터)
└── useIncidentReport.ts                       # 축 A 통합

apps/pettracker/screens/
├── WalkScreen.tsx                             # 축 B 캡션 표시 + 수정 UI
├── WalkSummaryScreen.tsx                      # 축 B 산책 종료 리포트 (신규)
├── IncidentReportScreen.tsx                   # 축 A 통합 (Milestone D 기존)
├── WalkerProfileEditScreen.tsx                # 축 D 모더레이션 결과 표시
└── OwnerWalkTrackingScreen.tsx                # 축 E GPS 이상 알림 표시
```

### 11-3. 의존 추가

```
backend/requirements.txt:
+ anthropic >= 0.40.0          # Claude SDK
+ openai >= 1.40.0             # OpenAI SDK (Moderation API + fallback)
+ tenacity >= 9.0.0            # retry policy

mobile/package.json:
(추가 없음 - 백엔드 endpoint 호출만)
```

### 11-4. 환경 변수 신규

```
ANTHROPIC_API_KEY              # Claude 호출
OPENAI_API_KEY                 # OpenAI Moderation + fallback
PT_LLM_PRIMARY_PROVIDER        # 'anthropic' | 'openai'
PT_LLM_MONTHLY_COST_CAP_KRW    # 월 비용 cap (default 3,000,000)
PT_LLM_FALLBACK_TIMEOUT_MS     # default 30000
```

---

## 12. Phase 1 Reviewer 분배

| Reviewer | 검토 영역 | 핵심 질문 |
|---|---|---|
| **backend-dev** | 백엔드 endpoint·LLM client·fallback·비용 cap·Milestone D~G 영향 | 영업일 추정 정확도 / 알고리즘 선택 / 회귀 0 가능성 |
| **product-manager** | UX·V1.0/V1.1 segment·약속과 동작 정합·환각 처리 | 보호자/펫시터 UX 결함 / Empathic tone 적정성 / 약속 실현 가능성 |
| **korea-fundraising-strategist** | 신청서 점수·해외 사례 인용·TTcare narrative·면접 예상 질문 | 외국 카피 반론 가능성 / TTcare zero-cost narrative 적정성 / 점수 회복 추정 합리성 |

(선택) **korea-regulatory-counsel**: Q-2 사고 신고 자동 분류의 119 자동 발신 법리. Phase 1 본 review와 별도 변호사 자문 5건에 추가.

---

## 13. Decision Required from User (Phase 1 진입 직전)

본 Brief 작성 직후 사용자 확인 필요 항목:

| # | 결정 사항 | 옵션 | 권장 |
|---|---|---|---|
| **D-1** | LLM provider primary | (a) Anthropic Claude / (b) OpenAI / (c) 둘 다 듀얼 + auto-failover | (c) 듀얼 (Q-1 답변) |
| **D-2** | TTcare 협력 outreach 별도 트랙 | (a) 즉시 시작 (Phase 1과 병렬) / (b) Phase 3 완료 후 / (c) 신청서 제출 후 | (a) 즉시 (Q-4 답변) |
| **D-3** | 사고 신고 119 자동 발신 휴먼 confirm | (a) 항상 휴먼 confirm 1단계 / (b) critical만 자동 / (c) 모두 자동 | (a) 항상 휴먼 confirm (변호사 자문 회수까지 안전 디폴트) |
| **D-4** | V1.0 산책 사진 컨디션 추정(축 F)을 V1.0에 포함? | (a) V1.0 베타 라벨 포함 / (b) V1.1로 미룸 | (a) V1.0 베타 (B와 통합 +0.5d) |
| **D-5** | 본 Brief 승인 후 즉시 Phase 1 시작? | (a) 예 / (b) 사용자 추가 검토 후 | (a) 예 (사용자 "지금 당장 진행" 발화 기준) |

---

## 14. Verification of this Brief

| 항목 | 결과 |
|---|---|
| CLAUDE.md Phase 0 산출물 6개 (Brief + Goals/Non-goals + Assumption + Open Questions + Acceptance + Code Impact) | ✓ |
| 글로벌·한국 사례 7건 인용 (실증 검색 결과) | ✓ |
| 차별화 8축 V1.0/V1.1/V1.2 분리 | ✓ |
| 신청서·자금·일정 영향 미리보기 | ✓ |
| 점수 회복 추정 5 페르소나별 + 평균 | ✓ |
| Reviewer 분배 plan | ✓ |
| 사용자 결정 필요 항목 (D-1~D-5) | ✓ |
| `2026-04-24-pt-quality-uplift-final-tech-spec.md`와 정합 (Milestone D~G) | △ Final Tech Spec 단계에서 정합 검증 |

---

## 15. 다음 단계 (Phase 1 진입)

1. **Phase 1 Independent Review 3개 병렬 호출** (Task #2~#4):
   - `backend-dev` — 백엔드 영향
   - `product-manager` — 제품·UX 영향
   - `korea-fundraising-strategist` — 신청서·점수 영향
2. **Phase 2 Consensus Matrix** — 3 reviewer 결과 통합 → `artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md`
3. **Phase 3 Final Tech Spec** — `artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md` (18 섹션)
4. **사용자 결정 게이트** — D-1~D-5 답변 후 Phase 4 Todo Plan 작성

---

## 16. Metadata

- **본 Brief 버전**: v1.0 (Phase 0 완료)
- **상위 워크스트림 정합**: PT V1.0 출시 + 모두의 창업 2026 신청
- **이전 산출물 연계**:
  - `artifacts/business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md` (5개 경쟁사 14축)
  - `artifacts/business/fundraising/2026-04-27-modoo-startup-pt-rubric-review.md` (5 페르소나 채점)
  - `artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md` (PT V1.0 Tech Spec)
- **다음 산출물**:
  - `artifacts/reviews/2026-04-29-pt-ai-differentiation-{backend,product,fundraising}-review.md`
  - `artifacts/reviews/2026-04-29-pt-ai-differentiation-consensus.md`
  - `artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md`
