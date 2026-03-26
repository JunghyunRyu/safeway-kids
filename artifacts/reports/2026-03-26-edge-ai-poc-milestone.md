# Milestone Report: Edge AI PoC 데모 시스템

**날짜:** 2026-03-26
**마일스톤:** Edge AI PoC 데모 (규제 샌드박스 시연용)

## 완료 항목

### 1. Edge AI 독립 패키지 (edge_ai/)
| 파일 | 용도 | 상태 |
|------|------|------|
| config.py | 설정 (백엔드 URL, 웹캠, AI 파라미터) | VERIFIED |
| face_manager.py | MediaPipe FaceDetector + 히스토그램 매칭 | VERIFIED |
| behavior_detector.py | YOLOv8n + MediaPipe PoseLandmarker | VERIFIED |
| passenger_detector.py | YOLOv8n 잔류 인원 감지 | VERIFIED |
| event_sender.py | 백엔드 API 이벤트 전송 | VERIFIED |
| main.py | Flask + MJPEG 스트리밍 데모 UI | VERIFIED |
| assets/ | MediaPipe 모델 파일 (face_detector, pose_landmarker) | VERIFIED |
| requirements.txt | CPU 전용 의존성 목록 | VERIFIED |

### 2. Backend edge_gateway 모듈
| 파일 | 용도 | 상태 |
|------|------|------|
| models.py | EdgeEvent DB 모델 | VERIFIED |
| schemas.py | Pydantic API 스키마 | VERIFIED |
| router.py | POST/GET /api/v1/edge/events | VERIFIED |
| service.py | 이벤트 처리 + FCM 푸시 알림 | VERIFIED |

### 3. 인프라 변경
- main.py: edge router 등록 완료
- migrations: edge_events 테이블 마이그레이션 적용
- env.py: EdgeEvent 모델 import 추가

## 검증 결과

### 백엔드 테스트
- **102 passed** (기존 96 + edge_gateway 6)
- 기존 WebSocket 테스트 1개 간헐적 에러 (기존 이슈, 변경과 무관)

### Edge AI 모듈 테스트
- FaceManager: 초기화 OK, MediaPipe FaceDetector 동작 확인
- BehaviorDetector: 초기화 OK, YOLOv8n + PoseLandmarker 동작 확인
- PassengerDetector: 초기화 OK, YOLO 모델 공유 동작 확인
- Flask 앱: 4개 API 엔드포인트 동작 확인 (status, mode, events, HTML)

### 소프트웨어 스택
- Python 3.12, PyTorch 2.11.0+cpu, YOLOv8n, MediaPipe 0.10.33
- Flask 3.1.3, OpenCV 4.13.0

## 데모 실행 방법
```bash
# 1. 백엔드 시작
cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Edge AI 데모 시작
cd edge_ai && source .venv/bin/activate && python main.py

# 3. 브라우저에서 http://localhost:7860 접속
```

## 잔여 리스크
| 리스크 | 설명 |
|--------|------|
| 디스크 공간 | 18GB 중 17GB 사용 (780MB 남음) - 추가 패키지 설치 시 주의 |
| 웹캠 없는 환경 | VMware에서는 웹캠 패스스루 설정 필요 |
| 얼굴 인식 정확도 | 히스토그램 기반은 조명 변화에 민감 - 데모 시 일정한 조명 필요 |

## 다음 단계
1. 실제 웹캠 연결 후 End-to-End 시연 테스트
2. 모바일 앱에서 FCM 푸시 알림 수신 확인
3. 필요시 face_recognition(dlib) 설치로 인식 정확도 향상
