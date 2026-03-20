# Final Tech Spec: Design System Redesign + Role Expansion

**Date:** 2026-03-17
**Status:** APPROVED
**Milestone:** Design System v2

---

## Problem Statement

safeway-kids 앱은 색상이 모두 인라인 하드코딩되어 있고, 일반적인 Material Blue 계열을 사용하여 독창성이 없다. 관리자(academy_admin/platform_admin)와 학생(student) 역할 화면이 없으며, Schedule/Billing/Profile 화면이 테스트 수준 UI를 벗어나지 못하고 있다.

---

## Goals

1. "Teal Amber" 팔레트 기반 중앙화 디자인 시스템 구축
2. 전체 앱 색상 일관성 확보
3. 관리자/학생 역할 화면 구현
4. Schedule, Billing, Profile UX 프로덕션 품질 달성
5. 사이트 랜딩 페이지 팔레트 동기화

## Non-Goals

- 백엔드 API 신규 기능 (RBAC 수정 1건 제외)
- 결제 게이트웨이 연동
- 다크모드
- Map 화면 리디자인

---

## Architecture — Color System

### `mobile/src/constants/theme.ts`

```typescript
export const Colors = {
  // Brand
  primary: '#0F7A7A',
  primaryDark: '#095E5E',
  primaryLight: '#E0F2F2',
  accent: '#F4A22D',
  accentDark: '#C47D10',

  // Surface
  background: '#F5F8F8',
  surface: '#FFFFFF',
  surfaceElevated: '#EBF3F3',
  border: '#C8DBDB',

  // Text
  textPrimary: '#1C2E2E',
  textSecondary: '#5A7272',
  textDisabled: '#9EB3B3',
  textInverse: '#FFFFFF',

  // Status
  success: '#2D9E6B',
  successLight: '#D4F2E7',
  warning: '#F4A22D',
  warningLight: '#FEF3DC',
  danger: '#D44C3E',
  dangerLight: '#FAE0DD',
  info: '#3B82C4',
  infoLight: '#DBEAFE',
  neutral: '#9EB3B3',

  // Role Accents (tab bar)
  roleParent: '#0F7A7A',
  roleDriver: '#F4A22D',
  roleEscort: '#7B5EA7',
  roleAdmin: '#D44C3E',
  roleStudent: '#2E9E6B',

  // Schedule Status
  statusScheduled: '#3B82C4',
  statusBoarded: '#F4A22D',
  statusCompleted: '#2D9E6B',
  statusCancelled: '#9EB3B3',

  // Billing Status
  statusPending: '#F4A22D',
  statusPaid: '#2D9E6B',
  statusOverdue: '#D44C3E',
} as const;

export const Typography = {
  sizes: { xs: 11, sm: 12, base: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
  weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
} as const;

export const Radius = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 9999,
} as const;
```

---

## Code Impact Map

### 수정할 파일 (기존)

| 파일 | 변경 내용 |
|------|----------|
| `mobile/src/navigation/tabConfig.tsx` | @expo/vector-icons 적용, 테마 토큰 사용 |
| `mobile/src/navigation/ParentTabNavigator.tsx` | Colors.roleParent 적용, 아이콘 변경 |
| `mobile/src/navigation/DriverTabNavigator.tsx` | Colors.roleDriver 적용, 아이콘 변경 |
| `mobile/src/navigation/EscortTabNavigator.tsx` | Colors.roleEscort 적용, 아이콘 변경 |
| `mobile/src/navigation/RootNavigator.tsx` | admin/student 라우팅 추가 |
| `mobile/src/screens/parent/HomeScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/parent/ScheduleScreen.tsx` | 전면 리디자인 |
| `mobile/src/screens/parent/BillingScreen.tsx` | 전면 리디자인 |
| `mobile/src/screens/parent/ProfileScreen.tsx` | 전면 리디자인 |
| `mobile/src/screens/parent/MapScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/driver/HomeScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/driver/RouteScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/driver/ProfileScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/escort/ShiftsScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/escort/AvailabilityScreen.tsx` | 색상 토큰 교체 |
| `mobile/src/screens/LoginScreen.tsx` | 색상 토큰 교체 |
| `backend/app/modules/student_management/router.py` | RBAC: ACADEMY_ADMIN 추가 |
| `site/src/index.css` | Tailwind 토큰 → Teal Amber |

### 신규 파일

| 파일 | 내용 |
|------|------|
| `mobile/src/constants/theme.ts` | 색상 시스템 |
| `mobile/src/navigation/AdminTabNavigator.tsx` | 관리자 탭 네비게이터 |
| `mobile/src/navigation/StudentTabNavigator.tsx` | 학생 탭 네비게이터 |
| `mobile/src/screens/admin/DashboardScreen.tsx` | 관리자 홈 (오늘 운행 현황) |
| `mobile/src/screens/admin/StudentsScreen.tsx` | 학생 목록 관리 |
| `mobile/src/screens/admin/BillingAdminScreen.tsx` | 청구서 관리 (mark-paid) |
| `mobile/src/screens/admin/ProfileScreen.tsx` | 관리자 프로필 |
| `mobile/src/screens/student/ScheduleScreen.tsx` | 학생 오늘 일정 |
| `mobile/src/screens/student/ProfileScreen.tsx` | 학생 프로필 |

---

## Functional Requirements — Screen Redesigns

### ScheduleScreen (Parent)

**현재:** 단순 목록, 날짜 고정(오늘), 취소 버튼 raw 색상

**개선:**
- 날짜 네비게이션 헤더: `◀ 2026-03-17 ▶`
- 오늘 날짜로 초기화, 이전/다음 이동
- 상태 배지: rounded pill with status background color
- 빈 상태: 아이콘(📅) + 안내 문구
- 취소 버튼: Colors.danger, 충분한 터치 영역(48dp)
- 카드 shadow 및 rounded corner 개선

### BillingScreen (Parent)

**현재:** 단순 카드 목록, 헤더 없음

**개선:**
- 상단 Summary Header:
  ```
  미납 청구서: 2건
  미납 금액: 320,000원
  ```
- 카드 확장/축소 (accordion): 축소 시 월/상태만, 확장 시 전체 정보
- 상태 배지: 색상 + 텍스트 아이콘(✓) for paid
- 금액 표기: bold, Colors.textPrimary
- 빈 상태: 청구서 없음 안내

### ProfileScreen (Parent/Driver/Escort/Admin)

**현재:** 텍스트 나열, 단순 로그아웃 버튼

**개선:**
- 상단 아바타 영역:
  - 원형 배경 (role accent color)
  - 이름 첫 글자(이니셜)
  - 이름, 역할 텍스트
- 정보 섹션 (카드 형태):
  - 전화번호
  - 이메일 (있을 경우)
- 로그아웃 버튼: danger outline style, 하단 배치

---

## Admin Screens

### AdminDashboardScreen
- `GET /academies/mine` → academy_id 획득
- `GET /schedules/daily?date=today` → 오늘 배차 수
- `GET /billing/invoices?academy_id=X` → 미납/납부 집계
- 표시: 오늘 운행 수, 미납 청구서 수/금액, 월별 요약

### AdminStudentsScreen
- `GET /students` (after RBAC fix: ACADEMY_ADMIN 허용)
- 학생 목록: 이름, 학원, 픽업 정보
- 검색/필터 없음 (MVP)

### AdminBillingScreen
- `GET /billing/invoices?academy_id=X`
- 목록 + 미납 건 "납부 처리" 버튼
- `POST /billing/invoices/{id}/mark-paid`
- `POST /billing/generate-invoices` (month 입력 후 일괄 생성)

### AdminProfileScreen
- 기존 ProfileScreen 패턴 재사용
- 역할 표시: 학원 관리자 / 플랫폼 관리자

---

## Student Screens (Placeholder)

**현재 상태:** 백엔드 UserRole.STUDENT 미존재 → 화면은 구축하나 라우팅 불가

### StudentScheduleScreen
- `GET /schedules/daily?date=today` → 오늘 일정
- 읽기 전용 (취소 불가)
- 기사 정보 표시 (있는 경우)

### StudentProfileScreen
- 기본 프로필 표시

---

## Backend Change

### `backend/app/modules/student_management/router.py`

```python
# AS-IS:
@router.get("/", response_model=List[StudentResponse])
async def list_students(
    current_user: UserResponse = Depends(
        require_roles(UserRole.PARENT)
    ),
    ...

# TO-BE:
@router.get("/", response_model=List[StudentResponse])
async def list_students(
    current_user: UserResponse = Depends(
        require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN)
    ),
    ...
    # academy_admin: 자신의 academy 소속 학생만 필터링
```

---

## Site Color Token Update

`site/src/index.css`:
```css
--color-primary: #0F7A7A        /* Ocean Teal */
--color-primary-dark: #095E5E
--color-primary-light: #E0F2F2
--color-accent: #F4A22D         /* Saffron Amber */
--color-accent-dark: #C47D10
--color-success: #2D9E6B
--color-warning: #F4A22D
--color-danger: #D44C3E
--color-dark: #1C2E2E
```

---

## Testing Strategy

1. TypeScript 컴파일: `tsc --noEmit`
2. 화면 렌더 스모크 테스트: Expo Go 기기 확인
3. 관리자 API 경로: backend curl 테스트
4. 색상 대비율: manual WCAG 체크 (도구: contrast checker)

---

## Rollback

변경 전 커밋으로 `git checkout` 가능. 테마 파일은 신규 파일이므로 삭제 시 롤백.

---

## Acceptance Criteria

- [ ] AC1: `theme.ts` 생성, 모든 역할 탭 토큰 참조
- [ ] AC2: AdminTabNavigator + 4 screens 동작
- [ ] AC3: StudentTabNavigator + 2 screens scaffold
- [ ] AC4: Schedule 날짜 네비게이션 동작
- [ ] AC5: Billing 요약 헤더 + accordion
- [ ] AC6: Profile 아바타 + 이메일
- [ ] AC7: 백엔드 RBAC 수정 적용
- [ ] AC8: 사이트 색상 토큰 동기화
- [ ] AC9: `tsc --noEmit` 오류 없음
- [ ] AC10: Vercel 스킬 품질 95점 이상
