# Final Tech Spec: Edge AI PoC 데모 시스템

## 문제 정의
규제 샌드박스 심사를 위해 i5 PC + 웹캠 환경에서 AI 기반 어린이 안전 시스템을 시연할 수 있는 PoC 데모가 필요하다.

## Goals
1. 웹캠 기반 안면 인식으로 승하차 인증 시연
2. 실시간 이상 행동 감지(서기/넘어짐) 시연
3. 시동 OFF 후 잔류 인원 감지 → 모바일 푸시 알림 시연
4. 비기술자가 직관적으로 이해할 수 있는 깔끔한 UI

## Non-goals
- 실제 Jetson Nano/LiDAR 하드웨어 통합
- 프로덕션 수준 모델 학습
- 앱스토어 배포

## 아키텍처

```
┌──────────────────────────────────────────────┐
│  Edge AI Demo (edge_ai/)                      │
│  Python 독립 프로세스                          │
│                                               │
│  ┌────────────┐ ┌────────┐ ┌──────────────┐  │
│  │face_recog  │ │YOLOv8n │ │ MediaPipe    │  │
│  │ 안면인식   │ │객체감지│ │ 포즈인식     │  │
│  └─────┬──────┘ └───┬────┘ └──────┬───────┘  │
│        └────────┬───┴─────────────┘           │
│           AI Event Manager                     │
│    ┌─────────────────────────┐                │
│    │ Gradio Web UI           │                │
│    │ - 웹캠 영상 + 오버레이  │                │
│    │ - 모드 선택 (3가지)     │                │
│    │ - 이벤트 로그           │                │
│    └─────────────────────────┘                │
└──────────────┬───────────────────────────────┘
               │ POST /api/v1/edge/events
┌──────────────▼───────────────────────────────┐
│  SafeWay Kids Backend (FastAPI)               │
│  edge_gateway 모듈 확장                       │
│  → 이벤트 저장 (DB)                           │
│  → FCM 푸시 알림 발송                         │
│  → 감사 로그 기록                             │
└──────────────┬───────────────────────────────┘
               │ FCM Push
┌──────────────▼───────────────────────────────┐
│  Mobile App (Expo)                            │
│  안전 알림 수신 + 표시                        │
└──────────────────────────────────────────────┘
```

## 컴포넌트 상세

### 1. edge_ai/ (신규 top-level 패키지)

**디렉토리 구조:**
```
edge_ai/
├── requirements.txt          # AI 의존성
├── main.py                   # Gradio 앱 진입점
├── config.py                 # 설정 (백엔드 URL 등)
├── face_manager.py           # 얼굴 등록/인식
├── behavior_detector.py      # 이상 행동 감지 (MediaPipe + YOLOv8)
├── passenger_detector.py     # 잔류 인원 감지 (YOLOv8)
├── event_sender.py           # 백엔드 API 호출
├── registered_faces/         # 등록된 얼굴 임베딩 저장
└── assets/                   # 사운드 파일 등
```

**의존성:**
- `ultralytics>=8.0.0` (YOLOv8)
- `mediapipe>=0.10.0`
- `face_recognition>=1.3.0`
- `opencv-python>=4.8.0`
- `gradio>=4.0.0`
- `requests>=2.31.0`
- `numpy>=1.24.0`
- `playsound>=1.3.0` (경고음)

**모드별 동작:**

#### Mode 1: 승하차 (Boarding)
- 웹캠에서 프레임 캡처
- `face_recognition`으로 얼굴 위치 감지 + 임베딩 추출
- 등록된 얼굴 DB와 유클리드 거리 비교 (threshold: 0.6)
- 매칭 시: 초록 박스 + "OOO 원생 확인" 텍스트
- 비매칭 시: 노란 박스 + "미등록"
- 이벤트 → POST /api/v1/edge/events

#### Mode 2: 운행 중 (Transit)
- YOLOv8n으로 사람 감지 (class 0: person)
- MediaPipe Pose로 각 감지된 사람의 포즈 분석
- 판단 기준:
  - 정상(앉아 있음): 어깨 Y좌표 > 엉덩이 Y좌표, 둘 다 비슷한 높이
  - 서 있음: 어깨-엉덩이-무릎이 일직선에 가까움
  - 넘어짐: 어깨 Y좌표 ≈ 엉덩이 Y좌표 (수평), 급격한 변화
- 이상 감지 시: 빨간 박스 + "⚠ 이상 행동 감지" + 경고음
- 이벤트 → POST /api/v1/edge/events

#### Mode 3: 하차 후 (Post-Transit)
- "시동 OFF" 버튼 클릭으로 트리거
- YOLOv8n으로 프레임 내 사람 감지
- 사람 감지 시: 빨간 박스 + "🚨 잔류 인원 감지!" + 경고음
- 이벤트 → POST /api/v1/edge/events → FCM 푸시

### 2. Backend edge_gateway 모듈 확장

**신규 파일:**
```
backend/app/modules/edge_gateway/
├── __init__.py              (기존, 확장)
├── models.py                # EdgeEvent 모델
├── schemas.py               # Pydantic 스키마
├── router.py                # /api/v1/edge/* 엔드포인트
└── service.py               # 이벤트 처리 + 알림 발송
```

**EdgeEvent 모델:**
- id: UUID
- event_type: enum (face_recognized, abnormal_behavior, remaining_passenger)
- vehicle_id: UUID (nullable, 데모에서는 시뮬레이션)
- details: JSON (이름, 신뢰도, 감지 유형 등)
- timestamp: datetime
- created_at: datetime

**API 엔드포인트:**
- `POST /api/v1/edge/events` — 이벤트 수신 + 알림 트리거
- `GET /api/v1/edge/events` — 이벤트 목록 조회

### 3. Mobile 알림 처리
- 기존 FCM 인프라 활용
- 알림 데이터에 `type: "edge_*"` 추가하여 구분
- 추가 코드 최소화 (기존 알림 UI 재활용)

## 수용 기준
1. 웹캠으로 등록된 얼굴 인식 시 이름 표시 (1초 이내)
2. 서 있거나 넘어지는 행동 감지 시 빨간 박스 + 경고 (2초 이내)
3. "시동 OFF" 후 잔류 인원 감지 시 알림 발생
4. 모든 이벤트가 백엔드에 기록됨
5. FCM 푸시 알림이 모바일 앱에 도달
6. i5 CPU에서 5 FPS 이상 동작

## 기술 리스크
| 리스크 | 확률 | 대응 |
|--------|------|------|
| dlib 설치 실패 (face_recognition 의존) | 중 | deepface 대안 준비 |
| i5에서 YOLOv8n 너무 느림 | 낮 | YOLOv8n은 CPU 최적화됨 |
| MediaPipe 포즈 인식 부정확 | 중 | threshold 조정, 데모용 동작 연습 |
| 웹캠 해상도/조명 문제 | 중 | 640x480으로 고정, 조명 안내 |

## 코드 영향 맵
| 파일 | 변경 유형 |
|------|----------|
| edge_ai/* (전체) | 신규 생성 |
| backend/app/modules/edge_gateway/* | 신규 생성 (models, schemas, router, service) |
| backend/app/main.py | 수정 (edge router 등록) |
| backend/pyproject.toml | 변경 없음 (AI 의존성은 edge_ai에만) |
