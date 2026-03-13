# Final Tech Spec: M1 — Core Backend Hardening + Seed Data + Mobile Scaffolding

**Date:** 2026-03-13
**Status:** FINAL
**Prerequisite:** M0 Foundation (COMPLETE)

---

## 1. Problem Statement

M0 delivered the backend skeleton. M1 bridges the gap to a functional system by: hardening the backend with proper error handling, adding seed data for pilot testing, creating a GPS replay tool for simulation, and scaffolding the React Native mobile project so M2 can build UI against working APIs.

## 2. Goals

| ID | Goal |
|----|------|
| G1 | Create seed data script (pilot: 5 academies, 10 drivers, 50 students, 100 parents) |
| G2 | Build GPS replay tool for simulating vehicle movement |
| G3 | Scaffold React Native mobile project (Expo) with navigation structure |
| G4 | Add API documentation (OpenAPI/Swagger auto-generated) |
| G5 | Implement data retention policy seeding and soft-delete cleanup job |
| G6 | Add proper logging and error tracking infrastructure |
| G7 | Verify full end-to-end flow: register → add child → consent → enroll → schedule → GPS → notify |

## 3. Non-Goals

- Mobile app UI (M2)
- Web dashboard (M2)
- VRP-TW engine (M5)
- Edge AI (M6)

## 4. Deliverables

### 4.1 Seed Data Script (`backend/scripts/seed.py`)
- 5 academies in Gangnam-gu area with real coordinates
- 10 drivers, 10 safety escorts
- 50 students with guardian parents
- Schedule templates (Mon-Fri patterns)
- 5 vehicles with contracts
- Guardian consents for all students
- All data in Korean

### 4.2 GPS Replay Tool (`backend/scripts/gps_replay.py`)
- Reads recorded GPS coordinates from a JSON file
- Broadcasts GPS updates to the API at configurable intervals
- Simulates N vehicles moving simultaneously
- Used for testing the real-time GPS → Redis → WebSocket pipeline

### 4.3 React Native Mobile Scaffolding (`mobile/`)
- Expo + React Native project
- Tab navigation: Home, Map, Schedule, Profile
- Shared API client pointing to backend
- Auth screens (Kakao Login, OTP)
- i18n setup with Korean default

### 4.4 Backend Improvements
- OpenAPI docs auto-served at `/docs`
- Logging with structlog
- Data retention seed + cleanup endpoint
- Health check enhanced (DB + Redis connectivity)

## 5. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| M1-AC1 | `python scripts/seed.py` populates all tables with pilot data |
| M1-AC2 | `python scripts/gps_replay.py` sends GPS pings and WebSocket subscribers receive them |
| M1-AC3 | React Native project builds and runs on Expo Go |
| M1-AC4 | `/docs` shows all API endpoints with Korean descriptions |
| M1-AC5 | End-to-end test: seed → login → list students → view schedule → receive GPS location |
| M1-AC6 | All M0 tests still pass (no regressions) |
