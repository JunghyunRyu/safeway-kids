# Consensus Matrix — Phase 1 Independent Reviews

Date: 2026-04-03
Status: CONSENSUS REACHED
Reviewers: Security Expert, DB Architect, Frontend Developer

---

## 1. Cross-Reviewer Agreement (All 3 Agree)

| # | Topic | Security | DB | Frontend | Consensus |
|---|-------|----------|----|----------|-----------|
| C-01 | app_context in JWT is mandatory | CRITICAL (T-01) | P1 blocker | Needed for role routing | **MUST DO — P0** |
| C-02 | RBAC must validate role + app_context | CRITICAL (T-02) | P1 blocker | Determines tab navigator | **MUST DO — P0** |
| C-03 | Single coordinated Alembic migration | Medium (T-04) | P1 blocker | N/A | **MUST DO — P0** |
| C-04 | Composite unique (phone, app_context) | Implied by T-02 | P1 item | N/A | **MUST DO — P0** |
| C-05 | Shared core extraction before app code | N/A | Schema separation | npm workspaces + turbo | **MUST DO — P0** |

## 2. Critical Findings (Security)

| # | Finding | Severity | Mitigation | Effort |
|---|---------|----------|------------|--------|
| S-01 | No app_context in JWT | Critical | Add to create_access_token() | 1hr |
| S-02 | PARENT role collision | Critical | RBAC checks role + app_context | 2hr |
| S-03 | Child PII not encrypted at rest | Critical | Encrypt columns via pgcrypto or app-layer | 4hr |
| S-04 | File upload no validation | Critical | MIME check, magic bytes, size limit | 2hr |
| S-05 | GPS spoofing (geofence) | High | Speed/acceleration sanity check, periodic re-verify | 3hr |
| S-06 | Toss webhook verification conditional | High | Make mandatory, fail-closed | 1hr |
| S-07 | OTP rate limit too permissive (1000/min) | High | Reduce to 3-5/min per phone | 30min |
| S-08 | Refresh token lacks app_context | High | Add app_context to refresh token | 1hr |
| S-09 | Background check docs contain 주민등록번호 | High | Encrypt at rest, restrict access | 2hr |

## 3. DB Schema Highlights

| # | Decision | Detail |
|---|----------|--------|
| D-01 | app_context as VARCHAR(30) | NOT ENUM — avoids ALTER TYPE issues |
| D-02 | PetTracker: 8 new tables | pets, walker_qualifications, pt_bookings, walk_sessions, walk_gps_history, walker_wallets, walker_reviews, walker_availabilities |
| D-03 | CareConnect: 9 new tables | cc_children, caregiver_qualifications, cc_bookings, care_sessions, care_activity_logs, caregiver_wallets, caregiver_reviews, caregiver_availabilities, child_consents |
| D-04 | Shared: 4 new tables | wallet_transactions, location_consents, subscriptions, commission_records |
| D-05 | walk_gps_history partitioned by month | Range partition on recorded_at for efficient 180-day purge |
| D-06 | Haversine + bounding box for proximity | PostGIS deferred to V1.1 |
| D-07 | No FK path between PT and CC tables | App-level isolation by design |

## 4. Frontend Architecture Highlights

| # | Decision | Detail |
|---|----------|--------|
| F-01 | npm workspaces + Turborepo | Clean starting point, no existing monorepo config |
| F-02 | Core extraction: ~2,200 LOC (19%) | hooks (100%), api/client+auth+billing (45%), 8 components |
| F-03 | createRootNavigator(config) factory | Auth gate → consent gate → role tabs, parameterized |
| F-04 | createTheme(palette) factory | Import-based theming, no Context needed |
| F-05 | useVehicleTracking → useSubjectTracking | 325 LOC, WS+auth+backoff+fallback, high-value shared |
| F-06 | PetTracker: ~4,690 new LOC | 12 new screens + reskins |
| F-07 | CareConnect: ~3,950 new LOC | 14 new screens + reskins |
| F-08 | Metro watchFolders config needed | Monorepo module resolution |

## 5. Disagreements / Tensions

| Topic | Security Says | DB Says | Frontend Says | Resolution |
|-------|---------------|---------|---------------|------------|
| PostgreSQL RLS | P1 — add defense-in-depth | Nice-to-have for MVP | N/A | **Defer to V1.1** — app_context in WHERE clauses + RBAC sufficient for MVP |
| Child PII encryption | Critical — must encrypt | Column-level pgcrypto | N/A | **MVP: app-layer encryption** for child medical_notes, allergies, emergency_contact |
| PostGIS for proximity | N/A | Defer to V1.1 | Agree | **Haversine for MVP**, PostGIS for V1.1 |
| GPS spoofing mitigation | High — needs server checks | N/A | Can check expo-location accuracy field | **MVP: accuracy threshold + speed check**. Full mitigation in V1.1 |

## 6. Implementation Priority Order

Based on all three reviews, the implementation should follow this order:

### P0 — Before any app code (Week 1)
1. Alembic migration: extend UserRole enum + add app_context VARCHAR(30) + composite uniques
2. JWT: add app_context + aud claims to access and refresh tokens
3. RBAC middleware: validate role + app_context
4. Auth service: accept app_context parameter on login/register
5. File upload: MIME validation + size limit
6. OTP rate limit: 3-5/min per phone
7. Toss webhook: make signature verification mandatory
8. Monorepo setup: npm workspaces + turborepo + watchFolders

### P1 — During app development (Week 2-4)
9. Core extraction: hooks, api client, shared components
10. PetTracker domain tables + API
11. CareConnect domain tables + API
12. Child PII app-layer encryption
13. GPS accuracy threshold for geofence
14. Background check document encryption

### P2 — Pre-launch hardening (Week 5)
15. PostgreSQL RLS policies
16. Refresh token rotation
17. Comprehensive audit logging
18. E2E test coverage for cross-app isolation

## 7. Residual Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| GPS spoofing bypasses geofence | Medium | High | Accuracy threshold + periodic re-verify + manual review |
| Cross-app query forgetting WHERE app_context | Low | High | Code review + integration tests + RLS in V1.1 |
| Enum migration ordering in CI | Low | Medium | Single coordinated migration file |
| Walker supply at launch | High | High | Pre-registration campaign, 0% commission first month |
| App Store rejection | Low | Medium | Privacy policy + consent flow ready before submission |
