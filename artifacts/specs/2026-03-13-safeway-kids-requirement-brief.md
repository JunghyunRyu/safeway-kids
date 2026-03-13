# SAFEWAY KIDS — Requirement Brief

**Date:** 2026-03-13
**Source:** `docs/srs/safeway_kids_srs_en.md` (SRS v1.0)
**Status:** Phase 0 — Intake

---

## 1. Problem Statement

Korean dual-income households face extreme scheduling stress for children's academy commutes. The current fragmented model — where each academy individually owns/contracts shuttle vehicles — is inefficient, opaque, and lacks systemic safety enforcement. No digital platform exists to consolidate, optimize, and monitor children's shuttle transportation at scale.

## 2. Platform Vision

**SAFEWAY KIDS** is an AI-powered children's school shuttle bus sharing platform that:
- Digitizes and monitors the interior of school vehicles (previously a black box)
- Optimizes multi-stop routes across academies
- Provides real-time tracking and notifications to parents
- Operates as a **legal mediation platform** (contract intermediary, not a transport operator)

## 3. Goals

| ID | Goal |
|----|------|
| G1 | Build a cloud-edge hybrid architecture for real-time safety monitoring |
| G2 | Implement facial recognition boarding/alighting verification (>=95% accuracy) |
| G3 | Implement in-vehicle abnormal behavior and remaining occupant detection |
| G4 | Build VRP-TW based multi-stop dispatch optimization engine |
| G5 | Deliver Parent App (React Native) with real-time tracking and notifications |
| G6 | Deliver Driver/Safety Escort App (React Native) with AI navigation and alerts |
| G7 | Deliver Academy Admin Web Dashboard (React.js) with scheduling, billing, and compliance |
| G8 | Implement payment system (subscription + usage-based) |
| G9 | Ensure Korean UI/UX for all end-user interfaces |
| G10 | Meet all legal/regulatory requirements (Passenger Transport Act, Se-rim Act, PIPA) |

## 4. Non-Goals (for initial development scope)

| ID | Non-Goal | Reason |
|----|----------|--------|
| NG1 | Regulatory sandbox filing | Requires dedicated legal team, not software |
| NG2 | Physical edge device procurement/setup | Hardware deployment is out of software scope |
| NG3 | Gig economy safety escort matching (full) | Deferred to Phase 4 per SRS roadmap |
| NG4 | Multi-region expansion | Post-pilot commercial launch scope |
| NG5 | LiDAR/ultrasonic external blind spot detection | Requires hardware integration beyond initial software |

## 5. Stakeholders

| Stakeholder | Role | Primary Concern |
|-------------|------|-----------------|
| Parents | End-user (demand) | Child safety, real-time visibility, schedule flexibility |
| Academies | End-user (supply) | Cost reduction, operational simplification, compliance |
| Drivers / Safety Escorts | End-user (operations) | Clear routing, manageable workload, fair compensation |
| Platform Operator | Business owner | Safety incident prevention, regulatory compliance, unit economics |

## 6. Assumption Register

| ID | Assumption | Risk if Wrong |
|----|-----------|---------------|
| A1 | React Native is acceptable for both mobile apps | Would require separate iOS/Android development |
| A2 | Firebase Realtime DB meets latency requirements for alert dispatch | May need to evaluate alternatives (e.g., Supabase, custom WebSocket) |
| A3 | NVIDIA Jetson Nano edge inference can be simulated/mocked for development | Edge AI features cannot be fully tested without hardware |
| A4 | Korean localization (i18n) is required from day 1 for all user-facing UI | English-first would not meet end-user requirements |
| A5 | The platform operates as a contract intermediary, not a transport provider | Legal structure affects entire data model and business logic |
| A6 | AES-256 encryption is required for all biometric and CCTV data | Non-compliance risks PIPA violations |
| A7 | Kubernetes is the target deployment platform | Affects CI/CD and infrastructure code |

## 7. Open Questions

| ID | Question | Impact | Blocking? |
|----|----------|--------|-----------|
| Q1 | What database(s) should be used? SRS mentions Firebase Realtime DB but not a primary relational DB | Architecture design | Yes |
| Q2 | Should we build a monolith-first or start with microservices? | Development speed vs. scalability | Yes |
| Q3 | What is the authentication strategy? (OAuth, phone OTP, social login?) | User registration flow | Yes |
| Q4 | What payment gateway to use for Korean market? (Toss Payments, NHN KCP, etc.) | Payment integration | No (Phase 2) |
| Q5 | What map/navigation API? (Kakao Maps, Naver Maps, T-map?) | Route optimization UI | Yes |
| Q6 | How should edge AI be simulated during development? | AI feature development workflow | Yes |
| Q7 | What is the MVP subset for a pilot with 1 district? | Scoping Phase 1-2 milestones | Yes |
| Q8 | Is the VRP-TW engine built in-house or integrated from a third-party? | Development effort estimation | Yes |

## 8. Acceptance Criteria (High-Level, Draft)

| ID | Criterion |
|----|-----------|
| AC1 | Parent can register, add children, and view real-time bus location on a map |
| AC2 | Driver receives optimized route and can mark boarding/alighting per stop |
| AC3 | Academy admin can manage student schedules and view billing |
| AC4 | System sends push notifications for boarding/alighting events within 3 seconds |
| AC5 | Abnormal behavior detection triggers alerts to driver and control dashboard |
| AC6 | Facial recognition boarding verification achieves >=95% success rate |
| AC7 | Dispatch optimization engine returns routes within 30 seconds |
| AC8 | System maintains >=99.95% availability during peak hours (1-6 PM) |
| AC9 | All user-facing UI is in Korean |
| AC10 | Biometric data is AES-256 encrypted and not persisted beyond inference |

## 9. Proposed Milestone Structure

Based on the SRS Phase roadmap, adapted for software development:

| Milestone | Focus | Aligns to SRS Phase |
|-----------|-------|---------------------|
| **M0: Foundation** | Project scaffolding, monorepo setup, DB schema, auth, CI/CD | Phase 1 |
| **M1: Core Backend** | API design, data models, basic CRUD for users/academies/vehicles/schedules | Phase 1 |
| **M2: Parent App MVP** | Registration, child management, real-time tracking, notifications | Phase 2 |
| **M3: Driver App MVP** | Route display, boarding management, emergency alerts | Phase 2 |
| **M4: Admin Dashboard MVP** | Student scheduler, basic billing, compliance document management | Phase 2 |
| **M5: Dispatch Engine** | VRP-TW route optimization, dynamic recalculation | Phase 2 |
| **M6: Edge AI Integration** | Abnormal behavior detection, remaining occupant detection, facial recognition | Phase 1-2 |
| **M7: Payment & Billing** | Subscription/usage billing, automated settlement | Phase 2 |
| **M8: Pilot Readiness** | QA, security audit, performance tuning, pilot deployment | Phase 3 |

---

**Next Step:** Resolve Open Questions (especially Q1, Q2, Q3, Q5, Q7) before proceeding to Phase 1 — Independent Review.
