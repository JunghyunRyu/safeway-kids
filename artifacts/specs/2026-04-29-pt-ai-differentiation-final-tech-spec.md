# PT AI 차별화 — Final Tech Spec

**문서 분류**: Phase 3 Final Tech Spec
**작성일**: 2026-04-30
**버전**: v1.0
**상위 워크스트림**: PetTracker V1.0 출시 + 모두의 창업 2026 신청
**입력 산출물**:
- Phase 0 Brief: [`2026-04-29-pt-ai-differentiation-brief.md`](2026-04-29-pt-ai-differentiation-brief.md)
- Phase 1 Reviews: [BE](../reviews/2026-04-29-pt-ai-differentiation-backend-review.md) / [PM](../reviews/2026-04-29-pt-ai-differentiation-product-review.md) / [KFS](../reviews/2026-04-29-pt-ai-differentiation-fundraising-review.md)
- Phase 2 Consensus: [`2026-04-29-pt-ai-differentiation-consensus.md`](../reviews/2026-04-29-pt-ai-differentiation-consensus.md)
- 사용자 결정 (2026-04-30): **D-1=5축 / D-2=추상화 / D-7=출처 삭제**

**Decision Precedence**: 사용자 결정 > Final Tech Spec (본 문서) > 기존 PT V1.0 Tech Spec > 코드베이스 > Reviewer 의견

---

## 1. Problem Statement

PetTracker V1.0의 모두의 창업 2026 신청서 사전 채점 평균 70~73점(합격선 70 분기점)을 80점 안정권으로 끌어올리기 위해, AI 도메인 통합 5축을 V1.0에 추가하고 V1.1·V1.2 약속 3축 narrative를 신청서·면접·VC IR에 inject한다.

기술 측면 문제: 5개 한국 메이저 경쟁사(도그메이트·와요·펫플래닛·에어댕냥이·펫피)가 정형 매칭(거리·평점·가격)에 머물러 있어, AI 추론 레이어를 도입한 PT가 한국 매칭 segment first-mover로 기능 차별화 + 데이터 자산 우위 + 신뢰 layer를 동시에 확보할 수 있는 white space가 존재한다.

사업 측면 문제: 5/15 신청서 마감 D-15, V1.0 출시 D-37 (6/7) 일정 안에서 신청서에서 약속한 AI 기능이 V1.0 출시 시점에 실제 동작해야 한다(약속-동작 정합).

---

## 2. Goals / Non-goals

### 2.1 Goals
- **G-1**: V1.0 출시 시점(2026-06-07 ±2d)에 AI **5축**(A·B·D·E·F) 동작 시연 가능
- **G-2**: 신청서 점수 추정 70~73 → **76~82**(consensus 보수 추정 +6~9), 80점 안정권 진입
- **G-3**: 백엔드 145 passed + PT jest 15 passed + TS 0 errors **회귀 0 유지**
- **G-4**: 자금 1억원 변경 0원 (LLM API 200만 + AI 인프라 100만 + 외주 150만 = 클라우드 -450만 재배분, 매핑 §18)
- **G-5**: V1.1 약속 3축(C·F+·H) **+45일** 출시 narrative
- **G-6**: NFR-5 (사고 신고 99.9% submission success rate) 보호 — 사고 신고 LLM 비동기 처리

### 2.2 Non-goals
- **NG-1**: 자체 AI 모델 학습/fine-tuning. Foundation Model API(Claude/OpenAI) + Moderation API만 사용
- **NG-2**: 펫 wearable 하드웨어 통합
- **NG-3**: TTcare SDK 실제 통합 (V1.2 협력 탐색만, 신청서 narrative는 추상화)
- **NG-4**: 5개 경쟁사와 직접 기능 동등성 추구 (LIVE 영상·가정집 위탁 등)
- **NG-5**: AI 기능 다국어 (V1.0~V1.2 한국어만)
- **NG-6**: 글로벌 펫 AI $660M+ 수치 신청서 인용 (출처 미확보로 삭제)

---

## 3. User Scenarios

### 3.1 보호자 (자주 외출형)
- 산책 매칭 시: 펫시터 프로필을 보면 LLM 모더레이션 통과 시 자기소개·후기가 표시 (축 D)
- 산책 중: 실시간 GPS 추적 화면에서 펫시터의 사진 + AI 캡션이 push로 도착 (축 B). GPS 이상 발생 시 워커 check-in 자동 발송 알림 수신 (축 E)
- 산책 종료: PDF/HTML 산책 리포트 카카오 push 또는 in-app 카드 자동 수신 (축 B). 사진별 AI 컨디션 1줄 ("활기/평온/지친 듯") 표시 (축 F, 베타 라벨)
- 사고 발생 시: 펫시터의 사고 신고를 즉시 push 수신 (축 A 비동기 분류 결과 도착 시 severity·action 추가 표시)

### 3.2 펫시터
- 등록 시: 자기소개·자격 입력 → LLM 모더레이션 자동 실행. flag 시 "수정 제안" + 자동 재검토 (축 D)
- 산책 중: 사진 업로드 → 5초 내 AI 캡션 자동 생성. 캡션 1-tap 수정 또는 삭제 가능 (축 B + 3-layer UX)
- 사고 시: 사고 신고 버튼 → 텍스트·사진 입력 → 즉시 201 응답(폼 종료). 백그라운드에서 LLM 분류 → severity 따라 119 가이드 / 동물병원 / 보호자 알림 (축 A)
- GPS 이상 발생 시: in-app check-in 알림 수신 → 60초 내 응답. 무응답 시 보호자 자동 알림 (축 E)

### 3.3 관리자 (운영자 = 1인 창업가 본인)
- 모더레이션 큐: false positive 자동 재검토 후에도 flag 유지된 케이스만 표시 (운영 시간 30분/일 한도)
- 비용 모니터링: Redis cost counter 80% 도달 시 카카오 push 알림. 100% 도달 시 자동 Haiku tier routing

---

## 4. Functional Requirements

### 4.1 축 A — 사고 신고 LLM 분류 (V1.0)

- **FR-A1**: `POST /pt/walks/{session_id}/incident` 핸들러는 텍스트·사진 첨부를 DB에 저장 후 **즉시 201** 응답 (LLM 호출 X)
- **FR-A2**: `BackgroundTasks` 또는 APScheduler가 `classify_incident(incident_id)` 호출. LLM(Claude Sonnet) 1회 호출, 10s timeout
- **FR-A3**: LLM 출력 JSON: `{ severity: "low"|"medium"|"critical", type: "injury"|"traffic"|"abuse"|"loss"|"other", action: ["119", "vet", "owner_call", "evidence_save"] }`
- **FR-A4**: 분류 결과 `PtIncidentClassification` UPSERT → 보호자·펫시터 push 알림 발송
- **FR-A5**: LLM 호출 실패/timeout 시 fallback `severity="medium", type="other", action=["owner_call"]`. 운영자 카카오 push 알림 (수동 분류 큐 진입)
- **FR-A6**: severity="critical" 결과여도 **자동 119 발신 X** — UI에 "119 호출 권장" 빨간 카드 + 사용자가 1-tap 발신 (휴먼 confirm 의무, Q-2 변호사 자문 회신까지 안전 디폴트)
- **FR-A7**: Critical path 응답 시간 SLA: incident POST 95th percentile < 800ms (LLM 호출 무관)

### 4.2 축 B — 산책 사진 자동 캡션 + Empathic 리포트 (V1.0)

- **FR-B1**: 사진 업로드 = 기존 `POST /api/v1/storage/confirm` 호출 시 `entity_type="walk_photo"` 인 경우 `BackgroundTasks`로 `generate_caption(walk_photo_id)` 실행
- **FR-B2**: `WalkPhoto(id, session_id, s3_key, caption, caption_status, created_at)` 신규 모델. caption_status enum: `pending|generated|edited|failed`
- **FR-B3**: Vision LLM (Claude Sonnet 4.x with Vision OR GPT-4o) 1회 호출, 8s timeout. 입력: 사진 URL + 산책 컨텍스트(견종·시간대)
- **FR-B4**: Empathic tone 한국 보호자 UX 기준 (PM F-4):
  - 1인칭 주어 ("뛰었어요" → "공원에서 신나게 뛰었습니다")
  - 이모지 max 1개/캡션, 감탄사 금지 ("와!" X)
  - 1~2문장 max
  - 상한선 예시: "잔디밭에서 활발하게 뛰었어요 🐾"
- **FR-B5**: 펫시터 1-tap 수정 권한 (`PUT /pt/walks/{id}/photos/{photo_id}/caption`). 수정 시 caption_status="edited"
- **FR-B6**: 보호자에게 사진별 disclaimer 라벨 표시: "AI 생성 캡션 — 펫시터가 수정할 수 있습니다"
- **FR-B7**: 산책 종료 시 `WalkSummaryScreen` 신규 화면 → 백엔드 `GET /pt/walks/{session_id}/report` HTML 응답 (jinja2 템플릿 + 사진 N장 + 캡션 + GPS 경로 + 시간/거리/행동 요약)
- **FR-B8**: Delivery 채널: in-app push 알림 + WalkSummaryScreen 카드 표시 (V1.0). 카카오 push는 V1.1 (FCM 통합 후)
- **FR-B9**: 보호자 부적절 신고 버튼 (`POST /pt/captions/{caption_id}/report`) → 운영자 큐
- **FR-B10**: PDF 생성은 V1.1 이연 (jinja2 HTML + 보호자 in-app 화면이면 V1.0 충족)

### 4.3 축 D — 펫시터 자기소개·후기 LLM 모더레이션 (V1.0)

- **FR-D1**: `PUT /pt/walkers/profile`(자기소개 PUT) + `POST /pt/walks/{id}/review`(후기 POST) 호출 시 OpenAI Moderation API 동기 실행 (응답 < 500ms)
- **FR-D2**: Moderation API 결과 + 한국어 추가 룰(욕설 사전 + spam 패턴) 통합 → flag 시 `PtModerationFlag` 저장
- **FR-D3**: flag 발생 시 펫시터에게 "수정 제안" UI + 자동 재검토 흐름 (1회 수정 후 재검토 통과 시 자동 게시)
- **FR-D4**: 2회 재검토 후에도 flag 시 운영자 큐 진입 (Brief AI-A7 false positive < 5% 기준 미달 시 룰 조정)
- **FR-D5**: Moderation API 실패 시 fallback = "검토 중" 상태로 게시 (실 데이터 노출 X) + 운영자 큐
- **FR-D6**: Claude/Sonnet 미사용 (BE AD-5: OpenAI Moderation API only)

### 4.4 축 E — GPS 이상 탐지 + 워커 자동 check-in (V1.0)

- **FR-E1**: 백엔드 WS handler (`/pt/ws/walks/{session_id}`) 내부 코루틴이 GPS 이벤트 수신 시 `pt:walk:{session_id}:gps_history` Redis ZSET에 기록 (score=ts, member=JSON)
- **FR-E2**: ZSET trim: 5분 윈도우만 유지 (`ZREMRANGEBYSCORE key -inf (ts-300)`)
- **FR-E3**: 이상 탐지 알고리즘 (LLM 미사용):
  - **sudden stop**: 최근 60초 평균 속도 > 1.0 m/s AND 최근 30초 평균 속도 < 0.1 m/s
  - **route deviation**: 산책 시작 위치 반경 5km 이탈
  - **pace surge**: 최근 30초 평균 속도 > 평균 속도 × 3배 (e.g., 차량 탑승 의심)
- **FR-E4**: 이상 탐지 시 `pt:walk:{session_id}:updates` 채널에 `{type: "anomaly", kind: "sudden_stop"|"route_deviation"|"pace_surge", at: ts}` publish
- **FR-E5**: 워커 모바일 클라이언트가 anomaly 수신 → in-app modal "괜찮으신가요? 60초 내 응답 부탁드려요" 표시
- **FR-E6**: 워커 60초 무응답 시 `pt:walk:{session_id}:non_response_count` 증가. 1회 무응답 = 보호자 push 알림 (위험 알림 X, "잠시 응답이 없어요")
- **FR-E7**: 보호자·워커가 1-tap "정상" dismiss 권한 (false alarm 처리)
- **FR-E8**: V1.0 베타 라벨 표시 (PM 권고 — 실 데이터 누적 후 V1.1 임계값 튜닝)
- **FR-E9**: 모바일 클라이언트는 detection 미수행 (배터리 절약). 단순 anomaly 이벤트 수신 + UI 렌더링

### 4.5 축 F — 산책 사진 → 펫 컨디션 1줄 (V1.0 베타)

- **FR-F1**: 축 B의 `generate_caption(walk_photo_id)` 호출 시 동일 LLM 응답에 `condition: "활기"|"평온"|"지친_듯"|"이상"|"불명"` 포함 (별도 호출 없음, B에 통합)
- **FR-F2**: `WalkPhoto.condition` 컬럼 추가 (Optional)
- **FR-F3**: 보호자 화면에 사진별 컨디션 chip + "AI 베타 — 참고용입니다" 라벨
- **FR-F4**: condition="이상" 시 "수의사 상담 권장" 안내 + V1.1 수의사 챗봇(축 H) 진입 단축
- **FR-F5**: 펫시터·보호자 dismiss 권한 (chip tap → 숨김)

---

## 5. Non-functional Requirements

| ID | 항목 | 목표 | 측정 |
|---|---|---|---|
| NFR-1 | 사고 신고 POST 응답 시간 | 95p < 800ms | LLM 호출 무관 (비동기) |
| NFR-2 | 사진 캡션 생성 SLA | 95p < 8s, fallback caption_status="failed" | BackgroundTask 큐 |
| NFR-3 | LLM API 월 비용 cap | 200만원 / 월 (`PT_LLM_MONTHLY_COST_CAP_KRW=2000000`) | Redis counter |
| NFR-4 | 모더레이션 false positive | < 5% (한국어 50개 샘플 검증) | 출시 전 검증, 출시 후 1개월 실측 |
| NFR-5 | 사고 신고 submission 성공률 | 99.9% (V1.0 baseline 유지) | LLM 호출 비동기 분리로 보호 |
| NFR-6 | GPS 이상 탐지 false alarm | < 5건/100산책 (baseline) | 출시 후 1개월 실측 → V1.1 임계값 튜닝 |
| NFR-7 | LLM provider availability | 99.5% (Claude/OpenAI SLA) | fallback design |
| NFR-8 | 캡션 환각 (사실과 다른 캡션) | < 2% (50건 사용자 테스트) | 펫시터 수정·신고 비율 모니터 |

---

## 6. Constraints

- **C-1**: 1인 창업가 운영 (사용자 capacity ~2x 일반 1인)
- **C-2**: V1.0 출시 2026-06-07 ±2d 한도. 추가 +4d 슬립 시 모두의 창업 면접 단계 영향
- **C-3**: 백엔드 145 passed + PT jest 15 passed + TS 0 errors **회귀 0**
- **C-4**: Alembic 단일 head 유지
- **C-5**: 자금 1억원 합산 변경 0원
- **C-6**: 모두의 창업 사업비 집행 지침 준수 (예비비 5% 한도 등)
- **C-7**: 119 자동 발신 금지 (Q-2 변호사 자문 회신까지 휴먼 confirm 의무)
- **C-8**: 자체 AI 모델 학습 X (V2.0 TIPS 단계로 이연)

---

## 7. Architecture / Data Flow

### 7.1 모듈 구조 (신규)

```
backend/app/modules/ai/
├── __init__.py
├── llm_client.py              # Claude/OpenAI dual provider + cost counter + fallback
├── prompts/
│   ├── incident_classify.py   # 축 A 프롬프트
│   ├── caption_walk_photo.py  # 축 B+F 통합 프롬프트
│   └── moderation_korean.py   # 축 D 추가 한국어 룰
├── classifiers/
│   ├── incident.py            # 축 A
│   └── condition.py           # 축 F (B에 통합 호출)
├── generators/
│   └── photo_caption.py       # 축 B
├── moderation/
│   └── content_moderator.py   # 축 D (OpenAI Moderation API)
├── detectors/
│   └── gps_anomaly.py         # 축 E (LLM 미사용, 통계 알고리즘)
├── reports/
│   └── walk_summary.py        # 축 B 산책 종료 리포트 (jinja2)
└── cost/
    └── redis_cost_counter.py  # NFR-3 cost cap
```

### 7.2 외부 의존

```
anthropic >= 0.40.0    # 축 A·B·F (Claude Sonnet 4.x with Vision)
openai >= 1.40.0       # 축 D (Moderation API), fallback for A·B
tenacity >= 9.0.0      # retry policy (3 attempts, exponential backoff)
jinja2 >= 3.1          # 축 B 산책 리포트 HTML 템플릿 (이미 FastAPI에 포함)
```

`pip check` 사전 검증 (BE F-5) 의무 — 첫 단계.

### 7.3 데이터 흐름

**축 A (사고 신고)**:
```
펫시터 모바일 → POST /pt/walks/{id}/incident
              → DB INSERT (PtIncident)
              → 즉시 201 응답
              → BackgroundTasks: classify_incident(incident_id)
                                → llm_client.invoke(incident_classify_prompt)
                                → DB UPSERT (PtIncidentClassification)
                                → push 알림 (보호자·펫시터·운영자)
```

**축 B (사진 캡션)**:
```
펫시터 모바일 → S3 presigned PUT
              → POST /api/v1/storage/confirm (entity_type="walk_photo")
              → DB INSERT (WalkPhoto, caption_status="pending")
              → BackgroundTasks: generate_caption(walk_photo_id)
                                → llm_client.invoke_vision(caption_prompt, photo_url)
                                → DB UPDATE (caption + condition + caption_status="generated")
                                → WS publish (pt:walk:{id}:updates, type="photo_caption")
```

**축 E (GPS 이상)**:
```
펫시터 모바일 WS → /pt/ws/walks/{id} (GPS event)
                 → backend ws handler 내부 코루틴
                                → Redis ZADD pt:walk:{id}:gps_history
                                → ZREMRANGEBYSCORE (5분 trim)
                                → detect_anomaly() (통계 알고리즘)
                                → if anomaly: WS publish + non_response timer 시작
                 → 워커 모바일 WS receive (anomaly modal)
                 → 60초 timer (Redis counter)
                                → if no response: 보호자 push 알림
```

### 7.4 LLM Client (`llm_client.py`)

```python
class LlmClient:
    async def invoke(self, prompt: str, *, max_tokens: int, timeout: float) -> dict:
        # 1. cost cap check (Redis counter)
        # 2. tier routing: < 80% cap → primary (Sonnet), >= 80% → Haiku
        # 3. tenacity retry (3x, exp backoff)
        # 4. dual provider failover (Anthropic primary, OpenAI fallback)
        # 5. cost counter increment (estimated tokens × KRW/token)
        # 6. return parsed JSON or raise LlmError

    async def invoke_vision(self, prompt: str, image_url: str, *, max_tokens: int, timeout: float) -> dict:
        # Vision-capable model only (Claude Sonnet 4.x or GPT-4o)
```

**Dependency injection**: FastAPI `Depends(get_llm_client)` — 테스트 시 Mock 주입.

---

## 8. Interfaces / API / WS Events

### 8.1 신규 endpoint

| Method | Path | 용도 |
|---|---|---|
| POST | `/pt/walks/{id}/incident` | 사고 신고 (기존, 비동기 LLM 트리거 추가) |
| GET | `/pt/walks/{id}/incident/classification` | 분류 결과 조회 (WS 알림으로 도착 알 수 있음) |
| POST | `/api/v1/storage/confirm` | 기존, walk_photo 처리 시 BackgroundTask 트리거 |
| GET | `/pt/walks/{id}/photos` | WalkPhoto list 조회 (caption 포함) |
| PUT | `/pt/walks/{id}/photos/{photo_id}/caption` | 펫시터 캡션 수정 |
| DELETE | `/pt/walks/{id}/photos/{photo_id}` | 펫시터 사진 삭제 |
| POST | `/pt/captions/{caption_id}/report` | 보호자 부적절 신고 |
| GET | `/pt/walks/{id}/report` | 산책 리포트 HTML |
| PUT | `/pt/walkers/profile` | 자기소개 (모더레이션 동기 실행) |
| POST | `/pt/walks/{id}/review` | 후기 (모더레이션 동기 실행) |
| POST | `/pt/anomaly/{anomaly_id}/dismiss` | false alarm dismiss (보호자·워커) |

### 8.2 WS 이벤트 (기존 `/pt/ws/walks/{session_id}` 채널)

| type | payload | 발행자 |
|---|---|---|
| `gps_update` | `{lat, lng, ts}` | 워커 모바일 (기존) |
| `incident_classified` | `{incident_id, severity, type, action[]}` | 백엔드 (축 A 비동기 결과) |
| `photo_caption` | `{walk_photo_id, caption, condition, caption_status}` | 백엔드 (축 B+F) |
| `anomaly` | `{anomaly_id, kind, at}` | 백엔드 (축 E) |
| `anomaly_dismissed` | `{anomaly_id}` | 보호자·워커 |

---

## 9. Edge Cases

- **EC-1**: LLM API 응답 시간 > 8s (caption) → caption_status="failed", 펫시터 수동 입력 가능 화면 fallback
- **EC-2**: LLM 환각 ("다른 강아지가 공격" 같은 false 부정 사건) → 펫시터 1-tap 삭제 + 보호자 신고 → 운영자 큐 + 프롬프트 룰 갱신
- **EC-3**: GPS 손실 (터널·지하철) → sudden_stop 오탐 → 워커 1-tap dismiss → false alarm count 증가, 출시 후 1개월 임계값 튜닝
- **EC-4**: 워커 무응답 60초 (이어폰 착용 등) → 보호자 알림 1회 (긴급 X). 5분 추가 무응답 시 운영자 큐
- **EC-5**: 모더레이션 false positive (정상 후기 차단) → 자동 재검토 후에도 flag 시 운영자 큐 (펫시터 이의 신청)
- **EC-6**: LLM API 비용 100% cap 도달 → Haiku tier 자동 routing + 운영자 카카오 push
- **EC-7**: 보호자가 산책 종료 후 리포트 화면 닫고 다시 열 때 → `GET /pt/walks/{id}/report` 멱등 응답
- **EC-8**: 캡션 생성 중 산책 종료 → caption_status="pending" 상태로 표시, 완료 시 WS push로 갱신
- **EC-9**: GPS 이상 탐지 알고리즘이 5분 윈도우 데이터 부족 (산책 시작 1분 이내) → 알고리즘 활성화 안 함 (warmup 5분)

---

## 10. Failure Handling

| 실패 유형 | 처리 |
|---|---|
| LLM provider down (Claude) | OpenAI fallback (`tenacity` retry) |
| 양 provider 모두 down | 축 A: severity="medium" / 축 B: caption="" + 펫시터 수동 / 축 D: "검토 중" 상태 / 축 F: condition=null |
| Redis down | cost counter X → 모든 호출 Haiku tier 강제 (안전) |
| BackgroundTask 큐 적체 | APScheduler (alternative): job retry, dead-letter queue |
| `pip` 의존성 충돌 (firebase-admin vs anthropic) | 첫 단계 차단, 의존성 호환 버전 매트릭스 검색 |
| Alembic head 충돌 | 단일 head 강제 (V1.0 spec C-2). 충돌 시 merge revision 작성 |
| WalkPhoto 모델 마이그레이션 실패 | 롤백 + arrival_photo_url 단일 컬럼 fallback (V1.0 미배포 → 영향 없음) |

---

## 11. Testing Strategy

### 11.1 유닛 테스트
- `llm_client.py`: Mock Anthropic/OpenAI client. Cost counter mock. Failover 시나리오 5건.
- `incident_classifier.py`: 사고 시나리오 10건 (low·medium·critical 각 분포). 환각 시나리오 3건.
- `photo_caption.py`: Vision LLM mock. 사진 → 캡션 매핑 검증. Empathic tone 룰 (이모지 1개·감탄사 금지).
- `moderation/content_moderator.py`: 한국어 후기 50건 (정상 30 + 비정상 20) → false positive < 5% 검증.
- `gps_anomaly.py`: 시뮬레이션 GPS 시퀀스 (정상·sudden_stop·route_deviation·pace_surge) freezegun 활용.

### 11.2 통합 테스트
- POST `/pt/walks/{id}/incident` → 즉시 201 + BackgroundTask 검증 (mock LLM)
- POST `/api/v1/storage/confirm` (walk_photo) → caption_status 변화 검증
- WS event flow: gps_update → anomaly → dismiss
- Moderation 통합: PUT `/pt/walkers/profile` → flag → 자동 재검토 → 재flag → 운영자 큐

### 11.3 회귀 테스트
- 백엔드 145 passed → AI 추가 후 **160+ passed** 목표 (회귀 0)
- PT jest 15 passed → AI 모바일 hook 추가 후 **20+ passed**
- TS 0 errors 유지

### 11.4 사용자 테스트 (V1.0 출시 전)
- 한국 보호자 10명에게 자동 캡션 + 산책 리포트 demo → NPS 측정
- 펫시터 5명에게 모더레이션 flow demo → false positive 체감 측정
- GPS 이상 탐지는 베타 라벨 + 출시 후 1개월 데이터 누적 후 임계값 튜닝

### 11.5 사전 검증 (D-Day)
- **D-15 (5/15)**: `pip check` 의존성 호환 검증 → 결과 verification artifact 기록
- **D-10 (5/20)**: 한국어 모더레이션 50건 샘플 검증 (FR-D 기준 충족)
- **D-5 (5/25)**: 사진 캡션 환각 검증 (사용자 테스트 10명)
- **D-2 (5/30)**: GPS 이상 탐지 시뮬레이션 시나리오 4건 통과

---

## 12. Rollback Strategy

- **Feature flag**: 5축 각각 `PT_AI_ENABLE_INCIDENT|CAPTION|MODERATION|GPS_ANOMALY|CONDITION` 환경변수. 출시 후 문제 발생 시 1개 축만 끄기 가능.
- **Database rollback**: WalkPhoto·PtAiInsight·PtIncidentClassification·PtModerationFlag 4개 테이블 신규 → drop 가능 (Alembic downgrade)
- **API rollback**: 모든 신규 endpoint 비활성화 시 V1.0 baseline으로 복귀
- **WS event rollback**: 신규 WS 이벤트 4종 → 클라이언트는 알 수 없는 event 무시 (forward compatibility)
- **Cost cap rollback**: Redis cost counter 비활성화 시 cap 미적용 (위험) → flag 끄기 전 비용 모니터링 강화 필수

---

## 13. Acceptance Criteria

### 13.1 V1.0 출시 시점 (2026-06-07 ±2d)

- [ ] **A-1**: 사고 신고 POST 95p < 800ms (LLM 비동기 분리 검증)
- [ ] **A-2**: 사진 업로드 후 8초 내 자동 캡션 생성 (95p)
- [ ] **A-3**: 산책 종료 시 WalkSummaryScreen 자동 표시 (HTML 리포트)
- [ ] **A-4**: 펫시터 자기소개·후기 등록 시 모더레이션 < 500ms 동기 실행
- [ ] **A-5**: GPS 이상 탐지 시 워커 in-app modal + 60초 타이머 동작 (베타 라벨)
- [ ] **A-6**: 사진 컨디션 1줄 chip 표시 (B 캡션 응답에 통합, 베타 라벨)
- [ ] **A-7**: 펫시터 캡션 수정 / 보호자 신고 / dismiss 3-layer UX 모두 동작
- [ ] **A-8**: Redis cost counter 동작 + 80% threshold Haiku tier auto-routing 검증
- [ ] **A-9**: LLM provider failover 검증 (Anthropic down → OpenAI fallback)
- [ ] **A-10**: 백엔드 160+ passed / PT jest 20+ passed / TS 0 errors

### 13.2 신청서 5/15 제출 시점

- [ ] **A-11**: §혁신성 narrative 1.5문단 inject (5축 + 한국 first-mover)
- [ ] **A-12**: §시장성 narrative 1문단 inject (글로벌 트렌드 — Traini $7.5M·TTcare TIPS·Mars만 인용)
- [ ] **A-13**: §리스크 narrative 1문단 inject (Wag 파산 후 restructured + 통합 narrative 강화)
- [ ] **A-14**: §자금사용계획 inject (LLM API 200 + AI 인프라 100 + 외주 150 = 클라우드 -450 재배분)
- [ ] **A-15**: 5 페르소나 평균 76~82점 (consensus 보수 추정 +6~9 적용)

---

## 14. Out-of-Scope (V1.0 미포함, V1.1+ 이연)

- 자연어 매칭 추천 (축 C) — V1.1
- 다중 모달 컨디션 (사진 + 짖음 사운드) (축 F+) — V1.1
- 수의사 LLM 자가 진단 챗봇 (축 H) — V1.1
- TTcare SDK 실 통합 (축 G) — V1.2 (신청서는 추상화)
- 카카오 push 채널 통합 (B 리포트) — V1.1
- PDF 생성 (B 리포트) — V1.1
- GPS 이상 탐지 임계값 자동 학습 — V1.1
- 산책 패턴 정상 학습 + 이탈 알림 (Furbo 영감) — V1.2
- 펫 wearable 통합 (Traini 영감) — V2.0
- 자체 AI 모델 학습 — V2.0 (TIPS)

---

## 15. Code Impact Map

### 15.1 백엔드 신규 파일 (디렉토리 §7.1 참조)
- `backend/app/modules/ai/` — 신규 모듈 8개 sub-module
- `backend/app/apps/pettracker/router.py` — endpoint 8개 추가
- `backend/app/apps/pettracker/models.py` — `WalkPhoto`, `PtIncidentClassification`, `PtModerationFlag`, `PtAiInsight` 4개 모델
- `backend/migrations/versions/<new>_add_ai_models.py` — Alembic 1건 (4 테이블 통합)

### 15.2 백엔드 변경 파일
- `backend/app/apps/pettracker/router.py` — 기존 incident POST 핸들러를 BackgroundTasks 패턴으로 refactor
- `backend/app/modules/storage/router.py` — `/api/v1/storage/confirm` 핸들러에 walk_photo 트리거 추가
- `backend/requirements.txt` — anthropic·openai·tenacity 추가
- `backend/.env.example` — AI 환경변수 추가

### 15.3 모바일 신규 파일
- `packages/core-mobile/hooks/useAiCaption.ts`
- `packages/core-mobile/hooks/useAnomalyEvent.ts`
- `apps/pettracker/screens/WalkSummaryScreen.tsx`

### 15.4 모바일 변경 파일
- `apps/pettracker/screens/WalkScreen.tsx` — 다수 사진 state 재설계 (단일 → 배열)
- `apps/pettracker/screens/WalkerProfileScreen.tsx` — 자기소개 텍스트 필드 추가 + 모더레이션 결과 표시
- `apps/pettracker/screens/OwnerWalkTrackingScreen.tsx` — anomaly modal + 캡션 displayed
- `apps/pettracker/screens/IncidentReportScreen.tsx` — 분류 결과 표시 (WS 도착 시)

### 15.5 환경 변수 신규
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
PT_LLM_PRIMARY_PROVIDER=anthropic     # anthropic | openai
PT_LLM_MONTHLY_COST_CAP_KRW=2000000   # 200만원 cap
PT_LLM_FALLBACK_TIMEOUT_MS=10000      # 사고 신고 10s
PT_LLM_VISION_TIMEOUT_MS=8000         # 사진 캡션 8s
PT_AI_ENABLE_INCIDENT=true            # feature flag
PT_AI_ENABLE_CAPTION=true
PT_AI_ENABLE_MODERATION=true
PT_AI_ENABLE_GPS_ANOMALY=true
PT_AI_ENABLE_CONDITION=true
PT_GPS_ANOMALY_BETA_LABEL=true        # V1.0 베타 표기
```

---

## 16. Migration Plan (Alembic)

### 16.1 신규 migration 1건

```
backend/migrations/versions/<rev>_add_ai_models.py
- WalkPhoto (id PK, session_id FK→walk_sessions, s3_key, caption text, caption_status enum, condition varchar, created_at)
- PtIncidentClassification (id PK, incident_id FK→pt_incidents, severity enum, type enum, action JSON, classified_at)
- PtModerationFlag (id PK, target_type enum=profile|review, target_id, reason JSON, status enum, flagged_at, resolved_at)
- PtAiInsight (id PK, source_type enum=walk_photo, source_id, insight JSON, generated_at) — 향후 확장용
```

### 16.2 head 충돌 회피
- C-13/14 modal C-Storage·C-WS 작업과 동시 진행 → AI migration은 **Milestone D 완료 후**에 head 추가 (단일 head 보장)
- Alembic autogenerate 후 drop 검토 (`feedback_alembic_autogenerate_review.md` 메모리 룰 준수)

### 16.3 Rollback
- `alembic downgrade -1` → 4 테이블 drop. Production 데이터 손실 (rollback 시점에 데이터 적음 → 영향 적음)

---

## 17. Cost Estimation (LLM API)

### 17.1 V1.0 6개월 누적 추정 (사용자 50명 기준)

| 축 | 호출 빈도 | 단가 (USD) | 월 비용 (KRW) |
|---|---|---|---|
| A 사고 신고 | 100건/월 (50명 × 2건) | $0.005/호출 (Sonnet 입력 1.5K token + 출력 0.3K) | ~7,000원 |
| B 사진 캡션 | 1,000건/월 (200산책 × 5사진) | $0.025/호출 (Vision Sonnet) | ~33,000원 |
| D 모더레이션 | 200건/월 | $0/호출 (OpenAI Moderation API 무료) | 0원 |
| F 컨디션 | B에 통합 | $0 추가 | 0원 |
| 합계 (V1.0 50명) | — | — | **~40,000원/월** |
| 합계 (V1.0 500명, 가입자 10x 가정) | — | — | **~400,000원/월** |
| 합계 (V1.1 1,500명) | — | — | **~1,200,000원/월** |

→ 자금 1억원 6개월 LLM API 200만원 배정 = **300% 안전 margin** (실 사용량 50명 기준 6개월 24만원).

### 17.2 cap 정책
- 80% threshold (160만원 누적 시) → Haiku/gpt-4o-mini 자동 routing (Sonnet 가격 1/10)
- 100% threshold → 캐시된 fallback 응답 + 운영자 카카오 push
- 출시 후 3개월 실측 데이터 후 cap 재산정

---

## 18. Schedule Integration + 신청서 본문 변경안

### 18.1 Milestone D~G inject 일정

| Milestone | 기존 | AI 추가 후 | 차이 |
|---|---|---|---|
| C-13/14 (잔여 모바일) | 2.5d | 2.5d | 0 |
| **D (사고 신고 + 축 A)** | 4.0d | 5.0d | +1.0 |
| **신규: 축 B (사진 캡션 + 리포트)** | 0 | 2.5d | +2.5 |
| **신규: 축 D (모더레이션)** | 0 | 1.0d | +1.0 |
| **신규: 축 E (GPS 이상)** | 0 | 1.5d | +1.5 |
| **신규: 축 F (컨디션, B 통합)** | 0 | 0.5d | +0.5 |
| **신규: pip check + 비용 cap + WalkPhoto migration** | 0 | 1.0d | +1.0 |
| Milestone E (V1.1 트러스트, 일부 prepone X — Brief 안 철회) | 5.0d | 5.0d | 0 |
| F (통합 테스트) | 3.0d | 4.0d | +1.0 (AI 회귀 테스트) |
| G (Pre-launch QA + EAS) | 2.5d | 2.5d | 0 |
| **합계 잔여** | 17.0d | **25.0d** | **+8.0d** |

→ 사용자 capacity 2x 가정: ~12.5 effective d. 4/30 시점부터 영업일 12.5d → **2026-05-15 도착, 5/15 신청서 제출 직후부터 본격 시작**, V1.0 출시 **2026-06-07~06-09** (margin -1~+1d, 위험).

**조정안**: AI 5축 작업의 일부를 신청서 제출 후 시작 (5/15까지는 신청서 본문 작성 + 외부 작업 우선)

### 18.2 신청서 본문 변경안 매핑 (5/9 korean-grant-application-writer 입력)

#### §혁신성 (300~500자 추가)

```
[글로벌 펫 AI 트렌드 + 한국 매칭 segment first-mover]

한국 메이저 5개사(도그메이트·와요·펫플래닛·에어댕냥이·펫피)는 모두 정형
매칭(거리·평점·가격)에 머물러 있다. PT는 한국 펫 AI 매칭 segment에 AI
추론 레이어를 처음 도입한다.

V1.0 출시 시점에 다음 5축이 동작한다.
(1) 사고 신고 LLM 자동 분류·응급 우선순위 (severity·type·action 분류).
    5개사 중 사고 신고 자체를 지원하는 곳이 없으므로 first-mover 우위.
(2) 산책 사진 자동 캡션 + Empathic 리포트 (Vision LLM). 보호자에게
    산책 종료 즉시 in-app 카드.
(3) GPS 이상 탐지 + 워커 자동 check-in (Edge AI 통계 알고리즘). 5개
    한국 경쟁사 모두 미보유.
(4) 펫시터 자기소개·후기 LLM 모더레이션. 신원조회 깊이를 와요·펫플래닛
    동급으로.
(5) 사진 → 펫 컨디션 1줄 추정 (베타). V1.1에서 정밀화.

V1.1(출시 +45일): 자연어 매칭 추천 + 수의사 LLM 자가 진단 챗봇 + 다중
모달 컨디션 추정. V1.2: 국내 펫 헬스케어 AI 사업자와 기술 협력 탐색.

글로벌 동종 사례: Traini가 2025년 12월 $7.5M 투자(NVIDIA·Anthropic·
Google·Meta 임원 LP)로 GenAI 펫 통역 출시, AI for Pet/TTcare가 한국
첫 AI 동물 의료기기 SW 인증·TIPS R&D 선정, Mars Petcare가 사진 1장 →
AI 진단 도입. PT는 한국 매칭 segment에 동일한 도구를 가져온다.
```

#### §리스크 (100~150자)

```
Wag(미국)는 AI matchmaking 전략으로 운영 후 2025-07 파산, restructured
운영 중이다. 이는 AI 매칭만으로는 손익분기점에 도달하지 않음을 입증한다.
PT는 매칭 + 사고 신고 의무 자동화 + 보험 가맹 + 신원조회 통합 4중 안전망
구조로 차별화한다.
```

#### §시장성 (200~300자)

```
한국 펫 AI 생태계는 헬스케어(AI for Pet/TTcare TIPS R&D + SaMD 인증,
Pawzmedi 펫 체성분 분석) + 보험(Pawchi Series A $4.5M) 도메인에서 활성
화되어 있고, 매칭·산책 segment는 미진출 white space다. PT는 V1.0 출시
시점에 AI 5축으로 first-mover 진입하며, V1.2 단계에서 국내 펫 헬스케어
AI 사업자와의 기술 협력을 탐색한다.
```

#### §자금사용계획 변경

기존 자금 1억원 배분에서 다음 매핑:
- 서버·인프라 800만 → 350만 (-450만), 그 안에 LLM API 6개월 200만 + AI 인프라 (Vector Store, V1.1 준비) 100만 흡수
- 외주용역비 4,500만 → 4,500만 그대로 유지 (TTcare 협력 PoC는 추상화로 변경 — D-2=2 결정 — 외주 별도 항목 없음)
- 합계 1억원 변경 0원

#### §실현가능성 (50~100자 추가)

```
LLM API 비용 cap 200만원/월 시스템 내재화. 초과 시 Claude Haiku·GPT-4o
mini 자동 routing. 출시 3개월 실측 후 재산정.
```

### 18.3 EXT 외부 작업 등록

| ID | 작업 | 마감 |
|---|---|---|
| EXT-3 | competitor-matrix §2 표에 "AI 기능 보유 여부" 행 추가 (도그메이트❌ / 와요❌ / 펫플래닛❌ / 에어댕냥이❌ / 펫피❌ / PT✓) | 5/9 |
| EXT-4 | 자금 계획 재배분 매핑 명시 (서버 800→350, LLM 200, AI 인프라 100) | 5/9 |
| EXT-5 | LOI 5건 AI 자문 영역 inject (#1 수의사 "사진 컨디션 임상 적합성" / #4 UX "AI 캡션 수정 UI") | 5/8 게이트 전 |
| ~~EXT-1 TTcare 접촉~~ | ❌ 취소 (D-2=2 추상화) | — |
| ~~EXT-2 글로벌 출처~~ | ❌ 취소 (D-7=2 삭제) | — |

---

## 19. Verification (본 spec)

| 항목 | 결과 |
|---|---|
| CLAUDE.md Phase 3 18 섹션 | VERIFIED (1~18) |
| 사용자 결정 D-1=5축 / D-2=추상화 / D-7=출처 삭제 반영 | VERIFIED (§4 5축 + §18 narrative + §18 EXT 취소) |
| Consensus 자동 반영 15건 | VERIFIED |
| 묵시 동의 4건 (D-3·4·5·6) | VERIFIED (§4-1 비동기 / §18 +45 / §17 200만 / §4-2 tone) |
| Brief Open Question 10건 답변 | Q-1=듀얼 (§7.4) / Q-2=휴먼 confirm (FR-A6) / Q-3=PM 기준 (FR-B4) / Q-4=별도 트랙 (보강 산출물 진행 중) / Q-5=백엔드 WS (FR-E1) / Q-6=Haiku tier (§17.2) / Q-7=자동 재검토 (FR-D3) / Q-8=Redis (§7) / Q-9=narrative 옵션 B 채택 (§18.2) / Q-10=운영자 큐 (FR-A5) |
| Brief Acceptance A-1~A-8 → §13 mapping | VERIFIED |
| Code impact map (§15) ↔ FR (§4) ↔ Tests (§11) cross-ref | VERIFIED |

---

## 20. Next Steps

| Phase | 상태 | 산출물 |
|---|---|---|
| Phase 0 Brief | ✅ 완료 | `2026-04-29-pt-ai-differentiation-brief.md` |
| Phase 1 Reviews 3건 | ✅ 완료 | `2026-04-29-pt-ai-differentiation-{backend,product,fundraising}-review.md` |
| Phase 2 Consensus | ✅ 완료 | `2026-04-29-pt-ai-differentiation-consensus.md` |
| Phase 3 Final Tech Spec | ✅ **본 문서** | `2026-04-29-pt-ai-differentiation-final-tech-spec.md` |
| 차별화·Moat·BM 보강 (병렬) | 🟡 진행 중 (BOM agent background) | `2026-04-30-pt-differentiation-moat-bm-deepening.md` |
| Phase 4 Todo Plan | 🟡 대기 | `2026-04-30-pt-ai-differentiation-todo-plan.md` |
| Phase 5 Implementation | 🟡 대기 (5/15 신청서 제출 후 본격 시작 권장) | Milestone D~G inject |
| 신청서 본문 작성 (5/9) | 🟡 대기 | korean-grant-application-writer 호출 |

---

## 21. References

- [`2026-04-29-pt-ai-differentiation-brief.md`](2026-04-29-pt-ai-differentiation-brief.md) — Phase 0 Brief
- [`2026-04-24-pt-quality-uplift-final-tech-spec.md`](2026-04-24-pt-quality-uplift-final-tech-spec.md) — PT V1.0 baseline Tech Spec
- [`2026-04-24-pt-quality-uplift-todo-plan.md`](../plans/2026-04-24-pt-quality-uplift-todo-plan.md) — V1.0 Todo Plan
- [`2026-04-29-pt-ai-differentiation-consensus.md`](../reviews/2026-04-29-pt-ai-differentiation-consensus.md) — Phase 2 Consensus
- [`2026-04-29-modoo-startup-pt-competitor-matrix.md`](../business/fundraising/2026-04-29-modoo-startup-pt-competitor-matrix.md) — 5개 경쟁사
- [`2026-04-29-modoo-startup-budget-guide-summary.md`](../business/fundraising/2026-04-29-modoo-startup-budget-guide-summary.md) — 자금 1억원 배분
