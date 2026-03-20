# Final Tech Spec: SAFEWAY KIDS 프로덕션 배포 준비

**작성일:** 2026-03-20
**상태:** APPROVED
**근거 문서:** Intake (2026-03-20), Independent Review, Consensus Matrix

---

## 1. Problem Statement

SAFEWAY KIDS 플랫폼은 개발 환경에서만 동작하며 프로덕션 배포가 불가능한 상태이다. 규제 샌드박스 심사 대비 실동작 데모 및 파일럿 운영을 위해 소프트웨어를 프로덕션 수준으로 끌어올려야 한다.

---

## 2. Goals / Non-goals

### Goals
| ID | 목표 | 범위 조정 |
|----|------|----------|
| G1 | 프로덕션 인프라 코드 작성 | Dockerfile 최적화, K8s 매니페스트, CI/CD, nginx SPA 배포 |
| G2 | PG 결제 연동 | 토스페이먼츠 SDK 연동 코드 (테스트 모드) |
| G3 | 배차 엔진 실거리 검증 | **이미 구현됨** → API 키 설정 + 통합 테스트 추가로 축소 |
| G4 | 프론트엔드 테스트 | jest-expo + Vitest 설정, 핵심 화면 테스트 |
| G5 | 백엔드 테스트 안정화 | 2개 오류 수정 |
| G6 | 미완성 기능 보완 | 엑셀 업로드, 관리자 학생화면, 법적 증빙 아카이브 |
| G7 | 보안 강화 | CORS 설정, rate limiting, debug=False, 시크릿 fail-fast |
| G8 | 에러 핸들링 + UX | 사용자 피드백 UI, 에러 바운더리 |
| G9 | SMS/FCM 프로덕션 준비 | **이미 구현됨** → 환경변수 문서화로 축소 |
| G10 | 운영 도구 | 구조적 로깅 (JSON stdout), K8s CronJob 전환 |

### Non-goals
- 엣지 AI 개발, 안면인식, 이상행동 감지
- 앱스토어/플레이스토어 제출
- 실서버 K8s 클러스터 프로비저닝
- 제3자 보안 감사, 부하 테스트
- PDPA 영향평가 (법무팀 영역)
- EAS 네이티브 빌드

---

## 3. Architecture / Data Flow

### 프로덕션 배포 아키텍처

```
[Internet]
    │
    ▼
[Ingress Controller (nginx)]
    ├── /api/*  → [Backend Pod (FastAPI)] ── [PostgreSQL] ── [Redis]
    ├── /       → [Web Dashboard Pod (nginx + React SPA)]
    └── /site/* → [Landing Site Pod (nginx + React SPA)]

[K8s CronJob] ── 매일 00:00 KST ── [Nightly Pipeline Job]
[K8s Job]     ── 배포 시 ── [Alembic Migration Job]
```

### 변경 요약
| 현재 | 변경 후 |
|------|---------|
| APScheduler 내장 | K8s CronJob 외부화 |
| Alembic 시작 시 실행 | K8s Job으로 분리 |
| debug=True 기본 | production에서 fail-fast |
| placeholder 시크릿 | 환경변수 필수 주입 |
| SPA 배포 없음 | nginx 컨테이너 |

---

## 4. Milestone 구조 및 상세

### MP-1: 백엔드 프로덕션 강화

#### MP-1.1: 시크릿 및 보안 강화
- [ ] `config.py` — 프로덕션에서 placeholder 값 사용 시 startup error 발생
- [ ] `config.py` — `debug=False` as default, 환경변수로 override
- [ ] CORS — 프로덕션 origin whitelist 설정 (`cors_origins: list[str]`)
- [ ] Rate limiting — `/api/v1/auth/*` 엔드포인트에 `slowapi` 적용
- [ ] `.env.example` 업데이트 — 모든 필수 환경변수 문서화

#### MP-1.2: 백엔드 테스트 수정
- [ ] 2개 테스트 오류 진단 및 수정 (SQLite database locked)
- [ ] Kakao Mobility API 통합 테스트 추가 (mock 기반)
- [ ] 전체 테스트 green 확인

#### MP-1.3: PG 결제 연동 (토스페이먼츠)
- [ ] `billing/providers/toss_payments.py` — 토스페이먼츠 SDK 래퍼
  - 결제 승인 (confirm)
  - 결제 취소 (cancel)
  - 웹훅 수신 (payment.done, payment.canceled)
- [ ] `billing/router.py` — 새 엔드포인트 추가
  - `POST /billing/payments/confirm` — 결제 승인 처리
  - `POST /billing/payments/webhook` — 토스 웹훅 수신
  - `POST /billing/invoices/{id}/pay` — 학부모 결제 시작
- [ ] `billing/models.py` — Payment 모델에 `pg_payment_key`, `pg_order_id` 필드 추가
- [ ] Alembic 마이그레이션 생성
- [ ] 토스 테스트 시크릿 키로 통합 테스트

#### MP-1.4: 엑셀 학생 일괄 업로드
- [ ] `student_management/router.py` — `POST /students/bulk-upload` 엔드포인트
- [ ] 지원 형식: `.xlsx` (openpyxl)
- [ ] 컬럼 매핑: 이름, 생년월일, 학년, 보호자 전화번호, 학원명
- [ ] 에러 응답: 행별 성공/실패 상세 (partial success 허용)
- [ ] 최대 500행 제한
- [ ] 중복 감지: 이름 + 생년월일 + 보호자 전화번호 기준

#### MP-1.5: 법적 증빙 아카이브
- [ ] `compliance/models.py` — `ComplianceDocument` 모델
  - document_type (보험증명서, 신고필증, 안전교육이수증 등)
  - file_path, uploaded_at, expires_at, academy_id
- [ ] `compliance/router.py` — 파일 업로드/조회/만료 목록 엔드포인트
- [ ] 만료 30일 전 알림 트리거

#### MP-1.6: 구조적 로깅
- [ ] structlog JSON 포맷 설정 (stdout 출력)
- [ ] 요청/응답 로깅 미들웨어
- [ ] 스케줄링 파이프라인 로깅 강화

---

### MP-2a: 프론트엔드 테스트 인프라 (MP-1과 병렬)

#### MP-2a.1: 모바일 테스트 설정
- [ ] `jest-expo`, `@testing-library/react-native` 설치
- [ ] jest.config.js, setup 파일 구성
- [ ] 네비게이션 mock, API client mock 설정
- [ ] 핵심 화면 테스트 10개:
  - LoginScreen, ParentHomeScreen, ParentMapScreen, ParentBillingScreen
  - DriverHomeScreen, DriverRouteScreen
  - EscortShiftsScreen, EscortAvailabilityScreen
  - AdminDashboardScreen, useAuth hook

#### MP-2a.2: 웹 대시보드 테스트 설정
- [ ] Vitest, `@testing-library/react` 설치
- [ ] vitest.config.ts 구성
- [ ] 핵심 페이지 테스트 5개:
  - LoginPage, DashboardPage, StudentsPage, BillingPage, Layout

---

### MP-2b: 프론트엔드 기능 보완 (MP-1 완료 후)

#### MP-2b.1: 관리자 학생 관리 화면 완성
- [ ] `admin/StudentsScreen.tsx` (모바일) — CRUD UI
- [ ] `web/src/pages/StudentsPage.tsx` — 검색/필터/추가/수정/삭제

#### MP-2b.2: 에러 핸들링 강화
- [ ] 모바일 — API 에러 시 Toast/Alert 피드백
- [ ] 모바일 — 네트워크 연결 실패 화면
- [ ] 웹 — API 에러 Toast 컴포넌트
- [ ] 웹 — React Error Boundary

#### MP-2b.3: PG 결제 UI (모바일)
- [ ] 학부모 BillingScreen — "결제하기" 버튼 → 토스페이먼츠 결제창 연동
- [ ] 결제 완료 콜백 처리
- [ ] 결제 상태 실시간 반영

---

### MP-3: 인프라 및 배포

#### MP-3.1: Dockerfile 최적화
- [ ] Multi-stage build (builder + runtime)
- [ ] Non-root user (`USER app`)
- [ ] Alembic 제거 (별도 Job)
- [ ] HEALTHCHECK 추가
- [ ] .dockerignore 작성

#### MP-3.2: K8s 매니페스트
- [ ] `deploy/k8s/` 디렉토리 생성
- [ ] backend: Deployment, Service, HPA
- [ ] web: Deployment (nginx), Service
- [ ] site: Deployment (nginx), Service
- [ ] Ingress (nginx-ingress)
- [ ] ConfigMap (비밀이 아닌 설정)
- [ ] Secret (환경변수 참조 템플릿)
- [ ] Migration Job (init)
- [ ] CronJob (nightly pipeline)
- [ ] liveness/readiness probe 설정

#### MP-3.3: SPA Dockerfile (web + site)
- [ ] `web/Dockerfile` — npm build + nginx serve
- [ ] `site/Dockerfile` — npm build + nginx serve
- [ ] nginx.conf — SPA fallback (try_files)

#### MP-3.4: CI/CD (GitHub Actions)
- [ ] `.github/workflows/ci.yml`
  - backend: lint (ruff) + test (pytest)
  - mobile: tsc --noEmit + jest
  - web: tsc --noEmit + vitest
- [ ] `.github/workflows/deploy.yml`
  - Docker build + push (ECR/GHCR)
  - K8s apply (dry-run validation)

#### MP-3.5: 모니터링
- [ ] FastAPI에 Prometheus metrics 미들웨어 (`prometheus-fastapi-instrumentator`)
- [ ] `/metrics` 엔드포인트
- [ ] Grafana dashboard JSON (선택)

---

## 5. Edge Cases & Failure Handling

| 시나리오 | 처리 방식 |
|---------|----------|
| PG 웹훅 중복 수신 | idempotency key (pg_payment_key) 기반 중복 무시 |
| 엑셀 업로드 부분 실패 | 행별 결과 반환, 성공한 행만 저장 |
| K8s 마이그레이션 Job 실패 | 배포 차단 (Pod은 마이그레이션 완료 전 시작 안 됨) |
| 프로덕션 시크릿 미설정 시 | config.py에서 ValidationError 발생, 앱 시작 거부 |
| CronJob 실패 | K8s 재시도 정책 (backoffLimit: 3) |
| Rate limit 초과 | HTTP 429 + Retry-After 헤더 |

---

## 6. Testing Strategy

| 레벨 | 도구 | 커버리지 목표 |
|------|------|-------------|
| 백엔드 유닛/통합 | pytest + pytest-asyncio | 전체 green (0 failures) |
| PG 결제 | pytest + 토스 sandbox | 승인/취소/웹훅 시나리오 |
| 모바일 컴포넌트 | jest-expo + RTL | 핵심 화면 10개 |
| 웹 컴포넌트 | Vitest + RTL | 핵심 페이지 5개 |
| K8s 매니페스트 | kubeval 또는 dry-run | YAML 유효성 |
| CI | GitHub Actions | PR마다 전체 테스트 실행 |

---

## 7. Acceptance Criteria (최종)

### Must Have
- [ ] AC-1: 백엔드 전체 테스트 통과 (0 failures)
- [ ] AC-2: 모바일 테스트 10개 이상 통과
- [ ] AC-3: 웹 테스트 5개 이상 통과
- [ ] AC-4: PG 결제 연동 코드 + 테스트모드 동작
- [ ] AC-5: Dockerfile multi-stage build 성공
- [ ] AC-6: K8s 매니페스트 dry-run 통과
- [ ] AC-7: CI/CD 워크플로우 정의 완료
- [ ] AC-8: config.py 프로덕션 fail-fast 동작
- [ ] AC-9: CORS + rate limiting 적용
- [ ] AC-10: 엑셀 업로드 API 동작 + 테스트

### Should Have
- [ ] AC-11: 법적 증빙 아카이브 동작
- [ ] AC-12: 관리자 학생 화면 CRUD 동작
- [ ] AC-13: 에러 핸들링 UI (모바일 + 웹)
- [ ] AC-14: 구조적 로깅 (JSON stdout)
- [ ] AC-15: Prometheus /metrics 엔드포인트

### Nice to Have
- [ ] AC-16: 관제센터 실시간 차량 맵
- [ ] AC-17: 월별 통계 리포트
- [ ] AC-18: K8s CronJob 매니페스트

---

## 8. Code Impact Map

| 파일/디렉토리 | 변경 유형 | 마일스톤 |
|-------------|----------|---------|
| `backend/app/config.py` | MODIFY — fail-fast, debug default | MP-1.1 |
| `backend/app/main.py` | MODIFY — CORS, rate limiting, logging | MP-1.1 |
| `backend/app/modules/billing/providers/` | CREATE — toss_payments.py | MP-1.3 |
| `backend/app/modules/billing/router.py` | MODIFY — 결제 엔드포인트 | MP-1.3 |
| `backend/app/modules/billing/models.py` | MODIFY — Payment PG 필드 | MP-1.3 |
| `backend/app/modules/student_management/router.py` | MODIFY — bulk upload | MP-1.4 |
| `backend/app/modules/compliance/` | MODIFY — document archive | MP-1.5 |
| `backend/migrations/` | CREATE — new migration | MP-1.3 |
| `backend/tests/` | MODIFY — 테스트 수정 + 추가 | MP-1.2 |
| `mobile/package.json` | MODIFY — 테스트 의존성 | MP-2a.1 |
| `mobile/jest.config.js` | CREATE | MP-2a.1 |
| `mobile/src/__tests__/` | CREATE — 테스트 파일들 | MP-2a.1 |
| `web/package.json` | MODIFY — 테스트 의존성 | MP-2a.2 |
| `web/vitest.config.ts` | CREATE | MP-2a.2 |
| `web/src/__tests__/` | CREATE — 테스트 파일들 | MP-2a.2 |
| `backend/Dockerfile` | REWRITE — multi-stage | MP-3.1 |
| `backend/.dockerignore` | CREATE | MP-3.1 |
| `web/Dockerfile` | CREATE — nginx serve | MP-3.3 |
| `site/Dockerfile` | CREATE — nginx serve | MP-3.3 |
| `deploy/k8s/` | CREATE — 전체 매니페스트 | MP-3.2 |
| `.github/workflows/` | CREATE — CI/CD | MP-3.4 |

---

## 9. Out of Scope
- 엣지 AI (G2, G3 from SRS)
- 사각지대 감지
- EAS 네이티브 빌드
- 앱스토어 제출
- 실서버 프로비저닝
- 부하/보안 테스트 실행
- 관제센터 맵, 통계 리포트 (Nice to Have)

---

*Final Tech Spec 승인됨. Phase 4 Todo Plan으로 진행.*
