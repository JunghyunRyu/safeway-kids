# Architecture Decisions — PetTracker + CareConnect

Date: 2026-04-03
Status: APPROVED by user

---

## AD-01: Database & Role Isolation Strategy
**Decision**: Option A — Shared DB + `app_context` column on `users` table
- Single PostgreSQL database for all apps
- `app_context` column: `"safeway_kids"` | `"pettracker"` | `"careconnect"`
- New roles added to UserRole enum: `PET_OWNER`, `WALKER`, `CAREGIVER`
- JWT claims include `app_context` — RBAC validates role + app_context together
- One user (same phone) can exist in multiple app contexts

## AD-02: PetTracker MVP Service Type
**Decision**: Walk only
- MVP supports only walk service (30min / 60min)
- Drop-in visit, boarding, day care → deferred to V1.1
- Simplifies booking state machine to: pending → confirmed → in_progress → completed / cancelled

## AD-03: CareConnect MVP Care Type
**Decision**: Visit care (방문돌봄) only
- MVP supports only in-home visit care
- School pickup/dropoff (등하원), overnight care → deferred to V1.1
- Session flow: check-in → activity logs → check-out

## AD-04: CareConnect GPS Check-in
**Decision**: Mandatory
- Caregiver must check in within 200m geofence of registered care address
- Check-in fails if outside geofence — caregiver must physically be present
- GPS coordinate recorded with timestamp for audit trail

## AD-05: Background Check Process
**Decision**: Manual for MVP
- Walker/Caregiver uploads background check document
- Platform Admin manually reviews and approves/rejects
- Automated API integration (경찰청 조회) → deferred to V1.1

## AD-06: Settlement Schedule
**Decision**: Weekly auto + instant withdrawal
- Default: Weekly automatic payout (every Monday for previous week's earnings)
- Optional: Instant withdrawal (D+1) available on demand
- Toss Payments transfer API for bank payouts
