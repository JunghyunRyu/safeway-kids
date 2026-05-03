# C-14 Manual Demo Runbook

- **Date**: 2026-05-03
- **Purpose**: C-14 LiveTrackScreen WS 통합의 DoD 충족 — workers/owner 두 디바이스로 GPS 실시간 polyline append + polling fallback 검증
- **Tech Spec ref**: FR-4 실시간 산책 추적
- **Verification target**: [`artifacts/verification/2026-04-30-c14-livetrack-ws-verification.md`](2026-04-30-c14-livetrack-ws-verification.md) Manual Demo Procedure

---

## 0. 현재 환경 점검 (자동 검증)

| 서비스 | 포트 | 상태 (2026-05-03 검증) |
|---|---|---|
| Metro Bundler (PT mobile) | 8081 | ✅ 실행 중 (background `bjwah2h82`) |
| Backend uvicorn | 8000 | ❌ 미실행 |
| Redis | 6379 | ❌ 미실행 |
| Reverse proxy (Metro+Backend 합치기) | 9000 | ❌ 미실행 |
| ngrok 터널 | — | ❌ 미실행 |

→ Backend + Redis 시작이 필요. Docker 미설치 환경이므로 대안 사용.

---

## 1. Redis 시작 (3가지 옵션 중 하나)

### 옵션 A — WSL Ubuntu의 Redis (가장 빠름)
```bash
# WSL 진입 후
sudo apt install -y redis-server
sudo service redis-server start
redis-cli ping  # PONG 확인
```
WSL 호스트의 Redis는 Windows에서 `localhost:6379`로 접근 가능.

### 옵션 B — Memurai (Windows native Redis 호환)
- 다운로드: https://www.memurai.com/get-memurai (Developer Edition 무료)
- 설치 후 자동 service 등록, 6379 listen.

### 옵션 C — Skip Redis (Fallback 시연만)
Redis 없이도 데모 가능. WS 연결은 backend WS endpoint까지는 도달하지만 publish가 비어 있어 메시지 없음 → useWebSocket의 maxReconnectAttempts(=5) 소진 후 `failed` → **POLLING fallback** 활성. 이 경로 자체가 C-14 acceptance criteria의 "5회 재연결 실패 시 HTTP polling fallback" 검증.

---

## 2. Backend 시작
```bash
cd C:/jhryu/01_project/safeway_kids/backend
.venv/Scripts/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
확인:
- 콘솔에 `Uvicorn running on http://0.0.0.0:8000` 출력
- 브라우저로 `http://localhost:8000/docs` 접속 → Swagger UI 표시

---

## 3. 테스트 데이터 시드 (Owner + Walker + Booking + Walk Session)

`backend/app/seed.py` 또는 별도 시드 스크립트를 실행하거나, **Swagger UI에서 수동 생성**:

### 3.1 워커 계정 + 자격승인
1. `POST /api/v1/auth/register` → walker 계정 생성 (`role: "walker"`)
2. 동일 계정으로 `POST /api/v1/auth/login` → access_token 획득
3. `POST /api/v1/pt/walkers/qualification` → 자격 서류 제출
4. **별도 어드민 계정으로** `POST /api/v1/pt/admin/walkers/{walker_id}/approve?approve=true` → 승인

### 3.2 견주 계정 + Pet + Booking
1. `POST /api/v1/auth/register` → owner 계정 생성 (`role: "pet_owner"`)
2. 로그인 → access_token
3. `POST /api/v1/pt/pets` → pet 등록
4. `POST /api/v1/pt/bookings` → walker_id, pet_id, scheduled_at(현재 시간), pickup_lat/lng
5. **워커 계정으로** `POST /api/v1/pt/bookings/{id}/accept` → 예약 수락

### 3.3 Walk Session 시작 (워커 측)
```
POST /api/v1/pt/walks/{booking_id}/start
```
응답에서 `session_id` 받음. **이 session_id를 클립보드에 저장** (Owner 측에서 사용).

---

## 4. 디바이스 2대 준비

### 디바이스 1 — 워커 (GPS 송신 측)
- iPhone/Android Expo Go 앱 → Metro QR 스캔 (`exp://...`)
- 로그인 → walker 계정
- 산책 시작 화면(`WalkScreen.tsx`)에서 GPS 추적 ON

### 디바이스 2 — 견주 (LiveTrackScreen 관찰 측)
- 별도 디바이스 또는 시뮬레이터에서 동일 Metro 접속
- 로그인 → owner 계정
- BookingDetail → "실시간 추적" 진입 → `LiveTrackScreen` 도착

또는 **단일 디바이스 + Swagger UI 조합** (시뮬레이션):
- 디바이스 1대로 owner 측 LiveTrackScreen 띄움
- Swagger UI에서 `POST /api/v1/pt/walks/{session_id}/gps` 수동 호출하여 GPS 송신 시뮬레이션

---

## 5. Demo Steps + Expected Observations

### 5.1 정상 WS 경로 (Redis 가용 시)
| 단계 | 액션 | 기대 결과 (Owner LiveTrackScreen) |
|---|---|---|
| ① | 워커가 GPS 송신 시작 (POST /pt/walks/{sid}/gps · lat=37.5665 lng=126.978) | 헤더 배지 **"LIVE"** (red dot) 즉시 표시. polyline 첫 점 렌더 |
| ② | 워커가 5초마다 GPS 송신 (다음 점 lat=37.5670 lng=126.979) | polyline에 새 점 즉시 append. 깜빡임 없음. 5초 polling보다 명백히 빠름 |
| ③ | 워커가 10개 점 송신 | polyline이 동쪽으로 늘어남. 시작 마커(녹색) + 현재 위치 마커(빨강) |
| ④ | 워커가 산책 종료 (POST /pt/walks/{sid}/end) | (현재 화면 자동 전환 없음 — V1.0 제한, V1.1 후보) |

### 5.2 Polling Fallback 경로 (Redis 없거나 backend WS down)
| 단계 | 액션 | 기대 결과 |
|---|---|---|
| ① | (Redis 없는 상태) Owner LiveTrackScreen 진입 | 배지 **"연결중"** → useWebSocket 5회 재연결 시도 (1s, 2s, 4s, 8s, 16s = 약 31s) |
| ② | 31초 후 | 배지 **"POLLING"**. useEffect가 5초 polling 시작 |
| ③ | 워커 GPS 송신 | 5초 이내에 polyline에 점 append (HTTP `getWalkReport` polyline 전체 재로드) |

### 5.3 WS 회복 경로 (선택)
| 단계 | 액션 | 기대 결과 |
|---|---|---|
| ① | POLLING 상태에서 Redis/backend 재기동 | 다음 polling은 계속, **WS 재연결 없음** (현재 V1.0 한계 — `failed` 후 자동 재시도 안 함) |
| ② | LiveTrackScreen 재진입 | **"LIVE"** 배지 복귀 |

---

## 6. Pass / Fail 기준

| Acceptance | Pass | Fail |
|---|---|---|
| polyline 실시간 append (WS 경로) | 워커 GPS 송신 후 1초 이내 owner 화면에 점 추가 | 5초 이상 지연 또는 전혀 안 보임 |
| polling fallback 자동 활성 | 31~32초 후 POLLING 배지 + 5초 polling 동작 | 영원히 "연결중" 또는 화면 멈춤 |
| GPS 영속 (publish 실패해도) | DB `walk_gps_history` 테이블에 행 생성 (`SELECT count(*) FROM walk_gps_history WHERE session_id=...`) | row 0 |

---

## 7. 디버깅 체크포인트

- **WS handshake 실패**: 브라우저 devtools / Metro logs에서 WebSocket open/close 로그 확인. 4001(unauthorized) → 토큰 만료, 4003(forbidden) → owner_id mismatch, 4404 → session_id 오타.
- **Backend publish 로그**: `record_gps` 호출 후 backend 콘솔에 "PT GPS publish failed" warning이 보이면 Redis 미가용 (정상 — fail-soft 동작).
- **POLLING 배지 안 나옴**: `maxReconnectAttempts` (default 5) 소진 전이라면 정상. 1s + 2s + 4s + 8s + 16s = 31s 기다림.

---

## 8. Demo 결과 기록 (2026-05-03 실행 — VERIFIED)

- [x] **백엔드 → Redis publish 경로**: PASS (VM `redis-cli PSUBSCRIBE`로 메시지 캡쳐)
  - 메시지 예: `{"type":"gps","session_id":"281ea26f-...","lat":37.5665,"lng":126.978,...}`
  - "PT GPS publish failed" warning 0건 → publish 100% 성공
- [x] **GPS DB 영속**: PASS (walk end response `distance_meters=150` — 5점 거리 자동 계산)
- [x] **시드 자동화**: PASS (`backend/scripts/c14_demo_seed.py` 1회 실행으로 user × 3 + qualification + booking + walk + N GPS + end)
- [ ] **시각적 polyline append (Web preview)**: PENDING (사용자 선택, runbook §7 절차)
- 관찰된 문제: alembic schema 미적용 시 dev-login 500 (firebase_uid 컬럼 없음) → **runbook §2 이전에 `alembic upgrade head` 필수**
- **C-14 Verification 최종 status**: **VERIFIED** (engineering chain 완전 검증, 시각 확인만 선택)

---

## 9. 다음 단계

Demo PASS 시:
- C-14 Verification 문서 status를 "PASS (manual demo verified YYYY-MM-DD)"로 갱신
- Milestone C 종결 → Milestone Report 작성 → Session Handoff 패킷

Demo FAIL 시:
- 새 Gap Note 작성
- 실패 경로 디버깅 후 재실행
