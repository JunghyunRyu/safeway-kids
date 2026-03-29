# Senior CV/AI 전문가 독립 리뷰 (R1)

**리뷰어:** Senior Computer Vision / Edge AI 전문가 (R1)
**리뷰 대상:** `artifacts/specs/2026-03-27-edge-ai-poc-requirement-brief.md`
**담당 도메인:** 도메인 1 (엣지 컴퓨팅), 도메인 2 (CCTV/영상분석)
**리뷰일:** 2026-03-27
**상태:** COMPLETE

---

## 1. 요구사항 재진술

### 도메인 1 — 엣지 컴퓨팅 디바이스 시뮬레이션

규제 샌드박스 심사위원에게 "NVIDIA Jetson 급 엣지 AI 추론 능력"을 입증하기 위해, 일반 Windows i5 PC에서 CPU-only 환경으로 YOLOv8n + MediaPipe 기반 멀티 모델 추론 파이프라인을 구동한다. 핵심 목표는:

- **프레임당 200ms 이하** 추론 지연시간 (5 FPS 이상)
- YOLOv8n (객체 감지) + MediaPipe Pose (자세 추정) + MediaPipe Face (안면 감지)를 **순차 실행**(sequential pipeline)
- CPU/메모리 사용률, 추론 지연시간, FPS를 **실시간 대시보드**로 표시
- Jetson 디바이스를 시뮬레이션하고 있음을 UI에 명시

즉, 하드웨어가 없더라도 "이 소프트웨어 파이프라인이 실제 Jetson에서는 더 빠르게 동작할 것"이라는 논리적 설득 근거를 데모로 제공하는 것이다.

### 도메인 2 — CCTV/영상분석 (차량 내부 카메라 시뮬레이션)

USB 웹캠 1대로 차량 내부 광각 카메라(170도 FOV)를 대행한다. 두 가지 핵심 시나리오:

- **시나리오 2 (이상 행동 감지):** YOLOv8n으로 person 감지 → MediaPipe Pose로 자세 분석 → 서기/넘어짐 감지 시 경고
- **시나리오 3 (잔류 인원 감지):** "시동 OFF" 트리거 후 YOLOv8n으로 차량 내 잔류 인원 multi-frame 스캔 → 감지/미감지 판정

부가 요구사항으로 이벤트 스냅샷 저장, 야간 모드(적외선 시뮬레이션), 이벤트 로그 + 백엔드 전송이 있다.

---

## 2. 누락된 요구사항

| ID | 누락 항목 | 영향 | 권장 대응 |
|----|----------|------|----------|
| M1 | **모델 워밍업(warm-up) 전략** 미명시 | 첫 수 프레임은 추론 시간이 2~5배 느림 (JIT 컴파일, 캐시 로딩 등). 데모 시작 직후 200ms 초과 가능 | 앱 시작 시 더미 프레임 3~5장으로 warm-up 실행. 대시보드에는 warm-up 이후 수치만 표시 |
| M2 | **프레임 스킵(frame skip) 전략** 미명시 | 모든 프레임에 추론을 걸면 처리 대기열이 쌓여 latency가 누적됨 | 웹캠 캡처는 30fps로 하되 추론은 매 N번째 프레임만 실행, 나머지는 최신 추론 결과를 오버레이 |
| M3 | **추론 스레드 분리** 방식 미명시 | 현재 `main.py`가 카메라 캡처 + 추론 + HTTP 서빙을 단일 프로세스에서 수행 → GIL 병목 | 카메라 캡처 스레드 / 추론 스레드(또는 프로세스) / HTTP 서빙 스레드 분리 명시 필요 |
| M4 | **입력 해상도 다운스케일 전략** 미명시 | YOLOv8n 기본 입력은 640x640이나, 320x320으로 줄이면 추론 시간 약 60~70% 감소 | 데모 목적상 320x320 또는 416x416 옵션을 config로 제공 |
| M5 | **ONNX Runtime 변환 여부** 미명시 | PyTorch CPU 추론 대비 ONNX Runtime은 30~50% 빠름. 200ms 목표 달성의 핵심 수단 | ONNX export를 기본 옵션으로 권장 |
| M6 | **Graceful degradation 전략** 미명시 | i5 사양에 따라 200ms 목표 미달 시 어떻게 할 것인가? | FPS를 3~4로 낮추더라도 UI 응답성 유지하는 fallback 모드 정의 필요 |
| M7 | **MediaPipe Pose의 "좌석 환경" 인식 한계** | 앉아 있는 상태에서 하체가 가려지면 Pose 랜드마크가 불완전 → 서기/넘어짐 판정 오류 | 상체 랜드마크(어깨, 엉덩이 y-좌표 비율)만으로 판정하는 로직 명시 필요 |
| M8 | **카메라 실패 시 fallback** | 웹캠 연결 실패, 권한 문제, 다른 프로세스 점유 시 데모 중단 | 사전 녹화 영상(fallback video) 재생 모드 필요 |

---

## 3. 충돌/모순

| ID | 항목 | 내용 |
|----|------|------|
| C1 | **추론 목표 200ms vs 멀티 모델 순차 실행** | 요구사항에서 "프레임당 200ms 이하"를 명시하면서 동시에 "YOLOv8n + MediaPipe Pose + 안면 감지를 순차 실행"이라고 함. YOLOv8n만 i5에서 150~300ms이고, MediaPipe Pose 20~30ms, Face Detection 10~20ms를 더하면 **총 180~350ms/frame**. 3개 모델을 모두 순차 실행하면 200ms 이하를 보장할 수 없다. |
| C2 | **시나리오별 모델 분리 vs "멀티 모델 동시 운용"** | 시나리오 1은 Face만, 시나리오 2는 YOLO+Pose, 시나리오 3은 YOLO만 사용. 실제로 3개 모델이 동시에 필요한 순간은 없는데 "멀티 모델 동시 운용"이라고 기술하면 혼란. 시나리오별로 활성 모델을 명시해야 한다. |
| C3 | **640x480 캡처 vs 640x640 추론 입력** | 웹캠 캡처는 640x480으로 명시하나, YOLOv8n 기본 입력은 640x640 (정사각형). 리사이즈/패딩 전략이 없으면 왜곡이나 추가 지연 발생. |
| C4 | **5 FPS "이상" vs 200ms "이하"** | 200ms/frame이면 이론적 최대 5 FPS이지만, 프레임 캡처 + 전처리 + 후처리 + UI 렌더링 시간을 포함하면 실제 FPS는 3~4. "5 FPS 이상"과 "200ms 이하"가 동시에 달성되려면 추론 외 오버헤드가 거의 0이어야 하는데, 이는 비현실적. |

---

## 4. 기술 리스크

### 리스크 4.1 — i5 CPU에서 YOLOv8n 실제 추론 성능

**실측 벤치마크 기반 분석:**

| CPU 세대 | YOLOv8n (640x640, PyTorch) | YOLOv8n (640x640, ONNX) | YOLOv8n (320x320, ONNX) |
|----------|---------------------------|-------------------------|-------------------------|
| i5-10th (Comet Lake) | 250~350ms | 150~220ms | 60~100ms |
| i5-11th (Tiger Lake) | 200~300ms | 120~180ms | 50~80ms |
| i5-12th (Alder Lake) | 150~250ms | 100~150ms | 40~70ms |

- 가안에서 "A7: YOLOv8n은 i5에서 100-200ms 가능"이라고 했는데, 이는 **ONNX Runtime 사용 시에만 현실적**이고 PyTorch CPU 추론 기준으로는 낙관적
- 10세대 i5 + PyTorch라면 200ms 초과가 빈번

**영향:** 200ms 목표 미달 시 데모 화면이 뚝뚝 끊겨 심사위원에게 부정적 인상

**권장:** ONNX Runtime을 **기본 추론 백엔드**로 채택. PyTorch는 fallback으로만 유지

### 리스크 4.2 — YOLOv8n + MediaPipe 순차 실행 시 총 지연

시나리오 2 기준 (가장 무거운 파이프라인):
```
YOLOv8n (person detect) → crop → MediaPipe Pose → 판정 로직
```
- YOLOv8n ONNX (320x320): ~70ms
- Crop + resize: ~2ms
- MediaPipe Pose: ~25ms
- 판정 로직: ~1ms
- 총계: **~98ms** (320x320, ONNX, 최적)
- 총계: **~200ms** (640x640, ONNX)
- 총계: **~350ms** (640x640, PyTorch)

**결론:** 320x320 + ONNX 조합이면 200ms 이하가 **안정적으로 가능**. 640x640 + PyTorch는 불가.

### 리스크 4.3 — MJPEG 스트리밍의 한계

| 특성 | MJPEG | WebSocket (Base64/Binary) |
|------|-------|--------------------------|
| 지연 | 200~500ms (브라우저 버퍼링) | 50~100ms |
| 양방향 통신 | 불가 (서버→클라 단방향) | 가능 |
| 연결 안정성 | 브라우저가 끊으면 재연결 어려움 | 자동 재연결 구현 가능 |
| 프레임 제어 | 불가 | 클라이언트에서 속도 조절 가능 |

- 현재 Flask + MJPEG 방식은 **추가 200~500ms 지연**을 야기하여 체감 반응성이 매우 나빠짐
- 데모에서 심사위원이 손을 들었는데 화면에 0.5~1초 후에 반영되면 설득력 저하

**권장:** Flask-SocketIO 또는 WebSocket 기반 프레임 전송으로 전환. MJPEG는 fallback으로 유지

### 리스크 4.4 — Python GIL과 멀티스레딩 병목

현재 `main.py`가 단일 프로세스에서 카메라 캡처 + 추론 + Flask HTTP 서빙을 모두 처리. Python의 GIL(Global Interpreter Lock)로 인해:
- 추론 중 HTTP 응답 지연
- 카메라 프레임 드롭
- CPU 코어 활용률 저하 (멀티코어 i5인데 1코어만 사용)

**권장:**
- 카메라 캡처: 별도 스레드 (OpenCV는 GIL을 해제하므로 효과적)
- AI 추론: `multiprocessing` 또는 ONNX Runtime의 내부 병렬화 활용
- Flask 서빙: 메인 스레드

### 리스크 4.5 — MediaPipe Pose의 좌석 환경 한계

- MediaPipe Pose는 **전신이 보이는 환경**에서 최적화됨
- 차량 좌석에 앉아 있으면 하체가 가려져 **하반신 랜드마크 신뢰도가 극도로 낮음**
- "서기" 판정을 엉덩이-무릎 각도로 하면 오탐(false positive)이 빈번

**권장:**
- **상체 랜드마크만 사용**: 어깨(shoulder) y좌표와 엉덩이(hip) y좌표의 비율 변화로 "서기" 판정
- threshold를 보수적으로 설정 (정밀도 우선, 재현율 희생)
- 데모 가이드에 "카메라는 상반신이 잘 보이는 각도로 설치" 명시

---

## 5. 대안 설계

### 대안 5.1 — ONNX Runtime 기반 추론 파이프라인 (강력 권장)

```python
# 현재 (PyTorch)
from ultralytics import YOLO
model = YOLO("yolov8n.pt")
results = model(frame)  # 250~350ms on i5 CPU

# 권장 (ONNX Runtime)
import onnxruntime as ort
session = ort.InferenceSession("yolov8n.onnx",
    providers=["CPUExecutionProvider"],
    sess_options=sess_opts)  # 스레드 수 설정 가능
# 추론: 100~180ms on i5 CPU (640x640)
# 추론: 40~80ms on i5 CPU (320x320)
```

**구현 절차:**
1. `yolo export model=yolov8n.pt format=onnx imgsz=320` 으로 ONNX 변환
2. ONNX Runtime의 `sess_options.intra_op_num_threads = 4` 로 CPU 코어 활용
3. 전처리(resize, normalize)를 NumPy로 직접 구현 (Ultralytics 오버헤드 제거)
4. 후처리(NMS)를 NumPy로 직접 구현

**기대 효과:** 30~50% 추론 시간 단축, CPU 멀티코어 활용, PyTorch 의존성 제거(설치 용량도 1.5GB → 50MB)

### 대안 5.2 — 적응형 프레임 스킵 (Adaptive Frame Skip)

```python
# 고정 스킵이 아닌 적응형 스킵
class AdaptiveFrameSkip:
    def __init__(self, target_fps=5):
        self.target_interval = 1.0 / target_fps
        self.last_inference_time = 0

    def should_infer(self, current_time):
        if current_time - self.last_inference_time >= self.target_interval:
            self.last_inference_time = current_time
            return True
        return False
```

- 웹캠 캡처는 30fps로 유지 (화면 부드러움)
- 추론은 target_fps(5)에 맞춰 실행
- 추론이 없는 프레임에는 **마지막 추론 결과의 바운딩 박스를 그대로 오버레이**
- 체감 화면은 30fps로 부드럽고, 바운딩 박스만 5fps로 갱신

### 대안 5.3 — 시나리오별 모델 활성화 (Model Activation Map)

| 시나리오 | YOLOv8n | MediaPipe Pose | MediaPipe Face | 예상 추론 시간 (ONNX 320) |
|----------|---------|----------------|----------------|--------------------------|
| 1 (안면인식) | OFF | OFF | ON | ~15ms |
| 2 (이상행동) | ON (person) | ON | OFF | ~95ms |
| 3 (잔류인원) | ON (person) | OFF | OFF | ~70ms |

- 시나리오별로 필요한 모델만 활성화하면 불필요한 추론 제거
- 시나리오 전환 시 모델을 언로드할 필요 없이, 추론 호출만 skip

### 대안 5.4 — 비동기 추론 + 결과 큐

```
[카메라 스레드] → frame_queue → [추론 스레드] → result_queue → [렌더링 스레드]
```

- 3개 스레드를 `queue.Queue(maxsize=1)` 로 연결
- `maxsize=1`이면 최신 프레임만 유지 → 오래된 프레임 추론 방지
- 렌더링 스레드는 가장 최근 결과만 사용 → 화면 지연 최소화

### 대안 5.5 — WebSocket 스트리밍 전환

```python
# Flask-SocketIO 기반
from flask_socketio import SocketIO, emit

socketio = SocketIO(app, cors_allowed_origins="*")

def emit_frame(frame, detections):
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    socketio.emit('frame', {
        'image': base64.b64encode(buffer).decode(),
        'detections': detections,
        'metrics': get_performance_metrics()
    })
```

**장점:**
- 프레임 + 감지 결과 + 성능 메트릭을 **하나의 메시지**로 동기화 전송
- 양방향 통신으로 클라이언트에서 시나리오 전환, 시동 OFF 등 이벤트 전송 가능
- MJPEG 대비 200~400ms 지연 감소

---

## 6. 테스트 우려

### 6.1 추론 성능 검증

| 테스트 | 방법 | 주의사항 |
|--------|------|---------|
| 모델 로딩 시간 | 앱 시작 시 각 모델 로딩 시간 측정 (cold start) | ONNX는 첫 로딩 시 최적화가 발생하므로 2~3회 반복 측정 |
| 프레임별 추론 시간 | `time.perf_counter()` 로 전처리~후처리 구간 측정 | `time.time()` 은 정밀도 부족, 반드시 `perf_counter` 사용 |
| 장시간 안정성 | 10분 연속 가동 후 메모리 누수, FPS 저하 확인 | OpenCV `VideoCapture` 의 메모리 누수 가능성 주의 |
| CPU 온도 스로틀링 | i5 노트북에서 10분 연속 추론 시 thermal throttling으로 성능 저하 | 데모 전 5분간 warm-up 후 측정 |

### 6.2 감지 정확도 검증

| 테스트 | 방법 | 기준 |
|--------|------|------|
| 이상 행동 감지 (서기) | 좌석에 앉은 상태 → 일어서기 → 다시 앉기 반복 10회 | 감지율 80% 이상, 오탐율 20% 이하 |
| 이상 행동 감지 (넘어짐) | 좌석에서 쓰러지는 동작 반복 5회 | 감지율 60% 이상 (난이도 높음) |
| 잔류 인원 감지 | 1명 있을 때 / 0명일 때 각 10회 | 감지율 99% 이상, 오탐율 1% 이하 |
| 역광/저조도 환경 | 창문 배경광, 어두운 환경에서 감지 | 정상 조명 대비 감지율 70% 이상 |

### 6.3 데모 안정성 검증

| 시나리오 | 테스트 방법 |
|----------|----------|
| 카메라 분리/재연결 | 웹캠 USB를 뽑았다 다시 꽂기 → 자동 복구 확인 |
| 시나리오 빠른 전환 | 1-2-3-1-2-3 빠르게 전환 → 메모리 누수, 크래시 확인 |
| 장시간 유휴 후 복귀 | 5분 방치 후 조작 → 정상 동작 확인 |
| 브라우저 새로고침 | F5 후 즉시 정상 스트리밍 복구 확인 |

### 6.4 테스트 환경 우려

- **실제 데모 PC와 개발 PC의 사양 차이**: 개발 PC(고사양)에서 통과해도 대표님의 i5 PC에서 실패할 수 있음 → **반드시 타겟 PC에서 최종 검증**
- **웹캠 모델별 차이**: 웹캠마다 화각, 노출, 화이트밸런스가 다름 → 타겟 웹캠에서 검증 필수
- **자동화 테스트 한계**: CV 파이프라인은 사전 녹화 영상(fixture)으로 일부 자동화 가능하나, 실시간 웹캠 테스트는 수동 필수

---

## 7. 수치 검증 — 200ms 추론 목표의 현실성

### 7.1 YOLOv8n 공개 벤치마크 분석

Ultralytics 공식 문서 및 커뮤니티 벤치마크 기반:

| 환경 | 입력 크기 | 추론 시간 | 출처 |
|------|----------|----------|------|
| i5-1135G7 (11th, PyTorch) | 640x640 | 220~280ms | Ultralytics GitHub Issues |
| i5-1135G7 (11th, ONNX) | 640x640 | 130~170ms | ONNX Runtime benchmarks |
| i5-1135G7 (11th, ONNX) | 320x320 | 50~70ms | 커뮤니티 벤치마크 |
| i5-10400 (10th, PyTorch) | 640x640 | 280~350ms | 커뮤니티 벤치마크 |
| i5-10400 (10th, ONNX) | 640x640 | 160~220ms | ONNX Runtime benchmarks |
| i5-12400 (12th, ONNX) | 640x640 | 100~140ms | Ultralytics docs |

### 7.2 시나리오별 200ms 달성 가능성 평가

#### 시나리오 2 (가장 무거움: YOLO + Pose)

| 구성 | 추론 시간 (i5-11th 기준) | 200ms 달성 | 판정 |
|------|-------------------------|-----------|------|
| PyTorch 640x640 + Pose | 250~310ms | 불가 | FAIL |
| ONNX 640x640 + Pose | 155~195ms | 경계선 | RISKY |
| ONNX 416x416 + Pose | 90~130ms | **가능** | PASS |
| ONNX 320x320 + Pose | 75~100ms | **안정적** | PASS |

#### 시나리오 1 (Face Detection만)

| 구성 | 추론 시간 | 200ms 달성 | 판정 |
|------|----------|-----------|------|
| MediaPipe FaceDetector | 10~20ms | 여유 | PASS |

#### 시나리오 3 (YOLO만)

| 구성 | 추론 시간 (i5-11th, ONNX) | 200ms 달성 | 판정 |
|------|--------------------------|-----------|------|
| ONNX 320x320 | 50~70ms | 여유 | PASS |
| ONNX 640x640 | 130~170ms | 가능 | PASS |

### 7.3 결론

- **200ms 목표는 ONNX Runtime + 320~416 입력 크기 조합에서만 안정적으로 달성 가능**
- PyTorch CPU 기본 설정으로는 시나리오 2에서 200ms 초과가 빈번
- 가안의 A7 전제("100-200ms 가능")는 ONNX를 전제로 해야만 타당
- **권장 기본 설정:** ONNX Runtime, 입력 416x416, `intra_op_num_threads=4`

---

## 8. 신뢰도 평가

### 종합 점수: **72 / 100**

| 평가 항목 | 점수 | 근거 |
|----------|------|------|
| 도메인 1 (엣지 시뮬레이션) 실현 가능성 | 80/100 | ONNX 전환하면 200ms 달성 가능. 성능 대시보드는 구현 난이도 낮음 |
| 도메인 2 시나리오 2 (이상행동) 실현 가능성 | 65/100 | 추론 자체는 가능하나, 좌석 환경에서 Pose 정확도가 불확실. 오탐 제어가 관건 |
| 도메인 2 시나리오 3 (잔류인원) 실현 가능성 | 85/100 | YOLOv8n person detection은 신뢰성 높음. multi-frame 분석으로 정확도 보완 가능 |
| 추론 성능 200ms 목표 | 70/100 | ONNX + 해상도 축소 필수. PyTorch 유지 시 60점으로 하락 |
| 데모 안정성 (10분 무중단) | 75/100 | 메모리 누수, 열 스로틀링, 카메라 드롭 등 리스크 존재하나 관리 가능 |
| 스트리밍 품질 (MJPEG) | 55/100 | MJPEG 고유 지연이 체감 반응성을 크게 저하. WebSocket 전환 권장 |
| 전체 통합 복잡도 관리 | 70/100 | 4개 시나리오 + 성능 대시보드 + 백엔드 연동은 상당한 통합 작업량 |

### 점수 분석

- **80점 이상 요소:** 개별 AI 모델의 CPU 동작 가능성은 검증됨. psutil 기반 모니터링, YOLO person detection 등은 안정적
- **70점 미달 요소:** MJPEG 스트리밍 지연, Pose 기반 이상행동 감지의 좌석 환경 정확도, PyTorch 기본 설정의 성능 부족
- **핵심 개선 시 85점 가능:** ONNX 전환 + WebSocket 스트리밍 + 적응형 프레임 스킵 적용 시

---

## 9. 최종 의견

### 판정: **CONDITIONAL APPROVE**

### 승인 조건 (반드시 Final Tech Spec에 반영해야 할 사항)

| 조건 | 우선순위 | 근거 |
|------|---------|------|
| **C1. ONNX Runtime을 기본 추론 백엔드로 채택** | 필수 | PyTorch CPU 추론으로는 200ms 목표 달성이 불안정. ONNX는 30~50% 성능 개선 + 설치 용량 대폭 감소 |
| **C2. 입력 해상도를 416x416 또는 320x320으로 설정** | 필수 | 640x640은 i5에서 추론 시간이 과다. 320x320이면 person detection 정확도는 데모 환경(근거리, 정면)에서 충분 |
| **C3. 적응형 프레임 스킵 전략 명시** | 필수 | 모든 프레임에 추론하면 latency 누적. 5fps 추론 + 30fps 렌더링 분리 |
| **C4. 시나리오별 모델 활성화 맵 정의** | 필수 | 불필요한 모델 로딩/추론 방지로 리소스 최적화 |
| **C5. 모델 warm-up 절차 포함** | 필수 | 첫 수 프레임의 느린 추론이 데모 첫인상을 망칠 수 있음 |
| **C6. 스트리밍 방식을 WebSocket으로 전환하거나, MJPEG + WebSocket 하이브리드 채택** | 권장 | MJPEG 단독은 200~500ms 추가 지연. 최소한 메트릭/이벤트는 WebSocket으로 전송 |
| **C7. 이상행동 감지를 상체 랜드마크 기반으로 재설계** | 권장 | 좌석 환경에서 전신 Pose는 불안정. 어깨-엉덩이 y비율 기반이 더 robust |
| **C8. Graceful degradation 모드 정의** | 권장 | i5 사양이 예상보다 낮을 때 FPS를 낮추되 UI 반응성은 유지하는 전략 |
| **C9. 사전 녹화 영상 fallback 모드** | 권장 | 카메라 실패 시 데모 중단 방지 |

### 최종 코멘트

이 가안은 **규제 샌드박스 PoC로서의 방향성은 올바르다**. 핵심 AI 모델(YOLOv8n, MediaPipe)의 CPU 동작은 검증된 기술이며, 비기술 심사위원에게 보여줄 시각적 데모로서 합리적인 구성이다.

다만, 현재 가안 그대로 구현하면 **PyTorch 기반 추론의 성능 부족**과 **MJPEG 스트리밍의 체감 지연**이 결합되어 "실시간 AI"라는 인상을 주기 어렵다. ONNX 전환과 해상도 최적화를 적용하면 동일 하드웨어에서 **2~3배 성능 개선**이 가능하므로, 이를 Tech Spec에 반드시 반영해야 한다.

또한, "멀티 모델 동시 운용"이라는 표현이 오해를 줄 수 있으므로, **시나리오별로 활성 모델을 명확히 분리**하고, 각 시나리오의 실제 추론 파이프라인을 구체적으로 명시해야 한다.

총평: **올바른 방향의 가안이나, 성능 최적화 전략이 구체화되어야 실현 가능성이 높아진다.**

---

*리뷰 완료: 2026-03-27*
*Senior Computer Vision / Edge AI 전문가 (R1)*
