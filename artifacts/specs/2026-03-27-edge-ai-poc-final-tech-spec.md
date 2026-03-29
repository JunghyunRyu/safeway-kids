# Final Tech Spec: Edge AI PoC 데모 시스템

**작성일:** 2026-03-27
**작성자:** Middle Engineer (Phase 3)
**상태:** FINAL (Rev.2 — 페르소나 GAP 해소 반영)
**근거:** Phase 2 Consensus Matrix + 7명 페르소나 평가 종합 (2026-03-27) 반영
**리뷰어:** R1 (CV/AI), R2 (안면인식), R3 (센서), R4 (데모 UX) + 7명 페르소나 평가

---

## 1. 문제 정의 (Problem Statement)

SafeWay Kids 플랫폼의 규제 샌드박스 신청서에 명시된 4개 AI 하드웨어 도메인(엣지 컴퓨팅 디바이스, CCTV, 안면인식 터미널, 사각지대 감지 센서)의 기술적 실현 가능성을 **소프트웨어 시뮬레이션**으로 입증해야 한다.

**대상:** 비기술 규제 심사위원 (정책/기술 심사위원 포함)
**실행 환경:** Windows i5 PC + USB 웹캠 1대, GPU 없음
**시연 방식:** 대표가 직접 시연 + 녹화본 함께 제출
**핵심 제약:** 원클릭 실행, 10분 이상 안정 가동, 시각적 완성도
**추가 요구:** 개인정보 보호 설계, 비용/ROI 근거, 상용화 로드맵, 현장 적합성 입증

---

## 2. Goals / Non-goals

### Goals

| ID | 목표 | 수용 기준 |
|----|------|----------|
| G1 | 4개 시나리오 완전 시연 | 안면인식, 이상행동, 잔류인원, 사각지대 모두 동작 |
| G2 | 심사위원 설득력 | 비기술자가 "기술이 동작한다"고 납득하는 시각적 완성도 |
| G3 | 원클릭 실행 | `start.bat` 더블클릭으로 venv 생성 + 의존성 설치 + 서버 시작 |
| G4 | 성능 지표 시각화 | CPU, 메모리, FPS, 추론 지연시간 실시간 표시 |
| G5 | 백엔드 연동 | 이벤트 → backend POST + standalone fallback 자동 감지 |
| G6 | 안정성 | 10분 이상 연속 가동, 크래시 없음 |
| G7 | 도메인 매핑 | 각 시나리오가 어느 하드웨어 도메인에 해당하는지 UI에 명시 |
| G8 | 개인정보 보호 | PIA 요약, 동의 절차 UI, 암호화, 파기 정책 데모에 포함 |
| G9 | 하차 인식 | 승차뿐 아니라 하차 확인 + 미하차 인원 알림까지 시연 |
| G10 | 비용/ROI 근거 | 설치비, 월정액, 사회적 비용 절감 근거를 데모 자료에 포함 |
| G11 | 상용화 로드맵 | PoC → 파일럿 → 전국 확산 3단계 로드맵 제시 |
| G12 | 현장 적합성 | 인솔교사/운전기사 전용 UI, 거짓 경고 억제, Human Fallback 시연 |
| G13 | 데모 영상 | 5~7분 녹화본 제출용 영상 촬영 가이드 포함 |

### Non-goals

| ID | 범위 밖 |
|----|---------|
| NG1 | 실제 하드웨어(Jetson, LiDAR, 초음파, CCTV) 통합 |
| NG2 | 커스텀 데이터셋 모델 학습/파인튜닝 |
| NG3 | 멀티 카메라 구성 |
| NG4 | GPU 필수 환경 |
| NG5 | 모바일 앱 빌드/배포 |
| NG6 | GPS 기반 실시간 차량 위치 추적 |
| NG7 | 멀티 유저 동시 접속 |
| NG8 | 야간 모드 (nice-to-have, 시간 여유 시 추가) |

---

## 3. 사용자 시나리오 (User Scenarios)

### 데모 흐름 (발표자 시연 형태)

```
[데모 시작 화면] → [① 승하차 안면인식] → [② 운행중 이상행동] → [③ 잔류인원 감지] → [④ 사각지대 감지] → [요약/종료]
```

**시나리오 ① — 안면 인식 승하차 (도메인 3: 안면인식 터미널)**

1. 발표자가 "데모 시작" 클릭 → 시나리오 ① 활성화
2. 웹캠 앞에서 원생 얼굴 등록 (이름 입력 + 캡처, 정면/좌15도/우15도 3장)
3. 등록 시 품질 게이트 검증 (얼굴 크기, 정면도, 밝기)
4. 등록 완료 후 원생이 카메라 앞에 서면 자동 감지
5. 매칭 성공 → 초록 바운딩 박스 + "OOO 원생 탑승 확인" + 토스트 알림
6. 미등록 → 노란 바운딩 박스 + "미등록"
7. 백엔드 이벤트 전송 (standalone 시 로컬 로그)

**시나리오 ② — 운행 중 이상 행동 감지 (도메인 2: CCTV)**

1. 시나리오 ②로 전환 → 전환 오버레이 1.5초 표시
2. 웹캠이 "차량 내부"를 촬영
3. YOLOv8n ONNX로 person 감지 → MediaPipe Pose로 상체 자세 분석
4. 정상 착석 → 초록 바운딩 박스 + "Normal"
5. 일어서기 → 빨간 바운딩 박스 + "위험: 이동 금지" + 경고음 + 화면 테두리 빨간 펄스
6. 이벤트 로그 기록 + 백엔드 전송

**시나리오 ③ — 시동 OFF 잔류 인원 감지 (도메인 2: CCTV)**

1. 시나리오 ③으로 전환
2. 대기 화면 표시 ("시동 OFF" 버튼 안내)
3. "시동 OFF" 클릭 → multi-frame 스캔 시작
4. 사람 감지 → 빨간 바운딩 박스 + "잔류 인원 감지" + 경보음 + "관리자 경보 발송"
5. 미감지 → "ALL CLEAR" 초록 표시
6. "시동 ON" 클릭 → 대기 상태 복귀

**시나리오 ④ — 사각지대 어린이 감지 (도메인 4: LiDAR + 초음파)**

1. 시나리오 ④로 전환 → Canvas 2D Bird's Eye View 활성화
2. 차량 조감도 + LiDAR 360도 레이 + 초음파 12개 콘 표시
3. 사전 정의 시나리오 자동 재생 (기본 모드):
   - 어린이 객체가 차량 후방에서 접근
   - 거리별 3단계 경고: 주의(4m) → 경고(2.5m) → 위험(1.0m)
4. LiDAR 포인트 클라우드에 어린이 형태 하이라이트
5. 초음파 거리 게이지 실시간 업데이트
6. 위험 단계 → "차량 이동 금지" 경고 + 경보음
7. 마우스 드래그로 어린이 객체 수동 이동 가능 (인터랙티브 모드)

---

## 4. 기능 요구사항 (Functional Requirements)

### FR1 — AI 추론 엔진 (Consensus: P1~P5)

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR1.1 | ONNX Runtime 기본 추론 백엔드 | PyTorch 제거. ultralytics는 ONNX export 도구로만 사용 |
| FR1.2 | YOLOv8n ONNX 모델 | `yolov8n.onnx` (416×416 입력), `onnxruntime` CPU |
| FR1.3 | 입력 해상도 416×416 기본 | 성능 부족 시 320×320 fallback (config 설정) |
| FR1.4 | 적응형 프레임 스킵 | 추론 시간 > 200ms 시 다음 2프레임 스킵. 렌더링은 30fps 유지, 추론은 target 5fps |
| FR1.5 | 시나리오별 모델 활성화 맵 | ①: FaceDetector + ArcFace / ②: YOLOv8n + Pose / ③: YOLOv8n / ④: 없음(JS) |
| FR1.6 | 모델 warm-up | 앱 시작 시 더미 프레임 5장으로 각 모델 warm-up. 로딩 프로그레스 바 표시 |
| FR1.7 | ONNX 스레드 설정 | `sess_options.intra_op_num_threads = 4` (i5 코어 활용) |

### FR2 — 안면 인식 파이프라인 (Consensus: F1~F5)

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR2.1 | ArcFace ONNX 512-dim embedding | 히스토그램 매칭 완전 폐기. ArcFace-R100 ONNX 모델 직접 로드 |
| FR2.2 | 얼굴 감지 | 기존 MediaPipe FaceDetector (TFLite) 유지 |
| FR2.3 | 얼굴 정렬 (alignment) | MediaPipe keypoint(양쪽 눈)로 affine transform → 112×112 정규화 |
| FR2.4 | 다중 각도 등록 | 정면 + 좌15도 + 우15도 최소 3장. 각 각도별 512-dim embedding 저장 |
| FR2.5 | 등록 품질 게이트 | 얼굴 크기(최소 80×80px), 정면도(양쪽 눈 높이 차 < 15%), 밝기(평균 40~220) |
| FR2.6 | CLAHE + 화이트밸런스 전처리 | CLAHE(clipLimit=2.0, tileGrid=8×8) + Gray World 화이트밸런스 정규화 |
| FR2.7 | 5프레임 temporal smoothing | 최근 5프레임 인식 결과 majority voting → 1프레임 오인식 보정 |
| FR2.8 | 코사인 유사도 threshold | 비마스크: 0.45 / 마스크 감지 시: 0.35 |
| FR2.9 | 마스크 감지 | MediaPipe 랜드마크 nose/mouth visibility < 0.3 → 마스크 착용 판정 |
| FR2.10 | Fallback | ArcFace ONNX 로드 실패 시 facenet-pytorch로 자동 전환 |

### FR3 — 이상 행동 감지 (Consensus: P4, R1-C7)

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR3.1 | 객체 감지 | YOLOv8n ONNX, person class(0)만 필터링 |
| FR3.2 | 포즈 분석 | MediaPipe PoseLandmarker (기존 TFLite 유지) |
| FR3.3 | 상체 랜드마크 기반 판정 | 어깨(11,12) - 엉덩이(23,24) y좌표 비율만 사용. 하체 미사용 |
| FR3.4 | 서기 판정 | `shoulder_y / hip_y` 비율이 0.7 이상이고 torso_height > 0.35 → STANDING |
| FR3.5 | 넘어짐 판정 | `torso_width / torso_height` > 2.0 → FALLING |
| FR3.6 | 정상 판정 | 위 조건 미충족 → NORMAL |
| FR3.7 | 경고 시각 효과 | 빨간 바운딩 박스 + "위험: 이동 금지" 라벨 + 화면 테두리 빨간 펄스 + 하단 경고 배너 |
| FR3.8 | 이벤트 쿨다운 | 동일 유형 이벤트는 5초 간격으로만 전송 |

### FR4 — 잔류 인원 감지

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR4.1 | 트리거 | "시동 OFF" 버튼 클릭 시 스캔 시작 |
| FR4.2 | Multi-frame 분석 | 연속 5프레임 분석, 가장 많은 인원이 감지된 결과 채택 |
| FR4.3 | 감지 시 경고 | 빨간 바운딩 박스 + "잔류 인원 감지" + 경보음 + "관리자 경보 발송" 표시 |
| FR4.4 | 미감지 시 | "ALL CLEAR" 초록 화면 |
| FR4.5 | 이벤트 전송 | 감지 시 백엔드로 remaining_passenger 이벤트 전송 |

### FR5 — 사각지대 센서 시뮬레이션 (Consensus: S1~S8)

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR5.1 | LiDAR 시뮬레이션 | VLP-16 기반, 360레이(1도 간격), 15m 시각화 범위, σ=3cm 노이즈, 2% 드롭아웃 |
| FR5.2 | 초음파 시뮬레이션 | 12개 센서(전4/후4/측면4), 15도 빔, 4m 범위, σ=1cm 노이즈 |
| FR5.3 | 센서 배치 | 차량(2.0m×7.0m) 기준 고정 좌표. LiDAR: 지붕 중앙. 초음파: 범퍼 레벨 |
| FR5.4 | 레이 캐스팅 | LiDAR: 360개 레이 × 객체 교차 판정. 어린이 = 타원, 장애물 = AABB |
| FR5.5 | 센서 융합 | 규칙 기반 가중 평균 (LiDAR 0.7 + 초음파 0.3). 양 센서 감지 시 신뢰도 0.95 |
| FR5.6 | 경고 단계 | 주의 4m / 경고 2.5m / 위험 1.0m (Consensus S7 반영) |
| FR5.7 | 어린이 객체 모델 | 높이 90~130cm, 이동속도 0.5~1.5 m/s |
| FR5.8 | 시나리오 최소 3개 | 후방 접근, 측면 사각지대, 복수 어린이 (JSON 기반 시나리오 파일) |
| FR5.9 | 자동 재생 + 인터랙티브 | 자동 재생 기본(데모 안정성) + 마우스 드래그 인터랙티브 모드 |
| FR5.10 | JS 프론트엔드 단독 | 시뮬레이션 엔진 + 렌더링 모두 JavaScript. 경고 이벤트만 Flask POST |

### FR6 — 데모 UX (Consensus: U1~U7)

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR6.1 | 스텝 위저드 패턴 | 4개 시나리오 순차 네비게이션. 현재 활성 시나리오 강조 |
| FR6.2 | 프레젠터 가이드 | 각 시나리오별 설명 패널 (다음 동작 안내, 발표자 노트) |
| FR6.3 | 웹캠 fallback | 웹캠 실패 시 사전 녹화 영상 자동 재생 |
| FR6.4 | 데모 리셋 | 한 버튼으로 전체 상태 초기화 (얼굴 등록, 이벤트 로그, 모드) |
| FR6.5 | 로딩 스플래시 | 모델 로딩 중 전문적인 프로그레스 화면 + 각 모델 상태 표시 |
| FR6.6 | 한국어 UI + 영문 기술 지표 | UI 텍스트 한국어, 기술 용어(CPU, FPS, Latency 등) 영문 병기 |
| FR6.7 | 성능 대시보드 | CPU, 메모리(psutil), FPS, 추론 시간 실시간 표시 |
| FR6.8 | 시나리오 전환 | fade 전환 0.3초 + 시나리오 소개 오버레이 1.5초 |
| FR6.9 | 데모 시작 화면 | 4개 도메인 인포그래픽 + "데모 시작" 버튼 (오디오 컨텍스트 활성화 겸용) |
| FR6.10 | 3단계 시각 피드백 | 정상(초록), 경고(주황), 위험(빨강) — 색상+애니메이션+음성 |

### FR7 — 백엔드 연동 & Standalone

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR7.1 | 자동 감지 모드 | 시작 시 localhost:8000 헬스체크 → 응답 시 연동, 미응답 시 standalone |
| FR7.2 | Standalone 모드 | 백엔드 없이 모든 UI 기능 동작. 이벤트는 로컬 메모리 저장 |
| FR7.3 | 이벤트 POST | `POST /api/v1/edge/events` (기존 event_sender.py 패턴 유지) |
| FR7.4 | 연결 상태 표시 | UI에 백엔드 연결/미연결 아이콘 표시 |

### FR8 — 음성 경고

| ID | 요구사항 | 상세 |
|----|----------|------|
| FR8.1 | 한국어 MP3 | 사전 녹음 경고 음성 파일 (3~4개: 탑승확인, 위험경고, 잔류인원, 차량정지) |
| FR8.2 | Web Audio API | 브라우저 내장 API로 재생. "데모 시작" 클릭으로 오디오 컨텍스트 활성화 |
| FR8.3 | 비프음 | 경고 단계별 비프음 (Web Audio oscillator 생성) |

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| ID | 항목 | 목표 | 측정 방법 |
|----|------|------|----------|
| NFR1 | 추론 지연시간 | 200ms 이하 / 프레임 | `time.perf_counter()` 전처리~후처리 구간 |
| NFR2 | 체감 FPS | 3 FPS 이상 (렌더링 30fps, 추론 3~5fps) | 적응형 프레임 스킵으로 렌더링과 추론 분리 |
| NFR3 | 안면인식 성공률 | 95% 이상 (정면, 적정 조명) | 5~10명 등록, 인당 20회 인식 시도 |
| NFR4 | 마스크 인식률 | 70% 이상 | 마스크 착용 시 threshold 0.35 적용 |
| NFR5 | 연속 가동 | 10분 이상 크래시 없음 | 메모리 누수, CPU 스로틀링 모니터링 |
| NFR6 | 시작 시간 | 모델 로딩 포함 30초 이내 | 로딩 프로그레스 바 표시 |
| NFR7 | 시나리오 전환 | 2초 이내 | 모델 활성화 맵으로 추론 호출만 전환 |
| NFR8 | 설치 | `start.bat` 더블클릭 한 번 | venv + pip install + 서버 시작 자동화 |
| NFR9 | 디스크 | 총 500MB 이하 (venv + 모델) | PyTorch 제거로 1.5GB→50MB |
| NFR10 | 해상도 대응 | 1024×768 ~ 1920×1080 | 반응형 CSS |

---

## 6. 제약사항 (Constraints)

| ID | 제약 | 영향 |
|----|------|------|
| CON1 | CPU only (GPU 없음) | ONNX Runtime CPU, 해상도 416×416 필수 |
| CON2 | Windows i5 PC | PyTorch 제거, dlib/face_recognition 사용 금지 |
| CON3 | 웹캠 1대 | 시나리오 ①②③은 동일 카메라 공유, ④는 카메라 미사용 |
| CON4 | Python만으로 완결 | Node.js, npm 설치 불필요. Flask가 정적 파일 서빙 |
| CON5 | 원클릭 실행 | 추가 설정 없이 batch 파일 하나로 시작 |
| CON6 | 인터넷 필요 | 초기 설치 시에만. 실행 시에는 오프라인 동작 |

---

## 7. 아키텍처 / 데이터 흐름 (Architecture)

### 7.1 전체 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│  Edge AI PoC Demo (Python + Static Frontend)                         │
│                                                                      │
│  ┌─ Python Backend (Flask + Flask-SocketIO) ─────────────────────┐  │
│  │                                                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │ Camera Thread │  │ Inference    │  │ Performance      │   │  │
│  │  │ (OpenCV)      │→ │ Thread       │→ │ Monitor (psutil) │   │  │
│  │  │ 30fps capture │  │ 3~5fps infer │  │ 1fps sampling    │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │  │
│  │         │                  │                   │              │  │
│  │         └──────────┬───────┴───────────────────┘              │  │
│  │                    ▼                                          │  │
│  │           ┌────────────────┐                                 │  │
│  │           │ Socket.IO emit │  frame (base64 JPEG)            │  │
│  │           │                │  detections (JSON)              │  │
│  │           │                │  metrics (JSON)                 │  │
│  │           └───────┬────────┘                                 │  │
│  │                   │                                          │  │
│  │  ┌────────────────┼──────────────────────────────────┐      │  │
│  │  │ Flask Routes   │                                   │      │  │
│  │  │ GET /          │ → index.html (static)             │      │  │
│  │  │ POST /api/mode │ → 시나리오 전환                    │      │  │
│  │  │ POST /api/register_face → 얼굴 등록                │      │  │
│  │  │ POST /api/engine_off → 시동 OFF 트리거             │      │  │
│  │  │ POST /api/blindspot_event → 사각지대 이벤트 수신    │      │  │
│  │  │ GET /api/events → 이벤트 로그                      │      │  │
│  │  │ GET /api/status → 시스템 상태                      │      │  │
│  │  └────────────────┼──────────────────────────────────┘      │  │
│  └───────────────────┼──────────────────────────────────────────┘  │
│                      │ WebSocket                                    │
│  ┌───────────────────▼──────────────────────────────────────────┐  │
│  │  Static Frontend (HTML + CSS + Vanilla JS + Canvas)          │  │
│  │                                                              │  │
│  │  ┌──────────────┐ ┌───────────────┐ ┌────────────────────┐ │  │
│  │  │ Video Canvas  │ │ Blindspot     │ │ Dashboard Panel    │ │  │
│  │  │ (시나리오①②③)│ │ Canvas (④)   │ │ CPU/MEM/FPS/Latency│ │  │
│  │  │ Frame render  │ │ Ray casting   │ │ SVG gauges         │ │  │
│  │  │ + BB overlay  │ │ + sensor cones│ │ + mini charts      │ │  │
│  │  └──────────────┘ └───────────────┘ └────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌──────────────┐ ┌───────────────┐ ┌────────────────────┐ │  │
│  │  │ Scenario Nav  │ │ Presenter     │ │ Event Log          │ │  │
│  │  │ (Step Wizard) │ │ Guide Panel   │ │ (실시간 스크롤)     │ │  │
│  │  └──────────────┘ └───────────────┘ └────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ Audio Engine (Web Audio API + MP3)                    │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Optional: SafeWay Kids Backend ──────────────────────────────┐  │
│  │  POST /api/v1/edge/events → 이벤트 저장 + FCM 푸시            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 스레드/프로세스 구조

```
Main Process
├── Main Thread: Flask + Socket.IO (eventlet)
│   ├── HTTP 라우트 핸들링
│   └── WebSocket 이벤트 핸들링
│
├── Camera Thread (daemon)
│   ├── OpenCV VideoCapture (30fps)
│   └── latest_frame → frame_queue (maxsize=1)
│
├── Inference Thread (daemon)
│   ├── frame_queue에서 최신 프레임 수신
│   ├── 시나리오별 모델 활성화 맵에 따라 추론
│   ├── 적응형 프레임 스킵 적용
│   └── result → Socket.IO emit (base64 frame + detections + metrics)
│
└── Performance Monitor Thread (daemon)
    ├── psutil로 CPU/메모리 1초 간격 샘플링
    └── metrics → Socket.IO emit
```

### 7.3 데이터 흐름

```
[웹캠] → Camera Thread → frame_queue(1) → Inference Thread
                                              │
                    ┌─────────────────────────┤
                    │ 시나리오 ①              │ 시나리오 ②          │ 시나리오 ③
                    │                         │                      │
                    ▼                         ▼                      ▼
            MediaPipe FaceDetect     YOLOv8n ONNX (person)     YOLOv8n ONNX (person)
                    │                         │                      │
                    ▼                         ▼                      │
            ArcFace ONNX              MediaPipe Pose              Multi-frame
            (512-dim embed)          (상체 랜드마크)                 집계
                    │                         │                      │
                    ▼                         ▼                      ▼
            코사인 유사도 비교         서기/넘어짐 판정          잔류 인원 판정
            (temporal smooth)                 │                      │
                    │                         │                      │
                    └─────────────────────────┤──────────────────────┘
                                              │
                                              ▼
                                    Socket.IO emit({
                                      frame: base64_jpeg,
                                      detections: [...],
                                      metrics: {cpu, mem, fps, latency},
                                      events: [...]
                                    })
                                              │
                                              ▼
                                    [Browser Canvas 렌더링]
```

**시나리오 ④ (사각지대):**
```
[JS Simulation Engine] → Canvas 2D 렌더링 (Python 무관)
         │
         └── 경고 이벤트 발생 시 → POST /api/blindspot_event → [Flask]
```

---

## 8. 인터페이스 (Interfaces)

### 8.1 WebSocket 메시지 (Socket.IO)

**서버 → 클라이언트:**

```javascript
// 프레임 + 감지 결과 (3~5 FPS)
socket.emit('frame', {
  image: 'base64_jpeg_string',   // JPEG base64 (quality 70)
  mode: 'boarding',               // 현재 시나리오
  detections: [{
    type: 'face',                 // 'face' | 'behavior' | 'passenger'
    bbox: [x1, y1, x2, y2],
    label: '김철수',
    confidence: 0.97,
    alert_level: 'normal'        // 'normal' | 'warning' | 'danger'
  }],
  metrics: {
    cpu_percent: 45.2,
    memory_percent: 62.1,
    fps: 4.8,
    inference_ms: 142,
    model_name: 'YOLOv8n + MediaPipe Pose'
  },
  timestamp: '2026-03-27T14:30:00.000Z'
});

// 이벤트 알림 (발생 시)
socket.emit('event', {
  type: 'face_recognized',        // 이벤트 유형
  message: '김철수 원생 탑승 확인',
  details: { student_name: '김철수', confidence: 0.97 },
  timestamp: '2026-03-27T14:30:00.000Z'
});

// 로딩 진행 상태
socket.emit('loading', {
  stage: 'yolov8n',              // 현재 로딩 단계
  progress: 0.6,                 // 0.0 ~ 1.0
  message: 'YOLOv8n ONNX 모델 로딩 중...'
});
```

**클라이언트 → 서버:**

```javascript
// 시나리오 전환
socket.emit('set_mode', { mode: 'transit' });

// 시동 OFF/ON
socket.emit('engine_control', { action: 'off' });

// 얼굴 등록 (REST API 유지 — 파일 기반이므로)
// POST /api/register_face { name: '김철수', angle: 'front' }

// 사각지대 이벤트 (JS → Flask)
// POST /api/blindspot_event { type: 'danger', distance: 0.8, ... }
```

### 8.2 REST API

| Method | Path | Body | Response | 용도 |
|--------|------|------|----------|------|
| GET | `/` | — | index.html | 메인 페이지 |
| POST | `/api/register_face` | `{name, angle}` | `{success, registered}` | 얼굴 등록 |
| DELETE | `/api/faces/{name}` | — | `{success}` | 얼굴 삭제 |
| POST | `/api/blindspot_event` | `{type, distance, angle, confidence}` | `{ok}` | 사각지대 이벤트 수신 |
| GET | `/api/events` | — | `[{time, type, message}]` | 이벤트 로그 |
| GET | `/api/status` | — | `{mode, camera, backend, faces}` | 시스템 상태 |
| POST | `/api/reset` | — | `{ok}` | 데모 리셋 |

### 8.3 시나리오별 모델 맵

| 시나리오 | 활성 모델 | 예상 추론 시간 (ONNX 416) | Python 스레드 CPU |
|----------|----------|--------------------------|------------------|
| ① 승하차 | MediaPipe FaceDetector + ArcFace ONNX | 60~100ms | 사용 |
| ② 이상행동 | YOLOv8n ONNX + MediaPipe Pose | 120~180ms | 사용 |
| ③ 잔류인원 | YOLOv8n ONNX | 80~130ms | 사용 |
| ④ 사각지대 | (없음 — JS 단독) | 0ms (Python) | 미사용 |

---

## 9. 엣지 케이스 (Edge Cases)

| ID | 상황 | 대응 |
|----|------|------|
| EC1 | 웹캠 연결 안 됨 | 에러 메시지 + fallback 영상 자동 재생 (사전 녹화) |
| EC2 | 웹캠 사용 중 분리 | 감지 후 5초 대기 → 자동 재연결 시도 3회 → 실패 시 fallback |
| EC3 | 모델 로드 실패 | 해당 시나리오 비활성화 + 에러 표시. 나머지 시나리오는 정상 동작 |
| EC4 | ArcFace ONNX 파일 없음 | facenet-pytorch fallback 자동 전환 |
| EC5 | 백엔드 미실행 | standalone 모드 자동 전환. UI에 "오프라인 모드" 표시 |
| EC6 | 얼굴 미감지 (등록 시) | "얼굴이 감지되지 않습니다. 카메라를 정면으로 봐주세요" 가이드 |
| EC7 | 등록 품질 미달 | "얼굴이 너무 작습니다" / "밝기가 부족합니다" 구체적 피드백 |
| EC8 | 다인 동시 감지 | 모든 감지된 얼굴에 대해 순차 인식. 가장 큰 얼굴 우선 |
| EC9 | i5 성능 부족 (200ms 초과) | Graceful degradation: 입력을 320×320으로 자동 축소 + 프레임 스킵 증가 |
| EC10 | 브라우저 새로고침 | Socket.IO 자동 재연결. 상태 동기화 |
| EC11 | 장시간 가동 메모리 누수 | Frame queue maxsize=1로 메모리 제한. 이벤트 로그 100개 제한 |
| EC12 | 오디오 자동재생 차단 | "데모 시작" 버튼 클릭으로 AudioContext 활성화 |
| EC13 | 마스크 + 모자 동시 착용 | 감지 자체 실패 가능. "얼굴을 잘 보이도록 해주세요" 안내 |
| EC14 | 프로젝터 해상도 변경 | 반응형 CSS. 1024×768 ~ 1920×1080 대응 |
| EC15 | 사각지대 시나리오 중 Python 부하 없음 | ④ 진입 시 Python 추론 완전 정지 → CPU 여유 |

---

## 10. 실패 처리 (Failure Handling)

### 10.1 Graceful Degradation 전략

```
┌─────────────────────────────────────────────────────────┐
│ Level 0: 정상                                            │
│ ONNX 416×416, 추론 <200ms, 5fps                         │
├─────────────────────────────────────────────────────────┤
│ Level 1: 성능 경고 (추론 >200ms 3회 연속)                │
│ → 입력 320×320으로 자동 축소                              │
│ → 대시보드에 "성능 조정 모드" 표시                         │
├─────────────────────────────────────────────────────────┤
│ Level 2: 성능 위험 (추론 >300ms 5회 연속)                │
│ → 프레임 스킵 3으로 증가 (2fps 추론)                      │
│ → 렌더링은 30fps 유지 (최신 결과 오버레이)                 │
├─────────────────────────────────────────────────────────┤
│ Level 3: 카메라 실패                                     │
│ → 사전 녹화 영상(fallback.mp4) 자동 재생                  │
│ → UI에 "녹화 영상 재생 중" 표시                           │
├─────────────────────────────────────────────────────────┤
│ Level 4: 모델 로드 실패                                  │
│ → 해당 시나리오 비활성화 (나머지 시나리오는 정상)           │
│ → ArcFace 실패 → facenet-pytorch fallback                │
└─────────────────────────────────────────────────────────┘
```

### 10.2 에러 복구

| 에러 유형 | 자동 복구 | 수동 복구 |
|----------|----------|----------|
| 카메라 분리 | 5초 대기 → 3회 재연결 | UI "카메라 재연결" 버튼 |
| Socket.IO 끊김 | 자동 재연결 (exponential backoff) | 브라우저 새로고침 |
| 백엔드 연결 끊김 | standalone 모드 전환 | 자동 (변경 없음) |
| 추론 예외 | 해당 프레임 스킵, 원본 프레임 표시 | — |
| 메모리 초과 | 이벤트 로그 자동 정리 (최근 100개만) | — |

---

## 11. 테스트 전략 (Testing Strategy)

### 11.1 단위 테스트

| 대상 | 테스트 내용 | 방법 |
|------|-----------|------|
| ArcFace 임베딩 | 동일인 유사도 > 0.6, 다른 사람 < 0.3 | 테스트 이미지 5장 + pytest |
| YOLOv8n ONNX 추론 | person 감지 정확도, 추론 시간 | fixture 이미지 + pytest |
| 이상 행동 판정 로직 | 서기/넘어짐/정상 분류 | mock 랜드마크 좌표 + pytest |
| 센서 융합 알고리즘 | 가중 평균 계산, 경고 단계 판정 | 단위 입력 데이터 + pytest |
| 성능 모니터 | CPU/MEM 수집 정상 여부 | psutil mock + pytest |

### 11.2 통합 테스트

| 대상 | 테스트 내용 | 방법 |
|------|-----------|------|
| Flask API | 모든 엔드포인트 응답 확인 | Flask test client + pytest |
| Socket.IO | 프레임 emit/수신 | socketio test client |
| 시나리오 전환 | ①→②→③→④ 전환 시 모델 맵 변경 확인 | 자동화 테스트 |
| 백엔드 연동 | standalone/연동 모드 전환 | mock backend |

### 11.3 데모 검증 (수동)

| 항목 | 방법 | 기준 |
|------|------|------|
| 안면인식 정확도 | 5명 등록, 인당 20회 인식 | 정인식 95% 이상 |
| 이상행동 감지 | 앉기→일어서기 10회 반복 | 감지율 80% 이상 |
| 잔류인원 감지 | 1명 있을 때/없을 때 각 10회 | 감지율 99% 이상 |
| 사각지대 시나리오 | 3개 시나리오 각 3회 자동 재생 | 경고 단계 100% 정확 |
| 연속 가동 | 15분 무중단 실행 | 크래시 0회 |
| 시나리오 빠른 전환 | ①→②→③→④→①→② 반복 | 메모리 누수 없음 |
| 프로젝터 해상도 | 1080p, 720p에서 확인 | UI 깨짐 없음 |

### 11.4 성능 벤치마크

| 지표 | 테스트 방법 | 합격 기준 |
|------|-----------|----------|
| 추론 시간 | 100프레임 평균 (`time.perf_counter`) | P95 < 200ms |
| FPS | 1분간 평균 | ≥ 3 FPS |
| 메모리 | 15분 가동 후 RSS 증가량 | < 100MB 증가 |
| 시작 시간 | cold start → 첫 프레임 표시 | < 30초 |

---

## 12. 롤백 전략 (Rollback Strategy)

| 계층 | 롤백 시나리오 | 방법 |
|------|-------------|------|
| 안면인식 | ArcFace ONNX 실패 | facenet-pytorch 자동 전환 |
| 추론 성능 | 200ms 초과 지속 | 320×320 입력 + 프레임 스킵 증가 |
| UI 프레임워크 | Socket.IO 불안정 | MJPEG fallback (기존 코드 보존) |
| 카메라 | 웹캠 실패 | 사전 녹화 영상 재생 |
| 전체 | 새 코드 전체 실패 | 기존 `edge_ai/main.py` (Flask+MJPEG) 실행 |

---

## 13. 수용 기준 (Acceptance Criteria)

### AC1 — 안면 인식 승하차 (시나리오 ①)
- [ ] 웹캠 앞에 서면 2초 이내에 얼굴 감지 바운딩 박스 표시
- [ ] 다중 각도 등록 (정면/좌/우 3장) 가능
- [ ] 등록 시 품질 게이트 피드백 표시
- [ ] 등록된 얼굴 95% 이상 정확도로 인식 (정면, 적정 조명)
- [ ] 마스크 착용 시 70% 이상 인식
- [ ] 인식 성공 시 "OOO 원생 탑승 확인" + 초록 바운딩 박스 + 토스트 알림
- [ ] 미등록 → "미등록" + 노란 바운딩 박스
- [ ] 5프레임 temporal smoothing 적용
- [ ] 이벤트 로그 기록 + 백엔드 전송 (또는 standalone 로컬 저장)

### AC2 — 운행 중 이상 행동 감지 (시나리오 ②)
- [ ] 일어서기 동작 2초 이내 감지
- [ ] 빨간 바운딩 박스 + "위험: 이동 금지" + 경고음
- [ ] 화면 테두리 빨간 펄스 애니메이션
- [ ] 정상 착석 → 초록 바운딩 박스 + "Normal"
- [ ] 상체 랜드마크 기반 판정 (하체 미사용)
- [ ] 이벤트 로그 기록

### AC3 — 시동 OFF 잔류 인원 감지 (시나리오 ③)
- [ ] "시동 OFF" 클릭 후 multi-frame 스캔
- [ ] 사람 감지 → 빨간 바운딩 박스 + "잔류 인원 감지" + 경보음
- [ ] 미감지 → "ALL CLEAR"
- [ ] 이벤트 백엔드 전송

### AC4 — 사각지대 어린이 감지 (시나리오 ④)
- [ ] Bird's Eye View UI (차량 + LiDAR 360레이 + 초음파 12콘)
- [ ] LiDAR 포인트 클라우드에 노이즈(σ=3cm) + 드롭아웃(2%)
- [ ] 초음파 콘에 노이즈(σ=1cm)
- [ ] 거리별 3단계 경고 (주의 4m / 경고 2.5m / 위험 1.0m)
- [ ] 센서 융합 판정 (LiDAR 0.7 + 초음파 0.3 가중 평균)
- [ ] 위험 시 "차량 이동 금지" 경고 + 경보음
- [ ] 최소 3개 사전 정의 시나리오 자동 재생
- [ ] 마우스 드래그 인터랙티브 모드
- [ ] 센서 상태 패널 (LiDAR/초음파 사양 + 실시간 수치)

### AC5 — 엣지 디바이스 시뮬레이션
- [ ] CPU 사용률, 메모리, 추론 지연시간 실시간 표시
- [ ] FPS 카운터 (미니 라인 차트)
- [ ] "시뮬레이션 대상: NVIDIA Jetson Orin" 표시
- [ ] 시나리오별 활성 모델명 표시

### AC6 — 통합 UX
- [ ] "데모 시작" 스플래시 화면 + 모델 로딩 프로그레스
- [ ] 스텝 위저드 시나리오 네비게이션
- [ ] 시나리오 전환 시 fade + 소개 오버레이 (1.5초)
- [ ] 프레젠터 가이드 패널
- [ ] 데모 리셋 버튼
- [ ] 한국어 UI + 영문 기술 지표
- [ ] 반응형 레이아웃 (1024×768 ~ 1920×1080)
- [ ] 원클릭 실행 (`start.bat`)
- [ ] 15분 이상 연속 가동 무크래시
- [ ] 웹캠 실패 시 fallback 영상 자동 재생

---

## 14. 범위 밖 (Out of Scope)

| 항목 | 이유 |
|------|------|
| 실제 Jetson/LiDAR/초음파 하드웨어 통합 | 하드웨어 미보유 |
| 커스텀 모델 학습 | PoC 범위 초과 |
| 다중 카메라 | 웹캠 1대 제약 |
| 앱스토어 배포 | 별도 팀 담당 |
| 야간 모드 (IR 시뮬레이션) | nice-to-have, 시간 여유 시 |
| Anti-spoofing (위조 방지) | PoC 필수 아님 (향후 계획으로 언급만) |
| 다국어 전환 | 한국어만 필수 |
| ~~데모 영상 녹화~~ | **범위 내로 변경됨** — 섹션 32 참조 |

---

## 15. 코드 영향 맵 (Code Impact Map)

### 15.1 디렉토리 구조

```
edge_ai/                              # 전체 리팩터링
├── main.py                            # Flask + Socket.IO 진입점
├── config.py                          # 설정 (환경변수 기반)
├── requirements.txt                   # 의존성 (PyTorch 제거, ONNX 추가)
├── start.bat                          # Windows 원클릭 실행 스크립트
├── setup_models.py                    # 모델 다운로드 + ONNX 변환 스크립트
│
├── core/                              # AI 엔진 (Python)
│   ├── __init__.py
│   ├── face_recognizer.py             # ArcFace ONNX 기반 얼굴 인식 (신규)
│   ├── face_quality.py                # 등록 품질 게이트 (신규)
│   ├── behavior_detector.py           # 이상 행동 감지 (상체 기반 리팩터링)
│   ├── passenger_detector.py          # 잔류 인원 감지 (ONNX 전환)
│   ├── yolo_inference.py              # YOLOv8n ONNX 추론 래퍼 (신규)
│   ├── performance_monitor.py         # CPU/MEM/FPS 모니터 (신규)
│   └── adaptive_skip.py              # 적응형 프레임 스킵 (신규)
│
├── web/                               # 정적 프론트엔드 (신규)
│   ├── templates/
│   │   └── index.html                 # 메인 데모 페이지
│   └── static/
│       ├── css/
│       │   └── demo.css               # 데모 스타일시트
│       ├── js/
│       │   ├── app.js                 # 메인 앱 로직 + Socket.IO 클라이언트
│       │   ├── video-canvas.js        # 비디오 Canvas 렌더링 + BB 오버레이
│       │   ├── blindspot.js           # 사각지대 시뮬레이션 엔진 + Canvas
│       │   ├── dashboard.js           # 성능 대시보드 (SVG 게이지)
│       │   ├── presenter.js           # 프레젠터 가이드 로직
│       │   └── audio.js              # Web Audio API 경고음
│       ├── audio/
│       │   ├── boarding_confirm.mp3   # "OOO 원생 탑승 확인"
│       │   ├── danger_warning.mp3     # "위험: 이동 금지"
│       │   ├── remaining_alert.mp3    # "잔류 인원 감지"
│       │   └── vehicle_stop.mp3       # "차량 이동을 금지합니다"
│       └── scenarios/
│           ├── rear_approach.json     # 사각지대 시나리오 1: 후방 접근
│           ├── side_blindspot.json    # 사각지대 시나리오 2: 측면 사각지대
│           └── multi_children.json    # 사각지대 시나리오 3: 복수 어린이
│
├── models/                            # AI 모델 파일
│   ├── yolov8n.onnx                   # YOLOv8n ONNX 변환 모델
│   ├── arcface_r100.onnx              # ArcFace 안면인식 모델
│   ├── face_detector.tflite           # MediaPipe 얼굴 감지 (기존)
│   └── pose_landmarker_lite.task      # MediaPipe 포즈 (기존)
│
├── fallback/                          # 데모 안전망
│   └── fallback_video.mp4            # 사전 녹화 영상 (웹캠 실패 시)
│
├── registered_faces/                  # 등록 얼굴 데이터 (런타임 생성)
│   ├── embeddings.json                # {name: [emb_front, emb_left, emb_right]}
│   └── *.jpg                          # 얼굴 크롭 이미지
│
└── tests/                             # 테스트
    ├── test_face_recognizer.py
    ├── test_behavior_detector.py
    ├── test_yolo_inference.py
    ├── test_sensor_fusion.py
    └── fixtures/                      # 테스트용 이미지/데이터
```

### 15.2 변경 범위 요약

| 영역 | 파일 수 | 유형 | 비고 |
|------|---------|------|------|
| core/ | 7 | 신규 3, 리팩터링 3, 이동 1 | AI 엔진 전체 |
| web/ | 10+ | 전체 신규 | 정적 프론트엔드 |
| models/ | 2 | 신규 (다운로드) | ONNX 모델 |
| 루트 | 4 | 리팩터링 3, 신규 1 | main, config, requirements, start.bat |
| tests/ | 5+ | 신규 | 테스트 코드 |
| fallback/ | 1 | 신규 | 녹화 영상 |
| **총계** | **~30** | | |

### 15.3 기존 코드 보존 정책

기존 `edge_ai/main.py`, `face_manager.py`, `behavior_detector.py`, `passenger_detector.py`는 **삭제하지 않고** `edge_ai/_legacy/`로 이동. 전체 실패 시 롤백 가능.

### 15.4 의존성 변경

**제거:**
- `torch`, `torchvision` (1.5GB → 제거)
- `ultralytics` (런타임 의존 제거, export 도구로만 사용)

**추가:**
- `onnxruntime` (~50MB, CPU only)
- `flask-socketio`
- `python-socketio`
- `eventlet`
- `psutil`

**유지:**
- `mediapipe`
- `opencv-python-headless`
- `numpy`
- `Pillow`
- `requests`
- `flask`

**새 requirements.txt:**
```
onnxruntime>=1.16.0
mediapipe>=0.10.0
opencv-python-headless>=4.8.0
flask>=3.0.0
flask-socketio>=5.3.0
python-socketio>=5.10.0
eventlet>=0.35.0
psutil>=5.9.0
requests>=2.31.0
numpy>=1.24.0
Pillow>=10.0.0
```

---

## 16. 센서 시뮬레이션 상세 (도메인 4)

### 16.1 LiDAR 사양 (VLP-16 기반)

| 파라미터 | 값 | PoC 적용 |
|----------|-----|---------|
| 수평 FOV | 360도 | 360레이 (1도 간격) |
| 수직 FOV | ±15도 | 수평면 1채널만 시각화 |
| 최대 거리 | 100m | 15m (시각화 범위) |
| 측정 노이즈 | ±3cm | `gaussian(0, 0.03)` |
| 드롭아웃 | 2% | `random() > 0.02` |
| 회전 속도 | 10Hz | 100ms/업데이트 |

### 16.2 초음파 사양 (12개 센서)

| 파라미터 | 값 |
|----------|-----|
| 빔 폭 | 15도 (반각 7.5도) |
| 최대 거리 | 4m |
| 최소 거리 | 2cm |
| 측정 노이즈 | ±1cm (`gaussian(0, 0.01)`) |
| 샘플링 주기 | 50ms (20Hz) |
| 배치 | 전방 4, 후방 4, 좌측 2, 우측 2 |

### 16.3 차량 모델

| 항목 | 치수 |
|------|------|
| 전폭 (W) | 2.0m |
| 전장 (L) | 7.0m |
| LiDAR 위치 | 지붕 중앙 (0, 0) |
| 초음파 높이 | 범퍼 레벨 (0.5m) |

### 16.4 어린이 객체 모델

| 항목 | 값 |
|------|-----|
| 높이 | 90~130cm |
| 단면 (탑뷰) | 타원 (35cm × 20cm) |
| 이동 속도 | 0.5~1.5 m/s |

### 16.5 경고 단계 (Consensus S7 확정)

| 단계 | 융합 거리 | 시각 | 음향 |
|------|----------|------|------|
| CLEAR | >4m | 초록 테두리 | 없음 |
| CAUTION (주의) | ≤4m | 노란 동심원 펄스 | "띵" 1회 |
| WARNING (경고) | ≤2.5m | 주황 깜빡임(1Hz) | 경고음 반복 |
| DANGER (위험) | ≤1.0m | 빨간 깜빡임(2Hz) + "정지" 오버레이 | 경보음 + 음성 |

### 16.6 센서 융합 공식

```
if LiDAR 감지 AND 초음파 감지:
    distance = lidar_dist × 0.7 + ultra_dist × 0.3
    confidence = 0.95
    source = "FUSION"
elif LiDAR only:
    distance = lidar_dist
    confidence = 0.70
    source = "LIDAR_ONLY"
elif 초음파 only:
    distance = ultra_dist
    confidence = 0.60
    source = "ULTRASONIC_ONLY"
```

### 16.7 사전 정의 시나리오 (JSON 형식)

```json
// rear_approach.json 예시
{
  "name": "후방 접근",
  "description": "어린이가 차량 후방에서 접근하여 위험 구역에 진입",
  "duration_sec": 15,
  "children": [{
    "id": "child_1",
    "start": { "x": 0, "y": -12 },
    "waypoints": [
      { "x": 0, "y": -8, "t": 3 },
      { "x": 0.3, "y": -4, "t": 7 },
      { "x": 0.2, "y": -2, "t": 10 },
      { "x": 0, "y": -0.8, "t": 13 }
    ],
    "speed": 1.0
  }],
  "obstacles": [
    { "type": "parked_car", "x": 3, "y": -5, "w": 1.8, "h": 4.5 }
  ]
}
```

---

## 17. UI 레이아웃 상세

### 17.1 데모 시작 화면 (Landing)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              SafeWay Kids Edge AI                            │
│        어린이 통학차량 AI 안전 시스템                          │
│                                                              │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│   │ 🖥️      │ │ 📹      │ │ 👤      │ │ 📡      │        │
│   │ 엣지    │ │ CCTV    │ │ 안면인식 │ │ 사각지대 │        │
│   │ 컴퓨팅  │ │ 카메라   │ │ 터미널  │ │ 센서    │        │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                              │
│   시스템 상태:                                                │
│   ● 카메라 연결   ● 모델 로드   ○ 백엔드 (오프라인)         │
│                                                              │
│              [ ▶ 데모 시작 ]                                  │
│                                                              │
│   SafeWay Kids (c) 2026 — 규제 샌드박스 기술 검증 데모       │
└──────────────────────────────────────────────────────────────┘
```

### 17.2 시나리오 활성 화면 (메인)

```
┌────────────────────────────────────────────────────────────────────┐
│ SafeWay Kids Edge AI  [LIVE] 00:03:42  [PoC DEMO]  [데모 리셋]    │
├────────────────────────────────────────────────────────────────────┤
│ [① 승하차 안면인식●] → [② 운행중 감시○] → [③ 잔류인원○] → [④ 사각지대○] │
│    안면인식 터미널        CCTV 카메라         CCTV 카메라      LiDAR+초음파   │
├───────────────────────────────┬────────────────────────────────────┤
│                               │  Edge Device Status                │
│   Main Viewport               │  CPU ▓▓▓░ 45%  MEM ▓▓░░ 62%     │
│   (Canvas)                    │  FPS: 4.8  Latency: 142ms        │
│                               │  Model: ArcFace ONNX              │
│   [비디오 프레임 + 오버레이]    │  Target: NVIDIA Jetson Orin      │
│                               ├────────────────────────────────────┤
│                               │  Controls                         │
│                               │  [얼굴 등록: 이름_____ ] [등록]    │
│                               │  등록: 김철수, 이영희              │
│                               ├────────────────────────────────────┤
│                               │  Event Log                        │
│                               │  14:30:05 김철수 탑승 확인 (97%)   │
│                               │  14:30:02 카메라 활성              │
├───────────────────────────────┤  14:30:00 시스템 시작              │
│ Presenter Guide               │                                    │
│ "등록된 원생이 카메라 앞에     │                                    │
│  서면 자동으로 인식됩니다"     │                                    │
└───────────────────────────────┴────────────────────────────────────┘
```

---

## 18. 구현 우선순위

### Milestone 1: 핵심 파이프라인 (ONNX 전환 + Socket.IO)

1. YOLOv8n ONNX 변환 + 추론 래퍼 (`yolo_inference.py`)
2. Flask-SocketIO 기본 설정 + 프레임 전송
3. 적응형 프레임 스킵 (`adaptive_skip.py`)
4. 성능 모니터 (`performance_monitor.py`)
5. 기본 HTML + Canvas 비디오 렌더링

### Milestone 2: 안면 인식 (ArcFace)

6. ArcFace ONNX 래퍼 (`face_recognizer.py`)
7. 얼굴 정렬 (affine transform)
8. 다중 각도 등록 + 품질 게이트
9. Temporal smoothing
10. 마스크 감지 + 동적 threshold

### Milestone 3: 이상 행동 + 잔류 인원

11. 이상 행동 감지 리팩터링 (상체 기반)
12. 잔류 인원 감지 ONNX 전환
13. 시나리오별 모델 활성화 맵

### Milestone 4: 사각지대 시뮬레이션

14. LiDAR 레이 캐스팅 엔진 (JS)
15. 초음파 센서 시뮬레이션 (JS)
16. 센서 융합 알고리즘 (JS)
17. Bird's Eye View Canvas 렌더링
18. 시나리오 JSON 자동 재생 + 인터랙티브 모드

### Milestone 5: 데모 UX 완성

19. 데모 시작 화면 (랜딩)
20. 스텝 위저드 네비게이션
21. 프레젠터 가이드
22. 성능 대시보드 (SVG 게이지)
23. 시각 피드백 시스템 (3단계)
24. 음성 경고 (Web Audio + MP3)
25. 데모 리셋, fallback, 에러 핸들링

### Milestone 6: 통합 검증

26. 단위/통합 테스트
27. 데모 검증 (수동)
28. 성능 벤치마크
29. start.bat + setup_models.py
30. 최종 문서화

---

## 19. 개인정보 보호 설계 (Privacy by Design)

### 19.1 PIA (Privacy Impact Assessment) 요약

| 항목 | 내용 |
|------|------|
| 수집 정보 | 어린이 안면 이미지 (등록 시), 안면 임베딩 벡터 (512-dim float) |
| 수집 목적 | 비접촉 승하차 인증, 잔류 인원 확인 |
| 법적 근거 | 개인정보보호법 제15조(동의), 제23조(민감정보 별도 동의) |
| 정보 주체 | 미성년자 (3~13세) → 법정대리인(보호자) 동의 필수 |
| 위험 등급 | 높음 (미성년자 생체정보) |

### 19.2 데이터 처리 원칙

1. **최소 수집:** 안면 임베딩 벡터(512-dim float)만 저장, **원본 이미지 미보관** (등록 후 즉시 삭제)
2. **암호화:** 임베딩 DB는 AES-256-GCM 암호화, 키는 환경변수로 분리
3. **보관 기간:** 재학 기간 + 30일 후 자동 파기
4. **접근 통제:** 관리자만 등록/삭제 가능, 조회 로그 기록
5. **유출 대응:** 임베딩 벡터는 원본 얼굴 복원 불가 (단방향 변환)

### 19.3 보호자 동의 절차 (데모 UI 포함)

```
[보호자 동의 화면]
┌─────────────────────────────────────────────┐
│  SafeWay Kids 안면인식 동의서                  │
│                                              │
│  수집 목적: 승하차 비접촉 인증                   │
│  수집 항목: 안면 특징 벡터 (원본 이미지 미보관)    │
│  보관 기간: 재학 기간 + 30일                    │
│  파기 방법: 자동 영구 삭제                      │
│                                              │
│  ☑ 위 내용을 확인하고 동의합니다                 │
│  보호자 이름: [________]                       │
│  원생 이름:   [________]                       │
│                                              │
│  [동의 후 얼굴 등록 진행]                       │
└─────────────────────────────────────────────┘
```

### 19.4 개인정보보호법 대응 매핑

| 법 조항 | 요구사항 | 대응 |
|---------|---------|------|
| 제15조 | 수집·이용 동의 | 보호자 동의 UI + 동의 기록 저장 |
| 제23조 | 민감정보 별도 동의 | 생체정보 별도 동의 체크박스 |
| 제21조 | 보유기간 경과 시 파기 | 자동 파기 스케줄러 |
| 제29조 | 안전조치 의무 | AES-256 암호화, 접근 로그 |
| 제34조 | 유출 통지 | 유출 시 72시간 내 통지 절차 |

---

## 20. 하차 인식 시나리오 확장

### 20.1 시나리오 ①-B: 하차 안면인식

기존 시나리오 ①(승차)을 **승차 + 하차**로 확장한다.

**하차 모드 흐름:**
1. 인솔교사/운전기사가 "하차 모드" 버튼 클릭 (또는 정차 시 자동 전환)
2. 웹캠이 하차하는 원생의 얼굴을 인식
3. 승차 명단에서 해당 원생을 **하차 완료**로 체크
4. 학부모에게 "OOO 원생 하차 확인 (14:32)" 푸시 알림 전송
5. 전원 하차 시 → "전원 하차 완료" 표시
6. **미하차 인원** 있으면 → 빨간색 경고 + 미하차 원생 목록 표시

**UI 표현:**
```
┌──────────────────────────────────────┐
│  [하차 모드] 승차 5명 / 하차 3명      │
│                                      │
│  ✅ 김민준  14:30                     │
│  ✅ 이서연  14:31                     │
│  ✅ 박지호  14:32                     │
│  ⬜ 최수아  — 미하차                   │
│  ⬜ 정도윤  — 미하차                   │
│                                      │
│  ⚠️ 미하차 인원 2명                   │
└──────────────────────────────────────┘
```

### 20.2 승하차 대조 로직

| 상태 | 조건 | 동작 |
|------|------|------|
| 정상 하차 | 승차 명단에 있는 원생이 하차 인식됨 | ✅ 체크 + 학부모 푸시 |
| 미하차 경고 | 하차 모드 종료 시 미하차 인원 존재 | 🔴 경고 + 인솔교사/관리자 알림 |
| 미등록 하차 | 승차 명단에 없는 얼굴 하차 감지 | ⚠️ 노란 경고 (오탈승 가능성) |
| 전원 하차 | 승차 인원 = 하차 인원 | 🟢 "전원 하차 완료" |

---

## 21. 비용 분석 및 ROI

### 21.1 차량 1대당 예상 비용

| 항목 | PoC (현재) | 파일럿 (Phase 2) | 상용 (Phase 3) |
|------|-----------|-----------------|---------------|
| 엣지 디바이스 | 0원 (기존 PC) | 70~100만원 (Jetson Orin Nano) | 50~80만원 (양산가) |
| 카메라 (내부+출입구) | 0원 (웹캠) | 20~40만원 (산업용 2대) | 15~30만원 |
| 센서 (초음파+LiDAR) | 0원 (시뮬레이션) | 80~120만원 | 60~100만원 |
| 설치비 (공임) | 0원 | 30~50만원 | 20~30만원 |
| **설치 소계** | **0원** | **200~310만원** | **145~240만원** |
| 월 이용료 (SW+클라우드) | 0원 | 10~15만원 | 8~12만원 |

### 21.2 ROI 시뮬레이션 (학원 3대 기준)

| 항목 | 연간 비용 |
|------|----------|
| SafeWay Kids 도입 (3대) | 설치 600~930만원 + 월정액 360~540만원 = **960~1,470만원/년** |
| 인솔교사 인건비 (3명) | 월 150만원 × 3명 × 12개월 = **5,400만원/년** |
| **인솔교사 보조 시 절감** | 인솔교사 2명으로 감축 가능 → **1,800만원/년 절감** |
| **순 절감 효과** | 1,800 - 1,470 = **330~840만원/년** |

### 21.3 사회적 비용 절감

| 항목 | 금액 | 출처 |
|------|------|------|
| 어린이 통학차량 사망사고 1건 사회적 비용 | 약 5억원 | 보험연구원 (2023) |
| 어린이 통학차량 중상 사고 1건 | 약 1~2억원 | 교통안전공단 |
| 연간 어린이 통학차량 사고 건수 | 약 200건 | 도로교통공단 통계 |
| **AI 시스템으로 30% 사고 감소 시** | **연간 300~600억원 사회적 비용 절감** | 추정 |

---

## 22. 성능 검증 프로토콜

### 22.1 안면인식 벤치마크 (NIST FRVT 참조)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| TAR@FAR=0.01 | ≥ 95% | 등록 5명 각 20회(100회) + 미등록 5명 20회(100회) |
| FAR (False Acceptance Rate) | ≤ 1% | 미등록 얼굴이 등록자로 인식되는 비율 |
| FRR (False Rejection Rate) | ≤ 5% | 등록 얼굴이 미인식되는 비율 |
| 마스크 착용 TAR | ≥ 70% | 마스크 착용 상태에서 동일 테스트 |
| 인식 속도 | ≤ 100ms/face | 감지~인식 완료 시간 |

### 22.2 End-to-End 파이프라인 타이밍 다이어그램

```
시나리오 ②(이상행동) 기준:
[캡처]→[전처리]→[YOLOv8n ONNX]→[후처리]→[Pose분석]→[판정]→[렌더링]
 5ms     3ms      80~130ms       2ms     20~30ms    1ms    10ms
총 E2E: 121~181ms (목표 200ms 이하) ✅

시나리오 ①(안면인식) 기준:
[캡처]→[전처리]→[FaceDetect]→[정렬]→[ArcFace ONNX]→[매칭]→[렌더링]
 5ms     3ms     15~25ms      3ms     30~50ms       2ms    10ms
총 E2E: 68~98ms (목표 100ms 이하) ✅
```

### 22.3 벤치마크 테스트 계획

| ID | 내용 | 횟수 | 합격 기준 |
|----|------|------|----------|
| BM-1 | YOLOv8n ONNX 추론 (416×416) | 100회 | P95 ≤ 150ms |
| BM-2 | ArcFace ONNX 추론 | 100회 | P95 ≤ 60ms |
| BM-3 | MediaPipe Pose 추론 | 100회 | P95 ≤ 35ms |
| BM-4 | 안면인식 TAR@FAR=0.01 | 200회 | ≥ 95% |
| BM-5 | 10분 연속 가동 메모리 누수 | 1회 | 증가 ≤ 50MB |
| BM-6 | 사각지대 시뮬레이션 FPS | 60초 | ≥ 30fps |

---

## 23. 상용화 로드맵

### Phase 1: PoC 검증 (현재, 2026 Q2)
- **목표:** 규제 샌드박스 심사 통과
- **하드웨어:** Windows i5 PC + USB 웹캠
- **센서:** 소프트웨어 시뮬레이션
- **대상:** 심사위원 데모

### Phase 2: 파일럿 (2026 Q3~Q4)
- **목표:** 실차 5대 장착, 현장 검증 3개월
- **하드웨어:** NVIDIA Jetson Orin Nano
- **카메라:** 산업용 광각 2대 (내부 + 출입구)
- **센서:** 초음파 8개 + 단채널 LiDAR
- **대상:** 협력 학원 2~3곳
- **기술 포인트:** HAL 전환 (CPU→Jetson), 실센서 드라이버

### Phase 3: 상용 서비스 (2027)
- **목표:** 전국 학원 500대
- **하드웨어:** 커스텀 엣지 보드 (양산)
- **인프라:** K8s 클라우드, Fleet 관리 대시보드

### 마이그레이션 포인트
```
Phase 1 (PoC)         Phase 2 (Pilot)        Phase 3 (Production)
CPU (i5)         →   Jetson Orin Nano   →   Custom Edge Board
웹캠             →   산업용 카메라       →   OEM 카메라
시뮬레이션 센서   →   실제 초음파+LiDAR  →   차량 전용 패키지
Flask 단독       →   Flask + MQTT       →   K8s + gRPC
로컬 DB          →   SQLite + Sync      →   PostgreSQL Cloud
```

---

## 24. HAL (Hardware Abstraction Layer)

### 24.1 추상 인터페이스
```python
class InferenceBackend:
    """추론 백엔드 추상 인터페이스."""
    def load_model(self, model_path: str) -> None: ...
    def infer(self, input_data) -> Any: ...
    def get_device_info(self) -> dict: ...

class CPUBackend(InferenceBackend):
    """PoC용 CPU 백엔드 (ONNX Runtime)."""
    pass

class JetsonBackend(InferenceBackend):
    """파일럿용 Jetson 백엔드 (TensorRT)."""
    pass

class SensorInterface:
    """센서 추상 인터페이스."""
    def read(self) -> dict: ...

class SimulatedSensor(SensorInterface):
    """PoC용 시뮬레이션 센서."""
    pass

class UltrasonicSensor(SensorInterface):
    """실제 초음파 센서 (Phase 2)."""
    pass
```

### 24.2 백엔드 전환 (환경변수)

| 환경변수 | 값 | 동작 |
|---------|-----|------|
| `EDGE_BACKEND` | `cpu` (기본) | ONNX Runtime CPU 추론 |
| `EDGE_BACKEND` | `jetson` | TensorRT GPU 추론 |
| `EDGE_SENSOR_MODE` | `simulation` (기본) | 가상 센서 데이터 |
| `EDGE_SENSOR_MODE` | `hardware` | 실제 센서 드라이버 |

### 24.3 Jetson 전환 시 예상 성능

| 모델 | i5 CPU (ONNX) | Jetson Orin Nano (TensorRT) | 개선율 |
|------|-------------|---------------------------|--------|
| YOLOv8n | 80~130ms | 8~15ms | 8~10x |
| ArcFace | 30~50ms | 5~10ms | 5~6x |
| MediaPipe Pose | 20~30ms | 5~8ms | 3~4x |
| **총 FPS** | **3~5** | **25~40** | **7~8x** |

---

## 25. 운행 모드 자동 전환

### 25.1 모드 상태 다이어그램
```
[승차 BOARDING] → [운행 TRANSIT] → [하차 ALIGHTING] → [하차후 POST_TRIP]
      ↑                                                       │
      └───────────────────────────────────────────────────────┘
```

### 25.2 모드별 AI 모듈 활성화

| 모드 | 안면인식 | 이상행동 | 잔류인원 | 사각지대 |
|------|---------|---------|---------|---------|
| 승차 (BOARDING) | ✅ | ❌ | ❌ | ✅ |
| 운행 (TRANSIT) | ❌ | ✅ | ❌ | ❌ |
| 하차 (ALIGHTING) | ✅ | ❌ | ❌ | ✅ |
| 하차후 (POST_TRIP) | ❌ | ❌ | ✅ | ❌ |

### 25.3 정차 중 이상행동 예외
- **운행 중(속도 > 0):** 서 있으면 위험 → 경고
- **정차 중(속도 = 0):** 서 있는 것은 정상 → 비활성화
- **PoC:** 모드 전환 버튼으로 구현. 향후 GPS/OBD 자동 판별

---

## 26. 거짓 경고 억제 메커니즘

### 26.1 다층 필터링
```
[Raw Detection] → [Confidence ≥0.6] → [Duration ≥2초] → [10프레임 Majority] → [Alert]
```

### 26.2 필터 상세

| 필터 | 파라미터 | 설명 |
|------|---------|------|
| Confidence | ≥ 0.6 | 낮은 신뢰도 무시 |
| Duration | ≥ 2초 (6~10프레임) | 순간 오감지 무시 |
| Temporal Smoothing | 10프레임 중 7+ 감지 | Majority voting |
| Cooldown | 동일 유형 5초 간격 | 반복 경고 방지 |
| Mode Filter | 정차 중 standing 무시 | 운행 모드만 경고 |

### 26.3 거짓 경고율 목표

| 시나리오 | FPR 목표 | 측정 |
|---------|---------|------|
| 이상행동 | ≤ 5% | 정상 착석 10분 중 거짓 경고 수 |
| 잔류인원 | ≤ 1% | 빈 차량 10회 스캔 중 거짓 감지 |
| 사각지대 | ≤ 3% | 빈 영역 시나리오 10회 중 거짓 감지 |

---

## 27. 현장 전용 UI

### 27.1 인솔교사 뷰
- 큰 버튼 3개 (승차/운행/하차) — 터치 친화적
- 경고 시 전체 화면 빨간색 플래시 + 경고음
- 승하차 명단 실시간 체크리스트
- 데모에서 "현장 UI 프리뷰" 탭으로 시연

### 27.2 운전기사 뷰
- **최소 정보만** 표시 (운전 방해 최소화)
- 상태 LED: 🟢 정상 / 🟡 주의 / 🔴 위험
- 경고 시 **음성 안내만** (화면 확인 불필요)
- 예: "경고: 3번째 줄 원생이 일어섰습니다"

---

## 28. Human Fallback (AI 장애 시 수동 절차)

### 28.1 장애 감지 조건
- 카메라 프레임 5초 이상 미수신
- AI 추론 시간 5초 이상
- 메모리 사용률 95% 이상
- 3회 연속 추론 실패

### 28.2 장애 시 동작
1. UI: "수동 확인 모드로 전환되었습니다" 표시
2. 인솔교사 뷰: 수동 출석 체크리스트 표시
3. 운전기사: "AI 시스템 점검 중, 잔류인원 직접 확인 필요" 음성
4. 학부모 앱: "현재 수동 확인 모드입니다" 알림
5. 관리자: 장애 알림 전송

### 28.3 복구
- AI 정상 복구 감지 시 자동 전환
- 장애 이력 로그 기록

---

## 29. 행정 시스템 연동

### 29.1 운행일지 자동 생성
- 일자, 노선, 운전기사, 인솔교사
- 탑승/하차 인원 명단 (안면인식 기반)
- 안전 이벤트 이력 (이상행동, 잔류인원 등)
- 운행 시간 (출발~도착)

### 29.2 내보내기 형식
- **CSV:** 엑셀 호환, 행정 보고서용
- **PDF:** 서명 가능한 공식 운행일지
- **JSON API:** e-안전관리시스템 연동용 (Phase 3)

---

## 30. 알림 다중 채널

### 30.1 전송 흐름
```
[이벤트] → 1차 앱 푸시(FCM) → 실패 시 → 2차 SMS → 실패 시 → 3차 카카오 알림톡
```

### 30.2 알림 유형별 채널

| 알림 유형 | 1차 | 2차 | 3차 |
|----------|-----|-----|-----|
| 승하차 확인 | 앱 푸시 | - | - |
| 이상행동/잔류인원 | 앱 푸시 | SMS | 카카오 알림톡 |
| 시스템 장애 | 앱 푸시 | SMS | 카카오 알림톡 |

---

## 31. 규제 특례 요청 목록

| # | 특례 내용 | 현행 규제 | 안전 장치 |
|---|---------|----------|----------|
| 1 | 어린이 안면 생체정보 수집·처리 | 개인정보보호법 제23조 | 보호자 동의, 임베딩만 저장, AES-256, PIA |
| 2 | 차량 내 AI 영상 분석 | 개인정보보호법 제25조 | 안전 목적 한정, 영상 미저장, 실시간 분석만 |
| 3 | AI 승하차 기록의 법적 출석 효력 | 인솔교사 수기 확인 의무 | AI + 인솔교사 이중 확인, Human Fallback |

**남용 방지:** 목적 외 사용 금지, 영상 즉시 폐기, 감사 로그, 연 1회 PIA, 동의 철회 시 7일 내 삭제

**특례 기간:** 2년 (연장 가능), 파일럿 5대 + 학원 3곳, 분기별 보고

---

## 32. 데모 영상 녹화 계획

### 32.1 영상 구성 (총 5~7분)

| 순서 | 시나리오 | 시간 | 내용 |
|------|---------|------|------|
| 0 | 인트로 | 30초 | SafeWay Kids 소개, 4개 도메인 인포그래픽 |
| 1 | ① 승차 안면인식 | 60초 | 등록 → 인식 → 학부모 푸시 |
| 2 | ①-B 하차 안면인식 | 30초 | 하차 인식 → 미하차 경고 |
| 3 | ② 이상행동 감지 | 60초 | 정상 착석 → 일어섬 → 경고 |
| 4 | ③ 잔류인원 감지 | 60초 | 시동 OFF → 감지 → 경보 |
| 5 | ④ 사각지대 감지 | 60초 | BEV → 접근 → 3단계 경고 |
| 6 | 성능 대시보드 | 30초 | CPU/FPS/추론시간 실시간 |
| 7 | 마무리 | 30초 | 요약, 로드맵, 연락처 |

### 32.2 편집 요소
- **자막:** 한국어 시나리오 설명
- **인포그래픽:** 시나리오 시작 시 도메인-하드웨어 매핑 표시
- **성능 지표:** 추론 시간, FPS 오버레이
- **배경음악:** 기업 PR용 저작권 프리 음악

---

## 부록 A: Consensus Matrix 반영 추적

| Consensus ID | 내용 | 본 문서 반영 위치 |
|-------------|------|------------------|
| P1 | ONNX Runtime 기본 | FR1.1, 의존성 변경 |
| P2 | 입력 416×416 | FR1.3, NFR1 |
| P3 | 적응형 프레임 스킵 | FR1.4, EC9 |
| P4 | 시나리오별 모델 맵 | FR1.5, 8.3 |
| P5 | warm-up | FR1.6, EC12 |
| F1 | ArcFace 512-dim | FR2.1 |
| F2 | 다중 각도 등록 | FR2.4 |
| F3 | 품질 게이트 | FR2.5 |
| F4 | CLAHE + 화이트밸런스 | FR2.6 |
| F5 | Temporal smoothing | FR2.7 |
| S1 | VLP-16 사양 | FR5.1, 16.1 |
| S2 | 12개 초음파 | FR5.2, 16.2 |
| S3 | 노이즈 모델 | FR5.1, FR5.2 |
| S4 | 규칙 기반 융합 | FR5.5, 16.6 |
| S5 | 차량 2.0×7.0m | FR5.3, 16.3 |
| S6 | 어린이 90~130cm | FR5.7, 16.4 |
| S7 | 경고 4/2.5/1.0m | FR5.6, 16.5 |
| S8 | 3개 시나리오 | FR5.8, 16.7 |
| U1 | 스텝 위저드 | FR6.1 |
| U2 | 프레젠터 가이드 | FR6.2 |
| U3 | Fallback | FR6.3, EC1 |
| U4 | 데모 리셋 | FR6.4 |
| U5 | 로딩 스플래시 | FR6.5 |
| U6 | 한국어 + 영문 병기 | FR6.6 |
| U7 | 성능 대시보드 | FR6.7 |

## 부록 B: Open Questions 해소 추적

| Q ID | 질문 | 결정 | 근거 |
|------|------|------|------|
| Q1 | 안면인식 라이브러리 | ArcFace ONNX (fallback: facenet-pytorch) | R2 추천, 전원 합의 |
| Q2 | 사각지대 아키텍처 | JS 프론트엔드 단독 | R3, R4 합의 |
| Q3 | 수동 vs 자동 시나리오 | 둘 다 (자동 기본, 수동 옵션) | R3, R4 합의 |
| Q4 | UI 프레임워크 | Flask + Socket.IO + Vanilla JS | R1, R4 합의 |
| Q5 | 야간 모드 | Out of scope (nice-to-have) | 전원 합의 |
| Q6 | 음성 경고 | Web Audio API + MP3 | R4 제안 채택 |
| Q7 | Standalone 모드 | 기본 모드. 백엔드 자동 감지 | R1, R4 합의 |
| Q8 | 심사일 | 미확정, 추가 자료 보강하여 제출 | 사용자 확인 |
| Q9 | 시연 형태 | **대표가 직접 시연** | 사용자 확인 |
| Q10 | 영상 녹화 | **녹화본도 함께 제출** | 사용자 확인 → 섹션 32 추가 |
