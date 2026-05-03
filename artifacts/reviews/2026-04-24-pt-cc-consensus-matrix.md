# Consensus Matrix — PT/CC 품질 향상 계획

**작성일:** 2026-04-24
**Phase:** 2 — Consensus
**입력 리뷰:**
- backend-dev (구현·아키텍처) — VERIFIED 회수
- korea-regulatory-counsel (사고 신고 법령·신고의무자) — VERIFIED 회수
- tech-spec-reviewer (전체 stress-test) — 회수 대기 (백그라운드 진행 중, 도착 시 V2 업데이트)

**기반 계획:** [`artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md`](../specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md)

**사용자 확정 결정 (6건):**
1. PT 우선 출시 (CC는 PT 안정화 후 사이클)
2. S3 호환 = AWS S3
3. WebSocket 실시간 = 출시 전 필수
4. 사고 신고 = 법적 의무 연계 필수
5. 결제 추가 = PortOne v2
6. 회원 관리 = Firebase Auth

---

## 1. 항목별 합의 매트릭스

### 1.1 PortOne v2 결제 통합

| 항목 | backend-dev 의견 | 합의 결정 |
|---|---|---|
| 위치 | `backend/app/modules/billing/providers/portone.py` 신규 + `base.py`로 추상화 | **승인** |
| Toss와의 관계 | 공존: SafeWay = Toss, PT/CC = PortOne | **승인** (Toss webhook 변경 없음) |
| 모델 변경 | `Payment.payment_provider: String(20)` 컬럼 추가, server_default="toss" | **승인** (Alembic 1건) |
| Webhook 검증 | `X-PortOne-Signature` HMAC-SHA256, fail-closed | **승인** (Toss 패턴 재사용) |
| 부분환불 | 양 provider에 `cancel_amount: int \| None` 파라미터 추가 | **승인** |
| LOC 예상 | ~250 LOC, 1.5일 | **승인** |
| 우선순위 | PT 출시 전 필수 | **승인** |
| 미해결 | PortOne v2 구체 SDK 라이브러리 (`portone-server-sdk-python` vs requests 직접) | tech-spec-reviewer 회수 후 확정 — 기본은 requests 직접 호출 (외부 의존 최소) |

### 1.2 Firebase Auth 전환 (PT/CC만)

| 항목 | backend-dev 의견 | 합의 결정 |
|---|---|---|
| 위치 | `backend/app/middleware/firebase_auth.py` 신규 dependency | **승인** |
| SafeWay 영향 | SafeWay는 JWT 유지, PT/CC만 Firebase | **승인** (SafeWay 회귀 0) |
| 모델 변경 | `User.firebase_uid: String(128) unique nullable` 추가 | **승인** (Alembic 1건) |
| Kakao OAuth | Firebase Custom Token 발급 방식 (OIDC Custom Provider 대비 단순) | **승인** |
| 기존 사용자 마이그레이션 | PT/CC 미출시 → 부담 없음 | **승인** |
| 듀얼 인증 미들웨어 | dependency 주입으로 라우터별 분리, 혼용 미들웨어 회피 | **승인** |
| LOC 예상 | ~150 LOC, 1일 | **승인** |
| 우선순위 | 베타 전 필수 (출시 직전 가능) | **PT 베타 직전 적용**으로 결정 — Milestone B에 배치 |
| 미해결 | Firebase 프로젝트 분리 (PT/CC 각각 vs 단일) | **단일 프로젝트 + tenant 분리** 권고 (운영 단순화) |

### 1.3 AWS S3 + Presigned URL 업로드

| 항목 | backend-dev 의견 | 합의 결정 |
|---|---|---|
| 위치 | `backend/app/modules/storage/{s3,router,schemas}.py` 신규 (3앱 공통) | **승인** |
| 엔드포인트 | 단일 `POST /api/v1/storage/upload-url` + entity_type 파라미터 | **승인** |
| Prefix 패턴 | `{app_context}/{entity_type}/{user_id}/{uuid}.{ext}` | **승인** |
| KMS 암호화 | CC 아동 사진 = 필수, PT = 선택 | **승인** (KMS는 출시 전 필수, PT는 default off) |
| Confirm 패턴 | 클라이언트 PUT → 백엔드 confirm 엔드포인트 → `s3:HeadObject` 검증 | **승인** |
| LOC 예상 | ~230 LOC, 1일 | **승인** |
| 우선순위 | PT 출시 전 필수 | **승인** |
| 라이브러리 | `boto3` 또는 `aioboto3` | **`aioboto3`** (FastAPI 비동기 일관성) |

### 1.4 WebSocket 일반화 (PT/CC 채널)

| 항목 | backend-dev 의견 | 합의 결정 |
|---|---|---|
| 위치 | `backend/app/middleware/ws_auth.py` 신규 (공통 추출) + 앱 라우터에 핸들러 | **승인** |
| Redis 채널 | `pt:walk:{session_id}:updates`, `cc:care:{session_id}:updates` | **승인** |
| PT 패턴 | walker GPS broadcast → owner subscribe (HTTP GPS 엔드포인트 병행 유지) | **승인** |
| CC 패턴 | 이벤트 알림성 → WS는 옵션, 백그라운드는 FCM (하이브리드) | **승인** |
| Firebase 인증 | `ws_auth.py`에서 Firebase ID token 분기 처리 | **승인** |
| LOC 예상 | ~225 LOC, 0.5일 | **승인** |
| 우선순위 | PT WS = 출시 전 필수, CC WS = 후속 가능 | **PT 출시 전 필수, CC는 출시 후 V1.1.5** |
| 의존 순서 | Firebase 전환 전에 JWT WS 먼저 구현 → Firebase 전환 시 ws_auth.py만 수정 | **승인** (안전한 2단계) |

### 1.5 사고 신고 기능 (법적 의무 연계)

| 항목 | korea-regulatory-counsel 의견 | 합의 결정 |
|---|---|---|
| **PT 적용 법령** | 동물보호법 §10/§14/§16, 민법 §759, 형법 §266/§267 | **모두 spec 반영** |
| **CC 적용 법령** | 아동복지법 §26, 아학처법 §10, 응급의료법 §6, 성범죄자 취업제한법 §56 | **모두 spec 반영** |
| **신고 시점** | PT/CC 모두 사고 발생 후 즉시(지체없이), 학대 의심 24시간 내 | **MUST** — 앱 내 시점 기록 |
| **외부 채널** | PT: 119/112/시군구 동물보호센터 / CC: 119/112/1577-1391 | **MUST** — 앱에서 원터치 다이얼링 |
| **필수 데이터** | PT: 등록번호+GPS+시각+유형+사진+진술 / CC: 아동 신원+GPS+시각+유형+사진+진술 | **MUST** — 폼 필수 필드 |
| **보존 기간** | 최소 5년 (민법 §766 소멸시효 기준), 학대 의심은 영구 보존 | **MUST** — DB retention 정책 |
| **암호화** | 전송 TLS 1.2+, 저장 AES-256 (이미 SafeWay에 구축됨, 재사용) | **승인** |
| **UI 의무 안내** | 신고의무자에게 의무 고지 텍스트 표시 | **MUST** — 사고 신고 화면 상단 |
| **신고 후 잠금** | 제출 후 편집 불가 (증거 무결성) | **MUST** — append-only 모델 |
| **온보딩 전제** | CC: 돌봄사 성범죄자 신원 조회 필수 (현재 미구현) | **선행 작업으로 추가** — Milestone A에 포함 |
| **플랫폼 면책 한계** | 전자상거래법 §20 부분 면책, 완전 면책 불가 | **약관 검토 별도 트랙** |
| **변호사 확인 5건 (Q-L1~5)** | 점유자 판정·신고의무자 해당·면책 범위·보존기간·산재 의무 | **spec에 "변호사 확정 후" 마커 + K-Startup 무료 자문 라우트** |

### 1.6 PT 우선 출시 결정

| 항목 | 분석 | 합의 결정 |
|---|---|---|
| `packages/core-mobile` 영향 | CC도 의존 → 공유 코드 변경 시 CC도 같이 update 필요 | **승인** — 공유 코드 변경은 CC TS 회귀 즉시 확인 |
| 백엔드 공유 (PortOne, Firebase, S3, WS) | 공유 모듈로 만들되 PT 라우터에만 적용, CC 라우터는 후속 | **승인** |
| CC 적용 시점 | PT 안정 출시 (D+30) 후 별도 V1.1 사이클 | **승인** |
| CC 잔여 미흡 (O4 Handover, CC-23 사진) | PT 출시 전에 미루지 말고 같이 정리 (회귀 영향 최소) | **승인** — Milestone A에 CC 잔여 5건 포함 |

---

## 2. 일정 재산정 (PT 우선 + 출시 전 필수 항목 합산)

| 마일스톤 | 작업 | 예상 시간 |
|---|---|---|
| Phase 0 검증 | 베이스라인 (백엔드 pytest + PT/CC TS + SafeWay 회귀) | 0.5일 |
| Milestone A | 잔여 5건 정리 (PT 4건 + CC 4건) + 돌봄사 성범죄자 조회 | 3일 |
| Milestone B | 모바일 테스트 인프라 (Jest + RTNL) — PT 우선 | 3일 |
| Milestone C | PortOne v2 (1.5d) + AWS S3 (1d) + WS PT 채널 (0.5d) — 출시 전 필수 | 3일 |
| Milestone D | Firebase Auth 전환 (PT only, 베타 직전) | 1일 |
| Milestone E | 사고 신고 기능 (법적 의무 + UI + DB + 외부 다이얼링) | 3일 |
| Milestone F | V1.1 트러스트 P0 (즐겨찾기·정기예약·산책리포트) — PT only | 4일 |
| Milestone G | 백엔드 통합 테스트 (PT e2e + commission) | 2일 |
| Milestone H | Pre-launch QA + 문서화 + EAS Build | 2일 |
| **PT 출시 합계** | | **~21.5일 (4.5주)** |
| Milestone I (후속) | CC 동일 통합 + V1.1 + Admin Web | 별도 사이클 |

> 5주 일정 현실적 — 단 변호사 자문 5건 회신 지연 시 사고 신고 기능 일부가 출시 후 패치 (V1.0.1)로 밀릴 수 있음.

---

## 3. 미해결 / 변호사 확정 필요 (Q-L1~Q-L5)

| ID | 질문 | spec 영향 | 우선순위 |
|---|---|---|---|
| Q-L1 | PT — 점유자(민법 §759) 판정 (산책사 vs 견주 vs 공동) | 약관·면책 문구 + 사고 신고 책임 안내 | HIGH |
| Q-L2 | CC — 돌봄사가 아동복지법 §26 신고의무자에 해당하는지 | UI 의무 안내 텍스트 + 신고 의무 알림 | HIGH |
| Q-L3 | 양 앱 — 전자상거래법 §20 플랫폼 면책 범위 | 약관 + 사고 화면 disclaimer | MEDIUM |
| Q-L4 | 양 앱 — 사고 데이터 보존 5년/영구 vs 개보법 §21 즉시 파기 | DB retention + 자동 파기 정책 | HIGH |
| Q-L5 | 양 앱 — 산재법 §125 특수형태근로종사자 산책사·돌봄사 포함 여부 | 보험 가입·신고 의무 + 사고 후 산재 신청 플로우 | MEDIUM |

→ **K-Startup 무료 일반상담** Q-L1·Q-L4 (단순), **K-Startup 심화상담** Q-L2·Q-L3 (복잡), **9988 전화** Q-L5

---

## 4. 권고 — Tech Spec에 반드시 포함될 항목

1. **사용자 결정 6건 명시 + 결정 일자**
2. **Open Questions 5건(Q-L1~Q-L5)** + 각 영향 범위 + 변호사 회신 전 임시 처리 방침
3. **Toss/PortOne 공존 표** — SafeWay = Toss / PT/CC = PortOne 명시
4. **JWT/Firebase 듀얼 인증 표** — 라우터별 dependency 매핑
5. **S3 prefix 패턴 + IAM 정책 예시 JSON**
6. **WebSocket 채널 명명 규칙 + Redis pub/sub 시퀀스 다이어그램**
7. **사고 신고 데이터 모델 (PT IncidentReport, CC IncidentReport)** + 보존 정책
8. **PT 우선 출시 → CC 후속 사이클 ROADMAP 표**
9. **변호사 확정 후 spec V1.1로 업데이트** 가이드라인
10. **회귀 테스트 매트릭스** — 결제·인증 동시 전환 영향 영역

---

## 5. tech-spec-reviewer 결과 통합 (V2 업데이트)

**판정:** REVISE BEFORE IMPLEMENTATION — backend-dev의 "변경 작음" 판단을 한 단계 더 깊이 본 결론.

### 5.1 결정적 발견 (Must-fix before Implementation)

| # | 발견 | 영향 | 채택 결정 |
|---|---|---|---|
| TR-1 | `BillingPlan/Invoice` 모델은 `academy_id`/`student_id` 하드 외래키 → **PT/CC 재사용 불가** | backend-dev "Payment.payment_provider 컬럼 추가만으로 충분" 의견을 뒤집음 | **PT/CC 전용 `PtPayment`, `CcPayment` 모델을 `apps/{pettracker,careconnect}/models.py`에 신설** |
| TR-2 | PortOne·Toss webhook 동일 엔드포인트 충돌 | 결제 이중 처리 또는 누락 | **`/billing/webhook/toss`, `/billing/webhook/portone` 분리** |
| TR-3 | WS 출시 전 필수 → Critical Path 재배열 필요 | 계획서의 Critical Path가 WS를 출시 후에 둠 | **Critical Path: Phase 0 → A → C(결제·S3·WS) → D(테스트) → E(사고신고) → F(V1.1) → 출시** |
| TR-4 | `users` 테이블 단일 Alembic head → SafeWay DB 동시 영향 | `firebase_uid` 추가 마이그레이션 시 SafeWay 운영 DB도 함께 적용 | **단일 head 유지 + nullable 컬럼 추가는 안전 (확인됨), pre-migration smoke test 의무** |
| TR-5 | C-6/C-7 사고 신고가 P1로 분류됨 → 사용자 결정 #4와 모순 | 법적 의무 연계 누락 위험 | **C-6/C-7을 P0 격상 + 자체 마일스톤(E)으로 분리** |
| TR-6 | RRULE 정기예약(C-2/C-3)이 PortOne 결제 자동화에 의존 | C-2/C-3는 PortOne 완료 후 가능 | **PortOne 마일스톤이 정기예약보다 선행** (의존성 그래프에 명시) |
| TR-7 | Open Question Q1/Q2/Q4 미닫음 — 사용자 결정으로 이미 닫혔는데 계획서가 미반영 | 혼선 | **Q1=PT 우선 / Q2=AWS / Q4=출시 전 필수로 close, Tech Spec Assumption Register로 이동** |
| TR-8 | core-mobile 변경 시 CC 회귀 위험 | PT 작업 중 core-mobile에 PT 전용 hook 추가 시 CC 빌드 깨짐 | **core-mobile 하위 호환 규칙 명시 + PT 전용 로직은 `apps/pettracker/` 내부 유지** |

### 5.2 Conflict 해결 — backend-dev vs tech-spec-reviewer

| 항목 | backend-dev 권고 | tech-spec-reviewer 권고 | 최종 채택 |
|---|---|---|---|
| Payment 모델 처리 | `Payment.payment_provider` 컬럼 추가로 단일화 | PT/CC 전용 `PtPayment`/`CcPayment` 신설 | **tech-spec-reviewer 채택** — academy_id 외래키 충돌 회피 |
| Webhook 경로 | (명시 없음) | `/billing/webhook/{toss,portone}` 분리 | **tech-spec-reviewer 채택** — 라우팅 충돌 회피 |
| Firebase 도입 시점 | 베타 직전 (Milestone D) | 미들웨어 분기로 dual auth 즉시 가능 | **출시 전 필수, Milestone B에 배치** (사용자 결정 #6 일관성) |
| WS 우선순위 | PT WS = 출시 전 필수, CC WS = 후속 | 동일 | **합의** |
| 사고 신고 우선순위 | (다루지 않음) | P0 격상 | **P0 격상** (사용자 결정 #4 일관성) |

### 5.3 일정 재산정 (V2)

tech-spec-reviewer가 7~8주를 제시. backend-dev는 4일 내외(통합만). 차이는 (a) 모델 신설 추가 (b) 듀얼 인증 미들웨어 (c) 사고 신고 법적 요구 정의 시간 (d) 회귀 테스트 작성.

**최종 합의:** PT 출시 전 필수 = **6주 (30 영업일)** — Section 2 표를 다음과 같이 재정정한다.

| 마일스톤 | 작업 | 영업일 |
|---|---|---|
| Phase 0 | 베이스라인 검증 | 0.5d |
| A | 잔여 8건 정리 (PT4 + CC4) + 돌봄사 성범죄자 조회 | 3d |
| B | 모바일 테스트 인프라 (PT 우선) + Firebase Auth 미들웨어 분기 | 4d |
| C | PortOne v2 + PT/CC 전용 PtPayment 신설 + AWS S3 + PT 산책 WS | 5d |
| D | 사고 신고 기능 (P0, 법적 의무 연계, PT/CC 모델·UI·외부 다이얼링) | 4d |
| E | V1.1 트러스트 P0 (즐겨찾기·정기예약·산책 리포트) — PT only | 5d |
| F | 백엔드 통합 테스트 + 도메인 분리(선택) + 회귀 매트릭스 | 3d |
| G | Pre-launch QA + EAS Build + 문서화 | 2.5d |
| **PT 출시 합계** | | **27 영업일 (~5.5주)** |

> 변호사 자문 5건(Q-L1~Q-L5) 회신이 D 시작 전에 필요. 무료 K-Startup 일반상담은 D+3, 심화상담은 D+14 회신.

### 5.4 Critical Path (V2)

```
Phase 0 (0.5d)
  ↓
A 잔여 정리 (3d) ──┐
  ↓                ├─ B 테스트 인프라 + Firebase 미들웨어 (4d, A와 부분 병렬)
  ↓                │
C PortOne + S3 + WS (5d, B 의존)
  ↓
D 사고 신고 (4d, A의 돌봄사 신원조회 의존, C의 storage 의존)
  ↓
E V1.1 트러스트 (5d, C의 PortOne 정기결제 의존)
  ↓
F 백엔드 통합 테스트 (3d)
  ↓
G Pre-launch QA (2.5d)
  ↓
PT 출시
```

CC 사이클은 PT 출시 + 30일 안정화 후 별도 시작.
