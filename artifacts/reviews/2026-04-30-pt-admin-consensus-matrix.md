# PT Admin Page — Consensus Matrix

- **Date**: 2026-04-30
- **Phase**: Phase 2 — Consensus
- **Reviewers**: Explore (web/ patterns) · backend-dev (API gap) · product-manager (user stories) · ux-advocate (workflow)
- **Source agent outputs**: 4건 (이번 세션 내 task notification으로 수집)
- **Decision**: PT 어드민 페이지를 `web/`에 신규 추가. Day-1 / V1.0+1주 / V1.1+ 3-stage 분할.

---

## 1. 합의 사항 (3 reviewer 이상 일치)

| 합의 항목 | 근거 reviewer | 비고 |
|---|---|---|
| **B안 — `web/src/pages/pettracker/` 서브디렉토리 + `/pettracker/*` 라우트** | Explore (강추) · UX (사이드바 별도 `ptNavItems` 권고) · PM (도메인 이질성 인정) | 현재 학원 어드민 11개 메뉴와 분리. Layout.tsx 단일 수정으로 양쪽 네비 병존. |
| **기존 학원 어드민 컴포넌트 재사용** | Explore · UX | KpiCard, StatusPieChart, ConfirmDialog, FormModal, DataTable 모두 재사용. shadcn 미도입 유지. |
| **axios client + interceptor 재사용** | Explore · backend-dev | `web/src/api/client.ts:1-83` baseURL=`/api/v1`. 별도 PT API 클라이언트 불필요. |
| **신규 어드민 endpoint 5건 (P1)** | backend-dev (5건) · PM (Day-1=3건, +1주=2건) | `pending walkers / payments list / admin refund / active walks / withdrawal queue`. |
| **AuditLog 기록은 신규 endpoint 부터 의무** | backend-dev (큰 약점 지적) · UX (immutability 필수) · PM (V1.1 UI지만 백엔드는 처음부터) | 기존 `approve_walker`도 retroactive 추가 권고. |
| **Vitest + React Testing Library 패턴 유지** | Explore · backend-dev (기존 145 passed 회귀 0 정책) | 신규 페이지마다 *.test.tsx 동반. |
| **모바일 어드민 접근성 보장** | UX (1인 운영자 외출 시) · PM (CS 대응) | Layout.tsx의 햄버거 메뉴 패턴 유지, 사고신고에 `tel:` 네이티브 링크. |

---

## 2. 충돌 + Resolution

### Conflict 1 — 어드민이 출시 전 필요한가? (가장 큰 충돌)

| Reviewer | 입장 | 근거 |
|---|---|---|
| backend-dev | ❌ 출시 후로 미뤄도 OK | curl + DB 직접 접근으로 초기 운영 가능. critical path 침범 회피. |
| PM | ✅ Day-1 3건 필수 | (a) 워커 승인 없이 견주 노출 안 됨 = 온보딩 차단. (b) 7일 환불 의무(소비자분쟁해결기준). (c) V1.0 무자동이체 = 출금 큐 수동 처리 필수. |
| UX | ✅ P0 3 화면 (사고신고 포함) | 1인 운영자가 외부 미팅 중 워커 신청 들어오면 첫인상 망가짐. |

**Resolution**: **PM/UX 우세 (2:1)**. Day-1 3건 critical path 진입.
- 워커 승인 큐 (M, 1~2일)
- 결제/환불 (M, 1~2일)
- 출금 요청 큐 (S, 0.5일)
- **합계 ~3.5일** — Milestone G(Pre-launch QA) 기간에 병행 가능 추정.

### Conflict 2 — 사고신고 어드민

| Reviewer | 입장 | 근거 |
|---|---|---|
| PM | V1.0+1주 (Milestone D 의존) | 사고신고 모델 자체가 미구현. PM은 의존성 차단을 우선. |
| UX | P0 Day-1 화면 | 위치정보법·동물보호법 잠재 의무, 알림 허브에 RED 슬롯 필요. |
| backend-dev | "Milestone D 미착수" 상태 보고 | `IncidentReport` 모델/테이블 미존재. |

**Resolution**: **PM 우세 (의존성)**. Day-1에서는 UX의 First Screen "사고신고 슬롯"을 **placeholder**로 두되, 클릭 시 "Milestone D 진행 중" toast. Milestone D 완료 직후 전체 사고신고 페이지를 실연결.

### Conflict 3 — 결제 환불 UI 깊이

| Reviewer | 입장 |
|---|---|
| PM | Day-1 단순 환불 버튼 + 사유 입력 (전액/부분 구분) |
| UX | 양측(견주/워커) Timeline 나란히 보기 + 부분 환불 2단계 ConfirmDialog |

**Resolution**: **Day-1 = PM (단순)**, **V1.0+1주 = UX (Timeline 통합)**. Day-1은 결제 목록 + ConfirmDialog 단일 단계로 출시. Timeline 시각화는 출시 후 1주 내 추가.

### Conflict 4 — First Screen 디자인

| Reviewer | 입장 |
|---|---|
| backend-dev | 기존 `/pt/admin/dashboard` KPI 5개 그대로 노출 |
| PM | KPI 카드 5개 (대기 워커 / 진행 산책 / 당일 완료 / 당월 커미션 / 환불 미처리) |
| UX | RED/AMBER/GREEN 알림 허브 + "최근 알림 5건" 피드 |

**Resolution**: **합성**. 상단 RED/AMBER/GREEN 카드 4개(UX) + 그 아래 KPI 카드(PM/backend-dev) + "최근 알림" 피드(UX). 첫 화면 1초 인지 = UX, 5분 운영 점검 = PM/backend.

### Conflict 5 — AuditLog 누락

| Reviewer | 입장 |
|---|---|
| backend-dev | 기존 `approve_walker`가 audit 안 남김 = 운영/법적 위험 |
| PM | V1.1+ Nice-to-Have (UI는) |
| UX | append-only 사고신고 audit log를 P0에 명시 |

**Resolution**: **백엔드는 Day-1 의무**, **UI는 V1.1+ (조회 페이지)**. Day-1 신규 endpoint 5건 + 기존 `approve_walker`까지 모두 `AuditLog` 기록. 운영자가 UI에서 audit 조회는 V1.1+로 이연.

### Conflict 6 — `active_walks` KPI 정확도 버그

| Reviewer | 입장 |
|---|---|
| backend-dev | `PtBooking.status='in_progress'` count는 `WalkSession` 실제 시작과 분리됨. KPI 미묘하게 불일치. |
| PM/UX | 미언급 |

**Resolution**: **Day-1 hygiene fix 포함**. `service.py`에서 `WalkSession` join으로 정확도 개선. 별도 sub-task로 분리.

---

## 3. Risk Register

| Risk | 영향 | 완화 |
|---|---|---|
| Day-1 3건 작업이 PT 모바일 critical path(C-13/C-14)를 침범 | PT 출시 6/4 지연 | Milestone C 모바일 트랙 완료 후 진행. 또는 Milestone G(Pre-launch QA)와 병행. |
| AuditLog 추가가 기존 `approve_walker` 회귀 유발 | backend 145 passed 깨짐 | 별도 PR + retroactive 변경은 V1.1+로 분리. Day-1은 신규 endpoint만 audit. |
| `pt_admin` role 도입이 RBAC 충돌 | 기존 platform_admin과 권한 중복 | 별도 role 도입 안 함. `require_platform_admin` 그대로 사용. UI에서만 PT 메뉴 표시 분기. |
| First Screen "사고신고 placeholder" UX 불일치 | 운영자 혼란 | 명시적 toast "Milestone D 진행 중" 표시. 빈 화면 회피. |
| 기존 학원 어드민 회귀 | web/ 50 passed 깨짐 | Layout.tsx 수정 시 학원 메뉴 변경 0건 보장. PT 메뉴는 추가만. |

---

## 4. Open Questions (Final Tech Spec 작성 시 결정 필요)

1. **사이드바 진입점**: PT 어드민 메뉴를 학원 어드민 사이드바에 통합할지, 별도 "PT 모드 전환" 토글로 분리할지?
2. **로그인 분기**: 기존 platform_admin 계정 그대로 사용할지, PT 전용 진입점(`/pt-admin/login`) 신설할지?
3. **첫 사용자 시나리오**: 운영자가 처음 진입했을 때 데모 데이터 또는 온보딩 가이드 필요한지?
4. **사고신고 Milestone D와의 인터페이스 계약**: 사고 신고 모델 `IncidentReport` 스키마 윤곽 — Tech Spec D에서 정의되어야 함.

---

## 5. Decision Summary

| 항목 | 결정 |
|---|---|
| 추진 여부 | ✅ 진행 |
| 위치 | `web/src/pages/pettracker/` (B안) |
| Day-1 범위 | 워커 승인 큐 + 결제/환불 + 출금 큐 + 알림 허브 대시보드 (4 화면) |
| V1.0+1주 범위 | 사고신고 관리 + 예약/산책 목록 + 환불 분쟁 Timeline 시각화 |
| V1.1+ 범위 | 평점 분포 + 월별 정산 CSV + 어드민 audit 조회 UI |
| 백엔드 endpoint | Day-1 신규 3건 + V1.0+1주 2건 + AuditLog 의무화 + active_walks KPI fix |
| 시점 | Milestone C(모바일) 완료 후 또는 Milestone G(Pre-launch QA)와 병행 |
| Tech Spec 산출 | 즉시 작성 (`artifacts/specs/2026-04-30-pt-admin-tech-spec.md`) |
