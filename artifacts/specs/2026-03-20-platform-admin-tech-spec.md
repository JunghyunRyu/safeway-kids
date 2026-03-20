# Final Tech Spec: 플랫폼 운영자 대시보드

**작성일:** 2026-03-20
**상태:** APPROVED

---

## 아키텍처

기존 web/ 앱에 역할 분기를 추가:
- `academy_admin` 로그인 → 기존 학원 관리 페이지
- `platform_admin` 로그인 → 플랫폼 전체 관리 페이지

### 백엔드 추가 사항

1. **사용자 관리 API** (신규)
   - `GET /api/v1/auth/users` — 전체 사용자 목록 (platform_admin)
   - `POST /api/v1/auth/users` — 사용자 생성 (platform_admin)

2. **시드 데이터 API** (신규)
   - `POST /api/v1/admin/seed` — 테스트 데이터 생성 (platform_admin, dev only)

### 프론트엔드 추가 사항

| 페이지 | 경로 | 역할 | 설명 |
|--------|------|------|------|
| PlatformDashboard | `/` | platform_admin | 전체 시스템 통계 |
| AcademiesPage | `/academies` | platform_admin | 학원 관리 |
| UsersPage | `/users` | platform_admin | 사용자 관리 |
| PlatformVehiclesPage | `/vehicles` | platform_admin | 전체 차량 |
| PlatformBillingPage | `/billing` | platform_admin | 전체 청구 |
| BulkUploadPage | `/upload` | platform_admin | 엑셀 업로드 |
| CompliancePage | `/compliance` | platform_admin | 컴플라이언스 |
| SeedDataPage | `/seed` | platform_admin | 시드 데이터 |

### 수정 사항

- `Layout.tsx` — 역할에 따라 사이드바 메뉴 분기
- `App.tsx` — 새 라우트 추가
- `useAuth.ts` — 역할 정보 활용
- `LoginPage.tsx` — platform_admin 역할 버튼 추가

---

## Code Impact Map

| 파일 | 변경 |
|------|------|
| `backend/app/modules/auth/router.py` | 사용자 목록/생성 API 추가 |
| `backend/app/modules/auth/service.py` | 사용자 CRUD 서비스 |
| `backend/app/modules/auth/schemas.py` | 사용자 스키마 |
| `backend/app/main.py` | admin 라우터 등록 |
| `backend/app/modules/admin/` | 시드 데이터 모듈 (신규) |
| `web/src/App.tsx` | 라우트 추가 |
| `web/src/components/Layout.tsx` | 역할 분기 사이드바 |
| `web/src/pages/LoginPage.tsx` | platform_admin 버튼 |
| `web/src/pages/platform/` | 신규 8개 페이지 |
| `web/src/types/index.ts` | 타입 추가 |
