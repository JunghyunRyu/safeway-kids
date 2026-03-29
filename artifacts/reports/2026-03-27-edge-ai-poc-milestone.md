# Milestone Report — Edge AI PoC 데모 시스템

**작성일:** 2026-03-27
**상태:** COMPLETE
**마일스톤:** Edge AI PoC 데모 (규제 샌드박스 심사용)

---

## 1. 완료 항목

### Phase 0~4: 설계 (전체 완료)
- Requirement Brief (479줄)
- Senior 독립 리뷰 4건 (R1~R4)
- 페르소나 평가 7건 (전원 91+ 달성)
- Consensus Matrix (20개 합의)
- Final Tech Spec Rev.2 (1,411줄, 32개 섹션)
- Todo Plan (35개 태스크, 7개 마일스톤)

### Phase 5: 구현 (전체 완료)

| 마일스톤 | 태스크 | 파일 수 | LOC | 상태 |
|---------|--------|--------|-----|------|
| M1 프로젝트 기반 | T1~T6 | 8 | 692 | ✅ |
| M2 AI 핵심 엔진 | T7~T13 | 8 | 2,192 | ✅ |
| M3 사각지대 시뮬 | T14~T18 | 8 | 1,789 | ✅ |
| M4 웹 서버 | T19~T23 | 5 | 1,703 | ✅ |
| M5 데모 UI | T24~T28 | 7 | 3,275 | ✅ |
| M6 통합/검증 | T29~T32 | 4 | 1,175 | ✅ |
| 기존 코드 | (참고용) | 4 | 828 | 유지 |
| **합계** | **35** | **44** | **11,654** | **✅** |

### Phase 6: 검증

| 항목 | 결과 |
|------|------|
| 모듈 import 테스트 | **12/12 PASSED** |
| 단위 테스트 (pytest) | **63 passed, 2 skipped** |
| 벤치마크 (preprocess) | P95 = 13.4ms (~142 FPS) |
| JS 구문 검사 | 5/5 통과 |
| JSON 검증 | 3/3 통과 |

## 2. 핵심 산출물

### AI 핵심 모듈 (Python)
- `core/yolo_detector.py` — YOLOv8n ONNX 추론 (416×416, NMS, person filter)
- `core/face_recognizer.py` — ArcFace ONNX 512-dim embedding, 다중각도 등록, temporal smoothing, 마스크 대응
- `core/behavior_analyzer.py` — 이상행동 감지, 4단계 거짓경고 억제
- `core/passenger_scanner.py` — 잔류인원 multi-frame 스캔
- `core/boarding_manager.py` — 승하차 명단 관리, 미하차 경고
- `core/scenario_manager.py` — 5개 모드 상태머신, 모델 활성화 맵
- `core/performance_monitor.py` — 적응형 프레임스킵, Graceful degradation

### 사각지대 시뮬레이션 (JavaScript)
- `blindspot/lidar.js` — VLP-16 360레이, 가우시안 노이즈, 레이캐스팅
- `blindspot/ultrasonic.js` — 12개 초음파 센서, 15도 빔, 콘 감지
- `blindspot/fusion.js` — LiDAR 0.7 + 초음파 0.3 가중 평균 융합
- `blindspot/bev-canvas.js` — Bird's Eye View 600×600px Canvas 렌더링
- `blindspot/scenario-player.js` — JSON 시나리오 자동 재생 + 인터랙티브

### 웹 서버 + UI
- `web/server.py` — Flask + Socket.IO, 카메라/추론/성능 스레드 분리
- `web/backend_bridge.py` — Standalone/연동 자동 감지
- `web/fallback.py` — Human Fallback 모드
- `web/templates/index.html` — 데모 메인 페이지
- `web/static/css/demo.css` — 다크 테마 + 프로젝터 최적화
- `web/static/js/app.js` — 메인 오케스트레이터

### 통합 + 실행
- `main_v2.py` — 전체 통합 진입점 (DI 방식)
- `setup_models.py` — ONNX 모델 자동 다운로드
- `start.bat` — Windows 원클릭 실행

## 3. 검증 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 12개 모듈 import | VERIFIED | 전부 성공 |
| 63개 단위 테스트 | VERIFIED | 모델 무관 테스트 전부 통과 |
| 2개 모델 의존 테스트 | SKIPPED | ONNX 모델 다운로드 후 실행 가능 |
| Preprocess 벤치마크 | VERIFIED | P95=13.4ms |
| YOLO/ArcFace 벤치마크 | UNVERIFIED | 모델 다운로드 후 실행 필요 |
| E2E 데모 시연 | UNVERIFIED | 실행 환경에서 수동 검증 필요 |
| JS Canvas 렌더링 | PARTIALLY VERIFIED | 구문 검사 통과, 브라우저 확인 필요 |

## 4. 잔여 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| ONNX 모델 다운로드 실패 | 데모 불가 | setup_models.py로 사전 다운로드, fallback 영상 |
| ArcFace 정확도 미달 (95%) | 데모 품질 | 다중각도 등록 + CLAHE + threshold 튜닝 |
| i5 CPU에서 200ms 초과 | FPS 저하 | 적응형 프레임스킵 + 320×320 fallback |
| 웹캠 접근 실패 | 데모 중단 | fallback 영상 자동 재생 |
| Socket.IO 연결 불안정 | UI 끊김 | 자동 재연결 + 에러 토스트 |

## 5. 다음 단계

1. `python setup_models.py` 실행하여 ONNX 모델 다운로드
2. `python main_v2.py` 실행하여 전체 데모 동작 확인
3. 벤치마크 실행 (`python -m tests.benchmark`)
4. 데모 영상 녹화 (Tech Spec 섹션 32 참조)
5. M7 앱 연동 (선택): 모바일 알림 라우팅 + 웹 이벤트 페이지
