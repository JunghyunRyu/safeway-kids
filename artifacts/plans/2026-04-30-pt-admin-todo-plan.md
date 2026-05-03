# PT Admin Page — Todo Plan

- **Date**: 2026-04-30
- **Phase**: Phase 4 — Todo Plan
- **Final Tech Spec**: [`artifacts/specs/2026-04-30-pt-admin-tech-spec.md`](../specs/2026-04-30-pt-admin-tech-spec.md)
- **Total Day-1 estimate**: ~3.5 영업일 (28 hours)
- **Stage breakdown**: Day-1 (4 화면 + 5 endpoint) → V1.0+1주 → V1.1+

---

## Stage A — Day-1 Critical (출시 전 필수, ~3.5 영업일)

### A-1 백엔드 endpoint 5개 + AuditLog (1.5일)

| # | Task | 파일 | LOC | 시간 |
|---|---|---|---|---|
| A-1.1 | `admin_service.py` 신규 분리 (admin 전용 service 함수 모음) | `backend/app/apps/pettracker/admin_service.py` | ~250 | 2h |
| A-1.2 | `GET /pt/admin/walkers/pending` endpoint + service | `router.py` + `admin_service.py` | +50 | 1.5h |
| A-1.3 | `GET /pt/admin/payments` endpoint + filter | `router.py` + `admin_service.py` | +60 | 2h |
| A-1.4 | `POST /pt/admin/payments/{id}/refund` + PortOne 연동 + AuditLog | `router.py` + `admin_service.py` | +80 | 3h |
| A-1.5 | `GET /pt/admin/withdrawals/pending` | `router.py` + `admin_service.py` | +40 | 1h |
| A-1.6 | `POST /pt/admin/withdrawals/{id}/complete` + AuditLog | `router.py` + `admin_service.py` | +50 | 1.5h |
| A-1.7 | 단위 테스트 3개 (`test_pt_admin_*.py`) | `backend/tests/` | ~300 | 2h |

**A-1 Verification gate**: backend `pytest` 145 → ~155 passed (회귀 0). AuditLog 기록 verified.

### A-2 프론트 페이지 4개 + 라우트 + Layout 수정 (1.5일)

| # | Task | 파일 | LOC | 시간 |
|---|---|---|---|---|
| A-2.1 | `App.tsx` 라우트 4개 추가 (role 분기) | `web/src/App.tsx` | +20 | 0.5h |
| A-2.2 | `Layout.tsx`에 `ptNavItems` 추가, 학원 메뉴 보존 | `web/src/components/Layout.tsx` | +30 | 1h |
| A-2.3 | `PtDashboardPage.tsx` — RED/AMBER/GREEN + KPI 5 + 알림 피드 | `web/src/pages/pettracker/` | ~250 | 4h |
| A-2.4 | `PtWalkersPendingPage.tsx` — 좌목록/우뷰어 + 승인/반려 모달 | 동 | ~300 | 5h |
| A-2.5 | `PtPaymentsPage.tsx` — 테이블 + 필터 + 환불 ConfirmDialog | 동 | ~280 | 4h |
| A-2.6 | `PtWithdrawalsPage.tsx` — 출금 큐 + 처리 완료 마킹 | 동 | ~200 | 3h |
| A-2.7 | Vitest 4 test suite | `web/src/__tests__/` | ~400 | 3h |

**A-2 Verification gate**: web `vitest` 50 → ~58 passed (회귀 0). TS 0 errors.

### A-3 통합 검증 + 모바일 반응형 (0.5일)

| # | Task | 시간 |
|---|---|---|
| A-3.1 | E2E 시나리오 1 (월요일 아침) 수동 실행 | 1h |
| A-3.2 | E2E 시나리오 2 (점심 환불) 수동 실행 | 1h |
| A-3.3 | E2E 시나리오 3 (저녁 출금) 수동 실행 | 1h |
| A-3.4 | iPhone Safari + Chrome Android 반응형 시각 검증 | 1h |

**A-3 Verification gate**: `artifacts/verification/2026-XX-XX-pt-admin-day1-verification.md` 생성, 모든 acceptance criteria 체크.

---

## Stage B — V1.0+1주 (출시 후 1주 내)

| # | Task | 의존성 | 시간 |
|---|---|---|---|
| B-1 | `PtIncidentsPage.tsx` (사고신고 관리) | Milestone D 사고신고 모델 | 6h |
| B-2 | `PtActiveWalksMapPage.tsx` (Leaflet 활성 산책 지도) | `GET /pt/admin/walks/active` endpoint | 5h |
| B-3 | 결제 환불 분쟁 Timeline 통합 뷰 (PtPaymentsPage 확장) | A-2.5 | 4h |
| B-4 | `PtBookingsPage.tsx` (예약/산책 목록 + 필터) | — | 5h |
| B-5 | 백엔드: `GET /pt/admin/walks/active`, `GET /pt/admin/incidents` | Milestone D | 4h |
| B-6 | Vitest test suite 4건 추가 | B-1~B-5 | 3h |

**B Verification gate**: 추가 4 화면 + 2 endpoint, web ~62 passed, backend ~158 passed.

---

## Stage C — V1.1+ (출시 후 1개월+)

| # | Task | 시간 |
|---|---|---|
| C-1 | `PtWalkerRatingsPage.tsx` (평점 분포 히스토그램) | 6h |
| C-2 | `PtSettlementReportPage.tsx` (월별 정산 CSV 다운로드) | 4h |
| C-3 | `PtAuditLogPage.tsx` (어드민 audit 조회) | 5h |
| C-4 | `approve_walker` retroactive AuditLog 추가 | 1h |
| C-5 | `active_walks` KPI 정확도 fix (WalkSession join) | 2h |

---

## 진행 시점 결정 (Open Question 1)

### Option α — Milestone C 완료 후 진행
- 장점: PT 모바일 critical path 침범 0
- 단점: 출시 D-day와 겹쳐 ~3.5일 슬립 위험
- 권고: Milestone C가 D-25 이내 완료될 경우 채택

### Option β — Milestone G(Pre-launch QA)와 병행
- 장점: 어드민 + 모바일 QA가 같은 시점 → 통합 테스트 효율
- 단점: 1인 작업자가 두 트랙 병행 시 컨텍스트 스위치 비용
- 권고: Milestone C가 D-15 이내까지 미완료 시 채택

### Option γ — 출시 후 V1.0.1로 분리
- 장점: 출시 무결점
- 단점: 출시 첫 1주가 운영자에게 가장 어려움
- 권고: 비추천 (PM 결정 정면 위배)

**Default 선택**: Option α — Milestone C 완료 직후 시작. C-13/C-14 마무리 시점에 사용자 재확인.

---

## 회귀 가드 (모든 Stage 공통)

```bash
# 백엔드
cd backend && pytest -x

# 프론트
cd web && npm run test && npm run typecheck

# E2E (수동)
# Day-1 시나리오 S1/S2/S3 실행
```

회귀 0 보장 필수. Test failure 시 stage 진행 정지.

---

## Verification Report 위치

| Stage | 파일 |
|---|---|
| A-1 | `artifacts/verification/2026-XX-XX-pt-admin-backend-verification.md` |
| A-2 | `artifacts/verification/2026-XX-XX-pt-admin-frontend-verification.md` |
| A-3 | `artifacts/verification/2026-XX-XX-pt-admin-day1-verification.md` |
| B | `artifacts/verification/2026-XX-XX-pt-admin-stage-b-verification.md` |
| C | `artifacts/verification/2026-XX-XX-pt-admin-stage-c-verification.md` |

---

## Phase 4 → Phase 5 진입 조건

- ✅ Final Tech Spec 승인 완료
- ✅ Todo Plan 승인 완료 (이 문서)
- 🟡 사용자 결정: 진행 시점 (α/β/γ)
- 🟡 사용자 결정: A-1과 A-2를 직렬 vs 병렬 처리

**Phase 5 Implementation 시작 전 사용자 confirmation 필수 (auto mode 예외 — destructive 아님이지만 ~3.5일 작업 트리거).**
