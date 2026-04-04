# Frontend Architecture Review: Multi-App Monorepo Refactoring

**Reviewer**: Senior Frontend Developer (frontend-dev agent)
**Date**: 2026-04-03
**Scope**: mobile/ codebase analysis for PetTracker + CareConnect monorepo split
**Status**: COMPLETE

---

## 1. Monorepo Refactoring Plan

### 1.1 Current Structure (mobile/)

```
mobile/
  App.tsx                          # Entry point (SafeAreaProvider > AuthProvider > RootNavigator)
  index.ts                         # registerRootComponent
  app.json                         # Expo config (safeway-kids specific)
  package.json                     # All dependencies
  tsconfig.json                    # extends expo/tsconfig.base
  jest.config.js
  src/
    i18n/                          # i18next (Korean only)
    constants/theme.ts             # Design system tokens
    constants/mapHtml.ts           # WebView map HTML
    constants/safetyQuizData.ts    # Safety quiz (kids-specific)
    api/client.ts                  # Axios + JWT interceptor + SecureStore
    api/auth.ts                    # OTP login, dev-login, getMe
    api/billing.ts                 # Invoices, payments
    api/schedules.ts               # Templates, daily schedules, board/alight
    api/vehicles.ts                # GPS, vehicle assignments
    api/routes.ts                  # Route plans
    api/escort.ts                  # Escort availability, shifts
    api/compliance.ts              # Consent (parent + driver)
    api/notifications.ts           # FCM token registration
    api/students.ts                # Student CRUD, enrollments, academy branding
    api/support.ts                 # Support tickets
    hooks/useAuth.tsx              # AuthContext + provider
    hooks/useGpsTracking.ts        # Driver GPS sender (expo-location)
    hooks/useVehicleTracking.ts    # Parent/viewer GPS receiver (WebSocket + polling)
    hooks/useNotifications.ts      # Push notification registration
    hooks/useTTS.ts                # Text-to-speech for driver announcements
    components/SOSButton.tsx       # Emergency SOS FAB
    components/InfoRow.tsx         # Reusable info display row
    navigation/RootNavigator.tsx   # Role-based routing (auth + consent gate)
    navigation/tabConfig.tsx       # Shared tab bar option factory
    navigation/ParentTabNavigator.tsx
    navigation/DriverTabNavigator.tsx
    navigation/EscortTabNavigator.tsx
    navigation/AdminTabNavigator.tsx
    navigation/StudentTabNavigator.tsx
    screens/LoginScreen.tsx        # Dev + Production login (OTP)
    screens/OnboardingScreen.tsx   # Onboarding slides
    screens/parent/               # 7 screens + 11 sub-components + 1 util
    screens/driver/               # 4 screens + 3 sub-components + 1 hook
    screens/escort/               # 3 screens
    screens/admin/                # 4 screens
    screens/student/              # 3 screens
    utils/debug.ts
    utils/navigation.ts
    utils/toast.ts
```

**Total mobile LOC**: ~11,528 (6,027 screens + 5,501 infra/components/hooks/api)

### 1.2 Proposed Monorepo Structure

```
packages/
  core-mobile/
    src/
      api/
        client.ts                  # Axios + JWT interceptor (parameterized baseURL)
        auth.ts                    # Login flows (OTP, dev-login, getMe)
      hooks/
        useAuth.tsx                # AuthContext (app-agnostic)
        useNotifications.ts        # Push notification registration
        useGpsTracking.ts          # GPS sender (for service providers)
        useVehicleTracking.ts      # GPS receiver (for consumers)
        useTTS.ts                  # TTS announcements
      components/
        SOSButton.tsx              # Emergency button (re-themed per app)
        InfoRow.tsx                # Info display row
        StatusBadge.tsx            # NEW: shared status badge
        EmptyState.tsx             # NEW: shared empty state
        LoadingScreen.tsx          # NEW: shared loading spinner
        FilterChipRow.tsx          # NEW: horizontal filter chips
        CardBase.tsx               # NEW: pressable card with shadow
      navigation/
        tabConfig.tsx              # Tab bar factory (accepts theme)
        RootNavigator.tsx          # Auth gate + role routing (configurable)
      screens/
        LoginScreen.tsx            # Login (parameterized: app name, logo, roles)
        OnboardingScreen.tsx       # Onboarding (parameterized: slides)
      i18n/
        index.ts                   # i18next setup
        ko.ts                      # Shared Korean strings
      constants/
        theme.ts                   # Base theme tokens + createTheme() factory
      utils/
        debug.ts
        navigation.ts
        toast.ts
    package.json
    tsconfig.json
    index.ts                       # Barrel exports

apps/
  safeway-kids/
    mobile/
      App.tsx
      app.json                     # bundleId: kr.safeway-kids.app
      index.ts
      eas.json
      src/
        theme.ts                   # Teal/Amber palette (current)
        i18n/ko.ts                 # Kids-specific strings
        onboarding.ts              # Slides config
        constants/mapHtml.ts
        constants/safetyQuizData.ts
        api/                       # Kids-specific: schedules, students, compliance, escort, routes, billing, support
        screens/                   # All current screens (parent, driver, escort, admin, student)
        navigation/                # Kids-specific tab navigators

  pettracker/
    mobile/
      App.tsx
      app.json                     # bundleId: kr.pettracker.app
      index.ts
      eas.json
      src/
        theme.ts                   # Orange/Green palette
        i18n/ko.ts                 # Pet-specific strings
        onboarding.ts              # Slides config
        api/                       # Pet-specific: pets, walks, bookings, walker profiles, reviews
        screens/
          owner/                   # Home, Search, Track, Bookings, Profile
          walker/                  # Home, Schedule, Walk, Earnings, Profile
        navigation/
          OwnerTabNavigator.tsx
          WalkerTabNavigator.tsx

  careconnect/
    mobile/
      App.tsx
      app.json                     # bundleId: kr.careconnect.app
      index.ts
      eas.json
      src/
        theme.ts                   # Teal/Navy palette
        i18n/ko.ts                 # Care-specific strings
        onboarding.ts              # Slides config
        api/                       # Care-specific: sessions, bookings, caregiver profiles, reviews
        screens/
          parent/                  # Home, Search, Monitor, Bookings, Profile
          caregiver/               # Home, Schedule, Session, Earnings, Profile
        navigation/
          ParentTabNavigator.tsx
          CaregiverTabNavigator.tsx
```

### 1.3 File Migration Matrix

| Current File | Destination | Rationale |
|---|---|---|
| `api/client.ts` | `packages/core-mobile/` | Identical JWT/axios logic across all apps |
| `api/auth.ts` | `packages/core-mobile/` | Same OTP flow, parameterized by `app_context` |
| `hooks/useAuth.tsx` | `packages/core-mobile/` | Auth state is app-agnostic |
| `hooks/useNotifications.ts` | `packages/core-mobile/` | FCM registration identical |
| `hooks/useGpsTracking.ts` | `packages/core-mobile/` | GPS sender reused by walker/caregiver |
| `hooks/useVehicleTracking.ts` | `packages/core-mobile/` | GPS receiver reused by owner/parent |
| `hooks/useTTS.ts` | `packages/core-mobile/` | Voice announcements reusable |
| `components/SOSButton.tsx` | `packages/core-mobile/` | Emergency button shared (label parameterized) |
| `components/InfoRow.tsx` | `packages/core-mobile/` | Generic UI component |
| `navigation/tabConfig.tsx` | `packages/core-mobile/` | Tab factory is app-agnostic |
| `navigation/RootNavigator.tsx` | `packages/core-mobile/` | Auth gate shared, role map injected |
| `screens/LoginScreen.tsx` | `packages/core-mobile/` | Login screen, parameterized by app name/roles |
| `screens/OnboardingScreen.tsx` | `packages/core-mobile/` | Onboarding, parameterized by slides array |
| `i18n/*` | `packages/core-mobile/` (base) | Base strings shared; app-specific merged |
| `constants/theme.ts` | `packages/core-mobile/` (base tokens) | `createTheme()` factory, app provides palette |
| `utils/*` | `packages/core-mobile/` | All utils are generic |
| `api/schedules.ts` | `apps/safeway-kids/` | Shuttle-specific scheduling |
| `api/students.ts` | `apps/safeway-kids/` | Child/student management |
| `api/escort.ts` | `apps/safeway-kids/` | Safety escort specific |
| `api/routes.ts` | `apps/safeway-kids/` | Route optimization specific |
| `api/billing.ts` | `packages/core-mobile/` | Billing concepts shared (invoices, payments) |
| `api/compliance.ts` | Split | Parent consent -> core, driver consent -> safeway-kids |
| `api/vehicles.ts` | `apps/safeway-kids/` | Vehicle telemetry specific |
| `api/support.ts` | `packages/core-mobile/` | Support tickets shared |
| `api/notifications.ts` | `packages/core-mobile/` | Notification prefs shared |
| `constants/mapHtml.ts` | `apps/safeway-kids/` | KakaoMap WebView specific |
| `constants/safetyQuizData.ts` | `apps/safeway-kids/` | Kids safety quiz specific |
| All `screens/parent/*` | `apps/safeway-kids/` | Shuttle-parent specific |
| All `screens/driver/*` | `apps/safeway-kids/` | Shuttle-driver specific |
| All `screens/escort/*` | `apps/safeway-kids/` | Shuttle-escort specific |
| All `screens/admin/*` | `apps/safeway-kids/` | Academy admin specific |
| All `screens/student/*` | `apps/safeway-kids/` | Student specific |

### 1.4 Package Manager Strategy

**Recommendation: npm workspaces + Turborepo**

Rationale:
- The project already uses `npm` (no yarn.lock or pnpm-lock present)
- npm workspaces provide a single hoisted `node_modules` which is critical for Expo compatibility
- Turborepo adds task orchestration (build, test, lint) with caching

Root `package.json`:
```json
{
  "name": "safeway-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*/mobile"
  ],
  "devDependencies": {
    "turbo": "^2.x"
  }
}
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "test": { "dependsOn": [] },
    "lint": { "dependsOn": [] },
    "typecheck": { "dependsOn": [] },
    "start": { "cache": false, "persistent": true }
  }
}
```

### 1.5 Expo Compatibility: Single node_modules

Expo requires all dependencies resolvable from the app root. With npm workspaces, dependencies hoist to the root `node_modules/` by default. Each app's `metro.config.js` must set `watchFolders` to include the packages directory:

```js
// apps/pettracker/mobile/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
```

---

## 2. Component Reuse Matrix

### 2.1 Shared Components (packages/core-mobile)

| Component | Current Location | Classification | Notes |
|---|---|---|---|
| `InfoRow` | `components/InfoRow.tsx` | **CORE** | Used as-is across all apps |
| `SOSButton` | `components/SOSButton.tsx` | **RESKIN** | Label/icon parameterized ("SOS" vs "Emergency") |

### 2.2 Screens

| Screen | Current LOC | Classification | Reuse Notes |
|---|---|---|---|
| `LoginScreen` | 406 | **RESKIN** | Parameterize: app name, subtitle, logo icon, role options, role colors |
| `OnboardingScreen` | 224 | **RESKIN** | Accept slides array as prop |
| `parent/HomeScreen` | 439 | **NEW** for PT/CC | Pattern reusable (greeting + today's list), but domain data entirely different |
| `parent/MapScreen` | 327 | **RESKIN** for PT | Same WebView tracking map, different entity (pet vs vehicle) |
| `parent/ScheduleScreen` | 365 | **NEW** for PT/CC | Different schedule models |
| `parent/BillingScreen` | 164 | **RESKIN** | Invoice model nearly identical across apps |
| `parent/ProfileScreen` | 273 | **RESKIN** | Profile structure reusable, different fields |
| `parent/ChildProfileScreen` | 295 | **NEW** for PT/CC | Pet profile / care recipient profile |
| `parent/ConsentScreen` | 204 | **RESKIN** | Consent flow shared, different scope items |
| `driver/HomeScreen` | 264 | **RESKIN** for PT walker | Assignment summary pattern reusable |
| `driver/RouteScreen` | 227 | **NEW** for PT | Walk has no route concept |
| `driver/MapScreen` | 206 | **RESKIN** | GPS tracking map shared concept |
| `driver/ProfileScreen` | 209 | **RESKIN** | Provider profile pattern shared |
| `escort/ShiftsScreen` | 304 | **NEW** | Specific to safeway-kids |
| `escort/AvailabilityScreen` | 352 | **RESKIN** for CC | Availability registration pattern shared |
| `escort/EscortRouteScreen` | 10 | **SKIP** | Scaffold only |
| `admin/DashboardScreen` | 318 | **NEW** for PT/CC | Different KPIs per domain |
| `admin/StudentsScreen` | 271 | **NEW** for PT/CC | Different entity management |
| `admin/BillingAdminScreen` | 382 | **RESKIN** | Admin billing pattern shared |
| `admin/ProfileScreen` | 199 | **RESKIN** | Admin profile shared |
| `student/ScheduleScreen` | 274 | **SKIP** | Kids-only |
| `student/SafetyQuizScreen` | 312 | **SKIP** | Kids-only |
| `student/ProfileScreen` | 2 | **SKIP** | Scaffold only |

### 2.3 Sub-Components

| Component | LOC | Classification |
|---|---|---|
| `parent/components/ScheduleItem` | 133 | **RESKIN** — Card pattern reusable |
| `parent/components/InvoiceCard` | 335 | **RESKIN** — Invoice card shared |
| `parent/components/ProfileHeader` | 122 | **RESKIN** — Header pattern shared |
| `parent/components/SettingsMenu` | 99 | **RESKIN** — Settings menu shared |
| `parent/components/DateNavHeader` | 69 | **CORE** — Date navigation shared |
| `parent/components/DailyView` | 84 | App-specific |
| `parent/components/WeeklyView` | 149 | App-specific |
| `parent/components/MonthlyView` | 152 | App-specific |
| `parent/components/ConsentCard` | 220 | **RESKIN** — Consent card shared |
| `parent/components/ConsentDetail` | 257 | **RESKIN** — Consent detail shared |
| `parent/components/PaymentModal` | 59 | **CORE** — Payment flow shared |
| `parent/components/TicketsModal` | 133 | **CORE** — Support tickets shared |
| `parent/components/SupportFormModal` | 172 | **CORE** — Support form shared |
| `driver/components/StopCard` | 276 | App-specific (shuttle) |
| `driver/components/VehicleClearance` | 90 | App-specific (shuttle) |
| `driver/components/MemoModal` | 59 | **RESKIN** — Note/memo pattern shared |

### 2.4 Hooks

| Hook | LOC | Classification |
|---|---|---|
| `useAuth` | 64 | **CORE** — Identical auth flow |
| `useGpsTracking` | 149 | **CORE** — GPS sender (walker sends location like driver) |
| `useVehicleTracking` | 325 | **RESKIN** — Entity tracking (pet/child/vehicle), WebSocket endpoint parameterized |
| `useNotifications` | 100 | **CORE** — FCM registration identical |
| `useTTS` | 60 | **CORE** — TTS reusable (different announcements per app) |

### 2.5 API Modules

| Module | LOC | Classification |
|---|---|---|
| `client.ts` | 127 | **CORE** — JWT interceptor shared |
| `auth.ts` | 70 | **CORE** — Auth endpoints shared (app_context added to login) |
| `billing.ts` | 71 | **CORE** — Invoice/payment model shared |
| `notifications.ts` | 23 | **CORE** — Token registration shared |
| `support.ts` | 25 | **CORE** — Tickets shared |
| `compliance.ts` | 62 | **SPLIT** — Parent consent -> core, driver consent -> kids |
| `schedules.ts` | 158 | App-specific (safeway-kids) |
| `students.ts` | 81 | App-specific (safeway-kids) |
| `vehicles.ts` | 45 | App-specific (safeway-kids) |
| `routes.ts` | 26 | App-specific (safeway-kids) |
| `escort.ts` | 59 | App-specific (safeway-kids) |

### 2.6 New Component LOC Estimates (PetTracker MVP)

| Component | Estimated LOC | Notes |
|---|---|---|
| **Owner Screens** | | |
| `OwnerHomeScreen` | ~350 | Today's walks + pet status cards |
| `SearchWalkersScreen` | ~400 | Walker search + filters + list |
| `TrackWalkScreen` | ~300 | Real-time GPS map (reskin of MapScreen) |
| `BookingsScreen` | ~250 | Booking list + status |
| `OwnerProfileScreen` | ~200 | Reskin of parent ProfileScreen |
| `PetProfileScreen` | ~300 | Pet details + photo + medical info |
| `BookingDetailScreen` | ~250 | Booking detail + cancel/review |
| **Walker Screens** | | |
| `WalkerHomeScreen` | ~300 | Today's walks + earnings summary |
| `WalkerScheduleScreen` | ~250 | Calendar of upcoming walks |
| `ActiveWalkScreen` | ~400 | GPS tracking + walk controls + photo capture |
| `EarningsScreen` | ~250 | Earnings history + withdrawal |
| `WalkerProfileScreen` | ~200 | Reskin of driver ProfileScreen |
| `WalkerOnboardingScreen` | ~300 | Background check + profile setup |
| **Shared New** | | |
| `ReviewScreen` | ~200 | Rating + review after service |
| `ChatScreen` | ~350 | In-app messaging (deferred?) |
| **New Core Components** | | |
| `StatusBadge` | ~40 | Extracted from ScheduleCard pattern |
| `EmptyState` | ~50 | Extracted from HomeScreen pattern |
| `LoadingScreen` | ~30 | Extracted from RootNavigator pattern |
| `FilterChipRow` | ~80 | Extracted from student filter pattern |
| `CardBase` | ~60 | Extracted from ScheduleCard wrapper |
| **PetTracker API modules** | | |
| `api/pets.ts` | ~80 | Pet CRUD |
| `api/walks.ts` | ~120 | Walk booking + active walk |
| `api/walkers.ts` | ~80 | Walker search + profiles |
| `api/reviews.ts` | ~50 | Review CRUD |
| | | |
| **PetTracker Total** | **~4,690** | New LOC estimate |

### 2.7 New Component LOC Estimates (CareConnect MVP)

| Component | Estimated LOC | Notes |
|---|---|---|
| **Parent Screens** | | |
| `CareParentHomeScreen` | ~350 | Today's sessions + child status |
| `SearchCaregiversScreen` | ~400 | Caregiver search + filters |
| `MonitorSessionScreen` | ~350 | Live session view + activity log |
| `CareBookingsScreen` | ~250 | Booking list + status |
| `CareParentProfileScreen` | ~200 | Reskin of ProfileScreen |
| `CareRecipientProfileScreen` | ~300 | Child/elder details |
| **Caregiver Screens** | | |
| `CaregiverHomeScreen` | ~300 | Today's sessions + earnings |
| `CaregiverScheduleScreen` | ~250 | Calendar of sessions |
| `ActiveSessionScreen` | ~450 | GPS check-in + activity logging + photo |
| `CareEarningsScreen` | ~250 | Earnings history + withdrawal |
| `CaregiverProfileScreen` | ~200 | Reskin |
| `CaregiverOnboardingScreen` | ~300 | Background check + certifications |
| **CareConnect API modules** | | |
| `api/sessions.ts` | ~120 | Session CRUD + check-in/out |
| `api/caregivers.ts` | ~80 | Caregiver search + profiles |
| `api/care-bookings.ts` | ~100 | Booking CRUD |
| `api/reviews.ts` | ~50 | Review CRUD |
| | | |
| **CareConnect Total** | **~3,950** | New LOC estimate |

---

## 3. Navigation Architecture

### 3.1 Current Navigation Pattern

The current `RootNavigator` implements a clean pattern:
1. Loading state (check onboarding + auth)
2. Onboarding gate
3. Auth gate (LoginScreen)
4. Consent gate (parent role only)
5. Role-based tab navigator selection

This pattern is **directly reusable** across all three apps. The key insight: `RootNavigator` already uses role-based routing via the `user.role` field. Adding `app_context` from AD-01 means the backend will return role-appropriate data per app automatically.

### 3.2 Proposed Navigation Per App

#### PetTracker

```
RootNavigator (core, configured)
  |-- OnboardingScreen (core, slides from pettracker/onboarding.ts)
  |-- LoginScreen (core, roles: [PET_OWNER, WALKER])
  |-- ConsentScreen (core, scope: pet data collection)
  |-- role === "PET_OWNER" --> OwnerTabNavigator
  |     |-- OwnerHome
  |     |-- Search (Walkers)
  |     |-- Track (Walk GPS)
  |     |-- Bookings
  |     |-- Profile
  |-- role === "WALKER" --> WalkerTabNavigator
        |-- WalkerHome
        |-- Schedule
        |-- Walk (Active Walk)
        |-- Earnings
        |-- Profile
```

#### CareConnect

```
RootNavigator (core, configured)
  |-- OnboardingScreen (core, slides from careconnect/onboarding.ts)
  |-- LoginScreen (core, roles: [CARE_PARENT, CAREGIVER])
  |-- ConsentScreen (core, scope: care data collection)
  |-- role === "CARE_PARENT" --> CareParentTabNavigator
  |     |-- Home
  |     |-- Search (Caregivers)
  |     |-- Monitor (Live Session)
  |     |-- Bookings
  |     |-- Profile
  |-- role === "CAREGIVER" --> CaregiverTabNavigator
        |-- Home
        |-- Schedule
        |-- Session (Active Session)
        |-- Earnings
        |-- Profile
```

### 3.3 Shared Navigation Infrastructure

The `createTabScreenOptions` factory in `tabConfig.tsx` is already well-designed for reuse. Each app passes its own accent color and icon map. No changes needed to this factory.

The `RootNavigator` needs refactoring into a **configurable component**:

```tsx
// packages/core-mobile/src/navigation/RootNavigator.tsx
interface AppConfig {
  onboardingSlides: OnboardingSlide[];
  loginRoles: RoleOption[];
  roleNavigatorMap: Record<string, React.ComponentType>;
  consentCheck?: (user: UserResponse) => Promise<boolean>;
  appName: string;
  appLogo: ImageSource;
}

export function createRootNavigator(config: AppConfig) {
  return function RootNavigator() {
    // ... same auth/onboarding/consent gate logic
    // ... role routing from config.roleNavigatorMap
  };
}
```

### 3.4 Deep Linking

Currently no deep link configuration exists. For the monorepo, each app should define its own linking config:

```ts
// apps/pettracker/mobile/src/linking.ts
export const linking = {
  prefixes: ["pettracker://", "https://pettracker.kr"],
  config: {
    screens: {
      OwnerHome: "home",
      Track: "track/:walkId",
      Bookings: "bookings",
    },
  },
};
```

---

## 4. App Configuration Strategy

### 4.1 app.json Per App

Each app maintains its own `app.json` (or `app.config.ts` for dynamic values):

| Field | safeway-kids | pettracker | careconnect |
|---|---|---|---|
| `name` | SAFEWAY KIDS | PetTracker | CareConnect |
| `slug` | safeway-kids | pettracker | careconnect |
| `ios.bundleIdentifier` | kr.safeway-kids.app | kr.pettracker.app | kr.careconnect.app |
| `android.package` | com.safewaykids.app | com.pettracker.app | com.careconnect.app |
| `icon` | ./assets/icon.png | ./assets/icon.png | ./assets/icon.png |
| `splash.backgroundColor` | #ffffff | #FFF8F0 (warm) | #F0F8FF (cool) |
| `extra.apiBaseUrl` | .../api/v1 | .../api/v1 | .../api/v1 |
| `extra.appContext` | safeway_kids | pettracker | careconnect |
| `owner` | patrickryu | patrickryu | patrickryu |

Recommendation: Use `app.config.ts` (dynamic config) instead of `app.json` for cleaner environment variable handling:

```ts
// apps/pettracker/mobile/app.config.ts
export default {
  expo: {
    name: "PetTracker",
    slug: "pettracker",
    extra: {
      apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:8000/api/v1",
      appContext: "pettracker",
    },
    // ...
  },
};
```

### 4.2 EAS Build Profiles

Each app gets its own `eas.json`:

```json
{
  "cli": { "version": ">= 15.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {
      "ios": { "appleId": "...", "ascAppId": "..." },
      "android": { "serviceAccountKeyPath": "..." }
    }
  }
}
```

Build commands from root:
```bash
# Build specific app
cd apps/pettracker/mobile && eas build --profile production --platform ios
# Or with turbo
turbo run build --filter=@pettracker/mobile
```

### 4.3 Environment Variables

Use `.env` per app + EAS secrets:

```
# apps/pettracker/mobile/.env
EXPO_PUBLIC_API_BASE_URL=https://api.pettracker.kr/api/v1
EXPO_PUBLIC_APP_CONTEXT=pettracker
EXPO_PUBLIC_KAKAO_MAP_KEY=...
```

The `api/client.ts` in core already reads from `Constants.expoConfig.extra.apiBaseUrl`, so this pattern works without code changes.

---

## 5. Theme / Branding

### 5.1 Current Theme Architecture

The current `constants/theme.ts` exports:
- `Colors` — 50+ color tokens (brand, surface, text, status, role accents)
- `Typography` — sizes, weights, line heights
- `Spacing` — 4-48px scale
- `Radius` — 4-9999 scale
- `Shadows` — sm/md/lg
- `STATUS_COLORS` / `STATUS_BG_COLORS` — status-to-color maps

This is a **solid foundation**. The architecture is already token-based, which makes theming straightforward.

### 5.2 Proposed Theme System

```ts
// packages/core-mobile/src/constants/theme.ts

// Base tokens (shared across all apps)
export const BaseTypography = { /* current Typography */ };
export const BaseSpacing = { /* current Spacing */ };
export const BaseRadius = { /* current Radius */ };
export const BaseShadows = { /* current Shadows */ };

// Color palette interface
export interface AppPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  // Role colors
  roleConsumer: string;    // parent / pet owner
  roleProvider: string;    // driver / walker / caregiver
  roleAdmin: string;
}

// Create full theme from palette
export function createTheme(palette: AppPalette) {
  return {
    Colors: {
      ...palette,
      // Surface, text, status colors remain the same
      background: '#F5F8F8',
      surface: '#FFFFFF',
      // ... all neutral/status colors
    },
    Typography: BaseTypography,
    Spacing: BaseSpacing,
    Radius: BaseRadius,
    Shadows: BaseShadows,
  };
}
```

### 5.3 App-Specific Palettes

```ts
// apps/safeway-kids/mobile/src/theme.ts
import { createTheme } from "@core-mobile/constants/theme";

export const theme = createTheme({
  primary: '#0F7A7A',        // Ocean Teal
  primaryDark: '#095E5E',
  primaryLight: '#E0F2F2',
  accent: '#F4A22D',         // Saffron Amber
  accentDark: '#C47D10',
  accentLight: '#FEF3DC',
  roleConsumer: '#0F7A7A',   // Parent teal
  roleProvider: '#E08020',   // Driver amber
  roleAdmin: '#D44C3E',
});
```

```ts
// apps/pettracker/mobile/src/theme.ts
import { createTheme } from "@core-mobile/constants/theme";

export const theme = createTheme({
  primary: '#E67E22',        // Warm Orange
  primaryDark: '#D35400',
  primaryLight: '#FEF0E0',
  accent: '#27AE60',         // Natural Green
  accentDark: '#1E8449',
  accentLight: '#D5F5E3',
  roleConsumer: '#E67E22',   // Owner orange
  roleProvider: '#27AE60',   // Walker green
  roleAdmin: '#8E44AD',
});
```

```ts
// apps/careconnect/mobile/src/theme.ts
import { createTheme } from "@core-mobile/constants/theme";

export const theme = createTheme({
  primary: '#1ABC9C',        // Teal
  primaryDark: '#16A085',
  primaryLight: '#D1F2EB',
  accent: '#2C3E50',         // Navy
  accentDark: '#1A252F',
  accentLight: '#D6E4F0',
  roleConsumer: '#1ABC9C',   // Parent teal
  roleProvider: '#2C3E50',   // Caregiver navy
  roleAdmin: '#E74C3C',
});
```

### 5.4 Theme Delivery to Components

**Option A (recommended): Theme via module import** — Each app re-exports `theme` as `@app/theme`, and components import from there. This is what the codebase currently does (importing from `../../constants/theme`), so the migration is minimal.

**Option B: React Context** — A `ThemeProvider` wraps the app and components consume via `useTheme()`. More flexible but adds overhead and requires refactoring every component that currently imports `Colors` directly.

Recommendation: **Option A for MVP**. The current import pattern works well. Core-mobile components accept theme tokens as props or use a re-exported module. Migrate to Context only if runtime theme switching becomes necessary (e.g., dark mode).

---

## 6. Performance Considerations

### 6.1 Bundle Size Impact

| Concern | Analysis | Mitigation |
|---|---|---|
| Shared package increases bundle | No — Metro tree-shakes unused exports from workspace packages | Ensure core-mobile uses named exports, not barrel re-exports of everything |
| Duplicate React/React Native | npm workspace hoisting ensures single copy | Verify with `npx expo-doctor` |
| Heavy dependencies | Current deps are lean: axios, i18next, expo-* | No action needed |
| WebView for maps | `react-native-webview` at 400KB | Already present, shared across apps |

Estimated bundle size per app:
- **Core-mobile shared**: ~200KB (api client, hooks, base components, navigation)
- **App-specific**: ~300-500KB (screens, assets, app-specific API)
- **Total per app**: ~2-3MB JS bundle (similar to current safeway-kids)

### 6.2 Lazy Loading

Currently all tab navigators use `lazy: true` (set in `tabConfig.tsx`), which means screens only mount when first visited. This is the correct approach.

For app-specific screens that are rarely accessed (e.g., admin dashboards), use `React.lazy()`:

```tsx
const AdminDashboard = React.lazy(() => import("./screens/admin/DashboardScreen"));
```

### 6.3 List Performance

**Current**: `FlatList` used throughout. The `ParentHomeScreen` renders schedule cards in a `FlatList` with `memo`-ized `ScheduleCard` components -- this is correct.

**Recommendation for new apps**: Use `@shopify/flash-list` (FlashList) for lists expected to exceed 50 items (e.g., walker search results, booking history). FlashList provides better recycling and FPS.

```bash
npx expo install @shopify/flash-list
```

### 6.4 Re-render Analysis

| Component | Re-render Risk | Notes |
|---|---|---|
| `RootNavigator` | Low | State changes only on auth/consent events |
| `ParentHomeScreen` | Medium | `useFocusEffect` triggers full reload on tab focus |
| `useVehicleTracking` | High | WebSocket messages trigger frequent state updates |
| `ScheduleCard` | Low | Already `memo`-ized |
| `SOSButton` | Low | Minimal state |

The `useVehicleTracking` hook creates a new `Map` on every location update. For multiple tracked entities, this could cause excessive re-renders of the map component. Consider `useRef` for the locations map and only trigger re-render via a counter or selected vehicle change.

### 6.5 Shared vs Duplicated Dependencies

With npm workspaces, all dependencies hoist to root by default. The key rule:

- **React, React Native, Expo SDK**: Must be single version across all apps. Enforce via `overrides` in root `package.json` if needed.
- **App-specific deps** (e.g., a pet image cropper): Can be app-local without issue.

---

## 7. Testing Strategy

### 7.1 Current Test State

- **10 test suites, 36 passed** (from CLAUDE.md verification data)
- Tests located in `mobile/src/__tests__/`
- Using Jest + @testing-library/react-native
- Test setup file: `mobile/src/__tests__/setup.ts`

Existing test files:
```
AdminDashboardScreen.test.tsx
DriverHomeScreen.test.tsx
DriverRouteScreen.test.tsx
EscortAvailabilityScreen.test.tsx
EscortShiftsScreen.test.tsx
LoginScreen.test.tsx
ParentBillingScreen.test.tsx
ParentHomeScreen.test.tsx
RootNavigator.test.tsx
useAuth.test.tsx
StopCard.test.tsx
VehicleClearance.test.tsx
MemoModal.test.tsx
ScheduleItem.test.tsx
InvoiceCard.test.tsx
SettingsMenu.test.tsx
ProfileHeader.test.tsx
```

### 7.2 Monorepo Test Architecture

```
packages/core-mobile/
  src/__tests__/          # Core component + hook tests
    useAuth.test.tsx
    LoginScreen.test.tsx
    RootNavigator.test.tsx
    InfoRow.test.tsx
    SOSButton.test.tsx
  jest.config.js          # Core test config

apps/safeway-kids/mobile/
  src/__tests__/          # Kids-specific tests (migrate current tests)
  jest.config.js

apps/pettracker/mobile/
  src/__tests__/          # PetTracker-specific tests
  jest.config.js

apps/careconnect/mobile/
  src/__tests__/          # CareConnect-specific tests
  jest.config.js
```

### 7.3 Shared Test Utilities

Move to `packages/core-mobile/src/__tests__/`:

```ts
// packages/core-mobile/src/__tests__/test-utils.tsx
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../hooks/useAuth";

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider>
      <AuthProvider>{ui}</AuthProvider>
    </SafeAreaProvider>
  );
}

// Mock factories
export function mockUser(overrides = {}) {
  return {
    id: "test-user-id",
    role: "parent",
    phone: "01012345678",
    name: "Test User",
    ...overrides,
  };
}
```

### 7.4 Test Commands

```bash
# Run all tests
turbo run test

# Run core tests only
cd packages/core-mobile && npm test

# Run specific app tests
cd apps/pettracker/mobile && npm test

# Run with coverage
turbo run test -- --coverage
```

### 7.5 Test Migration Plan

1. `useAuth.test.tsx` -> `packages/core-mobile/` (tests core hook)
2. `LoginScreen.test.tsx` -> `packages/core-mobile/` (tests shared screen)
3. `RootNavigator.test.tsx` -> `packages/core-mobile/` (tests shared nav)
4. All other tests remain in `apps/safeway-kids/mobile/` (they test kids-specific screens)

---

## 8. Risks and Recommendations

### 8.1 High Priority

| Risk | Impact | Mitigation |
|---|---|---|
| Metro resolution in monorepo | App won't start if Metro can't find packages | Set up `metro.config.js` watchFolders early; test with `expo start --clear` |
| Single Expo SDK version | All apps must use same SDK | Enforce in root package.json; current SDK 54 is correct |
| Auth state shared across apps | Users could accidentally cross-authenticate | Backend `app_context` in JWT (AD-01) prevents this; verify in auth.ts |

### 8.2 Medium Priority

| Risk | Impact | Mitigation |
|---|---|---|
| i18n key collisions | Wrong translations shown | Namespace keys: `core.common.loading` vs `pettracker.walk.start` |
| Theme import paths break | Build errors across all components | Create path aliases in tsconfig: `@core-mobile/*`, `@app/*` |
| Test mocks differ per app | Flaky tests | Shared mock factories in core-mobile test utils |

### 8.3 Architecture Observations

1. **useAuth.tsx uses React 19 `use()` API** (line 63: `return use(AuthContext)`). This is a modern pattern but requires React 19. All apps must stay on React 19.1.0+. This is fine since Expo SDK 54 ships with React 19.

2. **api/client.ts has platform-aware token storage** (SecureStore for native, localStorage for web). This is well-designed for cross-platform and can be shared as-is.

3. **useVehicleTracking.ts is the most complex hook** (325 LOC). It handles WebSocket connection, auth, reconnection with exponential backoff, and fallback to HTTP polling. This is a high-value shared component that avoids reimplementation for PetTracker/CareConnect.

4. **No state management library** (no Redux, Zustand, Jotai). State is managed via React Context (useAuth) and local component state. This is appropriate for the current complexity. If PetTracker or CareConnect needs more complex state (e.g., active walk with multiple data streams), consider adding Zustand in core-mobile.

5. **mapHtml.ts embeds KakaoMap HTML** for WebView rendering. PetTracker may need a different map provider or different markers. This should remain app-specific.

---

## 9. Implementation Order

### Phase 1: Monorepo Scaffold (1 milestone)
1. Create root `package.json` with workspaces
2. Create `packages/core-mobile/` structure
3. Move shared code (api/client, hooks, components, navigation, utils, i18n base)
4. Set up `metro.config.js` for each app
5. Add `turbo.json`
6. Verify `safeway-kids` still builds and tests pass

### Phase 2: Theme Extraction (1 milestone)
1. Create `createTheme()` factory in core-mobile
2. Create app-specific theme files
3. Update import paths in all shared components
4. Verify visual parity with current safeway-kids

### Phase 3: PetTracker App Shell (1 milestone)
1. Create `apps/pettracker/mobile/` with app.json, App.tsx
2. Wire up core-mobile navigation
3. Create OwnerTabNavigator + WalkerTabNavigator (skeleton screens)
4. Verify Expo Go launch

### Phase 4: PetTracker Screens (2-3 milestones)
1. Owner flow: Home, Search, Track, Bookings, Profile
2. Walker flow: Home, Schedule, ActiveWalk, Earnings, Profile
3. PetTracker-specific API modules

### Phase 5: CareConnect (follows same Phase 3-4 pattern)

---

## 10. Summary

| Metric | Value |
|---|---|
| Current mobile LOC | ~11,528 |
| Core-mobile (shared) estimated | ~2,200 LOC (19% of current) |
| SafeWay Kids (after split) | ~9,300 LOC |
| PetTracker new LOC | ~4,690 |
| CareConnect new LOC | ~3,950 |
| Total after all 3 apps | ~20,140 LOC |
| Components marked CORE | 8 |
| Components marked RESKIN | 15 |
| Components marked NEW | 12 (per app) |
| Hooks shared | 5/5 (100%) |
| API modules shared | 5/11 (45%) |

The existing mobile codebase is well-structured for extraction. The role-based navigation pattern, token-based theme system, and JWT auth infrastructure all translate directly to a multi-app monorepo. The primary work is in creating app-specific screens and API modules, not in rearchitecting shared infrastructure.
