# Hotfix QA Report

**Date:** 2026-03-22
**Scope:** 핫픽스 13건 (보안 4건, 프론트엔드 5건, 버그 4건)

## 테스트 결과

| 영역 | 통과 | 실패 | 비고 |
|------|------|------|------|
| Backend (pytest) | 112 | 0 | 5 warnings (무해) |
| Web (vitest) | 50 (12 suites) | 0 | |
| Mobile (jest) | 36 (10 suites) | 0 | |
| TypeScript Web | 0 errors | - | |
| TypeScript Mobile | 0 errors | - | |
| TypeScript Site | 0 errors | - | |

## 핫픽스 검증 (13건)

### 보안 (4건)

| # | 항목 | PASS/FAIL | 근거 |
|---|------|-----------|------|
| 1 | V7: update_gps 기사-차량 배정 확인 | **PASS** | `router.py:148-150` — `check_vehicle_access(db, current_user, body.vehicle_id)` 호출 후 실패 시 `ForbiddenError` 발생 |
| 2 | V8: mark_boarded 기사-스케줄 관계 확인 | **PASS** | `service.py:331-332` — `_verify_driver_vehicle(db, driver_id, instance.vehicle_id, instance.schedule_date)` 호출. `_verify_driver_vehicle` (L301-316)에서 VehicleAssignment 조회 후 driver_id/safety_escort_id 매칭 검증 |
| 3 | V9: 빌링 웹훅 HMAC 서명 검증 | **PASS** | `billing/router.py:261-282` — `hmac.new(webhook_secret, body_bytes, sha256)` 후 `hmac.compare_digest(sig_header, expected)` 로 상수 시간 비교. 서명 누락/불일치 시 ForbiddenError |
| 4 | N3: REST 위치 API check_vehicle_access | **PASS** | `router.py:164-166` — `get_vehicle_location` 엔드포인트에서 `check_vehicle_access(db, current_user, vehicle_id)` 호출. `service.py:227-286` — 역할별(PLATFORM_ADMIN/DRIVER/ESCORT/PARENT/ACADEMY_ADMIN) 접근 제어 구현 완료 |

### 프론트엔드 (5건)

| # | 항목 | PASS/FAIL | 근거 |
|---|------|-----------|------|
| 5 | ParentHomeScreen academy_name/driver_name/vehicle_license_plate | **PASS** | `HomeScreen.tsx:129-131` — `academyName={item.academy_name}`, `vehiclePlate={item.vehicle_license_plate}`, `driverName={item.driver_name}` 전달. ScheduleCard (L76-83)에서 렌더링 |
| 6 | ParentScheduleScreen 동일 3필드 렌더링 | **PASS** | `ScheduleScreen.tsx:289-291` — `academyName={item.academy_name}`, `vehiclePlate={item.vehicle_license_plate}`, `driverName={item.driver_name}` 전달. ScheduleItem (L112-118)에서 렌더링 |
| 7 | StudentScheduleScreen academy_name 사용 | **PASS** | `student/ScheduleScreen.tsx:35` — `item.academy_name ? \`${item.academy_name} 등원\` : "오늘의 등원"` — academy_name 있으면 학원명 표시, 없으면 폴백 |
| 8 | LoginScreen student 역할 | **PASS** | `LoginScreen.tsx:17` — `RoleOption` 타입에 `"student"` 포함. L19-25 `ROLE_OPTIONS` 배열에 `{ value: "student", label: "학생", icon: "school-outline" }` 존재. `ROLE_COLORS`에 `student: Colors.roleStudent` 매핑 |
| 9 | Layout academyNavItems 엑셀 업로드 | **PASS** | `Layout.tsx:12` — `{ to: '/upload', label: '엑셀 업로드', icon: '📤' }` 존재 |

### 버그 (4건)

| # | 항목 | PASS/FAIL | 근거 |
|---|------|-----------|------|
| 10 | RouteScreen vehicle_id 올바르게 전달 | **PASS** | `RouteScreen.tsx:265` — `getMyAssignment(todayStr())` 로 배정 조회 후 L265 `setVehicleId(assignmentData?.vehicle_id ?? null)`. L408 `submitVehicleClearance(vehicleId, todayStr(), {...})` 에서 사용 |
| 11 | 웹 스케줄 페이지 student_name 표시 | **PASS** | `SchedulesPage.tsx:94` — `(row as ScheduleTemplate & { student_name?: string }).student_name || row.student_id.slice(0, 8)`. 일간 스케줄 L160 — `row.student_name || row.student_id.slice(0, 8)`. 백엔드 `service.py:280` — enriched dict에 `student_name` 포함 |
| 12 | RouteScreen 미탑승 사유 선택 UI | **PASS** | `RouteScreen.tsx:325-348` — `handleNoShow`에서 Alert.alert로 "미탑승 사유 선택" 다이얼로그 표시. 3가지 사유: "학생 미출현"(`student_absent`), "보호자 취소"(`parent_cancelled`), "기타"(`other`). 백엔드 `mark_no_show` (L342-363) 에서 reason 파라미터 저장 |
| 13 | RouteScreen 잔류 확인 개별 체크 | **PASS** | `RouteScreen.tsx:380-389` — `clearanceItems`에 학생별 좌석 체크(`seat_{id}`: "좌석: {student_name} 하차 확인"), 트렁크, 잠금 항목 생성. L522-536 개별 체크박스 UI. L391 `allClearanceChecked`로 전체 완료 여부 확인 후 제출 허용 |

## 판정: PASS

모든 테스트(112+50+36=198건) 통과, TypeScript 에러 0건, 핫픽스 13건 전체 코드 검증 완료.
