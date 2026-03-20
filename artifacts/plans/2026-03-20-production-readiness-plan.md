# Todo Plan: 프로덕션 배포 준비

**작성일:** 2026-03-20
**Tech Spec:** `artifacts/specs/2026-03-20-production-readiness-tech-spec.md`

---

## 실행 순서

### 🔷 MP-1: 백엔드 프로덕션 강화

| # | 태스크 | 의존성 | AC |
|---|--------|--------|-----|
| 1.1 | config.py 프로덕션 fail-fast + debug=False 기본값 | 없음 | AC-8 |
| 1.2 | CORS origin whitelist 설정 | 1.1 | AC-9 |
| 1.3 | slowapi rate limiting (/auth/* 엔드포인트) | 1.1 | AC-9 |
| 1.4 | 백엔드 테스트 오류 2건 수정 | 없음 | AC-1 |
| 1.5 | 구조적 로깅 (structlog JSON) | 없음 | AC-14 |
| 1.6 | PG 결제 연동 — 토스페이먼츠 provider | 없음 | AC-4 |
| 1.7 | PG 결제 — router 엔드포인트 + Alembic 마이그레이션 | 1.6 | AC-4 |
| 1.8 | PG 결제 — 테스트 작성 | 1.7 | AC-4 |
| 1.9 | 엑셀 학생 일괄 업로드 API | 없음 | AC-10 |
| 1.10 | 엑셀 업로드 테스트 | 1.9 | AC-10 |
| 1.11 | 법적 증빙 아카이브 (ComplianceDocument 모델 + API) | 없음 | AC-11 |
| 1.12 | .env.example 전체 환경변수 문서화 | 1.1~1.11 | AC-8 |

### 🔷 MP-2a: 프론트엔드 테스트 인프라 (MP-1과 병렬)

| # | 태스크 | 의존성 | AC |
|---|--------|--------|-----|
| 2a.1 | 모바일 jest-expo + RTL 설정 | 없음 | AC-2 |
| 2a.2 | 모바일 테스트 10개 작성 | 2a.1 | AC-2 |
| 2a.3 | 웹 Vitest + RTL 설정 | 없음 | AC-3 |
| 2a.4 | 웹 테스트 5개 작성 | 2a.3 | AC-3 |

### 🔷 MP-2b: 프론트엔드 기능 보완 (MP-1 완료 후)

| # | 태스크 | 의존성 | AC |
|---|--------|--------|-----|
| 2b.1 | 관리자 학생 관리 화면 완성 (모바일 + 웹) | MP-1 | AC-12 |
| 2b.2 | 모바일 에러 핸들링 (Toast/Alert + 네트워크 에러) | 없음 | AC-13 |
| 2b.3 | 웹 에러 핸들링 (Toast + Error Boundary) | 없음 | AC-13 |
| 2b.4 | 학부모 PG 결제 UI (BillingScreen → 토스 결제창) | MP-1.7 | AC-4 |

### 🔷 MP-3: 인프라 및 배포

| # | 태스크 | 의존성 | AC |
|---|--------|--------|-----|
| 3.1 | Backend Dockerfile multi-stage 최적화 | 없음 | AC-5 |
| 3.2 | .dockerignore 작성 | 3.1 | AC-5 |
| 3.3 | Web Dockerfile (nginx + SPA) | 없음 | AC-5 |
| 3.4 | Site Dockerfile (nginx + SPA) | 없음 | AC-5 |
| 3.5 | K8s 매니페스트 — Backend (Deployment, Service, HPA) | 3.1 | AC-6 |
| 3.6 | K8s 매니페스트 — Web/Site (Deployment, Service) | 3.3, 3.4 | AC-6 |
| 3.7 | K8s 매니페스트 — Ingress, ConfigMap, Secret | 3.5, 3.6 | AC-6 |
| 3.8 | K8s 매니페스트 — Migration Job + CronJob | 3.5 | AC-6, AC-18 |
| 3.9 | GitHub Actions CI 워크플로우 | MP-2a | AC-7 |
| 3.10 | GitHub Actions Deploy 워크플로우 | 3.7 | AC-7 |
| 3.11 | Prometheus metrics 미들웨어 | 없음 | AC-15 |

---

## 우선순위 요약

**즉시 병렬 실행 가능:**
- MP-1.1~1.5 (보안 + 테스트 수정 + 로깅)
- MP-2a.1, 2a.3 (테스트 프레임워크 설정)
- MP-3.1~3.4 (Dockerfile)
- MP-3.11 (Prometheus)

**순차 실행:**
- MP-1.6 → 1.7 → 1.8 (PG 연동)
- MP-1.9 → 1.10 (엑셀 업로드)
- MP-2a.1 → 2a.2 (모바일 테스트)
- MP-3.1 → 3.5 → 3.7 → 3.8 (K8s)
- MP-1 완료 → MP-2b (프론트엔드 기능)

---

*Todo Plan 완료. Phase 5 Implementation으로 진행.*
