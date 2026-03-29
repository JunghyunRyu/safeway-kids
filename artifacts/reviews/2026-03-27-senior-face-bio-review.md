# Senior 안면 인식 / 생체 인증 전문가 (R2) 독립 리뷰

**리뷰어:** R2 — Senior Face Recognition / Biometric Authentication Specialist
**리뷰 대상:** `artifacts/specs/2026-03-27-edge-ai-poc-requirement-brief.md` — 도메인 3 (안면 인식 터미널)
**리뷰일:** 2026-03-27
**상태:** COMPLETE

---

## 1. 요구사항 재진술

도메인 3은 **스마트 미러 / 태블릿 형태의 안면 인식 단말기**를 시뮬레이션하는 PoC이다.
핵심 시나리오(시나리오 1)는 다음과 같다:

1. **얼굴 등록:** 데모 시작 전, 웹캠으로 원생의 얼굴을 실시간 캡처하여 이름과 함께 등록한다.
2. **비접촉 자동 인식:** 원생이 카메라 앞에 서면 터치 없이 자동으로 얼굴을 감지하고, 등록된 얼굴 DB와 매칭하여 신원을 확인한다.
3. **결과 표시:** 등록된 얼굴이면 "OOO 원생 탑승 확인" + 초록색 바운딩 박스, 미등록이면 "미등록" + 노란색 바운딩 박스를 표시한다.
4. **이벤트 연동:** 인식 결과를 백엔드에 전송하고, 학부모 앱으로 푸시 알림을 시뮬레이션한다.

**핵심 수치 목표:**
- 정면 + 정상 조명 기준 **95% 이상** 인식 성공률
- 마스크 착용 시 **70% 이상** 인식률
- 얼굴 감지 후 **2초 이내** 바운딩 박스 표시
- 10분 이상 연속 가동, 크래시 없음

**실행 환경 제약:**
- Windows i5 PC, CPU only (GPU 없음)
- USB 웹캠 640x480
- 원클릭 실행 (batch 파일)

---

## 2. 누락된 요구사항

| ID | 누락 항목 | 영향도 | 설명 |
|----|----------|--------|------|
| M1 | **다중 각도 등록 (Multi-angle enrollment)** | 높음 | 현재 단일 정면 캡처만 명시됨. 실제 환경에서 어린이는 정면만 바라보지 않으므로, 등록 시 정면/좌15도/우15도 최소 3장 캡처가 필요하다. 이것 없이 95%는 달성 불가. |
| M2 | **등록 품질 검증 (Enrollment quality gate)** | 높음 | 등록 시 얼굴 크기, 조명, 블러, 정면 각도 등을 검증하는 품질 게이트가 없음. 저품질 등록 이미지는 인식률을 크게 저하시킴. |
| M3 | **임베딩 갱신 전략** | 중간 | 등록 후 시간이 지나면 외모 변화(머리 스타일, 안경 등)로 인식률 하락. PoC에서는 단기 데모이므로 심각하지 않으나, 심사위원이 "장기 운영 시?"라고 질문할 수 있음. |
| M4 | **동시 다인 인식 시나리오** | 중간 | 현재 명세는 1명씩 인식하는 것을 전제로 하나, 여러 어린이가 동시에 카메라 앞에 설 수 있음. 다인 동시 감지+인식 처리 명세 없음. |
| M5 | **인식 실패 시 재시도 UX** | 중간 | 인식 실패 시 사용자에게 "다시 정면을 봐주세요" 등의 가이드 표시가 없음. 데모 흐름이 멈출 수 있음. |
| M6 | **Anti-spoofing (위조 방지) 언급** | 낮음 | PoC 필수는 아니지만, 심사위원이 "사진으로 속일 수 있나?"라고 질문할 가능성 높음. 최소한 개념적 대응 방안(향후 liveness detection 적용 계획)을 UI나 발표 자료에 포함해야 함. |
| M7 | **얼굴 데이터 개인정보 처리 언급** | 낮음 | 어린이 얼굴 데이터는 민감 개인정보. 규제 심사에서 "생체 데이터 보호 방안"을 질문할 수 있음. 최소한 "로컬 저장, 암호화 예정" 등의 방침이 필요. |

---

## 3. 충돌/모순

| ID | 충돌 항목 | 설명 |
|----|----------|------|
| C1 | **히스토그램 매칭 vs 95% 정확도 목표** | 요구사항 브리프에서 히스토그램 기반 매칭을 현재 구현으로 명시하면서 동시에 95% 정확도를 요구하고 있음. 이 두 가지는 **근본적으로 양립 불가**. 히스토그램 매칭은 조명, 카메라 노출, 배경색에 따라 같은 사람도 전혀 다른 디스크립터를 생성한다. 정면+정상조명이라 해도 80% 이상 달성하기 어렵다. |
| C2 | **MediaPipe FaceDetector vs 안면 "인식"** | MediaPipe FaceDetector는 얼굴 **감지**(detection)만 수행하며, 얼굴 **인식**(recognition/identification)은 제공하지 않는다. 명세에서 "MediaPipe FaceDetection + 히스토그램 기반 매칭"을 하나의 파이프라인으로 기술하고 있으나, detection과 recognition은 완전히 별개 단계임을 명확히 해야 함. |
| C3 | **마스크 70% vs 히스토그램** | 히스토그램 매칭은 얼굴 전체 영역의 색상 분포를 사용하므로, 마스크가 얼굴 하반부를 가리면 특징 벡터의 50% 이상이 마스크 색상으로 오염됨. 히스토그램으로는 마스크 대응 70%를 달성할 수 없음. |

---

## 4. 기술 리스크

| ID | 리스크 | 확률 | 영향 | 상세 분석 |
|----|--------|------|------|----------|
| TR1 | **히스토그램 매칭의 조명 의존성** | 확정 | 치명적 | 현재 `face_manager.py`는 HSV H/S 채널 + 그레이스케일 히스토그램을 결합하여 128-dim 디스크립터를 생성한다. HSV H 채널은 조명 강도에 비교적 안정적이나, S 채널과 그레이스케일은 조명에 민감하다. 데모 장소의 형광등/자연광 변화만으로도 동일인의 유사도가 0.7에서 0.4로 떨어질 수 있다. `equalizeHist`를 적용하고 있으나, 이는 히스토그램을 평탄화할 뿐 색상 분포 자체를 안정화하지 않는다. **95% 달성 불가능.** |
| TR2 | **dlib Windows 빌드** | 높음 | 높음 | `face_recognition` 라이브러리는 dlib에 의존하며, dlib는 C++ 컴파일(CMake + Visual Studio Build Tools)이 필요하다. Windows에서 `pip install dlib`은 빈번하게 실패하고, 사전 빌드된 wheel도 Python 버전에 따라 없을 수 있다. "대표님 PC에서 원클릭 실행"이라는 목표와 정면 충돌. |
| TR3 | **CPU 추론 지연** | 중간 | 중간 | Deep embedding 모델(InsightFace buffalo_l, FaceNet)은 CPU에서 50~150ms/face 소요. 도메인 1,2의 YOLOv8n + MediaPipe Pose와 동시 실행 시 프레임 처리 시간이 200ms를 초과할 수 있음. 단, 시나리오 1(안면인식)은 독립 실행이므로 실제 충돌은 제한적. |
| TR4 | **등록 이미지 품질** | 중간 | 높음 | 640x480 웹캠에서 얼굴 크롭은 약 100x100~200x200px. Deep embedding 모델은 112x112 입력을 사용하므로 해상도는 충분하나, 웹캠 자동 노출/화이트밸런스에 의한 색상 편향이 등록-인식 간 일관성을 해칠 수 있음. |
| TR5 | **마스크 착용 시 얼굴 감지 자체의 어려움** | 낮음~중간 | 중간 | MediaPipe FaceDetector는 마스크 착용 얼굴도 비교적 잘 감지하나, min_detection_confidence=0.5에서 마스크+모자 조합 시 감지 실패 가능. ArcFace 계열 모델은 정렬(alignment)을 위해 양쪽 눈 좌표가 필요하므로, 마스크 자체는 recognition 단계에서 문제됨 (detection은 OK). |
| TR6 | **ONNX Runtime 호환성** | 낮음 | 중간 | InsightFace의 buffalo_l 모델은 `onnxruntime`을 사용한다. Windows CPU에서 `onnxruntime`은 `pip install onnxruntime`으로 바로 설치 가능하며 호환성 이슈가 거의 없다. 다만, InsightFace Python 패키지 자체가 내부적으로 Cython 빌드를 요구하는 경우가 있어, `insightface` 대신 ONNX 모델 파일을 직접 로드하는 경량 래퍼를 작성하는 것이 더 안전할 수 있음. |

---

## 5. 라이브러리 선택 결정 (Q1 미결사항)

### 옵션별 상세 분석

#### 옵션 A: `face_recognition` (dlib 기반)

| 항목 | 평가 |
|------|------|
| 정확도 | LFW 99.38% (dlib 공식). 128-dim embedding. 매우 우수. |
| CPU 성능 | 얼굴당 약 150~300ms (i5). HOG detector 사용 시 detection도 150ms 추가. |
| Windows 호환성 | **심각한 문제.** dlib C++ 빌드 필요. CMake + VS Build Tools 필수. Python 3.12+ 에서 wheel 미제공 빈번. |
| 마스크 대응 | 기본 모델은 마스크 학습 안 됨. 마스크 착용 시 60% 이하로 급락. |
| 설치 용이성 | `pip install face_recognition`은 dlib 빌드 성공 전제. 실패율 높음. |
| API 편의성 | 매우 간단 (`face_recognition.face_encodings()`, `compare_faces()`). |
| 총평 | 정확도 우수하나, **Windows 빌드 리스크가 "원클릭 실행" 요구와 정면 충돌**. 마스크 대응도 약함. **비추천.** |

#### 옵션 B: InsightFace / ArcFace (ONNX Runtime)

| 항목 | 평가 |
|------|------|
| 정확도 | **LFW 99.83%** (buffalo_l / ArcFace-R100). 512-dim embedding. 업계 최고 수준. |
| CPU 성능 | ONNX Runtime CPU에서 얼굴당 50~100ms (i5, buffalo_l). detection(RetinaFace) 30~50ms 추가. |
| Windows 호환성 | `onnxruntime`은 pip install 한 줄. 순수 Python + C extension으로 빌드 이슈 없음. 단, `insightface` 패키지 자체는 Cython 빌드 요구 가능 → **ONNX 모델 직접 로드 래퍼 추천.** |
| 마스크 대응 | ArcFace는 눈+이마 영역 임베딩 가중치가 높아, 마스크 착용 시에도 **75~85%** 인식률 보고됨. 마스크 학습된 fine-tuned 모델도 존재. |
| 설치 용이성 | `pip install onnxruntime` + ONNX 모델 파일 다운로드. 깔끔함. |
| 모델 크기 | buffalo_l: ~300MB (recognition + detection + landmark). buffalo_s: ~30MB (경량). |
| 총평 | **정확도, 마스크 대응, Windows 호환성 모두 최상.** ONNX 직접 로드 방식으로 의존성을 최소화하면 "원클릭 실행"에 가장 적합. **최우선 추천.** |

#### 옵션 C: MediaPipe FaceMesh + Custom Embedding

| 항목 | 평가 |
|------|------|
| 정확도 | MediaPipe FaceMesh는 468개 랜드마크를 제공하지만, **identity embedding을 제공하지 않음.** 랜드마크 좌표로 custom embedding을 만들면 구조적 특징(눈 간 거리, 코 길이 비율 등)만 사용 가능. **80~85% 수준이 한계.** |
| CPU 성능 | 매우 빠름. 10~20ms/face. |
| Windows 호환성 | MediaPipe는 pip install 한 줄. 이미 프로젝트에 포함. |
| 마스크 대응 | 마스크 착용 시 하반부 랜드마크가 부정확해짐. 눈+이마 랜드마크만 사용 가능 → 구별력 저하. **60~70% 수준.** |
| 총평 | 속도는 최고이나, **identity 임베딩이 없어 정확도 95% 달성 불가.** 보조 수단(얼굴 감지, 정렬)으로는 유용하나 주 인식 엔진으로는 부적합. **비추천 (주 인식 엔진으로).** |

#### 옵션 D: facenet-pytorch (PyTorch 기반)

| 항목 | 평가 |
|------|------|
| 정확도 | LFW 99.63% (InceptionResnetV1). 512-dim embedding. 우수. |
| CPU 성능 | PyTorch CPU에서 얼굴당 100~200ms (i5). MTCNN detection 추가 시 150~300ms. |
| Windows 호환성 | 프로젝트에 **이미 PyTorch CPU가 설치**되어 있으므로 추가 의존성 최소. `pip install facenet-pytorch` 한 줄. |
| 마스크 대응 | 기본 모델은 마스크 학습 안 됨. dlib과 유사하게 마스크 시 65~75% 수준. |
| 설치 용이성 | PyTorch 이미 존재 → 매우 용이. MTCNN도 포함. |
| 모델 크기 | ~100MB (InceptionResnetV1). |
| 총평 | PyTorch가 이미 설치된 환경에서 **추가 비용 최소.** 정확도 우수하나 마스크 대응은 InsightFace보다 열세. 속도도 ONNX보다 느림. **차선 추천.** |

### 최종 추천: 옵션 B (InsightFace/ArcFace ONNX) — 1순위

**추천 구현 전략:**

```
1순위: InsightFace buffalo_l 모델을 ONNX Runtime으로 직접 로드
  - Detection: RetinaFace (ONNX) 또는 기존 MediaPipe FaceDetector 유지
  - Recognition: ArcFace-R100 (ONNX, 512-dim embedding)
  - 의존성: onnxruntime, numpy, opencv-python (모두 pip install)

2순위 (fallback): facenet-pytorch
  - 이미 PyTorch가 설치되어 있으므로 의존성 추가 최소
  - InsightFace ONNX 모델 다운로드 실패 시 대안

히스토그램 매칭: 완전 폐기 (95% 달성 불가능)
```

**구체적 구현 방안:**

```python
# 핵심 구조 (pseudo-code)
import onnxruntime as ort

class ArcFaceRecognizer:
    def __init__(self):
        # detection은 기존 MediaPipe FaceDetector 재사용 (이미 동작 확인됨)
        self.detector = MediaPipeFaceDetector()
        # recognition만 ArcFace ONNX로 교체
        self.recognizer = ort.InferenceSession("arcface_r100.onnx")

    def get_embedding(self, aligned_face_112x112):
        # 112x112 정규화된 얼굴 → 512-dim embedding
        blob = cv2.dnn.blobFromImage(face, 1.0/127.5, (112,112), (127.5,127.5,127.5))
        embedding = self.recognizer.run(None, {"input": blob})[0]
        return embedding / np.linalg.norm(embedding)

    def compare(self, emb1, emb2):
        # cosine similarity → threshold 0.4~0.5
        return float(np.dot(emb1, emb2))
```

---

## 6. 95% 정확도 달성 전략

### 전략 개요

95% 정확도를 달성하기 위해 다음 5개 레이어를 조합한다:

### Layer 1: Deep Embedding 모델 적용 (기본 정확도 확보)
- 히스토그램 매칭 → ArcFace ONNX 교체
- 이것만으로 정면+정상조명에서 **97~99%** 달성 가능
- 코사인 유사도 threshold: **0.45** (등록 인원 10명 이하 PoC 환경에서 최적)

### Layer 2: 다중 각도 등록 (Multi-angle Enrollment)
- 등록 시 **최소 3장** 캡처: 정면, 좌측 15도, 우측 15도
- 각 각도의 임베딩을 저장하고, 인식 시 **최대 유사도**를 사용
- 이 전략은 고개를 살짝 돌린 상태에서의 인식률을 **+10~15%** 향상

```python
# 등록: 3장의 embedding 저장
enrollment_embeddings = {
    "김철수": [emb_front, emb_left15, emb_right15]
}

# 인식: 최대 유사도
def recognize(query_emb, db):
    best_score = 0
    for name, embs in db.items():
        for ref_emb in embs:
            score = cosine_similarity(query_emb, ref_emb)
            if score > best_score:
                best_score = score
                best_name = name
    return best_name if best_score > threshold else "미등록"
```

### Layer 3: 얼굴 정렬 (Face Alignment)
- 감지된 얼굴을 양쪽 눈 좌표 기준으로 **affine transform** 정렬
- MediaPipe FaceDetector가 keypoint(양쪽 눈, 코끝, 입 양쪽)를 제공하므로 추가 모델 불필요
- 정렬 없이 크롭만 하면 회전/기울기에 따라 임베딩이 변동 → 정렬로 **+3~5%** 향상

### Layer 4: 전처리 파이프라인
- **CLAHE** (Contrast Limited Adaptive Histogram Equalization) — 단순 equalizeHist보다 로컬 대비 개선에 우수
- **화이트밸런스 정규화** — Gray World 가정으로 색온도 보정
- **얼굴 크롭 패딩** — 바운딩 박스를 10~20% 확장하여 이마/턱 포함

```python
def preprocess_face(face_crop):
    # CLAHE 적용
    lab = cv2.cvtColor(face_crop, cv2.COLOR_BGR2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:,:,0] = clahe.apply(lab[:,:,0])
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    # 112x112 리사이즈 + 정규화
    aligned = cv2.resize(enhanced, (112, 112))
    return aligned
```

### Layer 5: 시간적 평활화 (Temporal Smoothing)
- 단일 프레임이 아닌 **최근 5프레임의 인식 결과를 투표(majority voting)**
- 1프레임 오인식이 있어도 5프레임 중 3프레임 이상 동일인이면 확정
- 데모 환경에서 **체감 정확도를 +2~3%** 더 높일 수 있음

### 예상 정확도 (레이어 적용 시)

| 조건 | 히스토그램 (현재) | ArcFace only | ArcFace + 전체 전략 |
|------|------------------|-------------|-------------------|
| 정면 + 정상 조명 | 70~80% | 97~99% | **99%+** |
| 약간 측면 (15도) | 50~60% | 90~95% | **97%+** |
| 조명 변화 (역광 등) | 40~60% | 88~93% | **95%+** |
| 마스크 착용 | 30~40% | 70~80% | **80~85%** |

---

## 7. 마스크 대응 방안

### 현황 분석
- 마스크 착용 시 얼굴 하반부(코, 입, 턱)가 가려짐 → 전체 얼굴 특징의 약 40~50% 손실
- ArcFace 계열 모델은 눈+이마 영역에 높은 가중치를 부여하여, 마스크 착용 시에도 70~85% 유지

### 구현 방안

#### 방안 1: ArcFace 기본 모델 활용 (최소 구현)
- ArcFace-R100은 마스크 없이 학습되었으나, 눈 주변 특징의 변별력이 높아 마스크 착용 시에도 **70~80%** 달성
- threshold를 마스크 감지 시 **0.35로 완화** (비마스크 시 0.45)
- **PoC에서 가장 현실적인 접근**

#### 방안 2: 마스크 감지 + 임계값 동적 조정
```python
def is_wearing_mask(face_landmarks):
    """MediaPipe 랜드마크로 마스크 착용 여부 추정"""
    # 코-입 영역 가시성 체크
    nose_visibility = landmarks[1].visibility  # 코끝
    mouth_visibility = landmarks[13].visibility  # 입
    return nose_visibility < 0.3 or mouth_visibility < 0.3

def get_threshold(wearing_mask: bool) -> float:
    return 0.35 if wearing_mask else 0.45
```

#### 방안 3: 눈 영역 집중 크롭 (보조)
- 마스크 감지 시, 전체 얼굴 대신 **눈+이마 영역만 크롭**하여 임베딩 추출
- 마스크 색상이 임베딩에 영향을 주는 것을 방지
- 단, 별도 학습 없이는 효과가 제한적이므로 **방안 1과 병행**

#### 추천 조합
```
마스크 대응 = 방안 1 (ArcFace 기본) + 방안 2 (동적 threshold)
→ 예상 결과: 마스크 착용 시 75~85%, 목표 70% 초과 달성 가능
```

#### PoC 데모 팁
- 데모 시 마스크 인식을 시연할 때, **먼저 마스크 없이 등록** → 이후 마스크 착용하고 인식 → "마스크에도 인식됩니다"를 보여주는 것이 가장 효과적
- 마스크 색상은 **흰색/파란색 수술용 마스크**가 가장 일반적이고, ArcFace 모델이 가장 잘 대응하는 유형

---

## 8. 테스트 우려

### 8.1 정확도 측정 방법

| 항목 | 우려 | 권장 방안 |
|------|------|----------|
| **테스트 데이터셋** | PoC에서 LFW 등 공개 데이터셋 벤치마크는 의미 없음. 실제 데모 환경(웹캠, 조명)에서 측정해야 함. | 데모 환경에서 5~10명 등록 후, 각 인당 20회 인식 시도 → 정인식/오인식/미인식 카운트 |
| **측정 자동화** | 수동 측정은 신뢰도 낮음 | 테스트 스크립트: 등록된 얼굴의 캡처 이미지 폴더를 준비, 오프라인으로 인식 수행, confusion matrix 생성 |
| **임계값 튜닝** | threshold가 너무 높으면 미인식, 너무 낮으면 오인식 | PoC 인원(5~10명)에 대해 ROC curve를 그려 EER(Equal Error Rate) 근처의 threshold 선택 |
| **마스크 테스트** | 마스크 종류에 따른 변동 | 최소 2종류 마스크(수술용, KF94)로 테스트 |

### 8.2 자동화 테스트 스크립트 제안

```python
def run_accuracy_test(recognizer, test_dir):
    """
    test_dir 구조:
      test_dir/김철수/001.jpg, 002.jpg, ...
      test_dir/이영희/001.jpg, 002.jpg, ...
      test_dir/unknown/001.jpg, ...
    """
    results = {"TP": 0, "FP": 0, "FN": 0, "TN": 0}
    for person_dir in os.listdir(test_dir):
        for img_file in glob(f"{test_dir}/{person_dir}/*.jpg"):
            img = cv2.imread(img_file)
            matches = recognizer.recognize(img)
            predicted = matches[0].name if matches else "미등록"
            actual = person_dir
            # 분류 후 results 업데이트

    accuracy = (results["TP"] + results["TN"]) / sum(results.values())
    return accuracy, results
```

### 8.3 성능 테스트

| 항목 | 측정 방법 |
|------|----------|
| 추론 지연시간 | `time.perf_counter()` 로 detection + recognition 각각 측정 |
| 메모리 사용 | ONNX 모델 로드 전후 `psutil.Process().memory_info().rss` 비교 |
| 연속 가동 | 10분 루프 실행 후 메모리 누수, FPS 하락 확인 |

---

## 9. 신뢰도 평가

**78 / 100점**

### 점수 근거

| 항목 | 점수 | 설명 |
|------|------|------|
| 요구사항 명확성 | 8/10 | 시나리오 흐름과 목표 수치가 잘 정의됨. 다중 각도 등록, 품질 게이트 등 세부 사항 누락. |
| 기술 타당성 | 6/10 | **히스토그램 매칭으로는 95% 달성 불가능**이라는 근본적 문제. 다만 대안(InsightFace)이 명시되어 있고 실현 가능함. |
| 리스크 식별 | 8/10 | dlib 빌드 이슈, 조명 의존성 등 주요 리스크를 정확히 식별. anti-spoofing, 개인정보 언급 부재. |
| 구현 가능성 | 9/10 | InsightFace ONNX 채택 시, i5 CPU + 웹캠 환경에서 모든 요구사항 달성 가능. |
| 테스트 전략 | 6/10 | 정확도 측정 방법, 테스트 데이터셋 구성이 미정의. |
| 데모 완성도 가능성 | 8/10 | 라이브러리 선택만 확정되면 높은 완성도 가능. |

---

## 10. 최종 의견

### **CONDITIONAL APPROVE**

### 승인 조건

1. **[필수] 히스토그램 매칭 폐기, ArcFace ONNX 채택 확정**
   - 히스토그램 기반 `_extract_descriptor()` 메서드를 ArcFace 512-dim embedding으로 완전 교체
   - `insightface` 패키지 직접 의존 대신, ONNX 모델 파일을 직접 로드하는 경량 래퍼 작성 권장
   - fallback으로 facenet-pytorch 준비

2. **[필수] 다중 각도 등록 구현**
   - 등록 UX를 "1장 캡처"에서 "3장 캡처 (정면/좌/우)"로 변경
   - 각 캡처 시 가이드 표시 ("정면을 봐주세요" → "왼쪽을 살짝 봐주세요" → "오른쪽을 살짝 봐주세요")

3. **[필수] 등록 시 품질 검증 게이트 추가**
   - 얼굴 크기 최소 80x80px, 블러 감지, 정면 각도 검증
   - 품질 미달 시 "다시 촬영해주세요" 안내

4. **[권장] 정확도 자동 측정 스크립트 포함**
   - 데모 전 사전 테스트로 현장 환경에서의 실제 정확도 확인 가능

5. **[권장] Anti-spoofing 개념적 대응**
   - PoC에서 구현할 필요는 없으나, UI 또는 발표 자료에 "향후 liveness detection 적용 예정" 언급
   - 심사위원 Q&A 대비

6. **[권장] 얼굴 데이터 보호 방침 명시**
   - "생체 데이터는 로컬에만 저장, 외부 전송 없음, 향후 암호화 적용" 등의 방침을 데모 UI에 표시

### 최종 평가

도메인 3의 요구사항은 전반적으로 잘 구성되어 있으나, **현재 구현체(히스토그램 매칭)로는 핵심 목표인 95% 정확도 달성이 불가능하다는 것이 가장 큰 문제**이다. 다행히 명세에 이미 대안이 열거되어 있으므로, **InsightFace ArcFace를 ONNX Runtime으로 채택하고, 다중 각도 등록 + CLAHE 전처리 + 시간적 평활화를 조합하면 PoC 목표를 충분히 달성할 수 있다.**

facenet-pytorch는 이미 PyTorch가 설치된 환경이므로 fallback으로 적합하며, dlib/face_recognition은 Windows 빌드 리스크로 인해 배제를 권장한다.

마스크 대응 70%는 ArcFace 기본 모델 + 동적 threshold 조정만으로 달성 가능하다.

**이 조건들이 충족되면, 도메인 3은 규제 샌드박스 심사에서 충분히 설득력 있는 데모를 제공할 수 있다.**

---

*리뷰어: R2 — Senior Face Recognition / Biometric Authentication Specialist*
*리뷰 완료: 2026-03-27*
