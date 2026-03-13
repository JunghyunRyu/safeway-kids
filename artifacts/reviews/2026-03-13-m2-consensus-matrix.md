# M2 Consensus Matrix

**Date**: 2026-03-13

## Review Findings Consolidated

### Gap API Completeness
| Item | Finding | Resolution |
|------|---------|------------|
| G1: Driver's daily assignments | VehicleAssignment model has driver_id + assigned_date. Need query joining VehicleAssignment → RoutePlan → DailyScheduleInstance | Add `GET /schedules/daily/driver` endpoint that joins through vehicle assignment |
| G2: FCM token registration | No `fcm_token` column on User model | Add `fcm_token` nullable column to User model + registration endpoint |
| G3: Driver's vehicle | VehicleAssignment already supports this | Add `GET /telemetry/vehicles/my-assignment` |
| G4: Parent enrollments | `GET /students/{id}/enrollments` — enrollment endpoint exists but only POST/DELETE, no GET list | Add GET endpoint for listing enrollments |
| G5: Board/alight → push | Notification service functions exist. Need to wire into scheduling service | Inject notification call into `mark_boarded()` and `mark_alighted()` |

### Additional Gaps Found
| # | Gap | Resolution |
|---|-----|------------|
| G6 | No route_plan → daily_schedule linkage | For M2, driver sees DailyScheduleInstances joined via vehicle_assignment → schedules by academy. Full RoutePlan integration deferred to M5 (VRP-TW) |
| G7 | DailyScheduleInstance has no vehicle_id column | Need to add `vehicle_id` to DailyScheduleInstance so we can query "all students on this vehicle today" |
| G8 | Parent needs to know which vehicle their child is on | Query: DailyScheduleInstance → academy → vehicle_assignment (by academy + date). Or add vehicle_id directly to DailyScheduleInstance during materialization |

### Architecture Decisions
| Decision | Consensus |
|----------|-----------|
| GPS auto-push interval | 5 seconds foreground only (M2). Background tracking deferred to M3 |
| ETA display | Client-side "N stops away" placeholder. Server-side ETA calculation in M5 |
| FCM token storage | Add `fcm_token` column to `users` table. One token per user (single device for M2) |
| Vehicle-schedule linkage | Add `vehicle_id` to DailyScheduleInstance. Assigned during materialization based on VehicleAssignment for the academy |
| Role-based navigation | Single React Native app with role check in RootNavigator. Parent → ParentTabs, Driver → DriverTabs |
| Kakao Maps integration | Use react-native-webview with Kakao Maps JS SDK (no native SDK for React Native) |

### Risk Assessment
| Risk | Severity | Mitigation |
|------|----------|------------|
| WebView map performance | Medium | Keep map simple — single marker + polyline. Native map deferred |
| FCM not working in dev (no real device) | Low | Console.log fallback already in FCMProvider |
| GPS foreground-only means data gaps when app backgrounded | Medium | Acceptable for M2. Display "last updated X min ago" |
| Schema migration needed (fcm_token, vehicle_id on daily_schedule) | Low | Single Alembic migration |
