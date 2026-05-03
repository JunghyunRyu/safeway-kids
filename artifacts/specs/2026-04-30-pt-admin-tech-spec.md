# PT Admin Page — Final Tech Spec

- **Date**: 2026-04-30
- **Phase**: Phase 3 — Final Tech Spec
- **Status**: APPROVED (auto mode, 4 reviewer consensus)
- **Owner**: jhryu (1인 운영자)
- **Workstream**: PT V1.0 출시 (~2026-06-04) 보조 트랙
- **Consensus Matrix**: [`artifacts/reviews/2026-04-30-pt-admin-consensus-matrix.md`](../reviews/2026-04-30-pt-admin-consensus-matrix.md)

---

## 1. Problem Statement

PT(PetTracker) 출시 후 1인 운영자(jhryu 본인)는 ① 워커 자격 승인 ② 결제 분쟁 환불 ③ 워커 출금 요청 처리를 매일 수동으로 해야 한다. 현재 어드민 UI가 없어 DB 직접 조회 또는 curl 호출로만 처리 가능하며, 외부 미팅·이동 중 대응이 막힌다. 또한 신규 어드민 액션이 `AuditLog`에 기록되지 않아 분쟁 발생 시 책임 소재 추적이 불가능하다.

## 2. Goals / Non-goals

### Goals
- 1인 운영자가 PT 핵심 운영 액션(워커 승인 / 환불 / 출금 처리)을 모바일 + 데스크톱 브라우저에서 수행
- 모든 어드민 액션을 `AuditLog` immutable 기록 (운영·법적 추적성)
- 학원 어드민과 도메인 분리 (사이드바 / 라우트 / 메뉴 격리)
- 출시 전 critical path를 침범하지 않는 범위 내 Day-1 최소 기능 출시

### Non-goals
- PT 어드민 전용 RBAC role 신설 (`platform_admin` 재사용)
- 별도 어드민 패키지·도메인·서버 분리 (`web/` 동일 SPA)
- 사고신고 페이지 풀 구현 (Milestone D 의존, V1.0+1주에 연결)
- 모바일 어드민 앱 (브라우저 반응형으로 충당)

## 3. User Scenarios

### S1 — 월요일 아침 9:00 운영 점검 (Day-1)
운영자가 노트북을 연다 → 로그인 → `/pettracker/dashboard` 진입 → 상단 RED/AMBER/GREEN 카드 4개로 위급 신호 1초 인지 → 워커 승인 7명 AMBER → "큐 열기" 클릭 → 7명 처리 (10분 내).

### S2 — 점심 12:30 환불 요청 (Day-1)
견주가 카톡으로 환불 요청 → `/pettracker/payments`에서 booking_id 검색 → 결제 카드 클릭 → ConfirmDialog 1단계로 환불 확정 → PortOne 환불 API 호출 → 토스트 성공 → AuditLog 기록.

### S3 — 저녁 18:00 출금 처리 (Day-1)
워커들이 그날 출금 요청 → `/pettracker/withdrawals`에서 pending 목록 + 은행/계좌 노출 → 운영자가 별도 은행 앱에서 이체 → "처리 완료" 마킹 → status=`completed` 업데이트.

### S4 — Milestone D 이후 사고신고 (V1.0+1주)
산책 중 사고 → 견주 PT 모바일 앱에서 신고 → 어드민 브라우저 Push 알림 → 사고 상세 페이지 (GPS 지도 + 양측 연락처 + 사진) → "전화 걸기" 1탭 → 메모 추가 + status 변경.

## 4. Functional Requirements

### FR-1 — Day-1 화면 (4개)

**FR-1.1 운영 현황 대시보드** (`/pettracker/dashboard`)
- 상단 알림 허브: RED(사고신고 placeholder) / AMBER(워커 승인 대기) / RED(분쟁 결제) / GREEN(활성 산책)
- KPI 카드 5개: 대기 워커, 진행 산책, 당일 완료 예약, 당월 누적 커미션, 환불 미처리
- 최근 알림 피드 5건 (read-only)

**FR-1.2 워커 승인 큐** (`/pettracker/walkers/pending`)
- 좌측: 신청자 목록 (`approval_status=pending`) + 보험 만료 임박 배지
- 우측: 서류 인라인 뷰어 (PDF iframe + 이미지 `<img>`)
- 액션: 승인 버튼 / 반려 버튼 (preset 5개 사유 + 자유 입력)
- 반려 시 워커 FCM Push 자동 발송 (사유 포함)

**FR-1.3 결제 목록 + 환불** (`/pettracker/payments`)
- 테이블: amount / status / paid_at / imp_uid / booking owner / walker
- 필터: status, 날짜 범위
- 환불 액션: ConfirmDialog 1단계 (전액/부분 + 사유) → `POST /pt/admin/payments/{id}/refund`
- 부분 환불 input의 `max=` 속성으로 결제액 초과 차단

**FR-1.4 출금 요청 큐** (`/pettracker/withdrawals`)
- pending withdrawal 목록 + `WalkerWallet.bank_name/bank_account/account_holder` 노출
- "처리 완료" 마킹 → status=`completed`
- 마킹 시 운영자 메모 입력 (선택)

### FR-2 — 백엔드 신규 endpoint (Day-1, 5개)

| ID | Method | Path | 설명 | AuditLog |
|---|---|---|---|---|
| FR-2.1 | GET | `/pt/admin/walkers/pending` | pending 워커 목록 + 서류 URL | ❌ (read-only) |
| FR-2.2 | GET | `/pt/admin/payments` | 결제 목록 + filter | ❌ |
| FR-2.3 | POST | `/pt/admin/payments/{id}/refund` | 어드민 강제환불 (PortOne API 연동) | ✅ `entity_type="pt_payment"` |
| FR-2.4 | GET | `/pt/admin/withdrawals/pending` | 출금 대기 목록 | ❌ |
| FR-2.5 | POST | `/pt/admin/withdrawals/{id}/complete` | 처리 완료 마킹 | ✅ `entity_type="pt_withdrawal"` |

기존 `POST /pt/admin/walkers/{id}/approve`에도 AuditLog 기록 추가 (FR-2.6).

### FR-3 — V1.0+1주 (출시 후 1주 내)
- FR-3.1 사고신고 관리 페이지 (`/pettracker/incidents`) — Milestone D 모델 의존
- FR-3.2 활성 산책 지도 (`/pettracker/walks/active`) — Leaflet WebView 패턴 재사용
- FR-3.3 결제 환불 분쟁 Timeline 뷰 (양측 timeline 나란히 보기)
- FR-3.4 예약/산책 세션 목록 (`/pettracker/bookings`) — status/날짜/walker 필터
- FR-3.5 신규 endpoint: `GET /pt/admin/walks/active`, `GET /pt/admin/incidents`

### FR-4 — V1.1+
- FR-4.1 워커 평점 분포 페이지
- FR-4.2 월별 정산 CSV 다운로드
- FR-4.3 어드민 AuditLog 조회 UI
- FR-4.4 retroactive `approve_walker` AuditLog 추가 (별도 마이그레이션)
- FR-4.5 `active_walks` KPI 정확도 fix (WalkSession join)

## 5. Non-functional Requirements

| ID | NFR | 측정 |
|---|---|---|
| NFR-1 | 환불 처리는 클릭 후 5초 이내 PortOne API 응답 | 95p latency |
| NFR-2 | 7일 이내 환불 의무 (소비자분쟁해결기준) | 운영 SLA |
| NFR-3 | AuditLog 기록은 fail-closed (실패 시 액션 자체 롤백) | 단위 테스트 |
| NFR-4 | 모바일 브라우저(iOS Safari / Chrome Android) 반응형 | manual QA |
| NFR-5 | 신규 페이지마다 Vitest test suite 동반, 기존 50 passed 회귀 0 | CI 게이트 |
| NFR-6 | 어드민 endpoint 인증은 `require_platform_admin` 동일 | RBAC 단위 테스트 |
| NFR-7 | PT 어드민 메뉴는 학원 어드민 사이드바에 추가하지 않음 (도메인 분리) | UI review |

## 6. Constraints

- 기존 `web/` 패키지 안에서 작업 (별도 패키지 신설 금지)
- 기존 axios client + interceptor + Tailwind v4 + Recharts 그대로 재사용
- shadcn/ui 도입 금지 (기존 자체 컴포넌트 일관성 유지)
- React Router v7 동일 버전 (App.tsx 33-88 라우트 추가만)
- 백엔드 `app_context` 헤더는 미사용 — `require_platform_admin`이 모든 앱 초월

## 7. Architecture / Data Flow

```
Browser (web/)
  └─ /pettracker/* routes
       ├─ Layout.tsx (재사용, ptNavItems 추가)
       ├─ pages/pettracker/PtDashboardPage.tsx
       ├─ pages/pettracker/PtWalkersPendingPage.tsx
       ├─ pages/pettracker/PtPaymentsPage.tsx
       └─ pages/pettracker/PtWithdrawalsPage.tsx
            │ axios POST/GET
            ▼
Backend (FastAPI /api/v1/pt/admin/*)
  ├─ router.py (admin section 신규 5 endpoint)
  ├─ service.py (admin_service.py 신규 분리 권장)
  ├─ models.py (변경 없음)
  └─ AuditLog 기록 (modules/admin/models.py:44 재사용)
```

## 8. Interfaces

### API 응답 스키마 예시 (FR-2.1)
```json
GET /api/v1/pt/admin/walkers/pending
[
  {
    "user_id": "uuid",
    "name": "김수연",
    "background_check_doc_url": "https://s3.../...",
    "certification_doc_url": "https://s3.../...",
    "insurance_expiry": "2026-06-15",
    "experience_years": 3,
    "created_at": "2026-04-29T08:55:00Z"
  }
]
```

### Frontend route 등록 (App.tsx:55+)
```tsx
{user.role === 'platform_admin' && (
  <>
    <Route path="/pettracker/dashboard" element={<PtDashboardPage/>} />
    <Route path="/pettracker/walkers/pending" element={<PtWalkersPendingPage/>} />
    <Route path="/pettracker/payments" element={<PtPaymentsPage/>} />
    <Route path="/pettracker/withdrawals" element={<PtWithdrawalsPage/>} />
  </>
)}
```

### 사이드바 신규 항목 (Layout.tsx)
`ptNavItems` 배열을 `navItems`와 분리. 기존 학원 어드민 메뉴 11개는 손대지 않음. PT 섹션 헤딩으로 시각적 분리.

## 9. Edge Cases

| 케이스 | 처리 |
|---|---|
| 환불 시 PortOne API 실패 | `PtPayment.status` 변경하지 않고 toast 에러 + AuditLog `result="failed"` |
| 부분 환불 금액이 결제액 초과 | 프론트 `max=` + 백엔드 422 거절 (이중 방어) |
| 워커 승인 중 동시 처리 (multi-tab) | DB 레벨 `approval_status='pending'` 체크 → 이미 처리됨 422 |
| 출금 처리 마킹 후 실제 이체 실패 | 운영자가 "되돌리기" 가능 (V1.1+) — Day-1은 마킹 후 변경 불가, 메모로만 기록 |
| 어드민 미로그인 상태에서 `/pettracker/*` 직접 접근 | axios interceptor 401 → `/login` 리다이렉트 (기존 패턴) |
| 사고신고 placeholder 클릭 | toast "Milestone D 진행 중. V1.0+1주 출시 예정" |

## 10. Failure Handling

- **백엔드 endpoint 5xx**: 토스트 (Toast.tsx 재사용) + 페이지 유지. 전체 SPA 리로드 회피.
- **PortOne API timeout 30s**: 클라이언트 측에서 30초 후 abort, AuditLog `result="timeout"`.
- **AuditLog 기록 실패**: DB 트랜잭션 rollback. 액션 자체 실패. (NFR-3)
- **WebSocket 미사용**: Day-1은 polling 5초. 활성 산책 지도(V1.0+1주)에서만 WS 도입.

## 11. Testing Strategy

### Backend (`backend/tests/`)
- `test_pt_admin_walkers_pending.py` — 200 응답 + role check (platform_admin only)
- `test_pt_admin_payments.py` — 환불 성공/PortOne 실패/AuditLog 기록 verify
- `test_pt_admin_withdrawals.py` — 처리 완료 마킹 + 권한 체크
- 기존 145 passed 회귀 0 보장

### Frontend (`web/src/__tests__/`)
- `PtDashboardPage.test.tsx` — RED/AMBER/GREEN 카드 + 클릭 동작
- `PtWalkersPendingPage.test.tsx` — 목록 렌더 + 승인/반려 모달
- `PtPaymentsPage.test.tsx` — 환불 ConfirmDialog 흐름
- `PtWithdrawalsPage.test.tsx` — 처리 완료 마킹 흐름
- 기존 50 passed 회귀 0 보장

### E2E (manual)
- 월요일 아침 시나리오 (S1) 1회 수동 실행
- 모바일 반응형: iPhone Safari + Chrome Android에서 사이드바 햄버거 + tel: 링크 동작 확인

## 12. Rollback Strategy

| 단계 | 롤백 방법 |
|---|---|
| 백엔드 endpoint | git revert + uvicorn reload. 기존 endpoint 영향 0. |
| 프론트 페이지 | git revert + Vite rebuild. 기존 학원 어드민 영향 0 (route 추가만). |
| AuditLog 추가 | DB 변경 없음 (기존 테이블 재사용). 코드만 revert. |
| RBAC 변경 | 미수행 (`require_platform_admin` 그대로) — 롤백 불필요. |

## 13. Acceptance Criteria

### Day-1 (4 화면 + 5 endpoint)
- [ ] `/pettracker/dashboard` 알림 허브 + KPI 5개 표시
- [ ] `/pettracker/walkers/pending` 목록 + 서류 인라인 뷰어 + 승인/반려 동작
- [ ] `/pettracker/payments` 결제 목록 + 환불 ConfirmDialog 동작
- [ ] `/pettracker/withdrawals` 출금 큐 + "처리 완료" 마킹
- [ ] 5 endpoint AuditLog 기록 verified (단위 테스트)
- [ ] backend 145 passed 회귀 0
- [ ] web 50+ passed 회귀 0
- [ ] TypeScript 0 errors
- [ ] Layout.tsx에 `ptNavItems` 추가, 학원 메뉴 변경 0건
- [ ] 모바일 반응형 (iPhone Safari + Chrome Android) 시각 검증

### V1.0+1주
- [ ] FR-3.1~5 모두 구현
- [ ] Milestone D 사고신고 모델과 통합

### V1.1+
- [ ] FR-4.1~5 모두 구현

## 14. Out of Scope

- PT 어드민 모바일 네이티브 앱
- 어드민용 별도 RBAC role 신설
- 학원 어드민과의 사이드바 통합
- 자동화된 워커 승인 (AI/규칙 엔진)
- 자동 이체 (출금)
- 다국어 (영어 어드민 UI)

## 15. Code Impact Map

| 파일 | 변경 유형 | LOC 추정 |
|---|---|---|
| `web/src/App.tsx` | 라우트 4개 추가 | +20 |
| `web/src/components/Layout.tsx` | `ptNavItems` 추가, role 분기 | +30 |
| `web/src/pages/pettracker/PtDashboardPage.tsx` | 신규 | ~250 |
| `web/src/pages/pettracker/PtWalkersPendingPage.tsx` | 신규 | ~300 |
| `web/src/pages/pettracker/PtPaymentsPage.tsx` | 신규 | ~280 |
| `web/src/pages/pettracker/PtWithdrawalsPage.tsx` | 신규 | ~200 |
| `web/src/api/pettracker.ts` (선택) | 신규 — 또는 페이지 인라인 | ~100 |
| `web/src/__tests__/Pt*Page.test.tsx` | 신규 4개 | ~400 |
| `backend/app/apps/pettracker/router.py` | admin section 5 endpoint 추가 | +120 |
| `backend/app/apps/pettracker/admin_service.py` | 신규 (분리 권장) | ~250 |
| `backend/tests/test_pt_admin_*.py` | 신규 3개 | ~300 |
| **합계** | — | **~2,250 LOC** |

## 16. Dependencies

| 의존 | 상태 |
|---|---|
| Milestone C 모바일 트랙 (C-13/C-14) 완료 | 🟡 진행 중 (Active) |
| Milestone D 사고신고 모델 | 🟡 미착수 (V1.0+1주에 필요) |
| PortOne 가맹점 계약 | 🟡 외부 (사용자 작업) |
| FCM service account | 🟡 외부 (사용자 작업, B-9) |
| 기존 `AuditLog` 모델 (`modules/admin/models.py:44`) | ✅ 재사용 |

## 17. Assumption Register

| ID | 가정 | 검증 방법 |
|---|---|---|
| A-1 | 운영자 = `platform_admin` 단일 계정 | jhryu 본인만 사용 |
| A-2 | PortOne 환불 API는 `imp_uid` 기준 cancel 지원 | 기존 `service.py` cancel_payment 참조 |
| A-3 | `WalkerQualification.background_check_doc_url`이 PDF/이미지 직접 노출 가능한 S3 presigned URL | 기존 storage 모듈 (Milestone C-7) 검증됨 |
| A-4 | Day-1 ~3.5일 작업이 6/4 출시를 위협하지 않음 | Milestone G 직전 또는 병행 |

## 18. Open Questions (Phase 4 진입 전 확인)

1. **Milestone C 잔여 작업 완료 vs 어드민 병행 진행** — 사용자 결정 필요
2. **Day-1 작업을 별도 Milestone H로 분리할지, 기존 Milestone G에 흡수할지**
3. **`web/src/api/pettracker.ts` 신규 파일 생성 vs 페이지 인라인 axios** — Day-1은 페이지 인라인, V1.0+1주에 추출 권고

---

## 19. Approval

- ✅ Explore (web/ 패턴): 합의
- ✅ backend-dev (API gap): 합의 (출시 후 권고는 PM이 뒤집음)
- ✅ product-manager (user story): 핵심 결정자
- ✅ ux-advocate (workflow): UI 디자인 결정자

**Phase 3 → Phase 4 진입 승인. Todo Plan 작성 시작.**
