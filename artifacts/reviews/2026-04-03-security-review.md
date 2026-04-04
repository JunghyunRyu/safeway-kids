# Security Review: PetTracker + CareConnect Architecture

Date: 2026-04-03
Reviewer: Security Expert Agent
Status: COMPLETE
Scope: AD-01 through AD-06, PetTracker requirement brief, CareConnect requirement brief, current auth/RBAC codebase

---

## Executive Summary

The proposed multi-app expansion introduces **4 Critical**, **5 High**, **3 Medium**, and **2 Low** severity findings. The most urgent risks center on (1) the absence of `app_context` isolation in the current JWT and RBAC system, (2) child data protection gaps for CareConnect, and (3) file upload security for background check documents. The existing safeway_kids codebase has solid foundations (OTP lockout, webhook HMAC verification, GPS purge compliance), but the shared-user architecture creates cross-app attack surfaces that must be addressed before any multi-app deployment.

---

## 1. Threat Assessment per Architecture Decision

### AD-01: Shared DB + `app_context` Column — CRITICAL

**Attack Surface**: Cross-app privilege escalation, token replay, data leakage

| Threat | Severity | Description |
|--------|----------|-------------|
| T-01: Cross-app token replay | **Critical** | Current JWT contains only `sub` (user_id) and `role`. No `app_context` claim exists. A safeway_kids PARENT JWT can be replayed against CareConnect PARENT endpoints. The RBAC middleware (`rbac.py:10-22`) checks `current_user.role not in roles` with no app_context validation. |
| T-02: Role collision — PARENT | **Critical** | `UserRole.PARENT` already exists for safeway_kids guardians. CareConnect also needs PARENT. Without `app_context` in the JWT and RBAC check, a safeway_kids parent who registers with the same phone automatically gains CareConnect parent access and vice versa. |
| T-03: Shared DB row-level leakage | **High** | A single `users` table with `app_context` column but no row-level security (RLS) means any SQL query that forgets the `WHERE app_context = ...` filter leaks cross-app data. Every repository query must be audited. |
| T-04: Enum migration collision | **Medium** | PostgreSQL `ALTER TYPE ADD VALUE` is non-transactional. If PetTracker and CareConnect migrations run in arbitrary order, enum extension can fail or create inconsistent state. |

**Recommendations**:
1. **(P0 — Must fix before implementation)** Add `app_context` to JWT access token claims in `create_access_token()` (`auth/service.py:176-186`). The payload must include `"app_context": user.app_context`.
2. **(P0)** Modify `get_current_user()` (`middleware/auth.py:16-39`) to extract and validate `app_context` from the JWT. Store it on the returned User object or a request-scoped context.
3. **(P0)** Modify `require_roles()` (`middleware/rbac.py:10-22`) to check **both** `role` AND `app_context`. A `PARENT` with `app_context="safeway_kids"` must NOT pass a guard requiring `PARENT` with `app_context="careconnect"`.
4. **(P1)** Consider PostgreSQL Row-Level Security (RLS) policies on the `users` table as defense-in-depth. Even if application code filters by `app_context`, RLS prevents accidental cross-app leakage at the database level.
5. **(P1)** Coordinate all new enum values (`PET_OWNER`, `WALKER`, `CAREGIVER`) in a single Alembic migration to avoid `ALTER TYPE` ordering conflicts.

### AD-02: PetTracker Walk Only MVP — LOW

**Assessment**: Limiting to walk-only reduces the booking state machine attack surface. No additional security concerns beyond those in AD-01.

### AD-03: CareConnect Visit Care Only MVP — LOW

**Assessment**: Single care type reduces complexity. The critical security concerns are in the child data handling (see Section 4).

### AD-04: CareConnect GPS Check-in Mandatory — HIGH

| Threat | Severity | Description |
|--------|----------|-------------|
| T-05: GPS coordinate spoofing | **High** | Caregiver submits GPS coordinates from the client app. A modified client or proxy can send fake coordinates to pass the 200m geofence check. There is no server-side verification of GPS authenticity. |
| T-06: Geofence bypass via timing | **Medium** | If the check-in endpoint doesn't enforce a time window, a caregiver could check in at the correct location, leave, and the session would still be "verified." |

**Recommendations**:
1. **(P1)** Implement GPS plausibility checks: reject coordinates that jump more than physically possible (e.g., >100 km/h velocity between consecutive readings). Compare with IP geolocation as a secondary signal.
2. **(P1)** Add device attestation where available (Android SafetyNet/Play Integrity, iOS DeviceCheck) to detect rooted/jailbroken devices running GPS spoofing apps.
3. **(P2)** Implement periodic re-verification during long sessions (e.g., every 30 minutes) rather than a single check-in point.
4. **(P2)** Log device metadata (device model, OS version, GPS accuracy radius) with each check-in for forensic analysis.

### AD-05: Manual Background Check — HIGH

| Threat | Severity | Description |
|--------|----------|-------------|
| T-07: Forged document upload | **High** | Walker/Caregiver self-declares background check and uploads a document. No automated verification against 경찰청 (police) database. Forged PDFs or images can pass manual review. |
| T-08: File upload attacks | **High** | Current `upload_document()` (`compliance/service.py:210-249`) does not validate file content type, file size, or scan for malware. It preserves the original file extension, which could allow executable uploads (`.exe`, `.php`, `.html` with XSS). |

**Recommendations**:
1. **(P0)** Add file validation to `upload_document()`:
   - Whitelist allowed MIME types: `application/pdf`, `image/jpeg`, `image/png` only
   - Validate actual file content (magic bytes), not just extension
   - Enforce maximum file size (e.g., 10 MB)
   - Strip or sanitize filenames; the current code uses `Path(file.filename).suffix` which is user-controlled
2. **(P1)** Store uploaded files outside the web-accessible directory. Current code stores to `UPLOAD_DIR` on local filesystem — ensure this is not served by the static file handler.
3. **(P1)** Add antivirus/malware scanning on upload (ClamAV or cloud-based scanning).
4. **(P2)** For CareConnect, background check documents contain sensitive PII. Encrypt at rest using the configured `aes_encryption_key`. Log all access to these documents in the audit trail.

### AD-06: Weekly Auto + Instant Withdrawal — MEDIUM

| Threat | Severity | Description |
|--------|----------|-------------|
| T-09: Commission manipulation | **Medium** | If commission percentage is stored per-transaction and the admin can adjust it, a compromised admin account could set commission to 0% and drain funds to walker/caregiver wallets. |
| T-10: Double-withdrawal race condition | **Medium** | Instant withdrawal (D+1) without proper locking could allow a concurrent request to withdraw the same balance twice. |

**Recommendations**:
1. **(P1)** Use database-level advisory locks or `SELECT ... FOR UPDATE` on wallet balance for withdrawal operations. Validate `balance >= withdrawal_amount` within the same transaction.
2. **(P1)** Log all commission rate changes in the audit trail with the admin user_id and IP address.
3. **(P2)** Set maximum withdrawal limits per day/week as a fraud control.

---

## 2. JWT Security Deep Dive

### Current State Analysis

**File**: `backend/app/modules/auth/service.py:176-208`

```
Current JWT access token payload:
{
  "sub": user_id,
  "role": role_value,
  "exp": expiry,
  "type": "access"
}
```

| Finding | Severity | Detail |
|---------|----------|--------|
| F-01: No `app_context` in JWT | **Critical** | Token issued for safeway_kids is valid for PetTracker and CareConnect. Cross-app replay is trivial. |
| F-02: HS256 symmetric signing | **Medium** | All services share the same `jwt_secret_key`. If any service is compromised, tokens for ALL apps can be forged. RS256 (asymmetric) would allow verification without exposing the signing key. However, HS256 is acceptable for a monolith. |
| F-03: No `jti` (JWT ID) claim | **Low** | Tokens cannot be individually revoked. If a user's session is compromised, the only mitigation is waiting for expiry or rotating the global secret (which invalidates ALL sessions). |
| F-04: No `aud` (audience) claim | **High** | Without an audience claim, any JWT consumer accepts any token. Adding `aud` per app (`"safeway_kids"`, `"pettracker"`, `"careconnect"`) provides a second layer of app isolation beyond `app_context`. |
| F-05: Refresh token has no role or app_context | **High** | `create_refresh_token()` (`service.py:189-198`) contains only `sub` and `exp`. A refresh token issued for safeway_kids PARENT can be used to obtain a new access token. If the refresh endpoint doesn't re-validate app_context, cross-app escalation persists even after access token rotation. |
| F-06: Default secret key in dev | **Low** | `jwt_secret_key = "change-me-in-production"` — the production validator catches this, but dev environments share a predictable key. Ensure test/staging environments also use unique keys. |

### Required JWT Changes for Multi-App

```python
# Proposed access token payload
{
  "sub": str(user_id),
  "role": role_value,
  "app_context": app_context_value,  # NEW: "safeway_kids" | "pettracker" | "careconnect"
  "aud": app_context_value,           # NEW: audience claim
  "exp": expiry,
  "type": "access",
  "jti": str(uuid4()),               # RECOMMENDED: for token revocation
}
```

---

## 3. RBAC Gap Analysis

### Current State

**File**: `backend/app/middleware/rbac.py`

The RBAC middleware is purely role-based with no app_context dimension:

```python
def require_roles(*roles: UserRole) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(...)
        return current_user
    return role_checker
```

### Required Changes

| Change | Priority | Description |
|--------|----------|-------------|
| Add `app_context` to `require_roles` | **P0** | `require_roles(UserRole.PARENT, app_context="careconnect")` must reject a `PARENT` with `app_context="safeway_kids"`. |
| New pre-built checkers | **P0** | `require_pet_owner`, `require_walker`, `require_caregiver` that include app_context validation. |
| `require_platform_admin` cross-app | **P1** | Decide: can a platform admin operate across all apps? If yes, `PLATFORM_ADMIN` should bypass app_context checks. If no, separate admin roles per app. Recommendation: platform admin is cross-app (single operator), but this must be an explicit design decision. |
| Endpoint-level app_context enforcement | **P0** | Even if middleware checks role+app_context, each router must declare which app_context it serves. A PetTracker booking endpoint must reject CareConnect tokens even if both have valid roles. |

### Cross-App Access Matrix (Proposed)

| Role | safeway_kids | pettracker | careconnect | Notes |
|------|:---:|:---:|:---:|-------|
| PARENT (SK) | Y | N | N | safeway_kids guardian |
| PARENT (CC) | N | N | Y | CareConnect parent |
| DRIVER | Y | N | N | safeway_kids only |
| STUDENT | Y | N | N | safeway_kids only |
| SAFETY_ESCORT | Y | N | N | safeway_kids only |
| ACADEMY_ADMIN | Y | N | N | safeway_kids only |
| PET_OWNER | N | Y | N | PetTracker only |
| WALKER | N | Y | N | PetTracker only |
| CAREGIVER | N | N | Y | CareConnect only |
| PLATFORM_ADMIN | Y | Y | Y | Cross-app superadmin |

---

## 4. Cross-App Data Leakage Analysis

### Scenario: safeway_kids PARENT accesses CareConnect

**Current risk**: Without app_context, a registered safeway_kids parent (role=PARENT) can call any CareConnect endpoint that requires role=PARENT. This includes:
- Viewing/creating child profiles (CareConnect children, not safeway_kids students)
- Booking caregivers
- Accessing caregiver GPS check-in data
- Viewing session activity logs and photos

**Impact**: Privacy violation. A safeway_kids parent could see CareConnect children's data (names, allergies, medical notes, emergency contacts). This is a **Korean Personal Information Protection Act violation** for children under 14.

### Scenario: PetTracker WALKER accesses safeway_kids DRIVER endpoints

**Current risk**: If WALKER and DRIVER share similar endpoint patterns and WALKER is not explicitly excluded from DRIVER role checks, a walker could potentially access vehicle telemetry or student scheduling data.

**Mitigation**: The new roles (PET_OWNER, WALKER, CAREGIVER) are distinct enum values, so they won't pass `require_driver` or `require_parent` checks. However, the PARENT role collision between safeway_kids and CareConnect remains the critical gap.

---

## 5. Child Data Protection (CareConnect-Specific)

### Legal Requirements

| Law | Article | Requirement | Current Status |
|-----|---------|-------------|----------------|
| 개인정보보호법 | 제22조의2 | Children under 14: legal guardian consent required before collecting personal data | GuardianConsent model exists but FK'd to `students` table, not CareConnect `children` table |
| 개인정보보호법 | 제30조 | Privacy policy must be published and accessible | NFR-CC-10 requires acceptance at registration |
| 개인정보보호법 | 제21조 | Personal data must be destroyed when purpose is achieved or retention period expires | DataRetentionPolicy model exists, auto_purge field present |
| 개인정보보호법 | 제29조 | Technical safeguards: encryption, access control, audit logging | Partial — AES key exists but not applied to child PII |

### Security Findings

| Finding | Severity | Detail |
|---------|----------|--------|
| F-07: Child PII not encrypted at rest | **Critical** | Child profiles (name, birth date, allergies, medical notes, emergency contact) are stored in plain text in PostgreSQL. Korean law requires technical safeguards for children's personal data. The `aes_encryption_key` in config exists but is not applied to child data columns. |
| F-08: Child data in API responses | **High** | NFR-CC-11 requires masking in logs, but OQ-CC-10 asks whether masking is needed in API responses. Recommendation: API responses to non-guardian users must mask child name and birth date. Only the linked guardian and the assigned caregiver (with active consent) should see full child data. |
| F-09: Consent withdrawal gap | **High** | FR-CC-17 requires consent records, but the consent withdrawal flow (OQ-CC-07) is unresolved. If a guardian withdraws consent mid-session, the caregiver should lose access to child data immediately, but the session may still be in progress. This needs explicit handling. |
| F-10: Audit log for child data access | **Medium** | FR-CC-20 requires audit logging. The existing `AuditLog` model can support this, but every service method that reads child data must call `log_audit()`. This is error-prone without a middleware or decorator pattern. |

### Recommendations

1. **(P0)** Encrypt child PII columns (name, birth_date, allergies, medical_notes, emergency_contact) using application-level AES-256-GCM encryption with the configured `aes_encryption_key`. Use a column-level encryption approach so that indexed lookups still work on a hash column.
2. **(P0)** Create a `ChildConsent` model (separate from `GuardianConsent`) with FK to CareConnect children table, including: `guardian_id`, `child_id`, `caregiver_id`, `booking_id`, `consent_method`, `granted_at`, `withdrawn_at`, `ip_address`.
3. **(P1)** Implement a `child_data_access` decorator or middleware that automatically logs access and checks consent before returning child data.
4. **(P1)** On consent withdrawal: immediately revoke caregiver's access to child data, flag active bookings for admin review, send FCM notification to both parties.

---

## 6. GPS Data Security

### PetTracker: Continuous Walk Tracking

| Finding | Severity | Detail |
|---------|----------|--------|
| F-11: GPS data is PII under Korean law | **High** | Walker GPS during walks is personal location data. The existing `purge_old_gps_data()` handles 180-day retention, but GPS coordinates must also be encrypted at rest per 위치정보법. |
| F-12: Redis GPS buffer unencrypted | **Medium** | `update_gps()` stores coordinates in Redis in plain JSON (`vehicle_telemetry/service.py:152-183`). Redis data at rest is unencrypted unless Redis itself is configured with TLS and disk encryption. |
| F-13: WebSocket GPS stream authentication | **High** | The GPS WebSocket subscription must validate that the subscriber (pet owner) has an active booking with the walker whose GPS they're viewing. The existing `check_vehicle_access()` pattern is good but must be replicated for walk sessions. |
| F-14: Redis key namespace collision | **Medium** | If apps share a Redis instance, `vehicle:{id}:gps` and `walk_session:{id}:gps` could collide if UUIDs overlap (unlikely but possible in test environments with seeded data). Use app-prefixed keys: `pt:walk_session:{id}:gps`. |

### CareConnect: Point-in-Time Check-in

| Finding | Severity | Detail |
|---------|----------|--------|
| F-15: Single GPS point still requires consent | **High** | Even a single GPS coordinate at check-in is location data under 위치정보법. `CaregiverLocationConsent` model must be created before any GPS data collection. |
| F-16: Care address stored as lat/lon | **Medium** | The registered care address (FR-CC-04) is the child's home. This is sensitive PII — encrypt the lat/lon columns. |

### Recommendations

1. **(P0)** Create `WalkerLocationConsent` and `CaregiverLocationConsent` models, analogous to `DriverLocationConsent` (`compliance/models.py:78-86`).
2. **(P1)** Encrypt GPS coordinates at rest in PostgreSQL (both GpsHistory for PetTracker and check-in records for CareConnect).
3. **(P1)** Use TLS for Redis connections (`rediss://` scheme) and enable Redis AUTH.
4. **(P2)** Implement app-prefixed Redis key namespaces: `sk:`, `pt:`, `cc:`.

---

## 7. Payment Security (Toss Payments)

### Current State

**File**: `backend/app/modules/billing/providers/toss_payments.py`
**File**: `backend/app/modules/billing/router.py:267-303`

| Finding | Severity | Detail |
|---------|----------|--------|
| F-17: Webhook signature verification is conditional | **High** | `router.py:282`: `if webhook_secret:` — if the secret is not configured (empty string in dev), webhook verification is skipped entirely. A malicious actor could send fake webhook events to change payment status. |
| F-18: Dev mode bypasses payment | **Medium** | `toss_payments.py:39-52`: In non-production environments, `confirm_payment()` returns a fake success response. This is expected for dev, but ensure the `environment` flag cannot be set to `"development"` in production via env variable injection. |
| F-19: Commission rate not validated | **Medium** | The requirement specifies 15% for PetTracker and 20% for CareConnect. If the commission rate is configurable per-transaction or per-admin, there must be validation bounds and audit logging for changes. |
| F-20: No idempotency key for Toss confirm | **Low** | `order_id` serves as an idempotency key per the requirements (NFR-PT-05, NFR-CC-05), but the code doesn't check for duplicate confirm attempts at the application level before calling Toss. Toss handles this server-side, but a local check prevents unnecessary API calls and potential race conditions. |

### Recommendations

1. **(P0)** Make webhook signature verification mandatory in production. Change the conditional to:
   ```python
   if settings.environment == "production" and not webhook_secret:
       raise ConfigurationError("toss_payments_webhook_secret is required in production")
   ```
2. **(P1)** Add application-level idempotency: check if `order_id` already has a confirmed payment before calling Toss API.
3. **(P1)** Set hard bounds on commission rates (e.g., 5%-30%) and log all changes.
4. **(P2)** Implement webhook replay protection: store processed webhook event IDs and reject duplicates.

---

## 8. Background Check Document Security

### Threat Model

Walker/Caregiver uploads background check documents (PDF/images) containing:
- Full legal name
- National ID number (주민등록번호)
- Criminal record check results
- Address

This is the most sensitive PII in the system outside of child data.

| Finding | Severity | Detail |
|---------|----------|--------|
| F-21: No file type validation | **Critical** | `compliance/service.py:230-237` reads the file and writes it with the original extension. No MIME type checking, no magic byte validation. An attacker could upload an HTML file with embedded JavaScript (stored XSS) or a polyglot PDF/executable. |
| F-22: No file size limit | **High** | No `max_size` check before `await file.read()`. An attacker could upload a multi-GB file to exhaust server memory (DoS). |
| F-23: Path traversal via filename | **Medium** | Although `uuid4().hex` is used for the stored filename, `file.filename` is stored in the database and could contain path traversal characters (`../../etc/passwd`). If any download endpoint uses the stored `file_name` field, this is exploitable. |
| F-24: Documents not encrypted at rest | **High** | Background check documents contain 주민등록번호 (national ID). Korean Personal Information Protection Act requires encryption of unique identification numbers (고유식별정보). |
| F-25: No access logging for document downloads | **Medium** | Uploads create a DB record, but downloads/views are not logged. For compliance audit, every access to a background check document must be tracked. |

### Recommendations

1. **(P0)** Validate uploaded files:
   - Check magic bytes match declared content type
   - Whitelist: `application/pdf`, `image/jpeg`, `image/png`
   - Maximum file size: 10 MB
   - Reject files with suspicious extensions: `.exe`, `.sh`, `.html`, `.js`, `.php`
2. **(P0)** Encrypt stored files using AES-256-GCM before writing to disk.
3. **(P1)** Sanitize `file.filename` — strip path components, limit to alphanumeric + `.` + `-` + `_`.
4. **(P1)** Serve documents via a signed URL with expiration, not a static file path.
5. **(P1)** Log every document download with user_id, timestamp, IP, and document_id.

---

## 9. Geofence Spoofing Mitigation (AD-04)

### Attack Vectors

1. **Mock location apps**: Android allows developer options to set mock locations. iOS requires jailbreak.
2. **Proxy/MITM**: Intercept the HTTPS request and modify the GPS coordinates in the payload.
3. **Emulator**: Run the app in an emulator with arbitrary GPS coordinates.
4. **Replay attack**: Capture a valid check-in request and replay it from a different location.

### Defense-in-Depth Strategy

| Layer | Control | Priority |
|-------|---------|----------|
| Client | Detect mock location providers (Android `isFromMockProvider()`, iOS jailbreak detection) | P1 |
| Client | Device attestation (Play Integrity API / DeviceCheck) | P1 |
| Transport | Certificate pinning to prevent MITM | P2 |
| Server | GPS plausibility: reject if accuracy radius > 100m | P1 |
| Server | Velocity check: if user was >50km away 5 minutes ago, flag for review | P2 |
| Server | IP geolocation cross-check: if IP geolocates to a different city, flag | P2 |
| Server | Nonce per check-in request to prevent replay | P1 |
| Process | Random re-verification during long sessions | P2 |
| Audit | Log all check-in attempts (pass/fail) with device metadata | P1 |

---

## 10. OWASP Top 10 Checklist

| # | Category | Status | Notes |
|---|----------|--------|-------|
| A01 | Broken Access Control | **FAIL** | No app_context isolation (T-01, T-02). PARENT role collision (F-01, F-04). Cross-app data leakage possible. |
| A02 | Cryptographic Failures | **WARN** | Child PII not encrypted at rest (F-07). GPS coordinates not encrypted (F-11). Background check docs not encrypted (F-24). HS256 acceptable for monolith but note symmetric key risk (F-02). |
| A03 | Injection | **PASS** | SQLAlchemy ORM used throughout. `ilike` queries use parameterized format strings — SQLAlchemy properly escapes these. No raw SQL detected. |
| A04 | Insecure Design | **WARN** | File upload lacks validation (F-21). GPS spoofing has no mitigation (T-05). Consent withdrawal flow unresolved (F-09). |
| A05 | Security Misconfiguration | **WARN** | Dev mode payment bypass (F-18). Webhook verification conditional (F-17). Rate limit set to 1000/min for auth — too permissive for OTP endpoints (should be 5/min). |
| A06 | Vulnerable Components | **PASS** | No known vulnerable dependencies flagged. Recommend periodic `pip audit` and `npm audit`. |
| A07 | Auth Failures | **WARN** | OTP lockout (5 failures, 15-min lock) is good. But no `jti` for token revocation (F-03). Refresh token lacks app_context (F-05). |
| A08 | Data Integrity Failures | **WARN** | Webhook signature verification is conditional (F-17). No replay protection for webhook events. |
| A09 | Logging & Monitoring | **PASS** | Request logging middleware exists. OTP audit logging exists. Location access logging exists. GPS purge is logged. Need to extend to child data access (F-10) and document downloads (F-25). |
| A10 | SSRF | **PASS** | External HTTP calls (Kakao, Toss, NHN) use hardcoded URLs. No user-controlled URL inputs detected. |

---

## 11. Korean Compliance Check

### 위치정보법 (Location Information Act)

| Article | Requirement | Status | Gap |
|---------|-------------|--------|-----|
| 제15조 | Consent before location data collection | **PARTIAL** | `DriverLocationConsent` exists for safeway_kids drivers. No `WalkerLocationConsent` or `CaregiverLocationConsent` models yet. |
| 제16조 | Location data retention max 6 months | **PASS** | `purge_old_gps_data()` deletes records >180 days. Must be replicated for PetTracker walk GPS and CareConnect check-in GPS. |
| 제24조 | Location access audit log retained 6 months | **PASS** | `LocationAccessLog` with `retention_until` and purge function exists. Must be replicated for new GPS data types. |
| 제18조 | Location data must not be provided to third parties without consent | **NEEDS REVIEW** | Ensure PetTracker owner GPS subscription and CareConnect parent check-in notification only transmit data to authorized recipients with verified consent. |

### 개인정보보호법 (Personal Information Protection Act)

| Article | Requirement | Status | Gap |
|---------|-------------|--------|-----|
| 제22조의2 | Legal guardian consent for children under 14 | **PARTIAL** | `GuardianConsent` model exists but FK'd to `students`. New `ChildConsent` needed for CareConnect. |
| 제24조 | Unique identification numbers (주민등록번호) must be encrypted | **FAIL** | Background check documents contain national ID. Not encrypted at rest (F-24). |
| 제29조 | Technical safeguards (encryption, access control, logging) | **PARTIAL** | Access control exists. Logging partial. Encryption for child PII and location data missing. |
| 제30조 | Privacy policy publication | **ADDRESSED** | NFR-CC-10 and NFR-PT-10 require acceptance at registration. Implementation needed. |
| 제21조 | Destroy data when retention period expires | **PASS** | `DataRetentionPolicy` model with `auto_purge` flag. GPS purge cron exists. Must extend to chat messages (30 days), activity photos (30/90 days). |

### 통신비밀보호법 (Telecommunications Privacy Act)

| Requirement | Status | Gap |
|-------------|--------|-----|
| Message retention max 6 months | **NEEDS IMPLEMENTATION** | FR-PT-13 and FR-CC-14 specify 30-day chat archive. A purge cron for `Message` records must be implemented. |
| No marketing messages | **PASS** | Notification types are operational only (booking events, safety alerts). |
| Notice about monitoring | **NEEDS IMPLEMENTATION** | Users must be informed that messages are stored and may be reviewed for safety purposes. Add to terms of service. |

---

## 12. Additional Findings

### Rate Limiting

**File**: `backend/app/config.py:65`

```python
rate_limit_auth: str = "1000/minute"
```

This is **extremely permissive** for authentication endpoints. The role definition specifies 5/min for OTP. Current config allows 1000 OTP requests per minute, making brute-force attacks feasible despite the OTP lockout (which only triggers after 5 failed *verifications*, not 5 failed *sends*).

**Recommendation (P0)**: Set auth rate limits per endpoint:
- OTP send: 3/minute per phone number
- OTP verify: 5/minute per phone number (already enforced by Redis counter, but rate limit adds network-level protection)
- Login: 10/minute per IP
- Token refresh: 30/minute per user

### Kakao OAuth Default Role

**File**: `backend/app/modules/auth/service.py:68-69`

```python
user = User(
    role=UserRole.PARENT,
    phone=f"kakao_{kakao_id}",
```

New Kakao OAuth registrations default to `PARENT` role with no app_context. In a multi-app environment, this is ambiguous — which app's PARENT? The registration flow must accept `app_context` as a parameter.

**Recommendation (P0)**: Add `app_context` parameter to `kakao_login()` and `otp_login_or_register()`.

### `list_users` Search — SQL Injection Risk Assessment

**File**: `backend/app/modules/auth/service.py:225`

```python
base = base.where(User.name.ilike(f"%{search}%"))
```

While SQLAlchemy's `ilike()` properly parameterizes the query (the `%{search}%` is bound as a parameter, not interpolated into SQL), the `%` wildcards in the search string itself are user-controlled. A user could submit `search="%"` to match all records. This is not SQL injection but could be an information disclosure concern if the endpoint returns more data than intended.

**Assessment**: LOW risk. SQLAlchemy parameterizes correctly. No code change needed, but consider input validation on search length.

---

## 13. Consolidated Recommendations by Priority

### P0 — Must Fix Before Implementation

| # | Finding | Action |
|---|---------|--------|
| R-01 | T-01, F-01 | Add `app_context` to JWT access token claims |
| R-02 | T-02, F-04 | Add `aud` (audience) claim to JWT, validate on decode |
| R-03 | F-05 | Add `app_context` to refresh token; validate on refresh |
| R-04 | T-01, T-02 | Modify `require_roles()` to check role + app_context |
| R-05 | F-21, F-22 | Add file type validation, magic byte checking, and size limits to upload |
| R-06 | F-07 | Encrypt child PII columns (CareConnect) at rest |
| R-07 | F-17 | Make Toss webhook signature verification mandatory in production |
| R-08 | Rate limit | Reduce auth rate limits to 3-10/minute per the security role spec |
| R-09 | Kakao OAuth | Add `app_context` parameter to registration flows |

### P1 — Fix Before Launch

| # | Finding | Action |
|---|---------|--------|
| R-10 | T-03 | Implement PostgreSQL RLS as defense-in-depth |
| R-11 | T-05 | GPS plausibility checks and device attestation |
| R-12 | F-11, F-15 | Create WalkerLocationConsent and CaregiverLocationConsent models |
| R-13 | F-24 | Encrypt background check documents at rest |
| R-14 | F-08 | Mask child data in API responses for non-guardian users |
| R-15 | F-09 | Implement consent withdrawal flow with immediate access revocation |
| R-16 | T-09 | Commission rate change audit logging |
| R-17 | T-10 | Database-level locking for wallet withdrawals |
| R-18 | F-23, F-25 | Sanitize filenames; log document downloads |
| R-19 | T-04 | Single coordinated Alembic migration for all new enum values |

### P2 — Hardening (Post-Launch)

| # | Finding | Action |
|---|---------|--------|
| R-20 | F-03 | Add `jti` claim for individual token revocation |
| R-21 | F-12 | Enable Redis TLS and AUTH |
| R-22 | F-14 | App-prefixed Redis key namespaces |
| R-23 | F-18 | Environment flag validation to prevent dev mode in production |
| R-24 | Geofence | Periodic re-verification, IP geolocation cross-check |
| R-25 | F-20 | Application-level idempotency for payment confirmation |

---

## 14. Review Confidence

| Area | Confidence | Notes |
|------|------------|-------|
| JWT / Auth | **High** | Full source review of service.py, auth.py, rbac.py |
| RBAC | **High** | Full source review of rbac.py, consent.py |
| File Upload | **High** | Full source review of compliance/service.py upload function |
| Payment / Webhook | **High** | Full source review of toss_payments.py, billing/router.py |
| GPS / Telemetry | **High** | Full source review of vehicle_telemetry/service.py |
| Child Data Protection | **Medium** | Based on requirement brief analysis; no CareConnect code exists yet |
| Geofence Spoofing | **Medium** | Client-side mitigations not reviewable (no mobile code for PetTracker/CareConnect yet) |
| Korean Compliance | **Medium** | Legal interpretation based on role definition; recommend legal counsel review |

---

## Appendix: Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `backend/app/modules/auth/models.py` | 1-66 | User model, UserRole enum, DriverQualification |
| `backend/app/modules/auth/service.py` | 1-321 | JWT creation, OTP flow, user CRUD |
| `backend/app/middleware/auth.py` | 1-39 | JWT extraction, user lookup |
| `backend/app/middleware/rbac.py` | 1-51 | Role-based access control |
| `backend/app/middleware/consent.py` | 1-31 | Guardian consent verification |
| `backend/app/modules/compliance/models.py` | 1-97 | GuardianConsent, DriverLocationConsent, DataRetentionPolicy |
| `backend/app/modules/compliance/service.py` | 200-280 | Document upload, listing |
| `backend/app/modules/billing/providers/toss_payments.py` | 1-109 | Toss Payments API integration |
| `backend/app/modules/billing/router.py` | 260-303 | Webhook endpoint with HMAC verification |
| `backend/app/modules/vehicle_telemetry/service.py` | 1-378 | GPS update, buffer flush, purge, access check |
| `backend/app/config.py` | 1-119 | Settings, production secret validation |
| `backend/app/middleware/request_logging.py` | 1-34 | HTTP request/response logging |
| `artifacts/specs/2026-04-03-architecture-decisions.md` | Full | AD-01 through AD-06 |
| `artifacts/specs/2026-04-02-pettracker-requirement-brief.md` | Full | PetTracker requirements |
| `artifacts/specs/2026-04-02-careconnect-requirement-brief.md` | Full | CareConnect requirements |
