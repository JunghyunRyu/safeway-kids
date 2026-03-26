# 세이프웨이키즈 — 최종 세션 리포트

**작성일**: 2026-03-22
**상태**: P0~P3 전체 구현 완료

---

## 1. 세션 성과 요약

| 라운드 | 항목 수 | 커밋 | 변경 규모 |
|--------|------:|------|----------|
| 코드하드닝 + P0 + 핫픽스 | 54 | `5b2ea99` | 109 files, +15,582 |
| P1 + 법률 수정 | 34 | `108577d` | 66 files, +6,483 |
| P2 | 25 | `eefabb7` | 45 files, +3,543 |
| P3 | 15 | `df95a17` | 43 files, +2,633 |
| **합계** | **128** | **4 commits** | **264 files, +28,414 lines** |

### 테스트 현황
- Backend: **112 passed**, 0 failed
- Web: **50 passed** (12 suites), 0 failed
- Mobile: **36 passed** (10 suites), 0 failed
- TypeScript: **0 errors** (web, mobile, site)

### 만족도 변화 (페르소나 기준)
| 그룹 | 초기 | P0 이후 | P1 이후 |
|------|------|---------|---------|
| 학부모 | 2.5/5 | 3.0/5 | 4.1/5 |
| 학생 | 1.0/5 | 2.0/5 | 3.0/5 |
| 기사 | 43/100 | 70/100 | 82/100 |
| 학원 | 53/100 | 61/100 | 71/100 |

---

## 2. 접속 정보

| 서비스 | URL | 용도 |
|--------|-----|------|
| 백엔드 API | http://localhost:8000 | FastAPI 서버 |
| API 문서 (Swagger) | http://localhost:8000/docs | API 테스트 |
| 헬스체크 | http://localhost:8000/health | DB/Redis 상태 |
| 웹 대시보드 | http://localhost:5173 | 관리자 대시보드 |
| 랜딩 사이트 | http://localhost:5174 | 서비스 소개 |

### 테스트 계정

| 역할 | 전화번호 | 이름 | 비고 |
|------|----------|------|------|
| 플랫폼 관리자 | 01099999999 | 플랫폼관리자 | 전체 시스템 관리 |
| 학원 관리자 | 01088888888 | 학원관리자 | 개별 학원 관리 |

> **시드 데이터**: 플랫폼 관리자 로그인 → 사이드바 "시드 데이터" → "시드 데이터 생성" 클릭

---

## 3. 기능 점검 체크리스트

### A. 랜딩 사이트 (http://localhost:5174)

| # | 점검 항목 | 확인 방법 | 예상 결과 |
|---|----------|----------|----------|
| A1 | 메인 히어로 섹션 | 페이지 접속 | 브랜드 메시지 + CTA 버튼 |
| A2 | Safety AI 섹션 | 스크롤 다운 | **"Coming Soon"** 배지 + 로드맵 표기 |
| A3 | 비용 시뮬레이터 | 헤더 "비용 계산기" 클릭 | 학생 수/차량 수 입력 → 비용 비교 차트 |
| A4 | 이용 후기 | 랜딩 스크롤 | 3개 추천사 카드 |
| A5 | 가격 섹션 | 스크롤 다운 | 요금 안내 (건당 과금 설명) |
| A6 | 서비스 소개서 다운로드 | CTA 버튼 | 브로셔 다운로드 링크 |
| A7 | Footer 사업자 정보 | 페이지 하단 | 사업자등록번호/주소/전화 (환경변수 기반) |
| A8 | 개인정보처리방침 | Footer 링크 | 전문 페이지 |
| A9 | 이용약관 | Footer 링크 | 전문 페이지 |
| A10 | 위치정보 이용약관 | Footer 링크 | 위치정보법 대응 약관 |
| A11 | OG 태그/SEO | 페이지 소스 보기 | meta og:title, og:description 존재 |
| A12 | robots.txt | /robots.txt | sitemap 참조 |

---

### B. 웹 대시보드 — 플랫폼 관리자 (http://localhost:5173)

> 로그인: "플랫폼 관리자 로그인" → 01099999999 / 플랫폼관리자
> 먼저 시드 데이터 생성 필수

| # | 점검 항목 | 확인 방법 | 예상 결과 |
|---|----------|----------|----------|
| **로그인/인증** | | | |
| B1 | 전화번호 검증 | 잘못된 번호 입력 (예: abc) | 에러 메시지 "올바른 전화번호 형식이 아닙니다" |
| B2 | 정상 로그인 | 01099999999 입력 | 대시보드 이동 |
| B3 | devLogin 제거 | 프로덕션 모드 여부 | 개발 모드에서만 자동 입력 가능 |
| **대시보드** | | | |
| B4 | 현황 카드 | 대시보드 메인 | 학원/학생/차량/기사 수 카드 |
| B5 | "배차 자동 생성" 용어 | 대시보드 | "파이프라인" 대신 "배차 자동 생성" 표시 |
| **학원 관리** | | | |
| B6 | 학원 목록 | 사이드바 → 학원 | 시드 학원 목록 |
| B7 | 학원 수정 (브랜딩) | 학원 수정 모달 | 로고 URL + 컬러 피커 필드 |
| **사용자 관리** | | | |
| B8 | 사용자 목록 | 사이드바 → 사용자 | 역할별 필터 |
| B9 | 학원 서브역할 | 학원관리자 수정 | 원장/매니저/직원 선택 가능 |
| **차량 관리** | | | |
| B10 | 차량 목록 | 사이드바 → 차량 | 차량 목록 + 등록 |
| B11 | 차량 법정 필드 | 차량 등록/수정 | 제조연도, 보험종류, 신고필증번호 필드 |
| **학생 관리** | | | |
| B12 | 학생 목록 | 사이드바 → 학생 | 학생 목록 |
| B13 | 엑셀 업로드 | 학생 페이지 상단 | 엑셀 업로드 버튼 + 템플릿 다운로드 |
| **스케줄** | | | |
| B14 | 스케줄 템플릿 탭 | 사이드바 → 스케줄 | 템플릿/일간 탭 전환 |
| B15 | 일간 스케줄 학생이름 | 일간 탭 | student_id UUID 대신 학생 이름 |
| B16 | 학원명/차량번호 컬럼 | 일간 탭 | academy_name, vehicle_license_plate 컬럼 |
| **관제센터** | | | |
| B17 | 관제센터 접근 | 사이드바 → 관제센터 | 지도 + 차량 마커 |
| **CS 기능** | | | |
| B18 | 학생 통합 조회 | 사이드바 → 학생 조회 | 이름 검색 → 카드 형태 결과 |
| B19 | 전화번호 마스킹 | 조회 결과 | 010****5678 형식 |
| B20 | 알림 이력 | 사이드바 → 알림 이력 | 발송 이력 테이블 |
| B21 | 수동 SMS 발송 | 알림 이력 → 발송 버튼 | 목적 드롭다운 + 번호 마스킹 |
| B22 | CS 티켓 | 사이드바 → CS 티켓 | 티켓 목록 + 상태 변경 |
| B23 | 티켓 내부 메모 | 티켓 상세 | 메모 작성/조회 패널 |
| B24 | 티켓 통계 | 티켓 페이지 상단 | 일간/주간 통계 카드 |
| B25 | 탑승 현황 대시보드 | 사이드바 → 탑승 현황 | 실시간 탑승/미탑승/완료 |
| **기사 관리** | | | |
| B26 | 기사 목록 | 사이드바 → 기사 | 기사 목록 + 자격 정보 |
| B27 | 자격 만료 경고 | 기사 목록 | 만료 임박 시 경고 배지 |
| **보고서** | | | |
| B28 | 월간 보고서 | 사이드바 → 보고서 | 월간 통계 + PDF 인쇄 |

---

### C. 웹 대시보드 — 학원 관리자 (http://localhost:5173)

> 로그아웃 후 "학원 관리자 로그인" → 01088888888 / 학원관리자

| # | 점검 항목 | 확인 방법 | 예상 결과 |
|---|----------|----------|----------|
| C1 | 학원 전용 메뉴 | 사이드바 | 학생/스케줄/차량/기사/관제/통계/청구 |
| C2 | 관제센터 접근 | 사이드바 → 관제센터 | 학원 소속 차량만 표시 |
| C3 | 엑셀 업로드 접근 | 사이드바 → 엑셀 업로드 | 업로드 페이지 (학원에게 개방됨) |
| C4 | 기사 관리 | 사이드바 → 기사 | 기사 목록 + 자격 정보 |
| C5 | 운행 통계 | 사이드바 → 통계 | 운행 보고서 |
| C6 | 청구 관리 | 사이드바 → 청구 | 학생/학원 이름 표시 인보이스 |
| C7 | 스케줄 템플릿 | 스케줄 → 템플릿 탭 | 반복 스케줄 조회/토글 |
| C8 | 컴플라이언스 | 학원 컴플라이언스 메뉴 | 보험/검사증 관리 |

---

### D. API 직접 테스트 (http://localhost:8000/docs)

| # | 점검 항목 | API | 예상 결과 |
|---|----------|-----|----------|
| **인증** | | | |
| D1 | dev-login 정상 | POST `/api/v1/auth/dev-login` body: `{"phone":"01012345678","name":"테스트","role":"parent"}` | JWT 토큰 반환 |
| D2 | dev-login admin 차단 | POST `/api/v1/auth/dev-login` body: `{"phone":"01000000000","name":"해커","role":"platform_admin"}` | 403 에러 |
| D3 | OTP 발송 | POST `/api/v1/auth/otp/send` body: `{"phone":"01012345678"}` | 200 (콘솔에 OTP 출력) |
| D4 | OTP 브루트포스 방어 | POST `/api/v1/auth/otp/verify` 잘못된 코드 5회 | 잠금 메시지 (15분) |
| **헬스체크** | | | |
| D5 | 서버 상태 | GET `/health` | status: ok, redis: connected, database: connected |
| **보안** | | | |
| D6 | IDOR 방어 | GET `/api/v1/students/{타인학생ID}` (다른 유저 토큰) | 403 Forbidden |
| D7 | 프로덕션 키 검증 | 환경변수 `ENVIRONMENT=production` 세팅 시 | 빈 키가 있으면 서버 기동 실패 |
| **SOS** | | | |
| D8 | SOS 신고 | POST `/api/v1/notifications/sos` body: `{"latitude":37.4979,"longitude":127.0276}` | 201 + 관리자 알림 |
| **메시지** | | | |
| D9 | 메시지 발송 | POST `/api/v1/messages/` | 메시지 생성 |
| D10 | 메시지 조회 | GET `/api/v1/messages/` | 메시지 목록 |
| **운전자 자격** | | | |
| D11 | 자격 등록 | POST `/api/v1/auth/users/{id}/qualification` | DriverQualification 생성 |
| D12 | 자격 조회 | GET `/api/v1/auth/users/{id}/qualification` | 면허번호 복호화된 상태 반환 |
| **ERP 연동** | | | |
| D13 | API 키 생성 | POST `/api/v1/integration/api-keys` | SHA256 해시 키 반환 |
| D14 | 웹훅 등록 | POST `/api/v1/integration/webhooks` | Webhook 엔드포인트 등록 |

---

### E. 모바일 앱 (Expo Go)

> 시작: `cd mobile && ./start-dev.sh` 또는 `npx expo start --port 8081`

| # | 점검 항목 | 확인 방법 | 예상 결과 |
|---|----------|----------|----------|
| **공통** | | | |
| E1 | 온보딩 | 앱 최초 실행 | 4슬라이드 온보딩 가이드 |
| E2 | OTP 로그인 | 전화번호 입력 → OTP | 콘솔에 OTP 출력, 입력 후 로그인 |
| E3 | SOS 버튼 | 모든 화면 우하단 FAB | 2단계 확인 → 112 전화 연결 |
| **학부모 (role: parent)** | | | |
| E4 | 홈 화면 스케줄 카드 | 로그인 후 홈 | 학원명, 기사 이름, 차량번호 표시 |
| E5 | 카드 터치 | 스케줄 카드 탭 | 상세 화면으로 이동 |
| E6 | 자녀별 필터 | 홈 상단 탭 | 다자녀 시 자녀별 필터 |
| E7 | 실시간 지도 | 하단 탭 → 지도 | 차량 위치 + 픽업 마커 |
| E8 | 스케줄 화면 | 하단 탭 → 스케줄 | 기사/차량/학원 정보 + 자녀 필터 |
| E9 | 요금 화면 | 하단 탭 → 요금 | 인보이스 (학생/학원 이름 표시) |
| E10 | 프로필 | 하단 탭 → 프로필 | 자녀 관리, 알림 설정, 문의하기 |
| E11 | 자녀 프로필 관리 | 프로필 → 자녀 관리 | 알레르기/특이사항 수정 |
| E12 | 알림 설정 | 프로필 → 알림 설정 | 알림 종류별 온/오프 토글 |
| **기사 (role: driver)** | | | |
| E13 | 루트 화면 | 로그인 후 홈 | 오늘의 배차 + 학생 목록 |
| E14 | 학생 사진/주소 | 학생 카드 | 사진 + 픽업 주소 표시 |
| E15 | 특이사항/알레르기 | 학생 카드 | 건강정보 표시 (동의한 경우) |
| E16 | 탑승 확인 팝업 | 탑승 버튼 탭 | Alert 확인 → 5분 되돌리기 |
| E17 | 일괄 탑승 | 같은 정류장 복수 학생 | 일괄 탑승 버튼 |
| E18 | 미탑승 처리 | No-Show 버튼 | 사유 선택 (부재/취소/기타) |
| E19 | 하차 인수자 확인 | 하차 버튼 | 보호자/학원직원/자율하차 선택 |
| E20 | 다음 정류장 하이라이트 | 루트 목록 | 현재 대상 정류장 강조 |
| E21 | 네비 연동 | 정류장 카드 → 네비 버튼 | 카카오네비 or T맵 앱 실행 |
| E22 | TTS 음성안내 | 다음 정류장 전환 시 | "다음 정류장: OO" 음성 안내 |
| E23 | 경로 재정렬 | 정류장 위/아래 버튼 | 순서 변경 |
| E24 | 잔류 확인 | 루트 완료 후 | 좌석별 개별 체크 → 전체 확인 |
| E25 | 운행 시작/종료 | 루트 상단 | 운행 세션 시작/종료 버튼 |
| E26 | 기사 메모 | 학생 카드 | 메모 작성 모달 |
| E27 | 일일 요약 | 루트 완료 후 | 탑승/미탑승/취소 현황 카드 |
| E28 | 지도 경로선 | 하단 탭 → 지도 | polyline 경로 표시 |
| **학생 (role: student)** | | | |
| E29 | 스케줄 화면 | 로그인 후 | 학원 이름 표시 (하드코딩 아님) |
| E30 | 함께 타는 친구 | 스케줄 카드 | 동일 차량 친구 이름 (이니셜) |
| E31 | 탑승 진행 바 | 탑승 중 | 남은 정류장 기반 프로그레스 |
| E32 | 안전 퀴즈 | 하단 탭 → 퀴즈 | O/X 10문항 퀴즈 |
| **관리자 (role: academy_admin)** | | | |
| E33 | 관리자 프로필 | 하단 탭 → 프로필 | 역할 표시 + 웹 대시보드 바로가기 |
| **안전도우미 (role: safety_escort)** | | | |
| E34 | 루트 탭 접근 | 로그인 후 | 기사와 동일한 RouteScreen 탭 |
| E35 | 학생 탑승/하차 | 루트 화면 | 탑승/하차 체크 가능 |

---

## 4. 구현 제외 항목 (사업 의사결정 필요)

| # | 항목 | 이유 | 필요한 결정 |
|---|------|------|-----------|
| 74 | 리퍼럴 프로그램 | 보상 정책 미확정 | 학원→학원 소개 보상 금액/방식 |
| 78 | 가격 전략 재검토 | 경영진 결정 필요 | 건당 과금 vs SaaS 월정액 모델 |

---

## 5. 알려진 제한사항

| 항목 | 현재 상태 | 비고 |
|------|----------|------|
| 결제 (Toss) | 개발 모드 (mock 응답) | PG 가맹점 계약 후 실거래 가능 |
| SMS 발송 | 개발 모드 (콘솔 로그) | NHN Cloud 발신번호 등록 후 실발송 |
| FCM 푸시 | 개발 모드 (콘솔 로그) | Firebase credentials 설정 후 실발송 |
| KakaoMap | API 키 미설정 시 폴백 | Kakao API 키 설정 후 실지도 |
| Edge AI | stub (하드웨어 필요) | NVIDIA Jetson 조달 후 구현 |
| 앱스토어 | 메타데이터만 준비 | 사업자등록 + 계정 등록 후 제출 |
| WS 테스트 | teardown error 1건 | 테스트 환경 한정, 프로덕션 무영향 |

---

## 6. 산출물 전체 목록

### 기획서
- `artifacts/specs/2026-03-21-code-hardening-spec.md`
- `artifacts/specs/2026-03-21-p0-improvement-spec.md`
- `artifacts/specs/2026-03-22-p1-improvement-spec.md`
- `artifacts/specs/2026-03-22-p2-improvement-spec.md`
- `artifacts/specs/2026-03-22-p3-improvement-spec.md`

### 리뷰/피드백
- `artifacts/reviews/2026-03-21-parent-feedback.md`
- `artifacts/reviews/2026-03-21-student-feedback.md`
- `artifacts/reviews/2026-03-21-driver-feedback.md`
- `artifacts/reviews/2026-03-21-academy-feedback.md`
- `artifacts/reviews/2026-03-21-marketing-review.md`
- `artifacts/reviews/2026-03-21-cs-ops-review.md`
- `artifacts/reviews/2026-03-21-senior-code-review.md`
- `artifacts/reviews/2026-03-21-legal-regulatory-review.md`
- `artifacts/reviews/2026-03-21-tech-security-review.md`
- `artifacts/reviews/2026-03-21-business-cfo-review.md`
- `artifacts/reviews/2026-03-21-edge-cases-review.md`
- `artifacts/reviews/2026-03-21-bus-guide-review.md`
- `artifacts/reviews/2026-03-21-legal-spec-review.md`
- `artifacts/reviews/2026-03-22-beta-parent-student.md`
- `artifacts/reviews/2026-03-22-beta-driver-guide.md`
- `artifacts/reviews/2026-03-22-beta-academy-cfo.md`
- `artifacts/reviews/2026-03-22-beta-legal-security.md`
- `artifacts/reviews/2026-03-22-beta-p1-consolidated.md`
- `artifacts/reviews/2026-03-22-p1-legal-review.md`
- `artifacts/reviews/2026-03-22-p1-planning-review.md`

### 종합 보고서
- `artifacts/reports/2026-03-21-user-feedback-consolidated.md` — 사용자 78건
- `artifacts/reports/2026-03-21-expert-review-consolidated.md` — 전문가 89건
- `artifacts/reports/2026-03-21-code-hardening-milestone.md`
- `artifacts/reports/2026-03-22-final-session-report.md` — 본 문서

### 검증 보고서
- `artifacts/verification/2026-03-21-integration-test-report.md`
- `artifacts/verification/2026-03-21-e2e-test-report.md`
- `artifacts/verification/2026-03-21-e2e-hardening-report.md`
- `artifacts/verification/2026-03-22-qa-test-report.md`
- `artifacts/verification/2026-03-22-hotfix-qa-report.md`
- `artifacts/verification/2026-03-22-integration-test-report.md`
- `artifacts/verification/2026-03-22-p1-qa-report.md`
- `artifacts/verification/2026-03-22-p1-integration-report.md`
- `artifacts/verification/2026-03-22-p3-qa-report.md`
