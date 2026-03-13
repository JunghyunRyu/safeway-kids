# M2 Final Tech Spec — Parent App MVP + Driver App MVP

**Date**: 2026-03-13
**Status**: FINAL

---

## 1. Problem Statement
M0/M1 established the backend (28 endpoints) and mobile scaffold. Users cannot yet interact with the system through the mobile app. M2 delivers functional parent and driver experiences: parents manage children, view schedules, track buses, and receive notifications; drivers view assignments, mark boarding/alighting, and broadcast GPS.

## 2. Goals / Non-Goals

### Goals
- Parent can manage children, view schedules, cancel rides, track bus, receive push notifications
- Driver can view today's route, mark boarding/alighting, auto-send GPS
- Role-based mobile navigation
- All UI in Korean

### Non-Goals
- Academy admin dashboard (M4)
- Route optimization / VRP-TW (M5)
- Background GPS tracking (M3)
- T-map navigation (M3+)
- Edge AI (M6), Billing (M7)

## 3. User Scenarios

### US-1: Parent Morning Flow
1. Opens app → sees today's schedule for each child
2. Taps "실시간 위치" tab → sees bus moving on map
3. Receives push: "김민준 학생이 탑승했습니다"
4. Receives push: "김민준 학생이 안전하게 하차했습니다"

### US-2: Parent Cancel Flow
1. Opens "스케줄" tab → sees weekly view
2. Taps tomorrow's ride → taps "취소" → confirms
3. Schedule status changes to "cancelled"

### US-3: Driver Route Flow
1. Opens app → sees today's stops (ordered by pickup time)
2. Arrives at stop → taps student → marks "탑승"
3. GPS auto-broadcasts every 5 seconds
4. At destination → taps student → marks "하차"

## 4. Schema Changes

### 4.1 Add `fcm_token` to User
```sql
ALTER TABLE users ADD COLUMN fcm_token VARCHAR(500) NULL;
```

### 4.2 Add `vehicle_id` to DailyScheduleInstance
```sql
ALTER TABLE daily_schedule_instances ADD COLUMN vehicle_id UUID REFERENCES vehicles(id) NULL;
```
Populated during materialization by looking up VehicleAssignment for the academy on that date.

## 5. New Backend Endpoints

### 5.1 FCM Token Registration
```
POST /api/v1/notifications/register-token
Body: { "fcm_token": "..." }
Auth: any authenticated user
Action: updates user.fcm_token
```

### 5.2 Driver's Today Assignments
```
GET /api/v1/schedules/daily/driver?target_date=YYYY-MM-DD
Auth: DRIVER, SAFETY_ESCORT
Action: find VehicleAssignment for current user on target_date,
        then find all DailyScheduleInstances with that vehicle_id on target_date,
        return with student name + academy name joined
Response: [{id, student_name, academy_name, pickup_time, status, boarded_at, alighted_at}]
```

### 5.3 Driver's Vehicle Assignment
```
GET /api/v1/telemetry/vehicles/my-assignment?date=YYYY-MM-DD
Auth: DRIVER
Action: find VehicleAssignment for current user on date
Response: {vehicle_id, license_plate, capacity, operator_name, safety_escort_name}
```

### 5.4 Student Enrollments List
```
GET /api/v1/students/{student_id}/enrollments
Auth: PARENT (owner only)
Response: [{enrollment_id, academy_id, academy_name, enrolled_at, is_active}]
```

## 6. Modified Backend Logic

### 6.1 Materialize with Vehicle Assignment
In `scheduling/service.py::materialize_daily_schedules()`:
- After creating DailyScheduleInstance, look up VehicleAssignment for the academy on that date
- If found, set `instance.vehicle_id = assignment.vehicle_id`

### 6.2 Board/Alight → Push Notification
In `scheduling/service.py::mark_boarded()` and `mark_alighted()`:
- After updating status, look up student's guardian (parent)
- Get parent's fcm_token
- Call `notification_service.send_boarding_notification()` or `send_alighting_notification()`
- Fire-and-forget (don't block the response on push delivery)

## 7. Mobile Architecture

### 7.1 Role-Based Navigation
```
App.tsx
  └─ AuthProvider
       └─ RootNavigator
            ├─ (not authenticated) → LoginScreen
            ├─ (role=parent) → ParentTabNavigator
            │    ├─ HomeTab → ParentHomeScreen
            │    ├─ ScheduleTab → ScheduleScreen
            │    ├─ MapTab → MapScreen
            │    └─ ProfileTab → ProfileScreen
            └─ (role=driver) → DriverTabNavigator
                 ├─ HomeTab → DriverHomeScreen
                 ├─ RouteTab → DriverRouteScreen
                 ├─ MapTab → DriverMapScreen
                 └─ ProfileTab → DriverProfileScreen
```

### 7.2 API Layer (new files)
- `mobile/src/api/students.ts` — listStudents, getStudent, listEnrollments
- `mobile/src/api/schedules.ts` — listTemplates, listDaily, cancelSchedule, driverDailyAssignments
- `mobile/src/api/vehicles.ts` — getMyAssignment, getVehicleLocation
- `mobile/src/api/notifications.ts` — registerFcmToken

### 7.3 Screens

#### Parent Screens
| Screen | File | Key Features |
|--------|------|-------------|
| ParentHomeScreen | `screens/parent/HomeScreen.tsx` | Today's schedules per child, quick status cards |
| StudentListScreen | `screens/parent/StudentListScreen.tsx` | FlatList of children with status badges |
| StudentDetailScreen | `screens/parent/StudentDetailScreen.tsx` | Child info + enrollments + schedule templates |
| ScheduleScreen | `screens/parent/ScheduleScreen.tsx` | Daily view with cancel button per item |
| MapScreen | `screens/parent/MapScreen.tsx` | WebView Kakao Maps with bus markers |
| ConsentScreen | `screens/parent/ConsentScreen.tsx` | View/grant/withdraw PIPA consent |
| ProfileScreen | `screens/parent/ProfileScreen.tsx` | User info, settings, logout |

#### Driver Screens
| Screen | File | Key Features |
|--------|------|-------------|
| DriverHomeScreen | `screens/driver/HomeScreen.tsx` | Today summary: vehicle info, student count, shift status |
| DriverRouteScreen | `screens/driver/RouteScreen.tsx` | Ordered stop list with board/alight buttons per student |
| DriverMapScreen | `screens/driver/MapScreen.tsx` | WebView Kakao Maps with current position |
| DriverProfileScreen | `screens/driver/ProfileScreen.tsx` | Vehicle info, logout |

### 7.4 GPS Auto-Push (Driver)
- `mobile/src/hooks/useGpsTracking.ts`
- Uses `expo-location` foreground location updates
- Posts to `POST /api/v1/telemetry/gps` every 5 seconds
- Starts when driver opens app and has active assignment
- Stops when app backgrounds or driver logs out

### 7.5 Real-Time Map (Parent)
- `mobile/src/hooks/useVehicleTracking.ts`
- Connects to WebSocket `ws://host/api/v1/telemetry/ws/vehicles/{vehicle_id}`
- Updates marker position on each message
- Shows "last updated X ago" if no update in 30s

### 7.6 Kakao Maps Integration
- Use `react-native-webview` loading an HTML page with Kakao Maps JS SDK
- Communication via `window.ReactNativeWebView.postMessage()` (map → RN) and `webViewRef.injectJavaScript()` (RN → map)
- Map HTML served from `mobile/assets/kakao-map.html`

## 8. Dependencies to Install (Mobile)
```
expo-location
react-native-webview
@react-native-firebase/messaging (or expo-notifications for Expo managed)
```
Since we're using Expo managed workflow: use `expo-notifications` + `expo-device` for push.

## 9. Testing Strategy

### Backend Tests
- Unit: FCM token registration
- Integration: driver daily assignments endpoint
- Integration: board → push notification triggered (mock FCM)
- Integration: materialize with vehicle_id populated
- Regression: all 26 existing tests must pass

### Mobile
- TypeScript compilation: `npx tsc --noEmit`
- Manual smoke: login → navigate tabs → view screens (no automated mobile tests for M2)

## 10. Edge Cases
| Case | Handling |
|------|---------|
| Driver has no assignment for today | Show "오늘 배정된 노선이 없습니다" |
| Parent has no children | Show empty state + "자녀 등록" button |
| Vehicle has no GPS data | Map shows "위치 정보 없음" |
| WebSocket disconnects | Auto-reconnect with exponential backoff (3s, 6s, 12s, max 30s) |
| FCM token not registered | Skip push silently, log warning |
| Multiple children on different vehicles | Show multiple markers on parent map |

## 11. Rollback Strategy
- Schema changes are additive (nullable columns) — safe to rollback
- New endpoints don't affect existing ones
- Mobile update is independent of backend (old app ignores new endpoints)

## 12. Acceptance Criteria
| ID | Criterion | Verification |
|---|----------|-------------|
| AC-M2-1 | Parent views children + schedules | Integration test |
| AC-M2-2 | Parent sees bus on map | Manual smoke (WebView + WebSocket) |
| AC-M2-3 | Push on boarding/alighting | Integration test (mock FCM) |
| AC-M2-4 | One-tap cancel | Already tested in M1 E2E |
| AC-M2-5 | Driver sees today's stops | Integration test |
| AC-M2-6 | Driver marks board/alight | Already tested in M1 E2E |
| AC-M2-7 | GPS auto-push 5s interval | Manual smoke |
| AC-M2-8 | Korean UI | Visual inspection |
| AC-M2-9 | Role-based navigation | TypeScript + manual |

## 13. Code Impact Map
| Area | Files Changed | Type |
|------|--------------|------|
| Schema | `scheduling/models.py`, `auth/models.py` | Modify |
| Migration | `migrations/versions/xxx_m2_schema.py` | New |
| Scheduling | `scheduling/service.py`, `scheduling/router.py`, `scheduling/schemas.py` | Modify |
| Telemetry | `vehicle_telemetry/service.py`, `vehicle_telemetry/router.py`, `vehicle_telemetry/schemas.py` | Modify |
| Notification | `notification/router.py`, `notification/schemas.py` | Modify + New |
| Student | `student_management/router.py`, `student_management/service.py` | Modify |
| Mobile API | `api/students.ts`, `api/schedules.ts`, `api/vehicles.ts`, `api/notifications.ts` | New |
| Mobile Nav | `navigation/RootNavigator.tsx`, `navigation/ParentTabNavigator.tsx`, `navigation/DriverTabNavigator.tsx` | Modify + New |
| Mobile Screens | `screens/parent/*.tsx`, `screens/driver/*.tsx` | New (11 files) |
| Mobile Hooks | `hooks/useGpsTracking.ts`, `hooks/useVehicleTracking.ts` | New |
| Mobile Assets | `assets/kakao-map.html` | New |
| Tests | `tests/integration/test_driver_schedule.py`, `tests/integration/test_notification_push.py` | New |

## 14. Task Breakdown
| Task | Description | Depends On |
|------|------------|-----------|
| M2-T1 | Schema migration (fcm_token, vehicle_id) | — |
| M2-T2 | Backend gap APIs (G1-G5: driver schedule, vehicle assignment, enrollments, FCM token) | M2-T1 |
| M2-T3 | Board/alight → push notification wiring | M2-T1, M2-T2 |
| M2-T4 | Backend integration tests | M2-T2, M2-T3 |
| M2-T5 | Mobile: role-based navigation + driver tab navigator | — |
| M2-T6 | Mobile: parent screens (Home, StudentList, Schedule, Consent, Profile) | M2-T5 |
| M2-T7 | Mobile: parent real-time map (Kakao Maps WebView + WebSocket) | M2-T5 |
| M2-T8 | Mobile: driver screens (Home, Route/Boarding, Map, Profile) | M2-T5 |
| M2-T9 | Mobile: GPS auto-push hook (expo-location) | M2-T5 |
| M2-T10 | Full regression + verification | M2-T4, M2-T6-T9 |
