# SAFEWAY KIDS — Architecture Decisions Record

**Date:** 2026-03-13
**Status:** Approved by user

---

## AD1 — Database Stack
**Decision:** PostgreSQL (primary relational) + Firebase Realtime DB (real-time events) + Redis (cache/pub-sub buffer)
- PostgreSQL: users, academies, students, contracts, schedules, billing
- Firebase Realtime DB: vehicle GPS pings, abnormal behavior flags, boarding alerts → push to clients
- Redis: absorbs 1–6pm burst traffic, prevents GPS updates from hitting Postgres directly, batch-write to Postgres for historical records

## AD2 — Architecture Pattern
**Decision:** Modular monolith with strict domain boundaries
- Internal modules: auth, routing-engine, vehicle-telemetry, billing, notification
- First extraction candidates: VRP-TW engine (CPU-intensive, clean API boundary) and telemetry pipeline
- Rationale: pre-revenue, small team, microservices overhead not justified yet

## AD3 — Authentication Strategy
**Decision:** Kakao login (primary) + Phone OTP (guardian verification + fallback) + Naver login (Phase 2)
- Parents: Kakao social login primary
- Drivers/Academy admins: Phone OTP primary (professional context)
- Legal guardian verification (PIPA, 14세 미만): Phone OTP mandatory
- Naver login: deferred to Phase 2

## AD4 — Maps/Navigation API
**Decision:** Kakao Maps (parent app display) + T-map (driver routing/ETA engine) + abstraction layer
- Kakao Maps: best developer experience for Korean web/mobile UI
- T-map (SK Telecom): superior turn-by-turn accuracy and real-time traffic data in Korea
- Abstraction layer: future provider flexibility, mitigate T-map pricing risk
- Action item: negotiate T-map enterprise contract early

## AD5 — MVP Scope (M0–M2)
**Decision:** End-to-end real-time data loop proving:
1. Project scaffolding + CI/CD pipeline + DB schema
2. Core Backend API (auth, student management, schedule CRUD, basic notifications)
3. Minimal Driver App (GPS broadcasting + manual boarding check-in/check-out)
4. Parent App MVP (real-time map tracking + boarding/alighting push notifications)
5. Web Dashboard skeleton (academy login + student roster upload)
- Rationale: Parent App without Driver App shows nothing — MVP must prove the full data loop

## AD6 — VRP-TW Engine
**Decision:** Google OR-Tools (Python), isolated service module from day one
- Free, well-documented, Python-native
- Handles domain-specific constraints: per-academy time windows, cross-academy mixing rules, daily capacity changes, child max ride time
- Runs as batch job (morning route generation) + lightweight re-optimization on cancellations
- Separate process with clean API even within monolith (different scaling profile)
- Third-party (Routific, OptimoRoute) rejected: custom constraint limitations + per-vehicle pricing + vendor lock-in on core competitive moat

## AD7 — Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Backend** | Python (FastAPI or Django) — TBD |
| **Primary DB** | PostgreSQL |
| **Real-time DB** | Firebase Realtime DB |
| **Cache/Pub-sub** | Redis |
| **Mobile Apps** | React Native |
| **Web Dashboard** | React.js |
| **Maps (Parent UI)** | Kakao Maps API |
| **Maps (Driver Routing)** | T-map API |
| **VRP-TW Engine** | Google OR-Tools (Python) |
| **Edge AI** | YOLOv4/v8, DeepSort, FaceNet (NVIDIA Jetson Nano) |
| **Deployment** | Kubernetes (autoscaling) |
| **CI/CD** | TBD |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Encryption** | AES-256 for biometric/CCTV data |
