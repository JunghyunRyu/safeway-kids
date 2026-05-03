# PT AI 차별화 — Phase 4 Todo Plan (옵션 A: 신청서 우선)

**문서 분류**: Phase 4 Todo Plan
**작성일**: 2026-04-30
**기반**:
- Final Tech Spec [`2026-04-29-pt-ai-differentiation-final-tech-spec.md`](../specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md)
- 차별화·Moat·BM 보강 [`2026-04-30-pt-differentiation-moat-bm-deepening.md`](../business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md)
- 사용자 결정 (2026-04-30): **옵션 A 신청서 우선** + D-1=5축 / D-2=추상화 / D-7=출처 삭제

**전략**: Track 1 (4/30~5/15 신청서) 우선 종결 → Track 2 (5/16~6/9 AI 구현) 본격 시작.

---

## 일정 개요

```
4/30 ──── 5/8 ──── 5/15 ──── 5/30 ──── 6/9
 │ Track 1: 신청서 │ Track 2: AI 5축 + Milestone D~G
 │  (외부 작업·    │  (백엔드 + 모바일 + 통합 테스트
 │   본문·게이트)  │   + Pre-launch QA + EAS)
 │                 │
 D-15            D-7           V1.0 출시
                 (게이트)         (±2d)
```

---

## Track 1 — 신청서 트랙 (4/30 ~ 5/15, D-15)

### T1.1 — 외부 작업 critical path (4/30 = D-15, 5.5h)

| ID | 작업 | 산출물 | 담당 |
|---|---|---|---|
| T1.1-1 | 랜딩 페이지 + 가입 폼 활성화 (O17) | https://pettracker.kr 가입 폼 동작 + 카운터 표시 | 사용자 |
| T1.1-2 | 베타 인센티브 N·M 값 결정 (O18) | 사전 가입 N% 할인 + M개월 무료 (예: 30%/3개월) | 사용자 |
| T1.1-3 | 1차 개인정보처리방침 Beta 게시 (O24) | 랜딩 footer 링크 + Beta 라벨 | 사용자 |
| T1.1-4 | LOI #1·#3·#4·#5 발송 (수의사·이의림·UX·선배) | 5명 이메일 발송 + 회신 추적 시작 | 사용자 |
| T1.1-5 | 카톡 인맥 50명 명단 + 1:1 발송 (O20) | 50명 발송 완료 표 | 사용자 |
| T1.1-6 | 인스타·X·페이스북 활성화 + 첫 캡션 (O21) | 3 채널 첫 게시물 | 사용자 |

### T1.2 — AI 차별화 신청서 자료 통합 (4/30 ~ 5/3, ~3 영업일, Claude)

| ID | 작업 | 산출물 |
|---|---|---|
| T1.2-1 | competitor-matrix 산출물에 AI 행 추가 (EXT-3) | `2026-04-29-modoo-startup-pt-competitor-matrix.md` 갱신 — 도그메이트❌ / 와요❌ / 펫플래닛❌ / 에어댕냥이❌ / 펫피❌ / PT✓(5축) |
| T1.2-2 | 자금 계획 재배분 매핑 (EXT-4) | `budget-guide-summary.md` 갱신 — 서버 800→350, LLM 200, AI 인프라 100 |
| T1.2-3 | LOI 5건 AI 자문 영역 inject (EXT-5) | `loi-templates.md` 갱신 — #1 수의사 "사진 컨디션 임상 적합성" / #4 UX "AI 캡션 수정 UI" |

### T1.3 — 5/2~5/7 운영 (외부 작업 분산)

| ID | 작업 | 마감 |
|---|---|---|
| T1.3-1 | 펫마케팅 LOI 발송 (인맥 발굴 후) | 5/2 |
| T1.3-2 | 강사모·반려동물사랑 카페 등업 후 게시 + LOI 1차 리마인더 | 5/5 |
| T1.3-3 | 이의림 변호사 미팅 (PT LOI 직접 회수 + Q3 자문) | 5/7 |

### T1.4 — 5/8 D-7 strong-go/no-go 게이트 ⚠️

| ID | 점검 항목 | 기준 |
|---|---|---|
| T1.4-1 | 사전 가입자 수 | **30명 이상** (strong-go) / 미달 시 K-Startup 초기창업패키지(7월) 전환 검토 |
| T1.4-2 | LOI 회수 건수 | **3건 이상** |
| T1.4-3 | EXT-6 변호사 자문 회신 (보험사 가맹 가능성) | 보험 narrative 신청서 inject 가능 여부 결정 |
| T1.4-4 | T1.2 AI 차별화 자료 통합 완료 확인 | competitor-matrix·budget·LOI 갱신 완료 |

### T1.5 — 5/9 신청서 본문 v1 작성

| ID | 작업 | 입력 | 산출물 |
|---|---|---|---|
| T1.5-1 | `korean-grant-application-writer` 호출 | 10건 inject 매핑 (Final Tech Spec §18.2 + 보강 §1-4·§2-4·§3-5) + P0 5건 산출물 + 보강 산출물 + Phase 1·2·3 결과 | 신청서 본문 v1 — `artifacts/business/fundraising/2026-05-09-modoo-startup-pt-application-v1.md` |
| T1.5-2 | LOI 회수 마감 20:00 | 5명 중 3명 이상 회수 확보 | 회수 LOI 5건 또는 3건 이상 |

### T1.6 — 5/10 1차 채점 (목표 70점)

| ID | 작업 | 산출물 |
|---|---|---|
| T1.6-1 | `evaluator-rubric-reviewer` 호출 (5 페르소나) | 사전 채점 보고서 v1 |
| T1.6-2 | 약점 Top 5 식별 + 5/13 v2 보강 plan | 약점 목록 |

### T1.7 — 5/11~5/12 v1 → v2 보강

| ID | 작업 | 산출물 |
|---|---|---|
| T1.7-1 | 약점 5 항목 보강 (Claude + 사용자 외부) | 신청서 v2 — `2026-05-12-...-application-v2.md` |
| T1.7-2 | 추가 LOI 회수 또는 가입자 추가 (필요 시) | 외부 작업 |

### T1.8 — 5/13 2차 채점 (목표 80점)

| ID | 작업 | 기준 |
|---|---|---|
| T1.8-1 | `evaluator-rubric-reviewer` 호출 v2 | 5 페르소나 평균 80점 이상 |
| T1.8-2 | 미달 시 5/14 긴급 보강 | 최후 수정 |

### T1.9 — 5/15 K-Startup 포털 제출 (16:00)

| ID | 작업 | 산출물 |
|---|---|---|
| T1.9-1 | K-Startup 포털 업로드 + 제출 확인 | 제출 영수증 |
| T1.9-2 | 제출 후 Track 2 즉시 시작 (5/16) | Track 2 kick-off |

---

## Track 2 — AI 구현 트랙 (5/16 ~ 6/9, D-25, ~17 영업일)

> Track 2 잔여 work = Final Tech Spec §18.1 25.0d. 사용자 2x capacity → effective 12.5d. 영업일 5/16~6/9 (17d) → 4~5d 버퍼.

### T2.0 — 사전 검증 (5/16, 0.5d) **첫 단계 의무**

| ID | 작업 | 산출물 |
|---|---|---|
| T2.0-1 | `pip check` 의존성 호환 검증 (BE F-5): `anthropic + openai + firebase-admin + aioboto3` | `artifacts/verification/2026-05-16-ai-deps-check.md` |
| T2.0-2 | 충돌 발생 시 호환 버전 매트릭스 결정 | 의존성 lock |

### T2.1 — Milestone C 잔여 + AI 인프라 (5/16 ~ 5/19, 3.5d)

| ID | 작업 | 영업일 |
|---|---|---|
| T2.1-1 | C-13 `useWebSocket` (PT) | 0.5d |
| T2.1-2 | C-14 OwnerWalkTrackingScreen 산책 실시간 추적 UI | 1.0d |
| T2.1-3 | `backend/app/modules/ai/llm_client.py` (Claude·OpenAI dual + tenacity retry + DI) | 1.0d |
| T2.1-4 | Redis cost counter `pt:ai:cost:{YYYY}:{MM}` + 200만 cap + Haiku auto-routing | 0.5d |
| T2.1-5 | `WalkPhoto` 모델 + Alembic migration (4 테이블 통합) | 0.5d |

### T2.2 — Milestone D + 축 A·D (5/20 ~ 5/23, 4.0d)

| ID | 작업 | 영업일 |
|---|---|---|
| T2.2-1 | D-1 사고 신고 백엔드 (`POST /pt/walks/{id}/incident` 비동기 전환) | 1.0d |
| T2.2-2 | 축 A — `incident_classifier.py` + BackgroundTasks + 10s timeout + fallback severity=medium | 1.0d |
| T2.2-3 | 축 D — `content_moderator.py` (OpenAI Moderation API) + 한국어 룰 + 자동 재검토 | 1.0d |
| T2.2-4 | D-2~D-3 IncidentReportScreen 모바일 + 분류 결과 WS 수신 표시 | 0.5d |
| T2.2-5 | WalkerProfileScreen 자기소개 텍스트 필드 추가 + 모더레이션 결과 표시 | 0.5d |

### T2.3 — 축 B + 축 F (5/24 ~ 5/28, 3.0d, 주말 포함 5d)

| ID | 작업 | 영업일 |
|---|---|---|
| T2.3-1 | `photo_caption.py` + Vision LLM (Claude Sonnet) + Empathic tone 룰 | 1.0d |
| T2.3-2 | `condition_estimator.py` (B에 통합 응답) + 베타 라벨 | 0.5d |
| T2.3-3 | `walk_summary.py` jinja2 HTML 리포트 생성 | 0.5d |
| T2.3-4 | `WalkSummaryScreen.tsx` 신규 + WalkScreen ended state routing | 0.5d |
| T2.3-5 | WalkScreen 다수 사진 state 재설계 (단일 → 배열) + 캡션 표시 + 펫시터 1-tap 수정 | 0.5d |

### T2.4 — 축 E (5/29 ~ 5/30, 1.5d)

| ID | 작업 | 영업일 |
|---|---|---|
| T2.4-1 | `gps_anomaly.py` Redis ZSET 5분 윈도우 + 통계 알고리즘 (sudden_stop·route_deviation·pace_surge) | 1.0d |
| T2.4-2 | WS handler 통합 + non-response 60s timer + dismiss endpoint | 0.5d |
| T2.4-3 | `useAnomalyEvent.ts` hook + 워커 in-app modal + 보호자 알림 + 베타 라벨 | (T2.3에 분산) |

### T2.5 — Milestone F 통합 테스트 + 회귀 (6/2 ~ 6/4, 3.5d)

| ID | 작업 | 영업일 |
|---|---|---|
| T2.5-1 | AI 5축 통합 테스트 (mock LLM) + 백엔드 145 → 165+ 목표 | 1.5d |
| T2.5-2 | PT jest 15 → 22+ 목표 (useAiCaption·useAnomalyEvent·WalkSummaryScreen 테스트) | 1.0d |
| T2.5-3 | 한국어 모더레이션 50건 샘플 검증 (FR-D 기준 false positive < 5%) | 0.5d |
| T2.5-4 | 사진 캡션 환각 검증 (사용자 테스트 5~10명) | 0.5d |
| T2.5-5 | KI-2·KI-3·KI-4 정비 (Toss webhook secret·health degraded·m4 teardown race) | (M-F 기존 작업) |

### T2.6 — Milestone G Pre-launch QA + EAS (6/5 ~ 6/9, 3.0d + 출시)

| ID | 작업 | 영업일 |
|---|---|---|
| T2.6-1 | E2E QA 시나리오 10건 (산책 매칭 → AI 캡션 → 산책 종료 리포트 → 사고 신고) | 1.0d |
| T2.6-2 | EAS Build (iOS + Android) + TestFlight·Internal Track 배포 | 1.0d |
| T2.6-3 | 베타 사용자 onboarding 시나리오 검증 | 0.5d |
| T2.6-4 | App Store / Play Store 제출 (6/8) | 0.5d |
| T2.6-5 | 6/9 V1.0 출시 ✅ | — |

---

## 공통 — 사용자 외부 작업 (Track 1·2 병렬)

| ID | 작업 | 마감 | 우선순위 |
|---|---|---|---|
| EXT-3 | competitor-matrix AI 행 추가 (Claude T1.2-1) | 5/9 | P0 (자동) |
| EXT-4 | 자금 재배분 매핑 (Claude T1.2-2) | 5/9 | P0 (자동) |
| EXT-5 | LOI 5건 AI inject (Claude T1.2-3) | 5/8 | P0 (자동) |
| EXT-6 | 변호사 자문 Q-L2·Q-L3 (보험사 가맹 가능성) | 5/8 게이트 전 | **P1 사용자** |
| EXT-7 | 보험사 가맹 1차 접촉 (Pawchi 등) | 출시 후 1~2개월 | P2 사용자 |
| EXT-8 | Beachhead 지역 결정 (서울 마포·용산·서초 중 1~2) | 5/15 후 | P2 사용자 |
| EXT-9 | AWS 계정 + IAM + S3 버킷 (T2.0 후) | 5/16 | P0 사용자 |
| EXT-10 | Firebase 프로젝트 + Admin SDK JSON | 5/16 | P0 사용자 |
| EXT-11 | Anthropic API key + OpenAI API key | 5/16 | P0 사용자 |
| EXT-12 | PortOne 가맹점 계약 + API key/secret | T2.5 전 | P1 사용자 |

---

## Verification Matrix (Track별 종결 기준)

### Track 1 종결 기준 (5/15)

| 기준 | 측정 |
|---|---|
| K-Startup 포털 제출 영수증 | ✓ |
| 5 페르소나 사전 채점 평균 ≥ 76점 | evaluator-rubric-reviewer 보고서 |
| 사전 가입자 ≥ 30명 + LOI ≥ 3건 | 외부 작업 결과 |
| 신청서 본문 v2 + 첨부 자료 8개 이미지 슬롯 모두 게시 | K-Startup 포털 |

### Track 2 종결 기준 (V1.0 출시 6/9)

| 기준 | 측정 |
|---|---|
| AI 5축 동작 시연 가능 | E2E 시나리오 10건 통과 |
| 백엔드 165+ passed | pytest |
| PT jest 22+ passed | jest |
| TS 0 errors | tsc |
| LLM API 비용 cap 동작 | Redis counter 검증 |
| EAS Build 양 플랫폼 성공 | App Store · Play Store 제출 영수증 |
| 사고 신고 NFR-5 (99.9% submission) | 통합 테스트 |
| 캡션 환각 < 2% | 사용자 테스트 5~10명 |

---

## Rollback Plan (Track 2)

| 시나리오 | 대응 |
|---|---|
| Track 2 5/27 시점 진척 < 50% | 축 E·F V1.0 → V1.1 이연 결정 (3축 fallback) |
| 6/4 시점 회귀 발생 | feature flag로 문제 축만 비활성화 + 출시 |
| 6/8 EAS Build 실패 | 6/10~6/12 출시 지연 (margin 사용) |
| 의존성 충돌 (T2.0) | anthropic 0.40 → 0.39 다운그레이드 또는 firebase-admin 호환 버전 매트릭스 |

---

## Phase 5 Implementation 진입 후 마일스톤 보고

| 시점 | 보고 |
|---|---|
| 5/15 18:00 | Track 1 milestone report (`artifacts/reports/2026-05-15-track-1-application-submitted.md`) |
| 5/23 EOD | Track 2 D + 축 A·D 완료 보고 |
| 5/30 EOD | Track 2 축 B·F·E 완료 보고 |
| 6/4 EOD | Track 2 Milestone F 완료 보고 |
| 6/9 V1.0 출시 | Final Milestone Report (`artifacts/reports/2026-06-09-pt-v1.0-launch.md`) |

---

## References

- Final Tech Spec: [`2026-04-29-pt-ai-differentiation-final-tech-spec.md`](../specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md)
- 차별화·Moat·BM 보강: [`2026-04-30-pt-differentiation-moat-bm-deepening.md`](../business/fundraising/2026-04-30-pt-differentiation-moat-bm-deepening.md)
- PT V1.0 Tech Spec (baseline): [`2026-04-24-pt-quality-uplift-final-tech-spec.md`](../specs/2026-04-24-pt-quality-uplift-final-tech-spec.md)
- Consensus Matrix: [`2026-04-29-pt-ai-differentiation-consensus.md`](../reviews/2026-04-29-pt-ai-differentiation-consensus.md)
