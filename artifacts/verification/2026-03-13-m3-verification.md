# M3 Verification Report — Real-time Features Hardening

**Date**: 2026-03-13
**Milestone**: M3

## Verification Summary

| Check | Result | Evidence |
|-------|--------|----------|
| TypeScript `tsc --noEmit` | VERIFIED | 0 errors |
| Backend pytest (35 tests) | VERIFIED | 35/35 passed in 9.44s |
| expo-location integration | VERIFIED | `useGpsTracking.ts` compiles, uses `Location.getCurrentPositionAsync` with `Accuracy.High` |
| expo-notifications integration | VERIFIED | `useNotifications.ts` compiles, correct Expo SDK 55 API (`shouldShowBanner`, `shouldShowList`) |
| Kakao Maps HTML asset | VERIFIED | `assets/kakao-map.html` handles init, updateBus, setStops, setEta, setStatus, setDriverPosition messages |
| WebSocket reconnection | VERIFIED | `useVehicleTracking.ts` compiles, exponential backoff 3s → 6s → 12s → max 30s |
| Parent MapScreen | VERIFIED | Compiles, uses `useVehicleTracking` + WebView + Kakao Maps |
| Driver MapScreen | VERIFIED | Compiles, uses `useGpsTracking` + WebView + stop markers from schedule |
| RootNavigator push registration | VERIFIED | `useNotifications(authenticated)` called on auth |
| Android notification channel | VERIFIED | Channel "default" with MAX importance configured |
| app.json permissions | VERIFIED | iOS `NSLocationWhenInUseUsageDescription`, Android `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` |

## Files Changed in M3

### Mobile — New
- `mobile/assets/kakao-map.html`
- `mobile/src/hooks/useVehicleTracking.ts`

### Mobile — Modified
- `mobile/app.json` — permissions + plugins
- `mobile/src/hooks/useGpsTracking.ts` — rewritten with expo-location
- `mobile/src/hooks/useNotifications.ts` — expo-notifications + FCM
- `mobile/src/screens/parent/MapScreen.tsx` — WebView + Kakao Maps + live tracking
- `mobile/src/screens/driver/MapScreen.tsx` — WebView + Kakao Maps + GPS + stops
- `mobile/src/navigation/RootNavigator.tsx` — added useNotifications

## Commands Run
```
cd mobile && npx tsc --noEmit          → 0 errors
cd backend && .venv/bin/python -m pytest tests/ -v  → 35/35 passed
```

## TypeScript Fixes Applied
1. `shouldShowAlert` → `shouldShowBanner: true, shouldShowList: true` (Expo SDK 55)
2. `Notifications.removeNotificationSubscription()` → `subscription.remove()`
3. `useRef<T>()` → `useRef<T>(undefined)` (React 19 types require initial value)

## Residual Risks
- Kakao Maps API key is placeholder (`YOUR_KAKAO_JS_API_KEY`) — needs real key before device testing
- Expo project ID is placeholder (`your-expo-project-id`) in `useNotifications.ts`
- WebSocket endpoint not yet implemented in backend (parent MapScreen will fall back to disconnected state)
- No device testing performed (TypeScript compilation only)

## Verdict
**VERIFIED** — All M3 code compiles cleanly, backend regression passes. Runtime behavior requires device testing with real API keys.
