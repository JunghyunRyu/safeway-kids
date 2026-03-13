# M2 Requirement Brief — Parent App MVP + Driver App MVP

**Date**: 2026-03-13
**Phase**: 0 — Intake

## Goals
1. Parent can manage children, view schedules, track bus in real-time, receive boarding/alighting push notifications
2. Driver can view today's assigned route, mark boarding/alighting, auto-send GPS
3. Role-based navigation: parent sees parent tabs, driver sees driver tabs
4. All UI in Korean

## Non-Goals
- Academy admin dashboard (M4)
- VRP-TW route optimization (M5)
- Edge AI / facial recognition (M6)
- Full billing (M7)
- T-map driver navigation (M3+, Kakao Maps only for M2)

## Stakeholders
- Parents (primary user), Drivers (primary user), Safety escorts (secondary)

## Existing Infrastructure (from M0/M1)
- 28 backend API endpoints covering auth, student CRUD, academy CRUD, scheduling (template + daily + board/alight), vehicle telemetry (GPS + WebSocket), compliance (consent + contract), notification (test push)
- React Native Expo project with auth flow, tab navigator, i18n Korean, API client

## Gap Analysis — Backend APIs Needed for M2

| # | Missing API | Why |
|---|------------|-----|
| G1 | `GET /api/v1/schedules/daily/my` — Driver's today assignments | Driver needs to see which students to pick up today based on vehicle assignment |
| G2 | `POST /api/v1/notifications/register-token` — FCM token registration | Store device FCM token for push delivery |
| G3 | `GET /api/v1/telemetry/vehicles/my` — Driver's assigned vehicle | Driver needs to know their vehicle_id for GPS posting |
| G4 | `GET /api/v1/students/{student_id}/enrollments` — Parent view enrollments | Parent needs to see which academies child is enrolled in |
| G5 | Boarding/alighting event → FCM push trigger | Service-level: when board/alight happens, send push to parent |

## Mobile Screens Needed

### Parent App (role=parent)
| Screen | Tab | Features |
|--------|-----|----------|
| HomeScreen | 홈 | Today's schedule summary, upcoming pickups, quick actions |
| StudentListScreen | 홈 | List children, tap to manage |
| StudentDetailScreen | — | Child info, enrollments, schedule templates |
| ScheduleScreen | 스케줄 | Weekly/daily schedule view, one-tap cancel |
| MapScreen | 실시간 위치 | Kakao Maps with live bus marker, ETA text |
| ProfileScreen | 내 정보 | User info, consent management, logout |
| ConsentScreen | — | PIPA consent grant/withdraw |

### Driver App (role=driver)
| Screen | Tab | Features |
|--------|-----|----------|
| DriverHomeScreen | 홈 | Today's route summary, start/end shift |
| DriverRouteScreen | 노선 | Ordered stop list with student names, pickup times |
| DriverBoardingScreen | — | Tap student to mark boarded/alighted |
| DriverMapScreen | 지도 | Map with route + current position |
| DriverProfileScreen | 내 정보 | Vehicle info, shift history, logout |

## Assumption Register
| # | Assumption | Risk |
|---|-----------|------|
| A1 | One driver → one vehicle (1:1 assignment for M2) | Low |
| A2 | GPS auto-push interval: 5 seconds | Medium — battery drain |
| A3 | FCM token stored per user, not per device | Low for M2 (single device) |
| A4 | Parent sees only their children's vehicle on map | Low |
| A5 | Driver sees all students assigned to their vehicle for today | Low |

## Open Questions
| # | Question | Default |
|---|---------|---------|
| Q1 | Should driver app use background GPS or only foreground? | Foreground only for M2 (simpler, no background permission) |
| Q2 | ETA display — calculated server-side or client-side? | Client-side placeholder text ("N stops away") for M2 |
| Q3 | Should we support multiple children on map simultaneously? | Yes, show all children's buses with different markers |

## Acceptance Criteria
| ID | Criterion |
|---|----------|
| AC-M2-1 | Parent can view list of children and their schedule |
| AC-M2-2 | Parent can see real-time bus location on Kakao Maps |
| AC-M2-3 | Parent receives push notification within 5s of boarding/alighting event |
| AC-M2-4 | Parent can cancel scheduled ride with one tap |
| AC-M2-5 | Driver can view today's assigned stops with student names |
| AC-M2-6 | Driver can mark boarding/alighting per student |
| AC-M2-7 | Driver app auto-sends GPS every 5 seconds while on route |
| AC-M2-8 | All UI text is in Korean |
| AC-M2-9 | Role-based navigation: parent and driver see different tab sets |

## Milestone Structure
- **M2-T1**: Backend gap APIs (G1-G5)
- **M2-T2**: FCM integration (token registration + boarding/alighting push trigger)
- **M2-T3**: Role-based navigation + driver tab navigator
- **M2-T4**: Parent app screens (Home, StudentList, Schedule, Consent)
- **M2-T5**: Parent real-time map (Kakao Maps + WebSocket GPS)
- **M2-T6**: Driver app screens (Home, Route, Boarding)
- **M2-T7**: Driver GPS auto-push (foreground location service)
- **M2-T8**: Integration tests + regression
