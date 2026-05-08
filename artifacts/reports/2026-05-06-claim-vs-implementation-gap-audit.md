# 제시 기능 vs 실제 구현 — 갭 통합 Audit 보고서

**감사 기준일**: 2026-05-06
**감사 범위**: 4개 claim 표면 (PT 신청서 v1 / SafeWay 마일스톤 표 / lunenlabs.com 사용자 카피 / 샌드박스 v2.1 신청서) ↔ 실제 코드
**감사 방법**: 4개 verification-auditor 에이전트 병렬 + 메인 컨텍스트 직접 검증
**왜 이 보고서가 필요한가**: 사용자가 "제시한 기능들 중 실제 구현이 안 된 것이 많을 것 같다"고 의심함. 5/15 K-Startup 신청서 제출 + 5/14 샌드박스 v2.2 freeze + 5/5 LIVE된 lunenlabs.com이 모두 평가위원·심사관·실사용자의 fact-check 표면이므로, claim과 코드의 갭을 빠르게 파악하지 못하면 (1) 평가 신뢰도 동반 하락 (2) 소비자 기만 위험 (3) 의사결정 베이스 오염이 동시 발생.

---

## 0. Executive Summary — TOP 11 시급 갭 (우선순위 순)

| # | 표면 | 갭 | 등급 | 데드라인 | 권고 조치 |
|---|---|---|---|---|---|
| 1 | lunenlabs.com Landing | "실제 이용자분들의 생생한 후기" — 가상 페르소나 후기를 실재처럼 표기 | 🔴 RED | 즉시 | "도입 시 기대 효과" 또는 "파일럿 시나리오"로 변경 |
| 2 | lunenlabs.com Landing | "정규직 전환 (플랫폼 직접 고용)" — 사업자 등록 진행 중인데 노출 | 🔴 RED | 즉시 | "안정적 파트너십 체계 (정규직 전환 로드맵 검토 중)"로 약화 |
| 3 | lunenlabs.com Landing | "소개서 PDF" 링크 → 파일 없음 → 404 | 🔴 RED | 즉시 | PDF 작성 후 업로드 또는 버튼을 "문의 유도"로 교체 |
| 4 | lunenlabs.com Landing | App Store/Play Store "다운로드" Step 안내 (앱 미등록) | 🔴 RED | 출시 전 | "사전 신청하기" 또는 "베타 참여 신청"으로 대체 |
| 5 | lunenlabs.com Landing/CostSimulator | 요금 체계 내부 모순: 5,000원/탑승 vs 89,000원/학생/월 | 🟡 YELLOW | 즉시 | 둘 중 하나로 통일 |
| 6 | 샌드박스 v2.1 §4.2·§5.3 | "안면 임베딩 AES-256 암호화 저장" — 실제 EdgeEvent.details는 평문 JSON | 🔴 RED | 5/14 freeze 전 | 코드에 encrypt_value 적용 OR 문구를 미래형으로 약화 |
| 7 | 샌드박스 v2.1 §5.2 | "교육시설장 지명" 법리 ↔ auto_match 함수 자동 배정 | 🔴 RED | 5/14 freeze 전 | suggest_candidates로 리네이밍 + 승인 API 추가 |
| 8 | 샌드박스 v2.1 §3 | "사각지대 외부 보행자 감지" — EdgeEventType enum에 없음 | 🔴 RED | 5/14 freeze 전 | enum 추가 OR §3 표현 미래형 재분류 |
| 9 | CLAUDE.md 검증 수치 | LOC 18,500 vs 실측 ~32,700 — 44% 과소 | 🟡 YELLOW | 5/14 freeze 전 | 실측치로 갱신 (PT 신청서 50,417과도 별도) |
| 10 | CLAUDE.md 검증 수치 | "백엔드 95 passed, 0 failed" + KI-2/KI-3/KI-4 known fails 동시 기록 — 내부 모순 | 🟡 YELLOW | 5/14 freeze 전 | "178 test functions, KI 3건 fail 가능"으로 갱신 |
| 11 | CLAUDE.md | "웹 대시보드 품질 95점 달성" — 측정 기준·결과 artifact 없음 | 🟡 YELLOW | 5/14 freeze 전 | 측정 출처 보충 OR 표현 약화 |

---

## 1. 영역별 상세 — A. lunenlabs.com 사용자향 카피

**검증 대상**: `site/src/pages/Landing.tsx`, `CostSimulator.tsx`, Footer 등 + `lunenlabs/src/pages/PetTracker.tsx` + `lunenlabs/src/components/pt/*` (8개 컴포넌트)

### A-1. 약속한 기능 인벤토리 (17건) → 매칭 결과

| # | 기능 | 등급 | 비고 |
|---|---|---|---|
| F-01 | 실시간 GPS 위치 추적 | 🟢 GREEN | backend WebSocket + mobile MapScreen 완전 구현 |
| F-02 | "AI 최적 경로 자동 생성" | 🟡 YELLOW | OR-Tools VRP (Euclidean 거리). "교통 상황 분석"은 과장 |
| F-03 | 탑승·하차·도착 알림 즉시 수신 | 🟢 GREEN | FCM provider + notification router 구현 |
| F-04 | 스케줄 관리 + 원터치 결석 처리 | 🟢 GREEN | endpoint·UI 모두 구현 |
| F-05 | 자동 청구서 발행 | 🟡 YELLOW | KI-2 TOSS_WEBHOOK_SECRET 미설정으로 webhook 불안정 |
| F-06 | 안전도우미 자격 검증 | 🟢 GREEN | qualification_checker.py 구현 |
| F-07 | App Store / Play Store 다운로드 | 🔴 RED | 앱 스토어 등록 미완료 |
| F-08~11 | Edge AI 4종 (이상행동·안면인식·사각지대·잔류) | (해당 없음) | 사이트가 이미 "Coming Soon" future-tense로 처리 — 갭 없음 |
| F-12 | 정규직 전환 (직접 고용) | 🔴 RED | 사업자 등록 진행 중. 즉시 이행 불가 약속 |
| F-13 | 24/7 안전 모니터링 | 🟡 YELLOW | 서버 모니터링은 OK, Edge AI 모니터링은 미존재. 혼용 위험 |
| F-14 | 소개서 PDF 다운로드 | 🔴 RED | `public/brochure/`에 파일 없음 → 404 |
| F-15 | 도입 문의 폼 | 🟢 GREEN | POST /api/v1/contact 구현 |
| F-16 | 비용 시뮬레이터 89,000원/학생/월 | 🔴 RED (모순) | Landing.tsx:422 "5,000원/탑승"과 CostSimulator.tsx:32 "89,000원/학생/월" 충돌 |
| F-17 | 기사·도우미 지원 폼 | 🟢 GREEN | inquiry_type 필드로 처리 |

### A-2. B2C 청중 분리 룰 위반 (메모리 anchor 위반)

| # | 룰 | 위반 | 권고 |
|---|---|---|---|
| V-01 | internal term 노출 금지 | "Edge AI Technology" 영문 기술 태그 (Landing.tsx:315) | "차세대 안전 기술"로 교체 |
| V-02 | internal term 노출 금지 | "AI" 단어 한 페이지 10회 이상 등장 | 결과 중심 카피로 교체 ("최단 경로 자동 계산") |
| V-03 | evolution leak 금지 | "실제 이용자분들의 생생한 후기입니다" (Landing.tsx:351) | "도입 시 기대 효과"로 변경 |
| V-04 | B2C 격식체 회피 | "이용자분들" | "이용 후기" |

### A-3. /pet 페이지 (PT) 카피

**확인됨**: `lunenlabs/src/main.tsx:15`에 `/pet` 라우트 존재. `lunenlabs/src/pages/PetTracker.tsx` + 8개 PT 컴포넌트 (`PtAiAxes`, `PtFaq`, `PtHero`, `PtHolisticCare`, `PtHowItWorks`, `PtSignupForm`, `PtWhy`) 실재.

(첫 audit 에이전트가 site/만 보고 "PT 페이지 없음"으로 잘못 보고 — lunenlabs/ 디렉토리에 있음. cross-validation으로 정정)

**미검증 (다음 audit 권고)**: PT 페이지 카피가 (1) 메모리 `pt_positioning_holistic_care.md`의 "산책 단일 → 일상 종합 케어" narrative를 반영하는지 (2) `feedback_b2c_*` 메모리의 청중 분리 룰을 따르는지 (3) `PtSignupForm`이 formsubmit.co로 실제 연결되어 있는지.

---

## 2. 영역별 상세 — B. SafeWay Kids 마일스톤 표 (CLAUDE.md)

### B-1. 마일스톤 15개 신뢰도

| # | 마일스톤 | 보고서 | 코드 | 신뢰도 |
|---|---|---|---|---|
| 1 | M0 Foundation | ✅ | turbo.json, 6 워크스페이스 | HIGH |
| 2 | M1 Core Backend | ✅ | auth/academy_management/student_management/vehicle_telemetry 모듈 | HIGH |
| 3 | M2 Parent/Driver App | ✅ | parent/driver 화면 다수 | HIGH |
| 4 | M3 Compliance/Notifications | ✅ | compliance/, sex_offender_check.py, ConsentScreen.tsx | MED (런타임 미검증) |
| 5 | M4 Real-time WebSocket | ✅ | test_m4_websocket (7), vehicle_telemetry | MED (KI-4 race 잔존) |
| 6 | M5 Operational Loop | ✅ | scheduling/, routing_engine/ | MED |
| 7 | M6 Production Hardening | ✅ | rate_limit.py, logging_config | MED |
| 8 | M7 Billing System | ❌ 개별 보고서 없음 | toss_payments.py·portone.py + test 22개 | MED (KI-2 미설정) |
| 9 | M8 Academy Web Dashboard | ✅ | web/pages 6개 | HIGH |
| 10 | M9 Safety Escort | ❌ 개별 보고서 없음 | escort/ 4 파일 + 모바일 3 화면 + test 10 | MED |
| 11 | Design System | ✅ | components 다수 | MED |
| 12 | WebSocket Connection Fix | ✅ | (heartbeat 위치 미확인) | LOW (KI-4와 모순) |
| 13 | 프로덕션 배포 준비 | ✅ | deploy/k8s/, Dockerfile, eas.json | MED |
| 14 | 플랫폼 운영자 대시보드 | ✅ | platform/ 14 페이지 | HIGH |
| 15 | 웹 대시보드 95점 | ✅ 보고서만 | (측정 기준·점수 산정 artifact 없음) | LOW |

### B-2. 검증 수치 갭

| 항목 | CLAUDE.md | 신청서 v1 | 메인 직접 측정 | 결론 |
|---|---|---|---|---|
| 백엔드 LOC | 6,543 | 24,379 | **24,936** (실측) | CLAUDE.md severely stale, 신청서가 실측에 근접 |
| 모바일 LOC | 7,292 | 12,665 | **12,609** (실측) | 신청서가 실측에 근접 |
| 웹 LOC | 4,000+ | 10,827 | **10,804** (실측) | 신청서가 실측에 근접 |
| 사이트 LOC | 736 | 1,361 | **1,361** (실측) | 신청서 정확 |
| 공유 코어 LOC | (없음) | 1,185 | **1,455** (`packages/`) | 신청서가 거의 정확 |
| apps/ (PT+CC mobile) LOC | (없음) | (없음) | **8,646** (실측) | **두 claim 모두 누락** |
| lunenlabs/ LOC | (없음) | (없음) | **2,926** (실측) | **두 claim 모두 누락** |
| 합계 | ~18,500 | 50,417 | **62,200+** (전체) / **49,710** (apps+lunenlabs 제외) | 신청서 50,417 ≈ 실측 49,710 (-1.4% 갭). CLAUDE.md 18,500은 **stale by ~30,000 LOC** |
| 백엔드 테스트 | 95 passed | 145 passed | **178 def test_** (정적 카운트, pytest 미실행) | 두 claim 모두 underclaim — 단 178은 collection 카운트가 아님 |
| 모바일 테스트 | 36 passed | (PT) 15 passed | SafeWay mobile 71 it() / PT mobile 9 파일 | CLAUDE.md SafeWay 36 vs 실측 71 (35건 차이). 신청서 PT 15 vs 실측 PT 파일 9 (6건 over-claim 위험) |
| 웹 테스트 | 50 passed | (없음) | 12 파일 / 50 it() | **정확히 일치** |
| TS 0 errors | 0 | 0 | 검증 미실행 (환경 제약) | UNVERIFIED |

### B-3. TOP 5 의심 항목

1. **"웹 대시보드 95점"** — 측정 기준·결과 artifact 없음. IR·신청서 인용 시 검증 불가
2. **"백엔드 95 passed, 0 failed"** + KI-2/KI-3/KI-4 동시 기재 — 내부 모순
3. **LOC 18,500** — 실측 ~32,700 (앱·lunenlabs 미포함 시) / 신청서 50,417과 모두 다름
4. **"WebSocket Connection Fix COMPLETE"** + KI-4 WS teardown race 잔존 — 모순
5. **M7 Billing COMPLETE** + TOSS_WEBHOOK_SECRET 미설정 → webhook 3건 fail (Known)

---

## 3. 영역별 상세 — C. PT 신청서 v1 (5/15 마감)

**검증 대상**: `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md`

### C-1. AI 5축 코드 흔적 매트릭스

신청서가 "Track 2 5/16~6/9에 구현 예정"이라고 명시했으므로 **현 시점 미구현은 정상**. 다만 (a) Final Tech Spec에 5축이 명세화되어 있는지, (b) backend pettracker 모듈에 placeholder라도 있는지로 "구현 가능성 신뢰도"가 결정됩니다.

| 축 | 신청서 약속 | 현재 코드 흔적 | Final Tech Spec 명세 | 위험도 |
|---|---|---|---|---|
| A 사고 신고 LLM | 119/SMS/병원 GPS 1탭 자동화 | 0 (PT 코드에 없음). CC·SafeWay에 incident/accident grep 매칭 | spec 문서 존재 | 🟡 5/16 시작 OK |
| B 사진 캡션 + Empathic | 자동 캡션 + 감정 톤 리포트 | 0 (`backend/app/apps/pettracker/service.py`는 Pet/Walker/Booking/Wallet CRUD만). spec·plan·신청서·사이트 컴포넌트만 존재 | spec 문서 존재 | 🟡 |
| D 모더레이션 | LLM 기반 콘텐츠 검토 | 0 (lunenlabs PtAiAxes 광고 컴포넌트 + spec만) | spec 문서 존재 | 🟡 |
| E GPS 이상 탐지 | 시계열 anomaly + 워커 자동 체크인 | 0 PT (CC test_gps_validation 16건만) | spec 문서 존재 | 🟡 |
| F 컨디션 추정 | 강아지 컨디션 추정 | **0 — spec 외 흔적 없음** | spec 부재 가능성 | 🔴 가장 약함 |

### C-2. 신청서 §4 "현재 검증 수치" 검증

| 신청서 주장 | 메인 직접 검증 | 판정 |
|---|---|---|
| 50,417 LOC | 49,710 (apps+lunenlabs 제외) / 62,200 (전체) | ✅ VERIFIED (apps+lunenlabs 제외 합계와 -1.4% 갭) |
| 백엔드 145 passed | 178 def test_ (정적). pytest 미실행 | 🟡 PARTIALLY — 178 ≠ 145 — 차이 33의 출처 불명 |
| 모바일 PT 15 passed | apps/pettracker/mobile/__tests__/ 9 파일 | 🔴 OVER-CLAIM 위험 — 6건 차이 |
| TS 0 errors (mobile/web/site/packages) | 환경 제약 미실행 | UNVERIFIED |
| 마일스톤 15개 | artifacts/reports/ milestone-* 파일 갯수와 일치 | ✅ VERIFIED |
| 멀티앱 시너지 백엔드 87% / 모바일 50~55% | `artifacts/specs/2026-04-02-pettracker-careconnect-pm-analysis.md` 존재 (메인 미열람) | UNVERIFIED — PM 분석 본문 확인 필요 |
| 기술 스택 (FastAPI/RN/Expo/Firebase Auth/PortOne v2/AWS S3/WS/Anthropic/OpenAI) | (메인 직접 미검증, 별도 grep 권고) | UNVERIFIED |

### C-3. CLAUDE.md vs 신청서 cross-document 모순

| 항목 | CLAUDE.md | 신청서 v1 | 어느 쪽이 진실? |
|---|---|---|---|
| 백엔드 테스트 | 95 passed | 145 passed | 둘 다 underclaim (실측 178 def test_) |
| LOC | ~18,500 | 50,417 | 신청서 (실측 49,710과 일치) — CLAUDE.md severely stale |
| 모바일 테스트 | 36 passed | (PT) 15 passed | 다른 모집단(SafeWay vs PT)이지만 둘 다 실측과 갭 |

**결론**: CLAUDE.md "프로젝트 진행 현황" 섹션이 가장 stale. 신청서는 실측에 더 가까우나 PT 모바일 테스트 갯수에서 over-claim 위험.

### C-4. 신청서가 인용한 artifacts 실재 확인

| 인용 | 파일 존재 |
|---|---|
| `2026-04-30-modoo-eval-guide-crosscheck.md` | (별도 확인 권고) |
| `traction-inventory` | (정확한 파일명 미상) |
| `market-citations` | (정확한 파일명 미상) |
| `moat-bm-deepening` | (정확한 파일명 미상) |
| `pettracker-careconnect-pm-analysis.md` | ✅ artifacts/specs/2026-04-02 |
| `pt-ai-differentiation-final-tech-spec.md` | ✅ artifacts/specs/2026-04-29 |

---

## 4. 영역별 상세 — D. 샌드박스 v2.1 (5/14 freeze)

(상세는 sub-agent 보고서에 충실 — 핵심만 요약)

| GAP | 신청서 § | 코드 현실 | 등급 |
|---|---|---|---|
| GAP-1 | §4.2·§5.3 안면 임베딩 AES-256 암호화 | EdgeEvent.details = 평문 JSON. encrypt_value 함수 존재하나 edge_gateway 미적용 | 🔴 RED |
| GAP-2 | §5.2 교육시설장 지명 (auto_match) | service.py:43~93이 first-come-first-served 자동 배정. 승인 단계 코드 없음 | 🔴 RED |
| GAP-3 | §3·§1.1 사각지대 외부 보행자 감지 | EdgeEventType enum = `FACE_RECOGNIZED`/`ABNORMAL_BEHAVIOR`/`REMAINING_PASSENGER` 3개만. 보행자 감지 enum 없음 | 🔴 RED |
| GAP-4 | §1.2·§5.1 N:N 계약 구조 | `Contract.operator_name` = String(200). 별도 Operator 테이블 없음 | 🟡 YELLOW |
| GAP-5 | §1.1·§2.8 VRP-TW 동적 배차 | solver.py "M4 prototype" 주석 + Euclidean 거리 (도로 거리 미적용) | 🟡 YELLOW |

### 양길모 의견서 인용 적정성

- Q1 "1개 운송계약" 인용: YELLOW — 인용 자체는 적정하나 "1차 차단" 강한 표현이 과장으로 읽힐 위험
- Q2 "고영향 AI 미해당" 인용: YELLOW — "미해당" + "§34 자발적 전면 이행" 이중 트랙의 논리적 일관성이 평가 시 공격 지점
- Q3 "정통망법 §44의2 적용 외" 인용: GREEN — 의견서 결론 범위 내 인용

---

## 5. 권고 — 우선순위 액션 플랜

### 5-A. 24시간 내 (사이트 LIVE 즉시 조치)

| # | 위치 | 조치 | 공수 |
|---|---|---|---|
| 1 | Landing.tsx:351~387 | "실제 이용자 후기" 섹션 → "도입 시 기대 효과" 또는 파일럿 모집 CTA로 교체 | 30분 |
| 2 | Landing.tsx:104 | "정규직 전환 (직접 고용)" → "안정적 파트너십 체계 (정규직 전환 로드맵 검토 중)" | 5분 |
| 3 | Landing.tsx:399~407 | PDF 링크 → 문의 유도 버튼으로 교체 (또는 PDF 작성 후 업로드) | 15분 |
| 4 | Landing.tsx:266 | "App Store/Play Store 다운로드" → "사전 신청하기" | 10분 |
| 5 | Landing.tsx:422 + CostSimulator.tsx:32 | 요금 체계 통일 (5,000원/탑승 OR 89,000원/학생/월 중 택일) | 30분 |

총 공수: **~1.5시간**. 신청서·IR 평가 신뢰도 보호 ROI 최고.

### 5-B. 5/14 v2.2 freeze 전 (샌드박스)

| # | 작업 | 공수 |
|---|---|---|
| 1 | EdgeEvent.details에 encrypt_value 적용 OR §4.2 표현 미래형 약화 | 1~2시간 |
| 2 | auto_match → suggest_candidates 리네이밍 + 교육시설장 승인 API 명시 | 2~3시간 |
| 3 | EdgeEventType enum에 BLIND_SPOT_DETECTED 추가 OR §3 표현 미래형 재분류 | 30분 |
| 4 | §5.1 operator_name 문자열 한계 솔직 명시 | 15분 |
| 5 | §5 VRP-TW에 "Euclidean 근사·도로 거리 전환 예정" 각주 | 15분 |

### 5-C. 5/15 신청서 제출 전 (PT)

| # | 작업 | 공수 |
|---|---|---|
| 1 | 신청서 §4 "백엔드 145 passed" → 정확한 baseline 확정 (pytest 실행 후 갱신) | 30분 |
| 2 | 신청서 §4 "모바일 PT 15 passed" → 실측 9 파일에 맞춰 수정 OR 누락 테스트 식별 | 30분~ |
| 3 | 신청서 §4 LOC 50,417 → 실측 49,710과 ±1.4% 갭 — 양호. 그대로 제출 가능 | 0 |
| 4 | 신청서 §4.7 "별개 진행" SafeWay 분리 narrative 명확성 재검토 | 30분 |
| 5 | 신청서 §3 AI 5축 표 "5/16~6/9 구현 예정" 일자 강조 (Track 1 vs Track 2 분리) | 0 (이미 §4 표에 명시) |

### 5-D. CLAUDE.md 갱신 (모든 신청서·IR의 base of truth)

| 현행 | 권고 변경 |
|---|---|
| "백엔드 6,543 + 모바일 7,292 + 웹 4,000+ + 사이트 736 = ~18,500+" | "백엔드 24,936 + 모바일(SafeWay) 12,609 + 웹 10,804 + 사이트 1,361 + apps(PT+CC) 8,646 + lunenlabs 2,926 + packages 1,455 = ~62,200 LOC (2026-05-06 실측)" |
| "백엔드 95 passed, 0 failed" | "178 test functions 정의 (pytest 미실행). Known issues: KI-2 Toss webhook 3 fail / KI-3 health 1 fail / KI-4 WS teardown race" |
| "모바일 10 suites, 36 passed" | "SafeWay mobile 17 파일 / 71 it() 블록 (jest 미실행) + PT mobile 9 파일 (별도)" |
| "웹 대시보드 품질 95점 달성" | "웹 대시보드 품질 향상 완료 (측정 기준·결과 artifact 미보존)" 또는 측정 출처 보충 |

---

## 6. 갭의 카테고리 분류 (재발 방지 관점)

### 카테고리 1: Stale 수치 (의도 없음, 갱신 누락)
- CLAUDE.md LOC 18,500
- CLAUDE.md 백엔드 95 passed
- CLAUDE.md 모바일 36 passed

→ **재발 방지**: `/session-end` 스킬에 "검증 수치 stale 체크" 게이트 추가. STATE.md 룰에 "검증 수치 N일 이상 stale 시 갱신" 명시.

### 카테고리 2: 약속과 코드 미스매치 (의도적 over-claim 위험)
- 가짜 후기
- 정규직 직접 고용
- App Store 다운로드 안내 (앱 미등록)
- 안면 임베딩 AES-256 (코드 평문)

→ **재발 방지**: 사용자향 카피·신청서 작성 시 verification-auditor를 작성 전 게이트로 호출.

### 카테고리 3: 신청서 narrative ↔ 코드 구조 미스매치 (구조적)
- auto_match 자동 배정 vs 교육시설장 지명 법리
- AI 5축 코드 0 (단, 5/16~6/9 명시이므로 위험은 낮음)
- 사각지대 보행자 감지 enum 없음

→ **재발 방지**: spec·plan에서 "함수명·enum값"을 법리·신청서 narrative와 1:1 매핑하는 cross-reference 표 의무화.

### 카테고리 4: 측정 기준 불명 (검증 자체 불가)
- "웹 대시보드 95점"
- "멀티앱 시너지 87%·50%" (PM 분석 본문 미열람)

→ **재발 방지**: 정량 claim은 "측정 방법·날짜·도구" 3종 메타데이터 동반 의무화.

---

## 7. 감사 한계 (솔직한 명시)

| 영역 | 한계 |
|---|---|
| pytest 실제 실행 | venv 활성화 환경 제약으로 미실행. 178 함수 → 실제 collected count는 다를 수 있음 |
| jest 실제 실행 | npm install 환경 제약으로 미실행. 71 it() → mock 의존성 실패분 포함 가능 |
| TypeScript tsc | 환경 제약으로 미실행 |
| 양길모 의견서 PDF 직독 | 미수행 — 메모리 + 신청서 paraphrase 기반 검증 |
| PT 모바일 코드 깊이 검증 | apps/pettracker/mobile/ 파일 목록만 확인, 화면 내부 로직 미검증 |
| /pet 페이지 카피 (lunenlabs/) | 첫 audit이 site/만 봐서 누락. PT positioning·formsubmit 연결 별도 audit 권고 |
| 멀티앱 시너지 87%·50% | PM 분석 본문 미열람 |
| 신청서 인용 traction/market/moat 파일 | 정확한 파일명 미확인 |

---

## 8. 다음 단계 제안

1. **즉시 (오늘 안)**: 5-A 사이트 LIVE 5건 RED 수정 (1.5시간)
2. **5/7 이의림 미팅 전**: 5-B 샌드박스 코드 수정 또는 표현 약화 결정
3. **5/9 신청서 v2 inject 전**: 5-C 신청서 §4 검증 수치 재baseline (pytest/jest 1회 실행 + 결과 fix)
4. **5/14 v2.2 freeze 전**: 5-B + 5-D CLAUDE.md 갱신
5. **재발 방지 (5/15 이후)**: 카테고리별 가드레일 도입 (`/session-end` 게이트, spec cross-reference 표, claim 메타데이터 의무화)

---

## 부록 A: 4개 audit 에이전트 출력 출처

- 사이트 카피 audit (ad188d6dffdd07ad9): ✅ 완전한 보고서 회수
- SafeWay 마일스톤 audit (a0e66ff0be382f7aa): ✅ 완전한 보고서 회수
- 샌드박스 v2.1 audit (ab755b17bac579cbe): ✅ 완전한 보고서 회수
- PT 신청서 audit (a60c2ec13135d5952): ❌ 미회수 — 메인 컨텍스트에서 직접 검증으로 대체

## 부록 B: 변경 이력

- 2026-05-06 v1.0: 초기 작성. 4 audit + 메인 직접 검증 통합.
