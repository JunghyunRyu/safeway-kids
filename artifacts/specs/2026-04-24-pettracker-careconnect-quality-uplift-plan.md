# PetTracker + CareConnect 품질 향상 계획

**작성일:** 2026-04-24
**작성자:** Claude (Phase 0 — Intake 산출물)
**상태:** DRAFT — 사용자 승인 후 Phase 1(독립 리뷰) 착수 예정
**기반 아티팩트:**
- `artifacts/handoffs/2026-04-09-session-final-handoff.md` (잔여 Open Issues 5건)
- `artifacts/reports/2026-04-09-p2p3-milestone-report.md` (잔여 리스크 5건)
- `artifacts/plans/2026-04-09-p2p3-todo-plan.md` (Milestone D 부분 미완)
- `artifacts/specs/2026-04-02-pettracker-careconnect-pm-analysis.md` (V1.1/V2 사용자 스토리)
- `artifacts/specs/2026-04-02-pettracker-requirement-brief.md`
- `artifacts/specs/2026-04-02-careconnect-requirement-brief.md`

---

## 1. 현 상태 진단 (verified)

### 1.1 코드 베이스라인
| 영역 | SafeWay Kids | PetTracker | CareConnect |
|---|---|---|---|
| 모바일 화면 (.tsx) | **40** | 21 | 24 |
| 모바일 src 디렉토리 | api/components/constants/hooks/i18n/navigation/screens/utils + `__tests__` | api/constants/navigation/screens | api/constants/navigation/screens |
| 모바일 자동 테스트 | 17 suites · 71 passed | **0** | **0** |
| 백엔드 모듈 분산 | 8+ 도메인(auth/billing/notification/…) | **단일 `pettracker/`** | **단일 `careconnect/`** |
| 백엔드 통합 테스트 | m2/m4/m7/m9 등 14+ | **0건** | **0건** |
| Admin Web 페이지 | 7 영역(학생·차량·청구·컴플라이언스·감사·관제·플랫폼) | **0** | **0** |
| WebSocket 실시간 | M4 완료 | 폴링 기반 | 폴링 기반 |

### 1.2 핸드오프(2026-04-09)에 명시된 잔여 Open Issues
| # | 이슈 | 심각도 | 현 상태 |
|---|---|---|---|
| O1 | PT/CC 모바일 자동 테스트 0개 | MEDIUM | 미해결 |
| O2 | ImagePicker S3 미연동 (로컬 프리뷰만) | LOW | 미해결 |
| O3 | 스케줄 반복 — 백엔드 RRULE 저장 안 함 | LOW | 미해결 |
| O4 | CC-24 Handover 데이터 일부 미연결 (아이/돌봄자 이름) | LOW | 미해결 |
| O5 | PT-17 보험 정보 UI 미완성 (모델만 있음) | LOW | 미해결 |

### 1.3 P3 별도 Tech Spec 필요(2026-04-09 핸드오프)
- 그룹 산책 (multi-pet group walk pricing)
- 다중 아동 (multiple children per booking)
- 실시간 지도 (CareConnect parent 측 실시간 위치 표시)

### 1.4 V1.1 미구현 — PM 분석(2026-04-02) 기준
**PetTracker:**
- PO-10 즐겨찾기 산책사 + Quick Re-book
- PO-11 / PT-25 정기 산책 (RRULE 백엔드 — O3와 동일 이슈)
- PO-12 산책 리포트 (route map polyline + 거리·시간·사진)
- WK-08 산책 중 사진/상태 업데이트 (S3 연동 — O2와 연계)
- WK-09 사고 신고 구조화 폼
- AD-04 분쟁 해결 센터

**CareConnect:**
- PA-10 정기 케어 스케줄
- PA-11 / CG-08 세션 리포트 (활동·식사·낮잠·메모)
- CG-10 사고 신고 구조화 폼 (구조 일부)
- CA-04 분쟁 해결 센터
- CA-06 동의 감사 이력 풀 트레일

### 1.5 SafeWay 대비 인프라 격차
| 격차 | 영향 |
|---|---|
| 모바일 `__tests__` 0개 | 회귀 검증 = TypeScript 컴파일만. 모든 변경이 수동 회귀 부담 |
| 모바일 `components/` 부재 | 화면별 로직 중복, DatePickerModal 외에 재사용 컴포넌트 없음 |
| 모바일 `hooks/` 부재 | useAuth/useGpsTracking 같은 cross-cutting 로직 없음 (SafeWay에선 검증됨) |
| 모바일 `i18n/` 부재 | 한국어 하드코딩 — 다국어 확장 시 전면 리팩터 필요 |
| 모바일 `utils/` 부재 | 날짜·금액·주소 포맷 중복 |
| 백엔드 단일 모듈 | models/router/schemas/service 4파일에 모든 도메인 응집 — 신규 기능마다 파일 비대화 |
| 백엔드 통합 테스트 0개 | API 변경 시 수동 검증, 회귀 위험 |
| Admin Web 부재 | 산책사·돌봄사 승인, 분쟁 처리, 매출 모니터링이 DB 직접 조회로만 가능 |
| WebSocket 실시간 부재 | 위치/상태 갱신이 폴링 → 배터리·네트워크 비효율 |

---

## 2. 목표 / 비목표

### Goals
1. PT/CC를 "MVP 코드 완료" → "**런칭 후 운영 가능한 서비스 품질**"로 끌어올린다.
2. SafeWay Kids에서 검증된 품질 게이트(자동 테스트, 컴포넌트 재사용, 다국어, 실시간)를 PT/CC에 이식한다.
3. V1.1 트러스트/리텐션 기능 중 **commission 수익 직접 영향 항목**을 우선 구현한다.
4. 매 단계마다 `verification-before-completion` 게이트로 회귀를 막는다.

### Non-goals
- V2 항목(Pet Insurance Integration, AI 매칭, 정부 아이돌봄 연동, 영상 모니터링) — 다음 분기 별도 분기.
- 신규 도메인 추가(예: 펫 호텔, 가정학습) — V1.1 출시 후 검토.
- SafeWay Kids 신규 기능 — 샌드박스 후속이 별도 워크스트림으로 진행 중.

---

## 3. 마일스톤 계획

### Phase 0 — 베이스라인 검증 (Day 0, ~2시간)
**목적:** "지금 무엇이 깨져 있는지" 0초에 파악.
1. 백엔드 pytest 풀런 + 결과 캡처
2. PT 모바일 `tsc --noEmit` + lint
3. CC 모바일 `tsc --noEmit` + lint
4. SafeWay 모바일 Jest (회귀 베이스라인)
5. 웹 vitest (회귀 베이스라인)
6. **산출물:** `artifacts/verification/2026-04-24-baseline-pt-cc.md`

### Milestone A — 잔여 Open Issues 정리 (Day 1~3)
**목표:** 04-09 핸드오프 5건 + Handover 데이터 연결을 close.

| # | 작업 | 산출물 |
|---|---|---|
| A-1 | O5 PT-17 보험 정보 UI — WalkerProfileDetailScreen에 보험·만료일 배지 표시 | UI + 시각 회귀 스냅샷 |
| A-2 | O4 CC-24 Handover 아이 이름·돌봄자 이름 데이터 연결 | API 응답에 nested join + 화면 표시 |
| A-3 | O2 ImagePicker → S3 업로드 (백엔드 presigned URL + 모바일 fetch+PUT) | 양 앱 공통 `useImageUpload` hook (packages/core-mobile) |
| A-4 | O3 스케줄 RRULE 백엔드 저장 — `recurrence_rule` 컬럼 + 슬롯 확장 시 RRULE 우선 | Alembic 마이그레이션 + service.py 분기 |
| A-5 | A-1~A-4 검증 — TS 0 errors + 백엔드 unit pass + 수동 회귀 체크리스트 | Verification Report |

### Milestone B — 모바일 테스트 인프라 (Day 4~7)
**목표:** PT/CC 모바일 자동 테스트 0개 → 핵심 플로우 회귀 안전망 구축.
1. Jest + React Native Testing Library 셋업 (PT, CC 각 1회)
2. 공유 fixture (`packages/core-mobile/__tests__/fixtures/`)
3. 핵심 플로우 테스트
   - PT: 예약 생성 → 산책 시작 → 산책 종료 → 리뷰 작성
   - PT: 산책사 검색 → 프로필 조회 → 즐겨찾기(B에서 같이 구현)
   - CC: 돌봄 예약 생성 → 체크인 → 세션 진행 → 체크아웃
   - CC: 돌봄사 검색 → 프로필 조회 → SOS 트리거
4. 목표: **각 앱 최소 8 suites · 30 tests pass**

### Milestone C — V1.1 트러스트/리텐션 (Day 8~14)
**목표:** 리텐션·재방문 직접 영향 항목 우선 구현.

| # | 기능 | 영향 | 우선순위 |
|---|---|---|---|
| C-1 | PT PO-10 즐겨찾기 산책사 + Quick Re-book | 재예약율 ↑, LTV 핵심 | **P0** |
| C-2 | PT PO-11 정기 산책 UI (Milestone A-4 백엔드 사용) | 결제 자동화 | **P0** |
| C-3 | CC PA-10 정기 케어 스케줄 (Milestone A-4 백엔드 공유) | 결제 자동화 | **P0** |
| C-4 | PT PO-12 산책 리포트 (route polyline + 거리·시간·사진) | 차별화 USP "산책이 보인다" | **P0** |
| C-5 | CC PA-11/CG-08 세션 리포트 (활동·식사·낮잠) | 차별화 USP "방문이 증명된다" | **P0** |
| C-6 | PT WK-09 사고 신고 폼 + 알림 | 운영 리스크 ↓ | P1 |
| C-7 | CC CG-10 사고 신고 폼 + SOS 연계 | 운영 리스크 ↓ | P1 |

### Milestone D — 백엔드 테스트 + 도메인 분리 (Day 15~18)
**목표:** PT/CC 백엔드 통합 테스트 0개 → 핵심 API 회귀 안전망.
1. `tests/integration/test_pettracker_e2e.py` — 예약·산책·리뷰·정산 사이클
2. `tests/integration/test_careconnect_e2e.py` — 예약·체크인·세션·정산 사이클
3. `tests/unit/test_pt_commission.py`, `test_cc_commission.py` — 수수료 산정 (15% / 20%)
4. `pettracker/` 모듈 분리 검토 — `pet_profiles`, `walker_profiles`, `booking`, `walk_session`, `review` 5파일 분리 (선택, 변경량 크면 D-2 단계로 분리)

### Milestone E — 공유 인프라 이식 (Day 19~22)
**목표:** SafeWay에서 검증된 인프라를 `packages/core-mobile`로 끌어올림.
1. `hooks/useAuth`, `useGpsTracking`, `useNotifications` → core-mobile로 이전 + PT/CC 적용
2. `utils/format.ts` (날짜·금액·주소·전화) → core-mobile
3. `i18n/` 한국어 리소스 분리 + 영어 stub (출시 후 추가 언어 가능 구조)
4. `components/` 공통 EmptyState/ErrorBoundary/LoadingSkeleton (이미 DatePickerModal 패턴 따름)
5. WebSocket 클라이언트 hook → PT 산책 라이브 위치, CC 세션 진행 상황 (폴링 → push)

### Milestone F — Admin Web (Day 23~28, 선택)
**목표:** 운영자가 DB 직접 조회 없이 PT/CC 관리 가능.
1. `web/src/pages/pettracker/` — 산책사 승인 큐, 활성 산책 모니터링, 분쟁(AD-04 일부)
2. `web/src/pages/careconnect/` — 돌봄사 승인 큐, 활성 세션 모니터링, 동의 감사(CA-06)
3. SafeWay Kids 플랫폼 관리자 패턴 그대로 사용

### Milestone G — P3 제외 3건 별도 spec (Day 29+, 선택)
- 그룹 산책 다중 펫 가격 (PT)
- 다중 아동 한 예약 (CC)
- CC parent 측 실시간 지도

---

## 4. 의존성 그래프

```
Phase 0 (베이스라인)
  └─ Milestone A (잔여 5건) ─┐
                              ├─ Milestone C (V1.1, A-3/A-4 의존)
  └─ Milestone B (모바일 테스트) ─┤
                              ├─ Milestone D (백엔드 테스트)
                              └─ Milestone E (공유 인프라)
                                  └─ Milestone F (Admin Web, 선택)
                                  └─ Milestone G (P3 spec, 선택)
```

**Critical path:** Phase 0 → A → C(P0) → B(병렬 가능) → D → 출시 가능 상태

---

## 5. Acceptance Criteria (closure 기준)

| 마일스톤 | 통과 조건 |
|---|---|
| Phase 0 | 베이스라인 verification 문서 작성, 깨진 항목 명시 |
| A | 5건 모두 VERIFIED, TS 0 errors, 수동 회귀 체크리스트 통과 |
| B | PT 8 suites + CC 8 suites pass, CI 통합(있다면) |
| C | C-1~C-5 (P0 5건) 모두 VERIFIED, 사용자 시나리오 테스트 통과 |
| D | PT/CC 통합 테스트 각 5+ pass, commission 단위 테스트 pass |
| E | 공유 hook/util/i18n 적용 후 PT/CC 화면 5+개 코드 라인 ↓ 확인 |
| F | 산책사·돌봄사 승인 플로우 web에서 가능, 활성 세션 모니터링 동작 |
| G | 별도 Tech Spec 3건 작성, 우선순위 결정 |

---

## 6. Assumption Register
1. SafeWay Kids 샌드박스 워크스트림은 별도 진행되며 본 계획과 충돌하지 않음.
2. 백엔드 DB 스키마는 PT/CC 동시 마이그레이션 가능 (Alembic single head).
3. S3 (또는 호환 객체스토리지) 자격증명은 환경 변수로 주입 가능.
4. WebSocket 인프라(M4)는 PT/CC에서 재사용 가능한 일반 채널 구조.
5. 사용자는 출시 전 Pre-launch QA에 1~2일 사용 가능.

## 7. Open Questions
1. **Q1**: V1.1 즐겨찾기·정기예약을 PT/CC 동시 출시할지, PT 먼저 출시 후 CC 별도 진행할지?
2. **Q2**: S3 호환 객체스토리지(AWS / Naver Cloud / R2)는 어디로?
3. **Q3**: Milestone F(Admin Web)는 출시 전 필수인가, 출시 후 V1.1.5로 미룰 수 있나?
4. **Q4**: WebSocket 실시간 도입은 출시 전 필수인가, V1.1.5 이후인가?
5. **Q5**: 사고 신고(C-6/C-7)는 보험 청구·법적 신고 의무와 연계해야 하는가? (legal 검토 필요)

## 8. Risks
| 리스크 | 심각도 | 완화책 |
|---|---|---|
| 5주 일정에 너무 많은 작업 압축 | HIGH | Milestone F·G를 출시 후로 분리 가능하게 설계 |
| 모바일 테스트 셋업 호환성 (RN 79 + Expo SDK 54) | MED | 먼저 Hello World suite로 셋업 검증 (Day 4 첫 1시간) |
| S3 마이그레이션 시 기존 로컬 프리뷰 호환 | LOW | 신규 업로드는 S3, 기존 로컬은 그대로 표시 |
| RRULE 라이브러리 선정 (rrule.js vs custom) | LOW | rrule.js 채택, 라이선스 확인 |
| Admin Web 디자인 시스템 격차 | MED | SafeWay 플랫폼 관리자 패턴 100% 재사용 |

---

## 9. 다음 정확한 첫 단계

```
Phase 0 시작 — 베이스라인 검증
1. 백엔드 pytest 풀런 (backend/.venv 활성 후 pytest -q)
2. PT 모바일 tsc --noEmit
3. CC 모바일 tsc --noEmit
4. SafeWay 모바일 Jest (회귀 베이스라인)
5. 결과를 artifacts/verification/2026-04-24-baseline-pt-cc.md로 기록
```

> **승인 게이트:** 사용자가 본 계획에 동의 + Open Questions Q1~Q5 응답 → Phase 1(독립 리뷰) 진행 → 최종 Tech Spec 확정 후 Milestone A 착수.
