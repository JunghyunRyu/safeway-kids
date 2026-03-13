# M3 Requirement Brief — Real-Time Features Hardening

**Date**: 2026-03-13
**Phase**: 0 — Intake

## Goals
1. Parent app shows live bus location on Kakao Maps (WebView integration)
2. Driver app uses real GPS via expo-location (foreground)
3. WebSocket reconnection with exponential backoff
4. Push notifications wired end-to-end with expo-notifications
5. Parent can see ETA placeholder ("N정거장 전")

## Non-Goals
- Background GPS tracking (needs separate permission flow, deferred to M3.5)
- T-map turn-by-turn navigation (M5)
- VRP-TW route optimization (M5)
- Academy admin dashboard (M4)

## Gap Analysis — What's Missing

| # | Gap | Resolution |
|---|-----|-----------|
| G1 | Kakao Maps JS SDK in WebView | Create HTML asset with Kakao Maps, communicate via postMessage |
| G2 | expo-location not installed | Install + permission flow + replace mock GPS |
| G3 | expo-notifications not installed | Install + FCM token auto-registration on login |
| G4 | WebSocket auto-reconnect | Add exponential backoff (3s → 6s → 12s → max 30s) |
| G5 | ETA display | Client-side "N정거장 전" based on stop order |
| G6 | Map marker updates | Smooth marker movement on WebSocket GPS messages |

## Assumption Register
| # | Assumption | Risk |
|---|-----------|------|
| A1 | Kakao Maps JS API key available | User must provide key |
| A2 | expo-notifications works in Expo managed workflow | Low |
| A3 | WebView performance sufficient for map + marker updates at 5s interval | Medium |
| A4 | Foreground-only GPS is acceptable for M3 | Low |

## Open Questions
| # | Question | Default |
|---|---------|---------|
| Q1 | Do we have a Kakao Maps JavaScript API key? | Use placeholder key, user provides real key via env |
| Q2 | Should map show route polyline? | Yes, simple straight-line path between stops |

## Acceptance Criteria
| ID | Criterion |
|---|----------|
| AC-M3-1 | Parent sees live bus marker on Kakao Maps moving in real-time |
| AC-M3-2 | Driver app sends real GPS coordinates (expo-location) every 5s |
| AC-M3-3 | Push notifications delivered via expo-notifications on boarding/alighting |
| AC-M3-4 | WebSocket auto-reconnects on disconnect |
| AC-M3-5 | Parent sees "N정거장 전" ETA text |
| AC-M3-6 | All 35 existing tests pass (regression) |

## Task Breakdown
- **M3-T1**: Install expo-location + expo-notifications, configure permissions
- **M3-T2**: Kakao Maps HTML asset + WebView integration in parent MapScreen
- **M3-T3**: Replace mock GPS with expo-location in useGpsTracking hook
- **M3-T4**: expo-notifications FCM token registration on login
- **M3-T5**: WebSocket reconnection with exponential backoff in useVehicleTracking
- **M3-T6**: ETA display ("N정거장 전") on parent MapScreen
- **M3-T7**: Driver MapScreen with current position on Kakao Maps
- **M3-T8**: TypeScript check + backend regression + verification
