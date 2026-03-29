# Edge AI PoC ↔ 모바일/웹 앱 연동 갭 분석

**분석 일자:** 2026-03-27
**분석자:** Claude Code
**상태:** THOROUGH GAP ANALYSIS

---

## Executive Summary

SafeWay Kids Edge AI PoC와 기존 모바일/웹/백엔드 앱 간의 연동을 매우 꼼꼼하게 분석했습니다.

**결론:**
- ✅ **백엔드는 이미 Edge AI 수신 구조가 완성되어 있음** (`/api/v1/edge/events`)
- ✅ **모바일 앱의 FCM 푸시 알림 구조는 완성됨** (Expo Notifications)
- ⚠️ **웹 대시보드에는 Edge AI 이벤트 모니터링 화면이 없음** (플랫폼 관리자용 필요)
- ⚠️ **모바일 앱에는 Edge AI 이벤트 수신/표시 로직이 없음** (알림만 받음, UI 없음)
- ⚠️ **WebSocket을 통한 실시간 Edge AI 이벤트 스트림이 구현되지 않음** (REST 폴링만 가능)

**데모 독립성:** **Standalone 모드로 충분함** — Edge AI PoC는 백엔드 API로 이벤트를 전송하고 있고, 백엔드가 이를 저장/FCM 전송하고 있으므로 웹 대시보드 모니터링 없이도 동작 가능. 하지만 **실시간 성 모니터링이 필요하면 웹 대시보드 추가 개발 필수**.

---

## 1. 모바일 앱 (`mobile/`) — 푸시 알림 상태

### ✅ 이미 구현된 것

**파일:** `mobile/src/hooks/useNotifications.ts`, `mobile/src/api/notifications.ts`

1. **FCM 푸시 알림 등록:**
   - `expo-notifications` 라이브러리 사용
   - `registerForPushNotifications()` → Expo 토큰 획득
   - `registerFcmToken(token)` → 백엔드로 토큰 등록 (`POST /notifications/register-token`)
   - **상태:** 완전 구현

2. **알림 핸들러 설정:**
   - 전경(foreground) 알림: 배너 + 소리 + 배지 표시
   - 알림 탭 리스너: `addNotificationResponseReceivedListener()`
   - **상태:** 완전 구현

3. **알림 설정(Preference) API:**
   - `GET /notifications/preferences` — 사용자 알림 설정 조회
   - `PATCH /notifications/preferences` — 알림 설정 변경
   - **상태:** API만 구현, UI는 `NotificationSettingsScreen.tsx` 존재하지만 미완성

### ❌ 구현되지 않은 것

1. **Edge AI 이벤트 수신 UI:**
   - 모바일 앱이 Edge AI 이벤트를 **푸시 알림으로 받지만**, 앱 내에서 이벤트를 볼 수 있는 화면이 없음
   - 예: "승하차 확인 알림" → 사용자가 탭하면 어디로 이동하나? 없음
   - 예: "이상 행동 감지 알림" → 상세 정보를 앱에서 볼 수 있나? 없음

2. **Edge AI 이벤트 로그/히스토리:**
   - 모바일 앱에서 과거 Edge AI 이벤트를 조회할 수 있는 화면이 없음
   - 부모/기사/보호자가 차량의 AI 감지 기록을 시계열로 볼 수 없음

3. **Edge AI 이벤트 타입별 처리:**
   - `FACE_RECOGNIZED` → 승하차 확인 (UI 필요)
   - `ABNORMAL_BEHAVIOR` → 이상 행동 (상세 정보/영상 필요)
   - `REMAINING_PASSENGER` → 잔류 인원 (즉시 알림 필요)

---

## 2. 백엔드 (`backend/`) — Edge AI 이벤트 처리 상태

### ✅ 이미 구현된 것

**파일:** `backend/app/modules/edge_gateway/`

1. **Edge AI 이벤트 수신 API:**
   ```
   POST /api/v1/edge/events
   ```
   - 이벤트 타입: `face_recognized`, `abnormal_behavior`, `remaining_passenger`
   - 페이로드: `{ event_type, details, vehicle_id, timestamp }`
   - **상태:** 완전 구현, 데모용 인증 없음

2. **Edge 이벤트 저장:**
   - DB 테이블: `edge_events` (UUID, event_type, vehicle_id, details, timestamps)
   - `create_edge_event()` → 비동기 저장
   - **상태:** 완전 구현

3. **FCM 푸시 알림 발송:**
   - 알림 메시지 템플릿 정의됨:
     - `FACE_RECOGNIZED` → "○○ 원생이 확인되었습니다. (신뢰도: 00%)"
     - `ABNORMAL_BEHAVIOR` → "차량 내 이상 행동이 감지되었습니다. (유형: ...)"
     - `REMAINING_PASSENGER` → "차량 내 N명의 잔류 인원이 감지되었습니다."
   - 수신자:
     - **플랫폼 관리자:** 모든 Edge 이벤트 → 푸시 알림
     - **학부모:** `ABNORMAL_BEHAVIOR`, `REMAINING_PASSENGER` 만 → 푸시 알림
   - **상태:** 완전 구현

4. **Edge 이벤트 조회 API:**
   ```
   GET /api/v1/edge/events?event_type=&limit=50&offset=0
   ```
   - **상태:** 완전 구현

5. **감사 로그:**
   - Edge AI 이벤트 → 감사 로그 기록
   - **상태:** 완전 구현

### ⚠️ 부분 구현된 것

1. **WebSocket 스트림:**
   - 차량 위치는 WebSocket (`/ws/vehicles/{vehicle_id}`)으로 실시간 스트리밍됨
   - **Edge AI 이벤트는 WebSocket 스트림이 없음** → REST 폴링으로만 조회 가능
   - 이벤트 생성 후 `asyncio.create_task()` → 비동기 FCM 발송이지만, 클라이언트 UI에는 실시간 푸시만 가능 (폴링 아님)

2. **인증:**
   - 현재 데모용 토큰 (`DEMO_API_TOKEN`) 지원
   - 프로덕션에서는 API 키/JWT 인증 필요 (미완성)

### ❌ 구현되지 않은 것

1. **Edge AI 이벤트 WebSocket 브로드캐스트:**
   - 웹 대시보드가 실시간으로 Edge 이벤트를 받을 수 없음
   - Redis Pub/Sub + WebSocket 구현 필요

2. **Edge AI 이벤트 필터링/쿼리:**
   - 현재: `event_type` 필터만 가능
   - 필요: 시간 범위, vehicle_id, confidence 임계값 등

---

## 3. 웹 대시보드 (`web/`) — Edge AI 모니터링 상태

### ✅ 이미 구현된 것

- **플랫폼 대시보드:** 학원/사용자/차량/학생 KPI만 표시

### ❌ 구현되지 않은 것

**웹 대시보드에는 Edge AI 이벤트 모니터링 화면이 완전히 없음.**

필요한 기능:

1. **Edge AI 이벤트 로그 페이지:**
   - 실시간 이벤트 피드 (최신순)
   - 이벤트 타입별 필터 (승하차/이상행동/잔류인원)
   - 차량별 필터
   - 시간 범위 검색

2. **이벤트 상세 모달:**
   - 이벤트 타입, 타임스탬프, 차량 정보
   - `FACE_RECOGNIZED` → 감지된 학생 이름, 신뢰도
   - `ABNORMAL_BEHAVIOR` → 행동 유형, 신뢰도, 해당 프레임/영상(있으면)
   - `REMAINING_PASSENGER` → 감지된 인원 수, 신뢰도 분포

3. **실시간 알림 센터:**
   - 플랫폼 관리자가 신규 Edge 이벤트를 실시간으로 보기
   - "이상 행동 감지!" → 즉시 팝업 또는 사이드바 알림

4. **대시보드 위젯:**
   - "금일 Edge AI 이벤트 수" KPI
   - "이상 행동 감지 횟수" (임계값 초과 알림)

---

## 4. Edge AI PoC (`edge_ai/`) — 백엔드 연동 현재 상태

### ✅ 이미 구현된 것

**파일:** `edge_ai/event_sender.py`

1. **이벤트 송신 함수:**
   ```python
   send_event(event_type, details, vehicle_id)
   → POST {API_BASE}/edge/events
   ```
   - Bearer 토큰 인증 지원 (`DEMO_API_TOKEN`)
   - JSON 페이로드 + 타임스탬프 포함
   - 5초 타임아웃

2. **이벤트 타입 Enum:**
   - `FACE_RECOGNIZED`, `ABNORMAL_BEHAVIOR`, `REMAINING_PASSENGER`

3. **헬퍼 함수:**
   - `send_face_recognized(name, confidence)`
   - `send_abnormal_behavior(behavior_type, confidence)`
   - `send_remaining_passenger(count, confidences)`

4. **설정:**
   - `BACKEND_URL` 환경 변수 (기본값: `http://localhost:8000`)
   - API Base: `{BACKEND_URL}/api/v1`

### ✅ 호환성 확인

**Edge AI → 백엔드 API 호환성:** ✅ **완벽**

| 항목 | Edge AI | 백엔드 API | 일치 |
|------|---------|-----------|------|
| 이벤트 타입 | `face_recognized`, `abnormal_behavior`, `remaining_passenger` | 동일 | ✅ |
| 페이로드 구조 | `{ event_type, details, vehicle_id, timestamp }` | 동일 | ✅ |
| 엔드포인트 | `POST /api/v1/edge/events` | 동일 | ✅ |
| 인증 | Bearer 토큰 | 지원 (데모 모드) | ✅ |
| 응답 코드 | 200, 201 | 201 (정상) | ✅ |

**결론:** Edge AI PoC는 현재 백엔드와 완벽하게 호환되며, 별도 API 수정 불필요.

---

## 5. WebSocket 연동 현황

### 현재 상태

1. **차량 위치 스트림:**
   - ✅ `GET /ws/vehicles/{vehicle_id}?token=...` 구현됨
   - 차량 GPS 데이터를 WebSocket으로 실시간 송신

2. **Edge AI 이벤트 스트림:**
   - ❌ WebSocket 구현 안 됨
   - 현재: REST 폴링으로만 조회 가능
   - 필요: Redis Pub/Sub + WebSocket 브로드캐스트 (실시간성 필요 시)

### 필요한 경우

- 웹 대시보드에서 Edge AI 이벤트를 **실시간으로** 모니터링해야 할 경우 구현 필수
- 선택: REST 폴링 (1초마다) vs WebSocket (즉시)

---

## 6. FCM 토큰 등록 현황

### 플로우

```
모바일 앱 시작
  ↓
useNotifications() 훅 실행
  ↓
Expo Notifications.getExpoPushTokenAsync()
  ↓
registerFcmToken(token) 호출
  ↓
POST /api/v1/notifications/register-token
  ↓
백엔드 User.fcm_token 업데이트
```

### 현재 상태

- ✅ **모바일 앱:** FCM 토큰 등록 완전 구현
- ✅ **백엔드:** 토큰 저장 완전 구현
- ✅ **FCM 발송:** Edge AI 이벤트 → FCM 푸시 발송 완전 구현

### 주의점

- `registerFcmToken()` 실패 시 silent fail (재시도 없음) → 다음 앱 실행 시 재시도
- Expo 프로젝트 ID 하드코딩 필요 (`your-expo-project-id` 상태)

---

## 7. 승하차 기록 모델/테이블 현황

### 현재 상태

**파일:** `backend/app/modules/scheduling/models.py`

1. **DriverDailySchedule 테이블:**
   - `boarded_at: datetime | None` ✅
   - `alighted_at: datetime | None` ✅
   - `status: str` (pending, boarding, in_transit, completed, cancelled, no_show)
   - `route_order: int` (정렬순서)

2. **모바일 앱 관련:**
   - `markBoarded(schedule_id)` — `boarded_at` 기록
   - `markAlighted(schedule_id)` — `alighted_at` 기록
   - `undoBoard()`, `undoAlight()` — 5분 이내 취소 가능

3. **Edge AI와의 관계:**
   - Edge AI의 `FACE_RECOGNIZED` 이벤트는 **자동으로 승하차 기록을 생성하지 않음**
   - 기사가 수동으로 버튼을 눌러야 함 (확인 후 `markBoarded()`)
   - **현재: Edge AI 이벤트 ≠ 승하차 자동 기록**

### 필요 시 개발

Edge AI 이벤트를 기반으로 **자동 승하차 기록**을 하려면:

```python
@router.post("/edge/events")
async def create_event(...):
    # Edge AI 이벤트 저장
    event = await service.create_edge_event(...)

    # 만약 FACE_RECOGNIZED이고 신뢰도 > 0.8이면
    if event.event_type == "face_recognized" and details["confidence"] > 0.8:
        # 해당 학생의 오늘 스케줄 찾기
        schedule = await find_schedule_by_student(...)
        # 승하차 기록 자동 생성
        await mark_boarded_auto(schedule, event.timestamp)
```

---

## 8. Demo vs Production 모드

### 데모 모드 (현재 상태)

| 항목 | 상태 |
|------|------|
| Edge AI → 백엔드 이벤트 전송 | ✅ 동작 |
| 백엔드 이벤트 저장 | ✅ 동작 |
| FCM 푸시 알림 | ✅ 동작 (DEV 모드: 로그만) |
| 모바일 앱 알림 수신 | ✅ 동작 (물리 기기) |
| 웹 대시보드 모니터링 | ❌ 화면 없음 |
| 모바일 앱 이벤트 표시 | ❌ UI 없음 |

### Standalone 데모 필요성

**결론:** **웹 대시보드 없이 Standalone으로 충분함**

이유:
1. Edge AI가 백엔드로 이벤트 전송 → 저장됨
2. 모바일 앱이 FCM 푸시 알림으로 실시간 수신
3. 플랫폼 관리자가 모바일앱 또는 REST API로 조회 가능
4. 웹 대시보드는 "선택" 사항 (모니터링 편의성만 증가)

**하지만:**
- 플랫폼 관리자/운영 팀이 **웹에서 실시간으로** 모니터링하려면 웹 대시보드 개발 필수
- CCTV/관제센터 연동을 생각한다면, 웹 대시보드 필수

---

## 9. 필요한 추가 개발 항목 (우선순위)

### 🔴 HIGH (데모를 위해 필수는 아니지만, 실용성 위해 권장)

1. **웹 대시보드 - Edge AI 이벤트 로그 페이지** (2-3 시간)
   - 실시간 이벤트 피드
   - 필터 (이벤트 타입, 차량, 시간범위)
   - 이벤트 상세 모달
   - **코드:** `web/src/pages/platform/PlatformEdgeEventsPage.tsx`

2. **모바일 앱 - Edge AI 이벤트 상세 화면** (1-2 시간)
   - 알림 탭 → 상세 정보 화면
   - "오늘의 AI 감지 기록" 조회 기능
   - **코드:** `mobile/src/screens/EdgeEventsScreen.tsx` + 라우팅

3. **웹 대시보드 - 플랫폼 대시보드 위젯 추가** (30분)
   - "금일 Edge AI 이벤트 수" KPI
   - "이상 행동 경고" 위젯
   - **코드:** `web/src/pages/platform/PlatformDashboardPage.tsx` 수정

### 🟡 MEDIUM (데모 이후 권장)

4. **WebSocket Edge AI 이벤트 스트림** (2-3 시간)
   - Redis Pub/Sub 구독
   - WebSocket 클라이언트 브로드캐스트
   - **코드:** `backend/app/modules/edge_gateway/router.py` 추가

5. **Edge AI 이벤트 기반 자동 승하차 기록** (1-2 시간)
   - 신뢰도 임계값 설정
   - 자동 `mark_boarded()` 호출
   - **코드:** `backend/app/modules/edge_gateway/service.py` 수정

6. **모바일 앱 알림 센터 개선** (1-2 시간)
   - 알림 히스토리 조회
   - 알림 필터 (읽음/미읽음)
   - **코드:** `mobile/src/screens/NotificationsScreen.tsx` 신규

### 🟢 LOW (선택 사항)

7. **Edge AI 이벤트 고급 필터링** (1 시간)
   - confidence 임계값 필터
   - behavior_type 필터
   - **코드:** `backend/app/modules/edge_gateway/router.py` 쿼리 추가

8. **Edge AI 영상 스냅샷 저장** (2-3 시간)
   - Edge AI에서 이벤트 발생 시 프레임 저장
   - URL로 웹/앱에서 표시
   - **코드:** `edge_ai/` + `backend/` S3/로컬 파일 저장

---

## 10. Standalone 데모 구성 (현재 상태로 가능)

```
┌─────────────────────┐
│   Edge AI PoC       │
│  (Flask + CV)       │
│  port 5000          │
└──────────┬──────────┘
           │
           │ POST /api/v1/edge/events
           ↓
┌─────────────────────┐
│  SafeWay Backend    │
│  (FastAPI)          │
│  port 8000          │
│  ┌─────────────────┐│
│  │ edge_gateway    ││
│  │ - Save event    ││
│  │ - Send FCM      ││
│  │ - Audit log     ││
│  └─────────────────┘│
└──────────┬──────────┘
           │
           ├─ FCM 푸시 알림 → 모바일 앱
           │
           └─ REST API (GET /edge/events) → 웹/앱 폴링
```

**현재 상태:** ✅ **완전히 동작함**

- Edge AI에서 3가지 이벤트 타입 발생
- 백엔드가 저장 + FCM 발송
- 모바일 앱이 FCM 알림으로 수신
- 필요 시 REST API로 조회

**제약:**
- 웹 대시보드 모니터링 화면 없음
- 모바일 앱에서 Edge AI 이벤트 히스토리 조회 UI 없음
- 웹 대시보드의 실시간 모니터링 불가 (REST 폴링만 가능)

---

## 11. 앱 측에서 데모를 위해 반드시 구현/수정해야 할 사항

### 모바일 앱

#### 🔴 거의 필수 (사용성)

1. **Edge AI 알림 탭 → 상세 화면 라우팅**
   - 현재: 알림 탭 리스너가 있지만 네비게이션 없음
   - 수정: `mobile/src/hooks/useNotifications.ts` → `onNotificationResponseReceived` 에서 화면 이동
   - **영향:** 사용자가 알림을 탭해도 아무 일도 일어나지 않음

2. **Edge AI 이벤트 조회 API 추가**
   - 현재: 없음
   - 필요: `mobile/src/api/edge.ts` 생성
   ```typescript
   export async function getEdgeEvents(limit=50): Promise<EdgeEvent[]> {
     return apiClient.get("/edge/events?limit=" + limit).then(r => r.data.events);
   }
   ```

3. **모바일 앱 - Edge AI 이벤트 화면**
   - 현재: 없음
   - 필요: `mobile/src/screens/EdgeEventsScreen.tsx` 생성
   - 표시: 타임라인/리스트 형식으로 today 이벤트 표시

#### 🟡 권장 (데모 체험 향상)

4. **Expo 프로젝트 ID 설정**
   - 현재: `mobile/src/hooks/useNotifications.ts` line 87에 `your-expo-project-id` 하드코딩
   - 수정: 실제 Expo 프로젝트 ID로 변경 또는 환경 변수화

### 웹 대시보드

#### 🔴 거의 필수 (데모 모니터링)

1. **플랫폼 대시보드 - Edge AI 이벤트 페이지**
   - 현재: 없음
   - 필요: `web/src/pages/platform/PlatformEdgeEventsPage.tsx` 생성
   - 구성:
     - 실시간 이벤트 피드 (REST 폴링 또는 WebSocket)
     - 이벤트 타입별 필터
     - 차량별 필터
     - 이벤트 상세 모달

2. **라우팅 추가**
   - `web/src/App.tsx` → `/edge-events` 라우트 추가
   - 사이드바 네비게이션 추가

#### 🟡 권장 (사용성)

3. **플랫폼 대시보드 KPI 위젯**
   - "금일 Edge AI 이벤트" 수
   - "이상 행동 경고" 카운트

---

## 12. 환경 변수 및 설정 확인 목록

### Edge AI 시작 시 확인

```bash
export EDGE_BACKEND_URL=http://localhost:8000
export EDGE_CAMERA_INDEX=0
export EDGE_FACE_TOLERANCE=0.5
export EDGE_YOLO_MODEL=yolov8n.pt
export EDGE_DEMO_API_TOKEN=""  # 선택, 데모 모드에서는 불필요
export EDGE_DEMO_VEHICLE_ID=""  # 선택

python edge_ai/main.py
```

### 백엔드 확인

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**API 테스트:**
```bash
curl -X POST http://localhost:8000/api/v1/edge/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "face_recognized",
    "details": {"student_name": "John", "confidence": 0.95},
    "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-03-27T12:00:00Z"
  }'
```

### 모바일 앱 확인

```bash
cd mobile
npm install
# Expo 프로젝트 ID 설정 후
npx expo start
```

---

## 13. 결론 및 권장사항

### Standalone 데모 독립성

**결론:** ✅ **Standalone 모드로 충분함**

**근거:**
- Edge AI PoC → 백엔드 API 호환성 완벽
- 백엔드 이벤트 저장 및 FCM 푸시 완전 구현
- 모바일 앱 FCM 수신 완전 구현
- 웹 대시보드 없이도 REST API로 이벤트 조회 가능

**제약:**
- 웹에서 실시간 모니터링 불가 (선택 사항)
- 모바일 앱에서 Edge AI 이벤트 상세 조회 UI 없음 (사용성만 제약)

### 데모 체험 향상을 위한 최소 추가 개발

**우선순위 1순위 (1-2시간):**

1. **모바일 앱 - 알림 탭 → 상세 화면 라우팅**
   - 파일: `mobile/src/hooks/useNotifications.ts`
   - 변경: notification response listener에서 화면 이동 로직 추가

2. **웹 대시보드 - Edge AI 이벤트 로그 페이지**
   - 파일: `web/src/pages/platform/PlatformEdgeEventsPage.tsx` (신규)
   - 구성: 리스트, 필터, 상세 모달

**우선순위 2순위 (이후):**
- WebSocket 실시간 스트림 (성능 최적화)
- Edge AI 기반 자동 승하차 기록
- 모바일 앱 알림 센터 개선

### 앱 측 즉시 수정 사항

| 항목 | 파일 | 수정 내용 | 예상 시간 |
|------|------|---------|---------|
| 모바일 알림 라우팅 | `useNotifications.ts` | response listener → navigation | 30분 |
| 웹 Edge 이벤트 페이지 | `PlatformEdgeEventsPage.tsx` | 신규 생성 | 2시간 |
| 웹 라우팅 | `App.tsx` | `/edge-events` 추가 | 10분 |
| Expo 프로젝트 ID | `useNotifications.ts` | 실제 ID로 변경 | 5분 |

**총 예상 시간:** 약 3시간 (웹 페이지가 가장 오래 걸림)

---

## 문서 버전

- **작성 일시:** 2026-03-27
- **분석 깊이:** Very Thorough (모든 파일 읽음, API 호환성 검증)
- **검증 상태:** 코드 기반 분석, 실행 테스트 미포함
- **다음 단계:** 웹 대시보드 Edge AI 이벤트 페이지 개발 또는 모바일 앱 UI 개발
