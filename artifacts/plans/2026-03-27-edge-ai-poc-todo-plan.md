# Todo Plan: Edge AI PoC 데모 시스템

**작성일:** 2026-03-27
**근거:** `artifacts/specs/2026-03-27-edge-ai-poc-final-tech-spec.md` (Rev.2, 32개 섹션)
**총 태스크:** 35개 (M1: 6, M2: 7, M3: 5, M4: 5, M5: 5, M6: 4, M7: 3)

---

## 팀 구성

| 역할 | 담당 영역 |
|------|----------|
| **middle-engineer** | Python 백엔드 (Flask, AI 파이프라인, HAL, 이벤트 전송) |
| **frontend-engineer** | JS 프론트엔드 (Canvas BEV, Socket.IO 클라이언트, UI, 성능 대시보드) |
| **qa-engineer** | 테스트 (벤치마크, E2E 검증, 안정성, 데모 검증) |

---

## 의존관계 요약

```
M1 (프로젝트 기반) ──┬──→ M2 (AI 핵심 엔진) ──→ M6 (통합 검증)
                     │                            ↑
                     ├──→ M3 (사각지대 시뮬) ──────┤
                     │                            │
                     └──→ M4 (웹 서버+Socket.IO)──┤
                                    │             │
                                    └──→ M5 (데모 UI) ─┘
```

- M2, M3, M4는 M1 완료 후 **병렬 진행** 가능
- M5는 M4 완료 필요 (Socket.IO 기반 위에 UI 구축)
- M6은 M2~M5 전체 완료 후 진행

---

## M1: 프로젝트 기반 설정

> **목표:** 디렉토리 구조, 의존성, ONNX 모델 준비, 설정, 원클릭 실행 스크립트
> **완료 조건:** `pip install -r requirements.txt` 성공, ONNX 모델 로드 확인, `start.bat` 동작

### T1: 디렉토리 구조 생성 및 의존성 설정
- **마일스톤:** M1
- **담당:** middle-engineer
- **의존성:** 없음
- **예상 산출물:**
  - `edge_ai/core/__init__.py`
  - `edge_ai/web/templates/index.html` (스켈레톤)
  - `edge_ai/web/static/css/demo.css` (스켈레톤)
  - `edge_ai/web/static/js/app.js` (스켈레톤)
  - `edge_ai/requirements.txt` (갱신)
  - `edge_ai/hal/__init__.py`, `edge_ai/hal/backend.py`
- **수용 기준:**
  - Tech Spec 섹션 15.1 디렉토리 구조와 일치
  - `requirements.txt`에 onnxruntime, flask-socketio, python-socketio, eventlet, psutil, opencv-python-headless, mediapipe, numpy, Pillow, requests 포함
  - ultralytics, torch 제거 확인
  - `pip install -r requirements.txt` 에러 없이 완료
- **예상 작업량:** S

### T2: ONNX 모델 다운로드 및 변환 스크립트
- **마일스톤:** M1
- **담당:** middle-engineer
- **의존성:** T1
- **예상 산출물:**
  - `edge_ai/setup_models.py`
  - `edge_ai/models/yolov8n.onnx`
  - `edge_ai/models/arcface_r100.onnx`
- **수용 기준:**
  - `python setup_models.py` 실행 시 YOLOv8n ONNX + ArcFace ONNX 자동 다운로드
  - 기존 MediaPipe 모델(face_detector.tflite, pose_landmarker_lite.task) 유지
  - 각 모델 파일 ONNX Runtime으로 로드 성공 확인 (더미 추론 통과)
- **예상 작업량:** M

### T3: 설정 모듈 확장 (config.py)
- **마일스톤:** M1
- **담당:** middle-engineer
- **의존성:** T1
- **예상 산출물:** `edge_ai/config.py` (갱신)
- **수용 기준:**
  - 기존 설정(BACKEND_URL, CAMERA_INDEX 등) 유지
  - 신규 설정 추가: INFERENCE_BACKEND(cpu/jetson), INPUT_RESOLUTION(416/320), EDGE_SENSOR_MODE(simulation/hardware), ONNX_THREADS(4)
  - 환경변수 기반 오버라이드 지원
- **예상 작업량:** S

### T4: HAL (Hardware Abstraction Layer) 구현
- **마일스톤:** M1
- **담당:** middle-engineer
- **의존성:** T1, T3
- **예상 산출물:**
  - `edge_ai/hal/backend.py` — InferenceBackend, CPUBackend, JetsonBackend(스텁)
  - `edge_ai/hal/sensor.py` — SensorInterface, SimulatedSensor, UltrasonicSensor(스텁)
- **수용 기준:**
  - Tech Spec 섹션 24 추상 인터페이스 구현
  - CPUBackend: ONNX Runtime 기반 `load_model()`, `infer()`, `get_device_info()` 동작
  - JetsonBackend: 인터페이스만 구현 (NotImplementedError)
  - `EDGE_BACKEND=cpu` 환경변수로 백엔드 선택
- **예상 작업량:** M

### T5: 원클릭 실행 스크립트 (start.bat)
- **마일스톤:** M1
- **담당:** middle-engineer
- **의존성:** T1, T2
- **예상 산출물:** `edge_ai/start.bat`
- **수용 기준:**
  - 더블클릭 시: venv 존재 확인 → 없으면 생성 + pip install → 모델 다운로드 확인 → Flask 서버 시작
  - 브라우저 자동 열기 (http://localhost:5000)
  - 에러 시 콘솔에 한국어 에러 메시지 출력
- **예상 작업량:** S

### T6: warm-up 및 모델 로딩 파이프라인
- **마일스톤:** M1
- **담당:** middle-engineer
- **의존성:** T2, T4
- **예상 산출물:** `edge_ai/core/model_loader.py`
- **수용 기준:**
  - 앱 시작 시 더미 프레임 5장으로 warm-up (Consensus P5)
  - 로딩 진행률을 Socket.IO `loading` 이벤트로 emit
  - 모델별 로딩 상태: pending → loading → ready / error
  - 로딩 실패 시 해당 시나리오 비활성화, 나머지 정상 동작
- **예상 작업량:** M

---

## M2: AI 핵심 엔진

> **목표:** 4개 시나리오의 Python AI 파이프라인 완성
> **완료 조건:** 시나리오 ①②③ 각각 독립 실행 가능, 정확도 기준 충족

### T7: YOLOv8n ONNX 추론 래퍼
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T2, T4
- **예상 산출물:** `edge_ai/core/yolo_inference.py`
- **수용 기준:**
  - ONNX Runtime으로 YOLOv8n 추론
  - 입력 416×416 기본, 320×320 fallback (Graceful degradation)
  - person class(0)만 필터링, confidence ≥ 0.5
  - NMS 적용 (IoU 0.45)
  - 추론 시간 P95 ≤ 150ms (i5 CPU)
  - HAL CPUBackend 통해 호출
- **예상 작업량:** M

### T8: ArcFace 안면인식 엔진
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T2, T4
- **예상 산출물:**
  - `edge_ai/core/face_recognizer.py`
  - `edge_ai/core/face_quality.py`
- **수용 기준:**
  - MediaPipe FaceDetector → 얼굴 크롭 → affine alignment(112×112) → ArcFace ONNX → 512-dim embedding
  - CLAHE(clipLimit=2.0) + Gray World 화이트밸런스 전처리 (FR2.6)
  - 다중 각도 등록: 정면/좌15도/우15도 3장, 각각 512-dim embedding 저장
  - 품질 게이트: 얼굴 크기 ≥ 80×80px, 정면도(양눈 높이 차 < 15%), 밝기(40~220)
  - 코사인 유사도 threshold: 비마스크 0.45 / 마스크 0.35
  - 마스크 감지: nose/mouth visibility < 0.3
  - 5프레임 temporal smoothing (majority voting)
  - Fallback: ArcFace 로드 실패 시 facenet-pytorch 자동 전환
  - 임베딩 DB: AES-256-GCM 암호화 (섹션 19)
- **예상 작업량:** L

### T9: 하차 인식 모드 확장
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T8
- **예상 산출물:** `edge_ai/core/boarding_manager.py`
- **수용 기준:**
  - 승차 모드 / 하차 모드 전환 지원 (섹션 20)
  - 승차 명단 관리 → 하차 시 대조 → 미하차 인원 경고
  - 하차 완료 시 학부모 푸시 알림 이벤트 생성
  - 전원 하차 완료 / 미하차 인원 존재 상태 구분
- **예상 작업량:** M

### T10: 이상 행동 감지 리팩터링
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T7
- **예상 산출물:** `edge_ai/core/behavior_detector.py`
- **수용 기준:**
  - YOLOv8n ONNX → person 감지 → MediaPipe Pose → 상체 랜드마크 판정
  - 상체 기반: shoulder(11,12) - hip(23,24) y좌표 비율만 사용 (하체 미사용)
  - 서기: shoulder_y / hip_y ≥ 0.7 && torso_height > 0.35 → STANDING
  - 넘어짐: torso_width / torso_height > 2.0 → FALLING
  - 거짓 경고 억제 (섹션 26): confidence ≥ 0.6, 지속 ≥ 2초, 10프레임 majority, 쿨다운 5초
  - 운행 모드 자동 전환 (섹션 25): 정차 중 standing 무시
- **예상 작업량:** M

### T11: 잔류 인원 감지 ONNX 전환
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T7
- **예상 산출물:** `edge_ai/core/passenger_detector.py`
- **수용 기준:**
  - YOLOv8n ONNX 기반 person 감지
  - "시동 OFF" 트리거 시 multi-frame 5프레임 스캔
  - 감지 → 빨간 BB + 경보 이벤트 / 미감지 → ALL CLEAR
  - 이벤트 전송 (remaining_passenger)
- **예상 작업량:** S

### T12: 시나리오 관리자 + 모델 활성화 맵
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T7, T8, T10, T11
- **예상 산출물:** `edge_ai/core/scenario_manager.py`
- **수용 기준:**
  - 4개 모드 관리: BOARDING, TRANSIT, ALIGHTING, POST_TRIP (섹션 25)
  - 시나리오별 모델 활성화 맵 (Consensus P4, Tech Spec 8.3):
    - ① 승하차: FaceDetector + ArcFace
    - ② 이상행동: YOLOv8n + Pose
    - ③ 잔류인원: YOLOv8n only
    - ④ 사각지대: Python 측 모델 없음
  - 모드 전환 시 2초 이내 (NFR7)
  - 동시 3모델 금지 (Consensus P4)
- **예상 작업량:** M

### T13: 적응형 프레임 스킵 + 성능 모니터
- **마일스톤:** M2
- **담당:** middle-engineer
- **의존성:** T7
- **예상 산출물:**
  - `edge_ai/core/adaptive_skip.py`
  - `edge_ai/core/performance_monitor.py`
- **수용 기준:**
  - 추론 시간 > 200ms 시 2프레임 스킵 (Consensus P3)
  - 추론 > 300ms 시 입력 320×320 자동 축소 (EC9 Graceful degradation)
  - psutil 기반 CPU/메모리 1초 간격 샘플링
  - FPS 계산 (추론 FPS + 렌더링 FPS 분리)
  - 추론 시간 P95 기록
  - Socket.IO metrics emit
- **예상 작업량:** M

---

## M3: 사각지대 센서 시뮬레이션

> **목표:** JS 프론트엔드 단독으로 LiDAR/초음파 물리 시뮬레이션 + Canvas BEV 렌더링
> **완료 조건:** 3개 시나리오 자동 재생, 3단계 경고, 센서 융합 동작

### T14: LiDAR 레이 캐스팅 엔진 (JS)
- **마일스톤:** M3
- **담당:** frontend-engineer
- **의존성:** T1
- **예상 산출물:** `edge_ai/web/static/js/blindspot/lidar.js`
- **수용 기준:**
  - VLP-16 기반: 360레이(1도 간격), 15m 시각화 범위
  - 레이-객체 교차: 어린이 = 타원, 장애물 = AABB
  - 가우시안 노이즈 σ=3cm, 드롭아웃 2%
  - 프레임당 360레이 계산 ≤ 2ms
- **예상 작업량:** L

### T15: 초음파 센서 시뮬레이션 (JS)
- **마일스톤:** M3
- **담당:** frontend-engineer
- **의존성:** T1
- **예상 산출물:** `edge_ai/web/static/js/blindspot/ultrasonic.js`
- **수용 기준:**
  - 12개 센서 (전4/후4/측면4), 15도 빔, 4m 범위
  - 차량 범퍼 레벨 배치 (차량 2.0m × 7.0m)
  - 가우시안 노이즈 σ=1cm
  - 어린이 객체: 높이 90~130cm, 이동속도 0.5~1.5 m/s
- **예상 작업량:** M

### T16: 센서 융합 + 경고 시스템 (JS)
- **마일스톤:** M3
- **담당:** frontend-engineer
- **의존성:** T14, T15
- **예상 산출물:** `edge_ai/web/static/js/blindspot/fusion.js`
- **수용 기준:**
  - 규칙 기반 가중 평균: LiDAR 0.7 + 초음파 0.3 (Consensus S4)
  - 양 센서 동시 감지 시 신뢰도 0.95
  - 경고 단계: 주의 4m / 경고 2.5m / 위험 1.0m (Consensus S7)
  - 경고 이벤트 발생 시 Flask POST `/api/blindspot_event`
- **예상 작업량:** M

### T17: Bird's Eye View Canvas 렌더링
- **마일스톤:** M3
- **담당:** frontend-engineer
- **의존성:** T14, T15, T16
- **예상 산출물:** `edge_ai/web/static/js/blindspot/bev-canvas.js`
- **수용 기준:**
  - Canvas 2D: 차량 조감도 + LiDAR 360도 포인트 클라우드 + 초음파 12개 콘
  - 색상 코딩: 주의(노랑) / 경고(주황) / 위험(빨강)
  - 어린이 객체 아이콘 표시 + 이동 궤적
  - 센서 상태 패널 (LiDAR/초음파 사양 + 실시간 수치)
  - 렌더링 FPS ≥ 30fps
- **예상 작업량:** L

### T18: 시나리오 JSON 자동 재생 + 인터랙티브 모드
- **마일스톤:** M3
- **담당:** frontend-engineer
- **의존성:** T17
- **예상 산출물:**
  - `edge_ai/web/static/js/blindspot/scenario-player.js`
  - `edge_ai/web/static/scenarios/rear_approach.json`
  - `edge_ai/web/static/scenarios/side_blindspot.json`
  - `edge_ai/web/static/scenarios/multi_children.json`
- **수용 기준:**
  - 3개 사전 정의 시나리오 자동 재생 (데모 기본 모드)
  - 마우스 드래그로 어린이 객체 이동 (인터랙티브 모드)
  - 시나리오 전환 버튼
  - 시나리오 반복 재생 옵션
- **예상 작업량:** M

---

## M4: 웹 서버 + Socket.IO

> **목표:** Flask + Socket.IO 서버, 카메라 스레드, 추론 스레드, REST API
> **완료 조건:** 브라우저에서 실시간 프레임 수신 + 오버레이 확인

### T19: Flask + Socket.IO 서버 기본 구조
- **마일스톤:** M4
- **담당:** middle-engineer
- **의존성:** T1, T6
- **예상 산출물:** `edge_ai/main.py` (전면 재작성)
- **수용 기준:**
  - Flask + Flask-SocketIO (eventlet) 서버
  - 카메라 스레드 (daemon): OpenCV 30fps → frame_queue(maxsize=1)
  - 추론 스레드 (daemon): frame_queue → 시나리오별 추론 → Socket.IO emit
  - 성능 모니터 스레드 (daemon): 1초 간격 metrics emit
  - 정적 파일 서빙 (web/templates, web/static)
  - Tech Spec 7.2 스레드 구조 구현
- **예상 작업량:** L

### T20: REST API 엔드포인트
- **마일스톤:** M4
- **담당:** middle-engineer
- **의존성:** T19, T8, T12
- **예상 산출물:** `edge_ai/routes.py` (또는 main.py 내 라우트)
- **수용 기준:**
  - Tech Spec 8.2 전체 API 구현:
    - `GET /` → index.html
    - `POST /api/register_face` → 얼굴 등록 (보호자 동의 확인 플래그 포함)
    - `DELETE /api/faces/{name}` → 얼굴 삭제
    - `POST /api/blindspot_event` → 사각지대 이벤트 수신 (JS → Flask)
    - `GET /api/events` → 이벤트 로그
    - `GET /api/status` → 시스템 상태 (mode, camera, backend, faces)
    - `POST /api/reset` → 데모 리셋
  - 하차 모드 API: `POST /api/mode/alighting`, `GET /api/boarding_status`
- **예상 작업량:** M

### T21: 백엔드 연동 + Standalone 모드
- **마일스톤:** M4
- **담당:** middle-engineer
- **의존성:** T19
- **예상 산출물:** `edge_ai/core/event_sender.py` (리팩터링)
- **수용 기준:**
  - 시작 시 localhost:8000 헬스체크 → 연동/standalone 자동 판별 (FR7.1)
  - Standalone: 이벤트 로컬 메모리 저장, 모든 UI 기능 동작 (FR7.2)
  - 연동: `POST /api/v1/edge/events` (기존 패턴 유지) + FCM 푸시 트리거
  - 연결 상태 UI 아이콘 emit (FR7.4)
  - 다중 채널 알림 이벤트 생성: 승하차 확인 → 푸시만 / 이상행동·잔류 → 푸시+SMS+카카오 (섹션 30)
- **예상 작업량:** M

### T22: WebSocket 메시지 프로토콜
- **마일스톤:** M4
- **담당:** middle-engineer
- **의존성:** T19
- **예상 산출물:** T19의 main.py 내 Socket.IO emit 로직
- **수용 기준:**
  - `frame` 이벤트: image(base64 JPEG quality 70), mode, detections[], metrics{}, timestamp (Tech Spec 8.1)
  - `event` 이벤트: type, message, details, timestamp
  - `loading` 이벤트: stage, progress, message
  - 클라이언트→서버: `set_mode`, `engine_control`
  - base64 JPEG 전송 (MJPEG 완전 폐기)
- **예상 작업량:** S

### T23: Human Fallback 모드
- **마일스톤:** M4
- **담당:** middle-engineer
- **의존성:** T19, T13
- **예상 산출물:** `edge_ai/core/fallback_manager.py`
- **수용 기준:**
  - 장애 감지 조건 (섹션 28): 카메라 5초 미수신, 추론 5초 초과, 메모리 95%, 3회 연속 실패
  - 장애 시: "수동 확인 모드" Socket.IO 이벤트 emit
  - 인솔교사 뷰: 수동 출석 체크리스트 데이터 전송
  - AI 정상 복구 감지 시 자동 전환
  - 장애 이력 로그 기록
- **예상 작업량:** M

---

## M5: 데모 UI

> **목표:** 심사위원 설득력 있는 시각적 완성도의 데모 프론트엔드
> **완료 조건:** 4개 시나리오 전체 UI 동작, 스텝 위저드, 프레젠터 가이드, 음성 경고

### T24: 메인 레이아웃 + 스텝 위저드 + 프레젠터 가이드
- **마일스톤:** M5
- **담당:** frontend-engineer
- **의존성:** T19, T22
- **예상 산출물:**
  - `edge_ai/web/templates/index.html`
  - `edge_ai/web/static/css/demo.css`
  - `edge_ai/web/static/js/app.js`
  - `edge_ai/web/static/js/presenter.js`
- **수용 기준:**
  - 데모 시작 화면: 4개 도메인 인포그래픽 + "데모 시작" 버튼 (AudioContext 활성화)
  - 스텝 위저드: ① → ② → ③ → ④ 순차 네비게이션, 현재 활성 시나리오 강조 (FR6.1)
  - 시나리오 전환: fade 0.3초 + 소개 오버레이 1.5초 (FR6.8)
  - 프레젠터 가이드: 각 시나리오별 설명 패널 (발표자 노트) (FR6.2)
  - 로딩 스플래시: 모델 로딩 프로그레스 바 + 모델별 상태 (FR6.5)
  - 한국어 UI + 영문 기술 용어 병기 (FR6.6)
  - 반응형: 1024×768 ~ 1920×1080 (NFR10)
  - 데모 리셋 버튼 (FR6.4)
  - 도메인-하드웨어 매핑 표시 (G7)
- **예상 작업량:** L

### T25: 비디오 Canvas + 바운딩 박스 오버레이
- **마일스톤:** M5
- **담당:** frontend-engineer
- **의존성:** T22, T24
- **예상 산출물:** `edge_ai/web/static/js/video-canvas.js`
- **수용 기준:**
  - Socket.IO `frame` 이벤트 수신 → Canvas에 base64 이미지 렌더링
  - detections 기반 바운딩 박스 오버레이:
    - 정상: 초록 BB + 라벨
    - 경고: 주황 BB + 라벨
    - 위험: 빨간 BB + 라벨 + 화면 테두리 빨간 펄스
  - 토스트 알림 (승차 확인 등)
  - 3단계 시각 피드백: 정상(초록), 경고(주황), 위험(빨강) (FR6.10)
  - 웹캠 fallback: 연결 실패 시 사전 녹화 영상 자동 재생 (FR6.3)
  - 보호자 동의 UI (섹션 19.3): 얼굴 등록 전 동의 화면 표시
  - 하차 모드 UI (섹션 20): 승하차 명단 체크리스트, 미하차 경고
- **예상 작업량:** L

### T26: 성능 대시보드
- **마일스톤:** M5
- **담당:** frontend-engineer
- **의존성:** T22, T24
- **예상 산출물:** `edge_ai/web/static/js/dashboard.js`
- **수용 기준:**
  - CPU 사용률 게이지 (SVG)
  - 메모리 사용률 게이지 (SVG)
  - FPS 미니 라인 차트 (최근 30초)
  - 추론 시간 표시 (현재 + P95)
  - "시뮬레이션 대상: NVIDIA Jetson Orin Nano" 표시
  - 시나리오별 활성 모델명 표시
  - 이벤트 로그 패널 (실시간 스크롤, 최근 100개)
- **예상 작업량:** M

### T27: 현장 전용 UI (인솔교사/운전기사 뷰)
- **마일스톤:** M5
- **담당:** frontend-engineer
- **의존성:** T24
- **예상 산출물:** `edge_ai/web/static/js/field-view.js`
- **수용 기준:**
  - 인솔교사 뷰 (섹션 27.1): 큰 버튼 3개(승차/운행/하차), 경고 시 전체 화면 플래시, 승하차 명단 체크리스트
  - 운전기사 뷰 (섹션 27.2): 최소 정보, 상태 LED(정상/주의/위험), 음성 안내 중심
  - 데모에서 "현장 UI 프리뷰" 탭으로 전환 가능
  - Human Fallback 표시: 수동 확인 모드 전환 시 체크리스트 UI (섹션 28)
- **예상 작업량:** M

### T28: 음성 경고 시스템
- **마일스톤:** M5
- **담당:** frontend-engineer
- **의존성:** T24
- **예상 산출물:**
  - `edge_ai/web/static/js/audio.js`
  - `edge_ai/web/static/audio/boarding_confirm.mp3`
  - `edge_ai/web/static/audio/danger_warning.mp3`
  - `edge_ai/web/static/audio/remaining_alert.mp3`
  - `edge_ai/web/static/audio/vehicle_stop.mp3`
- **수용 기준:**
  - Web Audio API로 브라우저 내 재생 (FR8.2)
  - 한국어 MP3 파일 4개 (FR8.1): "OOO 원생 탑승 확인", "위험: 이동 금지", "잔류 인원 감지", "차량 이동을 금지합니다"
  - 경고 단계별 비프음 (oscillator) (FR8.3)
  - "데모 시작" 클릭으로 AudioContext 활성화 (EC12)
- **예상 작업량:** M

---

## M6: 통합 검증

> **목표:** 테스트, 벤치마크, 원클릭 실행, 데모 영상 준비
> **완료 조건:** 전체 수용 기준 충족, 벤치마크 합격, 15분 연속 가동 성공

### T29: 단위 테스트 + 통합 테스트
- **마일스톤:** M6
- **담당:** qa-engineer
- **의존성:** T7, T8, T10, T11, T19, T20
- **예상 산출물:**
  - `edge_ai/tests/test_yolo_inference.py`
  - `edge_ai/tests/test_face_recognizer.py`
  - `edge_ai/tests/test_behavior_detector.py`
  - `edge_ai/tests/test_passenger_detector.py`
  - `edge_ai/tests/test_sensor_fusion.py`
  - `edge_ai/tests/test_flask_api.py`
  - `edge_ai/tests/test_socketio.py`
  - `edge_ai/tests/test_scenario_manager.py`
- **수용 기준:**
  - Tech Spec 11.1 단위 테스트 전체 구현:
    - ArcFace 임베딩: 동일인 유사도 > 0.6, 다른 사람 < 0.3
    - YOLOv8n ONNX: person 감지, 추론 시간
    - 이상 행동 판정: standing/falling/normal 분류
    - 센서 융합: 가중 평균, 경고 단계
    - 성능 모니터: CPU/MEM 수집
  - Tech Spec 11.2 통합 테스트:
    - Flask API: 모든 엔드포인트 응답
    - Socket.IO: 프레임 emit/수신
    - 시나리오 전환: 모델 맵 변경
    - 백엔드 연동: standalone/연동 모드
  - 전체 테스트 통과율 100%
- **예상 작업량:** L

### T30: 성능 벤치마크 자동화
- **마일스톤:** M6
- **담당:** qa-engineer
- **의존성:** T7, T8, T13
- **예상 산출물:**
  - `edge_ai/tests/benchmark.py`
  - `edge_ai/tests/benchmark_results.json`
- **수용 기준:**
  - Tech Spec 22.3 벤치마크 6개 자동 실행:
    - BM-1: YOLOv8n ONNX 추론 100회, P95 ≤ 150ms
    - BM-2: ArcFace ONNX 추론 100회, P95 ≤ 60ms
    - BM-3: MediaPipe Pose 추론 100회, P95 ≤ 35ms
    - BM-4: 안면인식 TAR@FAR=0.01, ≥ 95%
    - BM-5: 10분 연속 가동, 메모리 증가 ≤ 50MB
    - BM-6: 사각지대 시뮬레이션 FPS ≥ 30fps
  - 결과를 JSON 보고서로 출력
  - 합격/불합격 자동 판정
- **예상 작업량:** L

### T31: E2E 데모 시나리오 검증 (수동 + 체크리스트)
- **마일스톤:** M6
- **담당:** qa-engineer
- **의존성:** T24, T25, T17, T18
- **예상 산출물:**
  - `edge_ai/tests/e2e_checklist.md`
  - `artifacts/verification/2026-03-27-edge-ai-poc-verification.md`
- **수용 기준:**
  - Tech Spec 11.3 데모 검증 7개 항목 수동 실행:
    - 안면인식: 5명 등록, 인당 20회 → 95% 이상
    - 이상행동: 앉기→일어서기 10회 → 80% 이상
    - 잔류인원: 있을 때/없을 때 각 10회 → 99% 이상
    - 사각지대: 3개 시나리오 각 3회 → 100%
    - 연속 가동: 15분 → 크래시 0회
    - 빠른 전환: ①→②→③→④→①→② → 메모리 누수 없음
    - 프로젝터 해상도: 1080p, 720p → UI 깨짐 없음
  - Tech Spec 13. 수용 기준 AC1~AC6 전체 검증
  - 검증 보고서 작성 (VERIFIED / PARTIALLY VERIFIED / FAILED)
- **예상 작업량:** L

### T32: 데모 영상 녹화 준비
- **마일스톤:** M6
- **담당:** qa-engineer
- **의존성:** T31
- **예상 산출물:**
  - `edge_ai/docs/recording-guide.md`
  - `edge_ai/fallback/fallback_video.mp4` (선택적 — 녹화 후 배치)
- **수용 기준:**
  - Tech Spec 섹션 32 기반 녹화 가이드:
    - 8개 파트 구성 (인트로~마무리, 총 5~7분)
    - 파트별 시간, 촬영 포인트, 주의사항 상세 기술
  - 편집 요소 목록: 자막, 인포그래픽, 성능 지표 오버레이, 배경음악
  - fallback 영상 제작 (웹캠 실패 시 사용할 사전 녹화 영상)
  - 운행일지 내보내기 기능 확인 (섹션 29: CSV/PDF)
- **예상 작업량:** M

---

## M7: 앱 연동 (선택적 — 데모 완성도 향상)

> **목표:** 기존 모바일/웹 앱과 Edge AI PoC 연동으로 "실제 서비스 수준" 데모
> **완료 조건:** Edge AI 이벤트 → 백엔드 → 모바일 푸시 알림, 웹 대시보드 이벤트 표시
> **전제:** 백엔드가 localhost:8000에서 실행 중

### T33: 모바일 알림 라우팅 수정
- **마일스톤:** M7
- **담당:** middle-engineer (또는 app-engineer)
- **의존성:** T21 (백엔드 연동)
- **예상 산출물:**
  - `mobile/src/hooks/useNotifications.ts` 수정
  - `mobile/src/screens/EdgeEventsScreen.tsx` (신규)
- **수용 기준:**
  - 푸시 알림 탭 → EdgeEventsScreen으로 이동
  - EdgeEventsScreen: 오늘의 AI 감지 이벤트 타임라인 표시
  - 이벤트 타입별 아이콘 (승하차/이상행동/잔류인원/사각지대)
- **예상 작업량:** S (30분~1시간)

### T34: 웹 대시보드 Edge AI 이벤트 페이지
- **마일스톤:** M7
- **담당:** frontend-engineer (또는 app-engineer)
- **의존성:** T21 (백엔드 연동)
- **예상 산출물:**
  - `web/src/pages/platform/PlatformEdgeEventsPage.tsx` (신규)
  - `web/src/App.tsx` 라우팅 추가
- **수용 기준:**
  - `GET /api/v1/edge/events` 호출하여 이벤트 리스트 표시
  - 이벤트 타입/차량별 필터
  - 이벤트 상세 모달 (시간, 타입, 상세 정보)
  - 자동 리프레시 (10초 간격)
  - 기존 웹 대시보드 디자인 시스템과 일관성 유지
- **예상 작업량:** M (2~3시간)

### T35: 데모 시연 시 앱 연동 통합 테스트
- **마일스톤:** M7
- **담당:** qa-engineer
- **의존성:** T33, T34, T31
- **예상 산출물:**
  - 앱 연동 E2E 체크리스트
- **수용 기준:**
  - Edge AI 이벤트 발생 → 백엔드 수신 확인
  - 백엔드 → FCM 푸시 전송 확인
  - 모바일 앱에서 알림 수신 + 탭 → 화면 이동 확인
  - 웹 대시보드에서 이벤트 실시간 표시 확인
- **예상 작업량:** S (1시간)

---

## 태스크 요약 매트릭스

### 담당별 분포

| 담당 | 태스크 수 | 태스크 목록 |
|------|----------|------------|
| middle-engineer | 19 | T1~T13, T19~T23, T33 |
| frontend-engineer | 11 | T14~T18, T24~T28, T34 |
| qa-engineer | 5 | T29~T32, T35 |

### 작업량 분포

| 크기 | 수 | 태스크 |
|------|---|--------|
| S | 6 | T1, T3, T5, T11, T22, T9(하차 의존 제외 시 M) |
| M | 17 | T2, T4, T6, T9, T10, T12, T13, T15, T16, T18, T20, T21, T23, T26, T27, T28, T32 |
| L | 9 | T8, T14, T17, T19, T24, T25, T29, T30, T31 |

### 병렬 작업 가능 구간

| 구간 | middle-engineer | frontend-engineer | qa-engineer |
|------|----------------|-------------------|-------------|
| M1 | T1→T2,T3→T4,T5,T6 | (대기) | (대기) |
| M2+M3+M4 | T7→T8→T9, T10, T11→T12, T13, T19→T20,T21,T22,T23 | T14,T15→T16→T17→T18 | (대기 또는 테스트 설계) |
| M5 | (지원) | T24→T25,T26,T27,T28 | (대기 또는 테스트 설계) |
| M6 | (버그 수정 지원) | (버그 수정 지원) | T29→T30→T31→T32 |

---

## 마일스톤별 완료 기준 요약

| 마일스톤 | 완료 기준 |
|---------|----------|
| M1 | `pip install` 성공, ONNX 모델 로드 확인, `start.bat` 서버 시작, HAL 인터페이스 동작 |
| M2 | 시나리오 ①②③ 각각 Python 단독 테스트 통과, 승하차/이상행동/잔류인원 감지 동작 |
| M3 | 사각지대 BEV Canvas 렌더링, 3개 시나리오 자동 재생, 3단계 경고 + 센서 융합 |
| M4 | 브라우저에서 실시간 프레임 수신, REST API 응답, Standalone/연동 모드 동작 |
| M5 | 4개 시나리오 전체 UI 동작, 스텝 위저드, 프레젠터 가이드, 음성 경고, 현장 UI |
| M6 | 전체 테스트 통과, 벤치마크 합격, 15분 연속 가동 성공, 녹화 가이드 완성 |
