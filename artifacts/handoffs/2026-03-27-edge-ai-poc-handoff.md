# Session Handoff — Edge AI PoC 데모 (2026-03-27)

**작성일:** 2026-03-27
**상태:** Phase 5 구현 완료 + Phase 6 검증 완료

---

## 현재 상태

Edge AI PoC 데모 시스템의 9단계 개발 프로세스를 통해 **44개 파일, 11,654 LOC**를 구현했습니다.

- Phase 0~4 (설계): 완료 — 요구사항, 리뷰 4건, 페르소나 7건 (전원 91+), Tech Spec 32섹션
- Phase 5 (구현): 완료 — M1~M6 전체 35태스크
- Phase 6 (검증): 완료 — 63 passed, 2 skipped, 12/12 모듈 import 성공
- Phase 7 (마일스톤): 완료 — 보고서 작성
- Phase 8 (핸드오프): 본 문서

## 변경 파일 목록

### 신규 생성 (40개)
```
edge_ai/config.py (갱신)
edge_ai/main_v2.py
edge_ai/setup_models.py
edge_ai/start.bat
edge_ai/requirements.txt (갱신)
edge_ai/core/__init__.py
edge_ai/core/yolo_detector.py
edge_ai/core/face_recognizer.py
edge_ai/core/behavior_analyzer.py
edge_ai/core/passenger_scanner.py
edge_ai/core/boarding_manager.py
edge_ai/core/scenario_manager.py
edge_ai/core/performance_monitor.py
edge_ai/core/engine.py
edge_ai/hal/__init__.py
edge_ai/hal/backend.py
edge_ai/hal/sensor.py
edge_ai/web/__init__.py
edge_ai/web/server.py
edge_ai/web/backend_bridge.py
edge_ai/web/fallback.py
edge_ai/web/protocol.py
edge_ai/web/templates/index.html
edge_ai/web/static/css/demo.css
edge_ai/web/static/js/app.js
edge_ai/web/static/js/video-canvas.js
edge_ai/web/static/js/dashboard.js
edge_ai/web/static/js/field-ui.js
edge_ai/web/static/js/audio.js
edge_ai/web/static/js/blindspot/lidar.js
edge_ai/web/static/js/blindspot/ultrasonic.js
edge_ai/web/static/js/blindspot/fusion.js
edge_ai/web/static/js/blindspot/bev-canvas.js
edge_ai/web/static/js/blindspot/scenario-player.js
edge_ai/web/static/scenarios/rear_approach.json
edge_ai/web/static/scenarios/side_blindspot.json
edge_ai/web/static/scenarios/multi_children.json
edge_ai/tests/__init__.py
edge_ai/tests/test_core.py
edge_ai/tests/benchmark.py
```

### 아티팩트 (설계 문서)
```
artifacts/specs/2026-03-27-edge-ai-poc-requirement-brief.md
artifacts/specs/2026-03-27-edge-ai-poc-final-tech-spec.md
artifacts/plans/2026-03-27-edge-ai-poc-todo-plan.md
artifacts/reviews/2026-03-27-consensus-matrix.md
artifacts/reviews/2026-03-27-persona-synthesis.md
artifacts/reviews/2026-03-27-senior-cv-ai-review.md
artifacts/reviews/2026-03-27-senior-face-bio-review.md
artifacts/reviews/2026-03-27-senior-sensor-review.md
artifacts/reviews/2026-03-27-senior-demo-ux-review.md
artifacts/reviews/2026-03-27-persona-*.md (7건)
artifacts/reports/2026-03-27-edge-ai-poc-milestone.md
artifacts/gap-notes/2026-03-27-edge-ai-mobile-integration-gap.md
```

## 실행 명령어

```bash
# 1단계: ONNX 모델 다운로드
cd edge_ai && python setup_models.py

# 2단계: 서버 실행
python main_v2.py
# → http://localhost:7860 에서 데모 UI 열림

# Windows 원클릭:
start.bat

# 테스트:
python -m pytest tests/ -v

# 벤치마크:
python -m tests.benchmark
```

## 테스트 결과

```
63 passed, 2 skipped (model-dependent)
12/12 module imports OK
Preprocess benchmark: P95=13.4ms (~142 FPS)
```

## 미해결 이슈

| # | 이슈 | 우선순위 | 대응 |
|---|------|---------|------|
| 1 | ONNX 모델 미다운로드 | 높음 | `python setup_models.py` 실행 필요 |
| 2 | E2E 데모 수동 검증 미완 | 높음 | 실행 후 브라우저에서 4개 시나리오 확인 |
| 3 | YOLO/ArcFace 벤치마크 미실행 | 중간 | 모델 다운로드 후 benchmark.py 실행 |
| 4 | 데모 영상 녹화 미완 | 중간 | Tech Spec 섹션 32 가이드 참조 |
| 5 | M7 앱 연동 미완 | 낮음 | T33~T35 (모바일 알림, 웹 이벤트) |
| 6 | fallback_video.mp4 미제작 | 낮음 | 웹캠 실패 시 재생할 사전 녹화 영상 |

## 다음 세션 첫 번째 단계

```bash
cd edge_ai
python setup_models.py     # ONNX 모델 다운로드 (YOLOv8n + ArcFace)
python main_v2.py           # 서버 시작
# 브라우저에서 http://localhost:7860 열기
# 4개 시나리오 순서대로 테스트:
#   ① 승하차 안면인식 → ② 이상행동 감지 → ③ 잔류인원 → ④ 사각지대
```
