# Milestone Report: 프로덕션 배포 준비

**작성일:** 2026-03-20
**마일스톤:** MP-1 + MP-2a + MP-2b + MP-3 (통합)
**상태:** COMPLETE

---

## 완료된 항목

### MP-1: 백엔드 프로덕션 강화 — COMPLETE
- ✅ 1.1 config.py 프로덕션 fail-fast + debug=False
- ✅ 1.2 CORS origin whitelist
- ✅ 1.3 slowapi rate limiting (/auth/*)
- ✅ 1.4 백엔드 테스트 오류 수정 (in-memory SQLite + StaticPool)
- ✅ 1.5 구조적 로깅 (structlog JSON stdout)
- ✅ 1.6-1.8 PG 결제 연동 (토스페이먼츠 provider + 엔드포인트 + 테스트)
- ✅ 1.9-1.10 엑셀 학생 일괄 업로드 (openpyxl + 테스트)
- ✅ 1.11 법적 증빙 아카이브 (ComplianceDocument + 4 endpoints)
- ✅ 1.12 .env.example 전체 환경변수 문서화

### MP-2a: 프론트엔드 테스트 인프라 — COMPLETE
- ✅ 2a.1 모바일 jest-expo + RTL 설정
- ✅ 2a.2 모바일 테스트 10 suites, 36 tests
- ✅ 2a.3 웹 Vitest + RTL 설정
- ✅ 2a.4 웹 테스트 5 suites, 15 tests

### MP-2b: 프론트엔드 기능 보완 — COMPLETE
- ✅ 2b.1 관리자 학생 관리 화면 완성 (모바일 + 웹)
- ✅ 2b.2 모바일 에러 핸들링 (Toast + NetworkError)
- ✅ 2b.3 웹 에러 핸들링 (Toast + ErrorBoundary)
- ✅ 2b.4 학부모 PG 결제 UI (BillingScreen 결제하기 버튼)

### MP-3: 인프라 및 배포 — COMPLETE
- ✅ 3.1 Backend Dockerfile multi-stage 최적화
- ✅ 3.2 .dockerignore
- ✅ 3.3 Web Dockerfile (nginx + SPA)
- ✅ 3.4 Site Dockerfile (nginx + SPA)
- ✅ 3.5-3.8 K8s 매니페스트 10개
- ✅ 3.9 GitHub Actions CI
- ✅ 3.10 GitHub Actions Deploy
- ✅ 3.11 Prometheus metrics

---

## 미검증 항목

| 항목 | 이유 | 위험도 |
|------|------|--------|
| Docker 이미지 빌드 | Docker 미설치 환경 | MEDIUM |
| K8s 매니페스트 dry-run | kubectl 미설치 | MEDIUM |
| 토스 sandbox 실 API 호출 | PG 키 미설정 | LOW |

## 미구현 항목 (Nice to Have)

| 항목 | 이유 |
|------|------|
| 관제센터 실시간 차량 맵 | 선택 기준, 시간 제약 |
| 월별 운행 통계 리포트 | 선택 기준, 시간 제약 |

---

## 검증 수치

| 지표 | 변경 전 | 변경 후 | 증감 |
|------|---------|---------|------|
| 백엔드 테스트 | 82 (2 errors) | **95 (0 errors)** | +15.8% |
| 모바일 테스트 | 0 | **36** | ∞ |
| 웹 테스트 | 0 | **15** | ∞ |
| 총 테스트 | 82 | **146** | +78% |
| 총 코드 라인 | 13,860 | **16,324** | +2,464 |
| API 엔드포인트 | 28+ | **35+** | +7 |
| 의존성 추가 | — | slowapi, structlog, openpyxl, aiofiles, prometheus-fastapi-instrumentator | 5개 |

---

## 다음 단계

1. **Docker 빌드 검증** — Docker 설치 후 실제 빌드 테스트
2. **K8s 클러스터 프로비저닝** — AWS EKS 또는 자체 K8s
3. **PG 가맹점 계약** — 토스페이먼츠 sandbox → production 키 전환
4. **도메인 + SSL** — safeway-kids.kr 도메인 확보, cert-manager 설정
5. **모니터링 인프라** — Grafana + Prometheus 배포
6. **보안 감사** — 제3자 보안 점검 의뢰

---

*Milestone CLOSED. Session Handoff로 진행.*
