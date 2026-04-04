# PetTracker + CareConnect: Product Manager Analysis

**Date:** 2026-04-02
**Author:** Product Manager Agent
**Status:** Phase 0 — Research Deliverable (No Code)

---

## Table of Contents

1. [Codebase Reusability Assessment](#1-codebase-reusability-assessment)
2. [User Stories — PetTracker](#2-user-stories--pettracker)
3. [User Stories — CareConnect](#3-user-stories--careconnect)
4. [Feature Priority Matrix (ICE Scoring)](#4-feature-priority-matrix-ice-scoring)
5. [Revenue Model Deep Dive](#5-revenue-model-deep-dive)
6. [Competitive Positioning](#6-competitive-positioning)
7. [MVP Definition](#7-mvp-definition)

---

## 1. Codebase Reusability Assessment

### Existing Modules (backend/app/modules/) and Reuse Potential

| Existing Module | PetTracker Reuse | CareConnect Reuse | Notes |
|---|---|---|---|
| **auth** (User, JWT, Kakao OAuth, RBAC) | HIGH — extend UserRole enum with `pet_owner`, `walker`, `sitter` | HIGH — extend with `parent_cc`, `caregiver` | Core auth infra 100% reusable; role enum needs new values |
| **billing** (BillingPlan, Invoice, Payment, Toss Payments) | HIGH — change `price_per_ride` to `commission_per_service` | HIGH — same commission model | Toss Payments provider fully reusable; schema needs service-based billing |
| **vehicle_telemetry** (GPS history, location logs) | MEDIUM — repurpose for walker GPS tracking (no vehicle) | LOW — visit verification uses geofence, not continuous tracking | GpsHistory model works if generalized from `vehicle_id` to `subject_id` |
| **notification** (FCM, SMS, preferences) | HIGH — same push/SMS infra | HIGH — same push/SMS infra | 100% reusable as-is |
| **scheduling** (templates, daily instances, route sessions) | MEDIUM — repurpose for booking slots | MEDIUM — repurpose for visit scheduling | Template/instance pattern works; domain fields differ |
| **escort** (availability, shifts, compensation) | HIGH — walker availability is the same pattern | HIGH — caregiver availability is the same pattern | Almost 1:1 mapping to walker/caregiver shifts |
| **compliance** (consent, documents, retention) | HIGH — pet owner consent for GPS | HIGH — parental consent (14세 미만) critical | GuardianConsent model directly applicable |
| **messaging** (in-app messages) | HIGH — owner-walker chat | HIGH — parent-caregiver chat | Reusable as-is |
| **middleware** (auth, RBAC, consent, logging) | HIGH | HIGH | 100% reusable |

### Existing Mobile Components and Reuse

| Screen/Hook | PetTracker Reuse | CareConnect Reuse |
|---|---|---|
| LoginScreen + useAuth | HIGH | HIGH |
| MapScreen + useGpsTracking | HIGH — walker live tracking | MEDIUM — visit location verification |
| ScheduleScreen (parent) | MEDIUM — booking calendar | HIGH — visit schedule |
| BillingScreen + PaymentModal | HIGH | HIGH |
| ProfileScreen (all roles) | HIGH | HIGH |
| ConsentScreen + ConsentCard | HIGH | HIGH |
| NotificationSettingsScreen | HIGH | HIGH |
| SOSButton | LOW — not critical for pets | HIGH — emergency during childcare |

### Estimated Reuse: ~60-65% of backend, ~50-55% of mobile UI

---

## 2. User Stories — PetTracker (패트래커)

### Pet Owner (반려인) — 12 Stories

| ID | User Story | Priority |
|---|---|---|
| PO-01 | As a pet owner, I want to sign up with Kakao login so that I can start using the app in under 30 seconds | MVP |
| PO-02 | As a pet owner, I want to register my pet's profile (breed, size, weight, temperament, special needs) so that walkers know how to handle my pet | MVP |
| PO-03 | As a pet owner, I want to search for available walkers nearby based on date, time, and service type so that I can find someone quickly | MVP |
| PO-04 | As a pet owner, I want to view walker profiles with reviews, certifications, and ratings so that I can choose someone trustworthy | MVP |
| PO-05 | As a pet owner, I want to book a walk/care session and receive confirmation so that both sides have a clear commitment | MVP |
| PO-06 | As a pet owner, I want to track my walker's real-time GPS location during a walk so that I know my pet is safe | MVP |
| PO-07 | As a pet owner, I want to receive push notifications when my walk starts, when the walker arrives, and when my pet is returned so that I'm always informed | MVP |
| PO-08 | As a pet owner, I want to pay for services through the app (card/transfer via Toss) and see billing history so that payment is hassle-free | MVP |
| PO-09 | As a pet owner, I want to rate and review my walker after each session so that the community can trust quality walkers | MVP |
| PO-10 | As a pet owner, I want to save favorite walkers and re-book them quickly so that I can build a consistent relationship for my pet | V1.1 |
| PO-11 | As a pet owner, I want to set up recurring walks (e.g., every weekday at 2 PM) so that I don't have to book each time | V1.1 |
| PO-12 | As a pet owner, I want to receive a walk report with route map, distance, duration, and photos so that I can see what happened during the walk | V1.1 |

### Walker/Sitter (워커/시터) — 10 Stories

| ID | User Story | Priority |
|---|---|---|
| WK-01 | As a walker, I want to create my profile with certifications (동물보건사, 반려동물관리사), experience, and service area so that owners can find and trust me | MVP |
| WK-02 | As a walker, I want to set my availability schedule so that I only receive booking requests when I'm free | MVP |
| WK-03 | As a walker, I want to receive and accept/decline booking requests with pet details so that I can prepare properly | MVP |
| WK-04 | As a walker, I want to start a walk session that automatically shares my GPS location with the owner so that trust is maintained | MVP |
| WK-05 | As a walker, I want to see the day's booking list with pet details, owner contact, and pickup location so that I can plan my day efficiently | MVP |
| WK-06 | As a walker, I want to receive payments directly to my account after each completed session (minus commission) so that I get paid reliably | MVP |
| WK-07 | As a walker, I want to view my earnings dashboard (daily/weekly/monthly) so that I can track my income | MVP |
| WK-08 | As a walker, I want to send photos and status updates during a walk so that the owner feels connected | V1.1 |
| WK-09 | As a walker, I want to report incidents (pet injury, escape, aggressive behavior) with a structured form so that there's a clear record | V1.1 |
| WK-10 | As a walker, I want to chat with the pet owner in-app so that we can coordinate without sharing personal phone numbers | MVP |

### Admin (관리자) — 6 Stories

| ID | User Story | Priority |
|---|---|---|
| AD-01 | As an admin, I want to review and approve/reject walker registrations with background check verification so that only qualified people join the platform | MVP |
| AD-02 | As an admin, I want to view a real-time dashboard of active walks, incidents, and key metrics so that I can monitor platform health | MVP |
| AD-03 | As an admin, I want to manage commission rates, subscription plans, and promotional pricing so that I can optimize revenue | MVP |
| AD-04 | As an admin, I want to handle dispute resolution between owners and walkers with access to GPS logs, chat history, and session data so that I can make fair decisions | V1.1 |
| AD-05 | As an admin, I want to view financial reports (GMV, commission revenue, payout summary, subscription revenue) so that I can track business performance | MVP |
| AD-06 | As an admin, I want to manage compliance documents (보험증서, 자격증) and send expiry reminders so that the platform stays legally compliant | V1.1 |

---

## 3. User Stories — CareConnect (돌봄커넥트)

### Parent (부모) — 12 Stories

| ID | User Story | Priority |
|---|---|---|
| PA-01 | As a parent, I want to sign up with Kakao login and verify my identity so that I can access the platform securely | MVP |
| PA-02 | As a parent, I want to register my child's profile (age, allergies, special needs, emergency contacts) so that caregivers are well-informed | MVP |
| PA-03 | As a parent, I want to provide legally valid parental consent for my child's data processing (14세 미만 개인정보 동의) so that the platform is compliant | MVP |
| PA-04 | As a parent, I want to search for available caregivers by date, time, location, and qualifications so that I can find the right match | MVP |
| PA-05 | As a parent, I want to view caregiver profiles with background checks, certifications (아이돌봄 서비스 자격), reviews, and ratings so that I can trust who comes to my home | MVP |
| PA-06 | As a parent, I want to book a care session with specific start/end times and receive confirmation so that both sides are committed | MVP |
| PA-07 | As a parent, I want to receive real-time notifications when the caregiver arrives (geofence verification), starts the session, and completes it so that I always know the status | MVP |
| PA-08 | As a parent, I want to pay for sessions through the app and see billing history with itemized receipts so that expenses are transparent | MVP |
| PA-09 | As a parent, I want to rate and review my caregiver after each session so that the community benefits from honest feedback | MVP |
| PA-10 | As a parent, I want to set up recurring care schedules (e.g., every Mon/Wed/Fri 3-7 PM) so that I have consistent childcare | V1.1 |
| PA-11 | As a parent, I want to receive a session report with activities completed, meals given, and any notes so that I know what happened while I was away | V1.1 |
| PA-12 | As a parent, I want to use an SOS button that immediately alerts emergency contacts and platform support if something goes wrong during a session | MVP |

### Caregiver (돌봄사) — 10 Stories

| ID | User Story | Priority |
|---|---|---|
| CG-01 | As a caregiver, I want to create my profile with qualifications (육아 경력, 아이돌봄 자격증, 응급처치 자격), experience, and preferred age groups so that parents can evaluate my fit | MVP |
| CG-02 | As a caregiver, I want to set my availability and preferred working areas so that I only receive relevant booking requests | MVP |
| CG-03 | As a caregiver, I want to receive and accept/decline booking requests with child details and special instructions so that I can prepare | MVP |
| CG-04 | As a caregiver, I want to check in at the visit location (geofence-verified) to confirm my arrival so that the parent has proof I showed up | MVP |
| CG-05 | As a caregiver, I want to see my daily/weekly schedule with child profiles, addresses, and parent contact info so that I can plan efficiently | MVP |
| CG-06 | As a caregiver, I want to receive payments after each completed session (minus commission) to my registered bank account so that income is reliable | MVP |
| CG-07 | As a caregiver, I want to view my earnings dashboard so that I can track my monthly income | MVP |
| CG-08 | As a caregiver, I want to submit a session report (activities, meals, naps, incidents) after each visit so that parents are informed | V1.1 |
| CG-09 | As a caregiver, I want to chat with the parent in-app before and during the session so that coordination is smooth | MVP |
| CG-10 | As a caregiver, I want to report emergencies or safety concerns through a structured incident form so that there's an official record | MVP |

### Admin (관리자) — 6 Stories

| ID | User Story | Priority |
|---|---|---|
| CA-01 | As an admin, I want to review and approve caregiver registrations with background check (범죄경력조회) and certification verification so that only qualified caregivers join | MVP |
| CA-02 | As an admin, I want a real-time operations dashboard showing active sessions, incidents, and key metrics so that I can monitor platform safety | MVP |
| CA-03 | As an admin, I want to manage commission rates, subscription tiers, and promotional campaigns so that revenue is optimized | MVP |
| CA-04 | As an admin, I want to handle disputes with access to geofence logs, chat history, session reports, and payment records so that resolution is fair | V1.1 |
| CA-05 | As an admin, I want financial reports (GMV, net revenue, caregiver payouts, subscription metrics) so that business health is tracked | MVP |
| CA-06 | As an admin, I want to audit parental consent records (14세 미만 동의 현황) and data retention compliance so that we pass regulatory inspections | MVP |

---

## 4. Feature Priority Matrix (ICE Scoring)

### PetTracker Features

| Feature | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Total | Phase |
|---|---|---|---|---|---|
| Kakao Login + Onboarding | 9 | 10 | 9 | 28 | MVP |
| Pet Profile Registration | 8 | 9 | 8 | 25 | MVP |
| Walker Profile + Certification | 9 | 9 | 7 | 25 | MVP |
| Availability & Booking Engine | 10 | 8 | 6 | 24 | MVP |
| Real-time GPS Walk Tracking | 10 | 9 | 5 | 24 | MVP |
| Push Notifications (walk lifecycle) | 9 | 10 | 8 | 27 | MVP |
| In-app Payment (Toss) | 10 | 9 | 7 | 26 | MVP |
| Rating & Review System | 8 | 9 | 7 | 24 | MVP |
| In-app Chat (owner-walker) | 7 | 8 | 6 | 21 | MVP |
| Walker Earnings Dashboard | 7 | 9 | 7 | 23 | MVP |
| Admin Dashboard (ops + finance) | 8 | 9 | 6 | 23 | MVP |
| Walker Background Check Flow | 9 | 7 | 5 | 21 | MVP |
| Walk Report (route, photos, stats) | 7 | 8 | 5 | 20 | V1.1 |
| Favorite Walkers & Quick Re-book | 6 | 9 | 8 | 23 | V1.1 |
| Recurring Walk Scheduling | 7 | 7 | 5 | 19 | V1.1 |
| Photo/Status Updates During Walk | 6 | 8 | 6 | 20 | V1.1 |
| Incident Reporting System | 7 | 7 | 5 | 19 | V1.1 |
| Dispute Resolution Center | 6 | 6 | 4 | 16 | V1.1 |
| Pet Insurance Integration | 8 | 4 | 3 | 15 | V2 |
| AI Walk Route Suggestion | 5 | 5 | 3 | 13 | V2 |
| Multi-pet Group Walk Pricing | 6 | 6 | 4 | 16 | V2 |
| Vet Appointment Booking | 5 | 4 | 3 | 12 | V2 |

### CareConnect Features

| Feature | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Total | Phase |
|---|---|---|---|---|---|
| Kakao Login + Onboarding | 9 | 10 | 9 | 28 | MVP |
| Child Profile + Emergency Info | 9 | 9 | 7 | 25 | MVP |
| Parental Consent (14세 미만) | 10 | 9 | 6 | 25 | MVP |
| Caregiver Profile + Certification | 9 | 9 | 7 | 25 | MVP |
| Availability & Booking Engine | 10 | 8 | 6 | 24 | MVP |
| Geofence Visit Verification | 9 | 8 | 5 | 22 | MVP |
| Push Notifications (session lifecycle) | 9 | 10 | 8 | 27 | MVP |
| In-app Payment (Toss) | 10 | 9 | 7 | 26 | MVP |
| Rating & Review System | 8 | 9 | 7 | 24 | MVP |
| In-app Chat (parent-caregiver) | 8 | 8 | 6 | 22 | MVP |
| Caregiver Earnings Dashboard | 7 | 9 | 7 | 23 | MVP |
| Admin Dashboard (ops + safety) | 8 | 9 | 6 | 23 | MVP |
| Background Check (범죄경력조회) | 10 | 7 | 4 | 21 | MVP |
| SOS Emergency Button | 9 | 9 | 7 | 25 | MVP |
| Consent Audit Trail | 9 | 8 | 6 | 23 | MVP |
| Session Report (activities, meals) | 7 | 8 | 5 | 20 | V1.1 |
| Recurring Schedule | 7 | 7 | 5 | 19 | V1.1 |
| Incident Reporting System | 8 | 7 | 5 | 20 | V1.1 |
| Dispute Resolution Center | 6 | 6 | 4 | 16 | V1.1 |
| Government 아이돌봄 서비스 연동 | 7 | 3 | 2 | 12 | V2 |
| AI Caregiver Matching | 6 | 5 | 3 | 14 | V2 |
| Video Monitoring (opt-in) | 5 | 4 | 2 | 11 | V2 |

---

## 5. Revenue Model Deep Dive

### 5.1 Free vs Premium Feature Split

#### PetTracker

| Feature | Free | Premium (₩4,900/월) |
|---|---|---|
| Walker search & booking | Up to 3/month | Unlimited |
| Real-time GPS tracking | Basic (60s refresh) | Real-time (5s refresh) |
| Walk history | Last 30 days | Unlimited history |
| Ratings & reviews | Read only | Read + write |
| Push notifications | Basic (start/end) | Full lifecycle |
| Walk report (route/photos) | No | Yes |
| Favorite walkers | Up to 3 | Unlimited |
| Recurring booking | No | Yes |
| Priority matching | No | Yes (shown first to walkers) |
| Customer support | Standard (48h) | Priority (4h) |

#### CareConnect

| Feature | Free | Premium (₩9,900/월) |
|---|---|---|
| Caregiver search & booking | Up to 2/month | Unlimited |
| Visit verification | Basic (check-in only) | Full geofence + timeline |
| Session history | Last 30 days | Unlimited |
| Ratings & reviews | Read only | Read + write |
| Push notifications | Basic (start/end) | Full lifecycle |
| Session report | No | Yes |
| Recurring schedule | No | Yes |
| Background check detail view | Summary only | Full detail + certificate |
| Priority matching | No | Yes |
| SOS button | Yes (safety = free) | Yes |
| Customer support | Standard (48h) | Priority (2h) |

### 5.2 Commission Structure

#### PetTracker: 15% Commission

| Scenario | Service Price | Commission (15%) | Walker Receives | Platform Revenue |
|---|---|---|---|---|
| 30min walk (small dog) | ₩15,000 | ₩2,250 | ₩12,750 | ₩2,250 |
| 60min walk (medium dog) | ₩25,000 | ₩3,750 | ₩21,250 | ₩3,750 |
| Day care (8hrs) | ₩50,000 | ₩7,500 | ₩42,500 | ₩7,500 |
| Overnight stay | ₩70,000 | ₩10,500 | ₩59,500 | ₩10,500 |

**Why 15% not higher:** Wag! charged 40% commission and went bankrupt. Rover charges ~20% but is established. For a new Korean entrant, 15% is competitive enough to attract walkers while remaining viable. Can increase to 18-20% after establishing market position.

#### CareConnect: 20% Commission

| Scenario | Service Price | Commission (20%) | Caregiver Receives | Platform Revenue |
|---|---|---|---|---|
| 2hr babysitting | ₩30,000 | ₩6,000 | ₩24,000 | ₩6,000 |
| 4hr after-school care | ₩50,000 | ₩10,000 | ₩40,000 | ₩10,000 |
| Full day care (8hr) | ₩100,000 | ₩20,000 | ₩80,000 | ₩20,000 |
| Overnight care | ₩150,000 | ₩30,000 | ₩120,000 | ₩30,000 |

**Why 20%:** Higher value service (children > pets in willingness-to-pay), parents prioritize trust over price. Government 아이돌봄 서비스 has long waitlists, so parents will pay premium for immediate availability. 20% is justified by background check costs, insurance overhead, and higher trust/safety bar.

### 5.3 Projected Unit Economics

#### PetTracker

| Metric | Value | Assumption |
|---|---|---|
| **CAC (Customer Acquisition Cost)** | ₩15,000 | Instagram/Naver ads for pet owners; pet community partnerships |
| **Average Order Value (AOV)** | ₩25,000 | 60-min walk is most popular |
| **Commission per Order** | ₩3,750 | 15% of ₩25,000 |
| **Orders per User per Month** | 6 | ~1.5x/week for active users |
| **Monthly Commission Revenue per User** | ₩22,500 | 6 x ₩3,750 |
| **Premium Subscription Rate** | 15% | After 3 months |
| **Blended Monthly Revenue per User** | ₩23,235 | ₩22,500 + (0.15 x ₩4,900) |
| **Average User Lifetime** | 14 months | Pet services have strong retention |
| **LTV (Lifetime Value)** | ₩325,290 | 14 x ₩23,235 |
| **LTV:CAC Ratio** | 21.7x | Healthy (>3x is good) |
| **Payback Period** | < 1 month | ₩23,235 > ₩15,000 CAC |

#### CareConnect

| Metric | Value | Assumption |
|---|---|---|
| **CAC** | ₩25,000 | Higher trust barrier; requires content marketing + referral |
| **AOV** | ₩50,000 | 4hr after-school care most common |
| **Commission per Order** | ₩10,000 | 20% of ₩50,000 |
| **Orders per User per Month** | 4 | ~1x/week for active users |
| **Monthly Commission Revenue per User** | ₩40,000 | 4 x ₩10,000 |
| **Premium Subscription Rate** | 20% | Parents value safety features more |
| **Blended Monthly Revenue per User** | ₩41,980 | ₩40,000 + (0.20 x ₩9,900) |
| **Average User Lifetime** | 18 months | Children's care needs are long-term |
| **LTV** | ₩755,640 | 18 x ₩41,980 |
| **LTV:CAC Ratio** | 30.2x | Very healthy |
| **Payback Period** | < 1 month | ₩41,980 > ₩25,000 CAC |

### 5.4 Break-Even Analysis

#### PetTracker

| Cost Category | Monthly | Notes |
|---|---|---|
| Server infra (AWS/GCP) | ₩500,000 | Shared core with CareConnect |
| Marketing | ₩3,000,000 | Instagram, Naver, pet community |
| Customer support (2 people) | ₩6,000,000 | Part-time initially |
| Insurance/compliance | ₩1,000,000 | Pet liability insurance |
| **Total Monthly Fixed** | **₩10,500,000** | |
| Revenue per active user/month | ₩23,235 | |
| **Break-even users** | **~452 active users** | |
| At 200 bookings/day target | ~3,000 active users | ₩69.7M revenue/month |

#### CareConnect

| Cost Category | Monthly | Notes |
|---|---|---|
| Server infra | ₩500,000 | Shared core |
| Marketing | ₩4,000,000 | Content + referral heavy |
| Customer support (3 people) | ₩9,000,000 | Child safety needs more support |
| Insurance/compliance | ₩2,000,000 | Higher liability for childcare |
| Background check costs | ₩1,500,000 | ₩5,000/check, ~300 caregivers |
| **Total Monthly Fixed** | **₩17,000,000** | |
| Revenue per active user/month | ₩41,980 | |
| **Break-even users** | **~405 active users** | |

### 5.5 Lessons from Wag! and Rover

#### Wag! Failure Analysis (IPO failed, sold for fraction of value)

| What Went Wrong | Our Mitigation |
|---|---|
| **40% commission** — walkers couldn't make a living, churn was massive | 15% commission; walkers keep ₩21,250 on a ₩25,000 walk |
| **No differentiation** — commoditized service, walkers were replaceable | GPS tracking is core differentiator; walker profiles build relationships |
| **Massive marketing burn** — Super Bowl ads with no retention strategy | Community-first growth; pet cafe/shop partnerships; low CAC channels |
| **Poor walker vetting** — incidents with lost/injured dogs | Certification verification + review system + incident tracking |
| **Tried to do everything** — dog sitting, boarding, training, vet | Focus on walk + care only for MVP; expand after product-market fit |

#### Rover Success Factors ($2.3B acquisition by A Place for Rover)

| What Worked | How We Apply It |
|---|---|
| **Platform trust** — extensive background checks, Rover Guarantee | Background checks + platform insurance + GPS verification |
| **Marketplace network effects** — critical mass of sitters per zip code | Launch hyper-local (Seoul 강남/서초/송파) then expand |
| **Recurring relationships** — same sitter for same pet | Favorite walkers + recurring booking + in-app chat |
| **Fair economics** — ~20% take rate, sitters can make real income | 15% commission, transparent earnings dashboard |
| **Quality content** — reviews, photos, walk reports | Walk reports with GPS route + photos in V1.1 |

---

## 6. Competitive Positioning

### 6.1 PetTracker vs Korean Competitors

| Feature | 패트래커 (Ours) | 도그메이트 | 와요 | 펫피 | Rover (해외) |
|---|---|---|---|---|---|
| **Real-time GPS Walk Tracking** | YES (5s refresh) | NO | NO | Self-tracking only | NO |
| **Walker-Owner Matching** | YES (location + availability) | YES (manual) | YES (limited) | NO (self-service) | YES |
| **In-app Payment** | YES (Toss Payments) | YES | YES | NO | YES (Stripe) |
| **Walker Certification** | YES (verified badges) | Partial | NO | N/A | YES |
| **Walk Report (route/photos)** | YES (V1.1) | NO | NO | YES (self-logged) | YES |
| **In-app Chat** | YES | YES | YES | NO | YES |
| **Recurring Booking** | YES (V1.1) | NO | NO | N/A | YES |
| **Premium Subscription** | ₩4,900/월 | N/A | N/A | ₩3,900/월 | N/A |
| **Commission Rate** | 15% | ~20% | ~20% | 0% (subscription) | ~20% |
| **Background Check** | YES | Partial | NO | N/A | YES |
| **Korean Market Optimized** | YES (Kakao OAuth, Toss) | YES | YES | YES | NO (English-only) |

#### PetTracker Unique Selling Points
1. **"산책이 보인다" (You Can See the Walk)** — Only Korean platform with real-time GPS tracking during walks
2. **15% commission** — Most competitive take rate in market (vs 20% competitors)
3. **Kakao-native UX** — Login, notifications, and share via KakaoTalk
4. **Trust trifecta** — GPS tracking + background check + review system (no competitor has all three)

### 6.2 CareConnect vs Korean Competitors

| Feature | 돌봄커넥트 (Ours) | 아이돌봄 서비스 (정부) | 맘시터 | 째깍악어 | 자란다 |
|---|---|---|---|---|---|
| **Instant Booking** | YES | NO (weeks wait) | YES | YES | YES |
| **Geofence Verification** | YES | NO | NO | NO | NO |
| **Real-time Session Status** | YES | NO | NO | Partial | NO |
| **In-app Payment** | YES (Toss) | Government subsidy | YES | YES | YES |
| **Background Check** | YES (범죄경력 + 자격증) | YES (government) | Partial | YES | YES |
| **14세 미만 Consent** | YES (법적 유효) | N/A | Partial | Partial | Partial |
| **SOS Emergency** | YES | NO | NO | NO | NO |
| **Session Report** | YES (V1.1) | NO | NO | YES | YES |
| **In-app Chat** | YES | NO | YES | YES | YES |
| **Premium Subscription** | ₩9,900/월 | Free (income-based) | N/A | Varies | Varies |
| **Commission Rate** | 20% | N/A | ~25% | ~25-30% | ~25-30% |
| **Kakao-native UX** | YES | NO | Partial | Partial | Partial |

#### CareConnect Unique Selling Points
1. **"방문이 증명된다" (Verified Visits)** — Only platform with geofence-based arrival/departure verification
2. **20% commission** — Most competitive vs 25-30% competitors
3. **SOS Emergency System** — One-tap alert to parent + platform + emergency contacts
4. **Full consent compliance** — Legally valid 14세 미만 동의 with audit trail (regulatory edge)
5. **No waitlist** — Instant availability vs government's multi-week wait

### 6.3 Defensibility / Moat Analysis

| Moat Type | PetTracker | CareConnect |
|---|---|---|
| **Technology** | Real-time GPS infra (Redis + PostgreSQL already built) | Geofence verification engine |
| **Network Effects** | Walker density per neighborhood creates lock-in | Caregiver trust network per area |
| **Data** | Walk pattern data enables route optimization (V2 AI) | Child preference data improves matching |
| **Switching Costs** | Pet profiles, favorite walkers, review history | Child profiles, trusted caregiver relationships, consent records |
| **Regulatory** | Pet industry has low regulatory barriers | Strong: 개인정보보호법 14세 미만 동의 compliance is hard to replicate well |
| **Brand Trust** | GPS tracking = "safest platform" narrative | Visit verification = "most accountable platform" |

---

## 7. MVP Definition

### 7.1 PetTracker MVP — Target: 4 weeks

#### Screens (12 screens)

**Pet Owner (6 screens):**
1. Login (Kakao OAuth) — reuse existing LoginScreen
2. Pet Registration — new
3. Walker Search & Results — new
4. Walker Profile Detail — new
5. Booking Confirmation — new
6. Live Walk Map — adapt existing MapScreen

**Walker (4 screens):**
1. Profile Setup (qualifications) — new
2. Availability Calendar — adapt EscortAvailabilityScreen
3. Today's Bookings — adapt driver HomeScreen
4. Active Walk (GPS broadcasting) — adapt driver MapScreen

**Admin (2 screens):**
1. Operations Dashboard — adapt existing web DashboardPage
2. Walker Approval Queue — new web page

#### Backend Scope (MVP)

| New Module | Reuse From | New Code Estimate |
|---|---|---|
| `pet_profiles` | None (new domain) | ~300 LOC |
| `walker_profiles` | escort models (availability pattern) | ~200 LOC |
| `booking` | scheduling (template/instance pattern) | ~500 LOC |
| `walk_session` (GPS) | vehicle_telemetry (GPS history) | ~300 LOC |
| `review` | None (new) | ~200 LOC |
| Auth role extension | auth (add pet_owner, walker roles) | ~50 LOC |
| Billing adaptation | billing (commission model) | ~200 LOC |
| **Total new backend** | | **~1,750 LOC** |

#### What to EXCLUDE from MVP

- Walk report with route replay and photos (V1.1)
- Recurring booking (V1.1)
- Favorite walkers quick re-book (V1.1)
- Photo/status updates during walk (V1.1)
- Incident reporting structured form (V1.1)
- Dispute resolution center (V1.1)
- Pet insurance integration (V2)
- AI route suggestion (V2)
- Multi-pet group pricing (V2)
- Vet appointment booking (V2)

### 7.2 CareConnect MVP — Target: 5 weeks

#### Screens (14 screens)

**Parent (7 screens):**
1. Login (Kakao OAuth) — reuse existing LoginScreen
2. Child Registration + Consent — adapt ConsentScreen
3. Caregiver Search & Results — new
4. Caregiver Profile Detail — new
5. Booking Confirmation — new
6. Session Status (with geofence) — adapt MapScreen
7. SOS Emergency — adapt SOSButton component

**Caregiver (5 screens):**
1. Profile Setup (qualifications) — new
2. Availability Calendar — adapt EscortAvailabilityScreen
3. Today's Sessions — adapt driver HomeScreen
4. Active Session (check-in/out) — new
5. Earnings Dashboard — new

**Admin (2 screens):**
1. Operations Dashboard — adapt existing web DashboardPage
2. Caregiver Approval + Consent Audit — new web page

#### Backend Scope (MVP)

| New Module | Reuse From | New Code Estimate |
|---|---|---|
| `child_profiles` | student_management | ~250 LOC |
| `caregiver_profiles` | escort models | ~300 LOC |
| `care_booking` | scheduling | ~500 LOC |
| `visit_verification` (geofence) | vehicle_telemetry (GPS) | ~400 LOC |
| `review` | Shared with PetTracker | ~0 LOC (shared) |
| `consent_14` | compliance (GuardianConsent) | ~200 LOC |
| Auth role extension | auth (add parent_cc, caregiver) | ~50 LOC |
| Billing adaptation | billing (commission model) | ~100 LOC (shared) |
| SOS module | None (new) | ~200 LOC |
| **Total new backend** | | **~2,000 LOC** |

#### What to EXCLUDE from MVP

- Session report (activities, meals) (V1.1)
- Recurring schedule (V1.1)
- Incident reporting structured form (V1.1)
- Dispute resolution center (V1.1)
- Government 아이돌봄 서비스 연동 (V2)
- AI caregiver matching (V2)
- Video monitoring opt-in (V2)

### 7.3 Combined MVP Timeline (Monorepo, Shared Core)

| Week | PetTracker | CareConnect | Shared |
|---|---|---|---|
| **Week 1** | Pet/Walker profile models + API | Child/Caregiver profile models + API | Auth role extension, shared review module, billing commission model |
| **Week 2** | Booking engine + Walker availability | Care booking + Caregiver availability + Consent 14세 | Shared scheduling engine adaptation |
| **Week 3** | GPS walk tracking + Live map | Geofence verification + Session status | Notification templates for both apps |
| **Week 4** | Owner mobile screens + Walker mobile screens | Parent mobile screens + Caregiver mobile screens | Admin web dashboard (both apps) |
| **Week 5** | Testing + App Store prep | Testing + SOS module + App Store prep | Integration testing, security audit |

### 7.4 Success Metrics for MVP Launch

#### PetTracker — First 30 Days

| Metric | Target | Why |
|---|---|---|
| App downloads | 1,000 | Baseline for seed market |
| Registered pet owners | 500 | 50% conversion from download |
| Registered walkers | 50 | 10:1 owner-to-walker ratio |
| Completed walks | 200 | ~7 walks/day average |
| Average rating | 4.5+ | Trust indicator |
| DAU/MAU ratio | 30%+ | Healthy engagement |

#### CareConnect — First 30 Days

| Metric | Target | Why |
|---|---|---|
| App downloads | 500 | Higher trust barrier = slower start |
| Registered parents | 200 | 40% conversion (need consent flow) |
| Registered caregivers | 30 | 7:1 parent-to-caregiver ratio |
| Completed sessions | 100 | ~3 sessions/day average |
| Average rating | 4.7+ | Higher bar for childcare trust |
| DAU/MAU ratio | 25%+ | Weekly usage pattern |

---

## Appendix: Risk Register

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Walker/caregiver supply shortage at launch | HIGH | MEDIUM | Pre-register through pet cafe/community partnerships; offer ₩0 commission for first month |
| GPS battery drain complaints | MEDIUM | HIGH | Offer 30s/60s polling option; background location optimization |
| Insurance liability if pet injured during walk | HIGH | LOW | Require walkers to have 반려동물보험; platform liability cap in ToS |
| Child safety incident during CareConnect session | CRITICAL | LOW | Background checks mandatory; SOS system; ₩1B liability insurance |
| Commission rate pressure from competitors | MEDIUM | MEDIUM | Lock in walkers with loyalty tiers; increase value through GPS reports |
| 14세 미만 consent legal challenge | HIGH | LOW | Legal review of consent flow; maintain audit trail; follow 개인정보보호법 정확히 |
| Seasonal demand variance (summer/winter) | MEDIUM | HIGH | Subscription smooths revenue; offer seasonal promotions |
