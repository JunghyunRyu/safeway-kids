# P3 개선 기획서 (17건)

**작성일**: 2026-03-22
**대상**: P3 로드맵 항목 17건 (#62~#78)
**입력 자료**:
- `artifacts/reports/2026-03-21-user-feedback-consolidated.md` — P3 항목 #62~#78
- `artifacts/reviews/2026-03-22-beta-p1-consolidated.md` — 베타 미해결 P3 6건

**분류**:
- 코드 수정 가능: 13건
- 사업 의사결정 필요 (코드 불가): 2건 (#74, #78)
- 하드웨어/외부 의존: 1건 (#65 — TTS는 소프트웨어로 대체 가능)
- 디자인 의존: 1건 (#70)

---

## #62. 함께 타는 친구 표시

**현재 문제**: 학생 앱에서 같은 차량에 배정된 다른 학생 목록이 없음. 아이들이 친구와 같은 차인지 알 수 없음.

**구현 방안**:
1. Backend: 기존 `GET /daily-schedules?date=` 응답에 `vehicle_id` 포함 (이미 존재)
2. Mobile: 학생 ScheduleScreen에서 동일 `vehicle_id` 스케줄을 그룹핑하여 "함께 타는 친구" 섹션 표시
3. 개인정보 최소화: 이름(이니셜)만 표시, 연락처/사진 미노출

**변경 파일**:
- `mobile/src/screens/student/ScheduleScreen.tsx` — 친구 목록 섹션 추가

**수락 기준**:
- [ ] 학생 스케줄 카드 하단에 동일 차량 배정 학생 이름 표시
- [ ] 이름은 성+이름 첫 글자 형태 (예: "김O준")로 마스킹
- [ ] 본인은 목록에서 제외

---

## #63. 차량 내 콘텐츠 (안전 퀴즈)

**현재 문제**: 학생 앱에 탑승 중 볼 수 있는 교육 콘텐츠가 없음.

**구현 방안**:
1. Backend: 안전 퀴즈 데이터를 하드코딩 상수로 제공 (별도 DB 불필요)
2. Mobile: 학생 탭에 "안전 퀴즈" 탭 또는 탑승 중 표시되는 퀴즈 카드
3. 5~10개 교통 안전 퀴즈 O/X 형태

**변경 파일**:
- `mobile/src/screens/student/SafetyQuizScreen.tsx` — 신규
- `mobile/src/navigation/StudentTabNavigator.tsx` — 퀴즈 탭 추가
- `mobile/src/constants/safetyQuizData.ts` — 퀴즈 데이터 상수

**수락 기준**:
- [ ] 학생 앱에 안전 퀴즈 화면 존재
- [ ] 최소 10개 교통 안전 문제 제공
- [ ] 정답/오답 즉시 피드백
- [ ] 맞춘 개수 표시

---

## #64. 탑승 중 진행 바 (학생용)

**현재 문제**: 학생이 목적지까지 남은 거리/시간을 알 수 없음.

**구현 방안**:
1. Mobile: 학생 스케줄 화면에서 현재 탑승 상태(`boarded`)일 때 진행 바 표시
2. 남은 정거장 수 계산 (전체 스케줄 중 완료되지 않은 수)
3. ETA = 남은 정거장 x 3분 (기존 부모 앱 로직과 동일)

**변경 파일**:
- `mobile/src/screens/student/ScheduleScreen.tsx` — 진행 바 컴포넌트 추가

**수락 기준**:
- [ ] 탑승 상태일 때 "목적지까지 약 N분" 표시
- [ ] 진행 바로 시각적 진행률 표시
- [ ] 미탑승 상태에서는 숨김

---

## #65. 음성 안내/TTS (기사용)

**현재 문제**: 기사가 운전 중 다음 정류장을 화면으로 확인해야 함. 안전 위험.

**구현 방안**:
1. Mobile: `expo-speech` 패키지를 사용한 TTS 음성 안내
2. 다음 정류장 진입 시 "다음 정류장: [학생이름] [주소]" 음성 출력
3. 탑승/하차 처리 완료 시 "다음 학생: [이름]" 안내
4. 설정에서 음성 안내 on/off 토글

**변경 파일**:
- `mobile/src/screens/driver/RouteScreen.tsx` — TTS 호출 로직
- `mobile/src/hooks/useTTS.ts` — 신규 TTS 훅
- `mobile/package.json` — `expo-speech` 의존성 추가

**수락 기준**:
- [ ] 기사 경로 화면에서 다음 정류장 TTS 안내
- [ ] 탑승/하차 처리 후 다음 학생 안내
- [ ] 음성 안내 on/off 설정 가능

---

## #66. 수동 노선 순서 변경

**현재 문제**: AI 최적화 노선 순서를 기사가 조정할 수 없음. 실제 도로 상황에 맞게 순서 변경 불가.

**구현 방안**:
1. Mobile: 기사 RouteScreen에서 드래그-앤-드롭 또는 위/아래 버튼으로 순서 변경
2. Backend: `PATCH /routes/{route_id}/reorder` 엔드포인트 추가
3. 변경된 순서를 서버에 저장하여 다음 로드 시 유지

**변경 파일**:
- `mobile/src/screens/driver/RouteScreen.tsx` — 순서 변경 UI
- `backend/app/modules/scheduling/router.py` — reorder 엔드포인트
- `backend/app/modules/scheduling/service.py` — reorder 로직
- `mobile/src/api/routes.ts` — reorder API 호출

**수락 기준**:
- [ ] 기사가 정류장 순서를 수동으로 변경 가능
- [ ] 변경된 순서가 서버에 저장됨
- [ ] 페이지 새로고침 후에도 변경된 순서 유지

---

## #67. 학원 내부 역할 분리

**현재 문제**: 학원 관리자(ACADEMY_ADMIN) 단일 역할만 존재. 원장/실장/사무직 권한 분리 불가.

**구현 방안**:
1. Backend: User 모델에 `academy_sub_role` 필드 추가 (`owner` / `manager` / `staff`)
2. 권한 매트릭스: owner=전체, manager=학생/스케줄/기사, staff=스케줄 조회만
3. RBAC 미들웨어 확장하여 sub_role 체크

**변경 파일**:
- `backend/app/modules/auth/models.py` — `academy_sub_role` 컬럼 추가
- `backend/app/middleware/rbac.py` — sub_role 체크 데코레이터
- `web/src/pages/platform/PlatformUsersPage.tsx` — 서브 역할 선택 UI
- `backend/app/modules/auth/schemas.py` — 서브 역할 필드

**수락 기준**:
- [ ] 학원 사용자에게 owner/manager/staff 역할 부여 가능
- [ ] staff 역할은 읽기 전용
- [ ] owner만 사용자 관리 가능

---

## #68. ERP 연동용 API 키 + Webhook

**현재 문제**: 대형 학원의 기존 전산 시스템과 데이터 동기화 불가.

**구현 방안**:
1. Backend: API 키 발급/관리 엔드포인트 (`POST /api-keys`, `GET /api-keys`, `DELETE /api-keys/{id}`)
2. Backend: Webhook 등록 (`POST /webhooks`, `GET /webhooks`, `DELETE /webhooks/{id}`)
3. 이벤트 발생 시 등록된 Webhook URL로 POST 전송 (boarding, alighting, schedule_created 등)
4. API 키 인증 미들웨어

**변경 파일**:
- `backend/app/modules/integration/` — 신규 모듈 (models, router, service, schemas)
- `backend/app/middleware/api_key_auth.py` — API 키 인증
- `backend/main.py` — 라우터 등록

**수락 기준**:
- [ ] 학원 관리자가 API 키 발급/폐기 가능
- [ ] Webhook URL 등록/삭제 가능
- [ ] 탑승/하차/스케줄 이벤트 시 Webhook POST 전송
- [ ] API 키로 외부에서 학생/스케줄 데이터 조회 가능

---

## #69. 서버사이드 페이지네이션

**현재 문제**: 300명+ 학원에서 학생/스케줄 목록을 전체 로딩. 성능 저하.

**구현 방안**:
1. Backend: `GET /students`, `GET /daily-schedules` 등 리스트 API에 `page`, `page_size`, `total` 응답 추가
2. Web: DataTable 컴포넌트에 서버사이드 페이지네이션 모드 추가
3. 기본 page_size=50, 최대 100

**변경 파일**:
- `backend/app/modules/student_management/router.py` — 페이지네이션 파라미터
- `backend/app/modules/student_management/service.py` — OFFSET/LIMIT 쿼리
- `backend/app/modules/scheduling/router.py` — 동일
- `backend/app/modules/scheduling/service.py` — 동일
- `web/src/components/DataTable.tsx` — 서버사이드 모드
- `web/src/pages/StudentsPage.tsx` — 페이지네이션 적용
- `web/src/pages/SchedulesPage.tsx` — 페이지네이션 적용

**수락 기준**:
- [ ] 학생 목록 API가 page/page_size 파라미터 지원
- [ ] 응답에 total 카운트 포함
- [ ] 웹 테이블에서 서버사이드 페이지 전환 동작
- [ ] 300명 학원에서 초기 로딩 1초 이내

---

## #70. 학부모 앱 학원 브랜딩 커스터마이징

**현재 문제**: 모든 학원이 동일한 SAFEWAY KIDS 브랜딩. 학원별 로고/색상 커스텀 불가.

**구현 방안**:
1. Backend: Academy 모델에 `logo_url`, `primary_color` 필드 추가
2. Mobile: 부모 앱 홈 헤더에 학원 로고/색상 반영
3. Web: 학원 설정 페이지에서 로고 업로드, 색상 선택

**변경 파일**:
- `backend/app/modules/academy_management/models.py` — `logo_url`, `primary_color`
- `backend/app/modules/academy_management/schemas.py` — 필드 추가
- `mobile/src/screens/parent/HomeScreen.tsx` — 학원 브랜딩 반영
- `web/src/pages/SettingsPage.tsx` — 브랜딩 설정 UI

**수락 기준**:
- [ ] 학원 관리자가 로고 업로드 가능
- [ ] 학원 관리자가 대표 색상 설정 가능
- [ ] 부모 앱에서 학원 브랜딩 반영

**참고**: 로고 이미지 파일 업로드에 S3/R2 스토리지 연동 필요 (현재 미구현). MVP는 URL 직접 입력.

---

## #71. 월간 경영 보고서 PDF 출력

**현재 문제**: 학원 경영진에게 보고할 수 있는 PDF 보고서 자동 생성 불가.

**구현 방안**:
1. Backend: `GET /admin/academy/{id}/monthly-report?month=YYYY-MM` 엔드포인트
2. 기존 stats API 데이터 + 일별 추이 데이터를 JSON으로 반환
3. Web: 브라우저 `window.print()` 기반 PDF 출력 (별도 라이브러리 불필요)
4. 출력 전용 CSS 스타일

**변경 파일**:
- `backend/app/modules/admin/router.py` — monthly-report 엔드포인트
- `backend/app/modules/admin/service.py` — 월간 리포트 데이터 집계
- `web/src/pages/MonthlyReportPage.tsx` — 신규 보고서 화면
- `web/src/App.tsx` — 라우트 추가
- `web/src/components/Layout.tsx` — 사이드바 메뉴 추가

**수락 기준**:
- [ ] 학원 관리자가 월 선택 후 보고서 조회 가능
- [ ] 운행 건수, 완료율, 미탑승 건수, 평균 지연 표시
- [ ] 브라우저 인쇄(Ctrl+P)로 PDF 출력 가능

---

## #72. SSR/SSG (SEO 크롤러 대응)

**현재 문제**: 랜딩 사이트가 React SPA로 검색 엔진 크롤러가 콘텐츠를 인덱싱하기 어려움.

**구현 방안**:
1. `vite-plugin-ssr` 또는 `vite-ssg` 플러그인 도입
2. 랜딩 페이지, 약관 페이지 등 정적 페이지를 빌드 시 HTML로 사전 렌더링
3. `sitemap.xml` 자동 생성 확장

**변경 파일**:
- `site/vite.config.ts` — SSG 플러그인 추가
- `site/package.json` — 의존성 추가
- `site/src/main.tsx` — SSG 엔트리포인트 분리

**수락 기준**:
- [ ] `npm run build` 시 주요 페이지가 정적 HTML로 생성
- [ ] 크롤러가 JavaScript 없이 콘텐츠 인덱싱 가능
- [ ] 기존 SPA 라우팅 동작 유지

---

## #73. 비용 절감 시뮬레이터

**현재 문제**: 학원이 SAFEWAY KIDS 도입 시 비용 절감 효과를 정량적으로 확인할 수 없음.

**구현 방안**:
1. Site: 인터랙티브 시뮬레이터 페이지 (또는 Landing 내 섹션)
2. 입력: 학생 수, 현재 차량 대수, 기사 인건비, 차량 유지비
3. 출력: 현재 비용 vs SAFEWAY KIDS 예상 비용 비교 차트

**변경 파일**:
- `site/src/pages/CostSimulator.tsx` — 신규
- `site/src/main.tsx` — 라우트 추가
- `site/src/components/Header.tsx` — 네비게이션 링크

**수락 기준**:
- [ ] 학원 규모 입력 시 예상 비용 절감액 표시
- [ ] 현재 비용 vs SAFEWAY KIDS 비용 시각적 비교
- [ ] 상세 산출 근거 표시

---

## #74. 리퍼럴 프로그램

**분류**: 사업 의사결정

**현재 문제**: 학원 간 소개 보상 프로그램 없음.

**구현 방안**: 사업팀에서 보상 정책(금액, 조건) 확정 후 코드 구현.
- Backend: referral 코드 발급, 추적, 보상 지급 로직
- Web: 리퍼럴 코드 관리 대시보드

**수락 기준**:
- [ ] 사업팀 정책 확정 후 구현 가능
- [ ] 현재 코드 작업 불가 (정책 미확정)

---

## #75. CS 일일/주간 리포트

**현재 문제**: CS팀이 문의 유형별 건수, 평균 처리 시간 등 통계를 확인할 수 없음.

**구현 방안**:
1. Backend: `GET /admin/support/stats?period=daily|weekly` 엔드포인트
2. SupportTicket 데이터에서 유형별 건수, 상태별 건수, 평균 처리 시간 계산
3. Web: CS 통계 대시보드 카드

**변경 파일**:
- `backend/app/modules/admin/router.py` — support stats 엔드포인트
- `backend/app/modules/admin/service.py` — 통계 집계 로직
- `web/src/pages/platform/PlatformTicketsPage.tsx` — 통계 카드 섹션 추가

**수락 기준**:
- [ ] 일일/주간 문의 건수 통계 조회 가능
- [ ] 유형별(카테고리) 분류 표시
- [ ] 평균 처리 시간 표시
- [ ] 상태별(접수/처리중/해결/종료) 분포 표시

---

## #76. 메모/내부 코멘트 (CS용)

**현재 문제**: CS 담당자가 사용자/학원/차량에 내부 메모를 남길 수 없음.

**구현 방안**:
1. Backend: `InternalNote` 모델 (entity_type, entity_id, author_id, content, created_at)
2. `POST /admin/notes`, `GET /admin/notes?entity_type=user&entity_id=xxx`
3. Web: 사용자 상세/학원 상세/티켓 상세에 내부 메모 섹션

**변경 파일**:
- `backend/app/modules/admin/models.py` — InternalNote 모델
- `backend/app/modules/admin/schemas.py` — 메모 스키마
- `backend/app/modules/admin/router.py` — 메모 CRUD
- `backend/app/modules/admin/service.py` — 메모 서비스
- `web/src/pages/platform/PlatformTicketsPage.tsx` — 티켓에 메모 추가

**수락 기준**:
- [ ] CS 담당자가 사용자/학원/티켓에 내부 메모 추가 가능
- [ ] 메모 목록 시간순 조회 가능
- [ ] 메모는 CS/플랫폼 관리자만 접근 가능

---

## #77. 기사 배차표 자동 전송

**현재 문제**: 기사가 매일 앱을 열어야 배차 정보를 확인함. 사전 알림 없음.

**구현 방안**:
1. Backend: APScheduler 작업 — 매일 오전 7시, 당일 배차가 있는 기사에게 FCM 푸시
2. 푸시 내용: "오늘 N명 학생 픽업 예정 (첫 픽업 HH:MM)"
3. 기존 notification 서비스 활용

**변경 파일**:
- `backend/app/modules/scheduling/daily_dispatch_notifier.py` — 신규
- `backend/main.py` — 스케줄러 등록

**수락 기준**:
- [ ] 배차가 있는 기사에게 당일 오전 자동 푸시 발송
- [ ] 푸시에 학생 수, 첫 픽업 시간 포함
- [ ] 배차 없는 기사에게는 미발송

---

## #78. 가격 전략 재검토 (SaaS 모델)

**분류**: 사업 의사결정

**현재 문제**: 학부모 직접 건당 과금 모델에 대한 전략적 검토 필요. 학원 월정액 SaaS + 학생당 소액 모델 검토 요청.

**구현 방안**: 사업팀에서 가격 모델 확정 후 billing 모듈 수정.

**수락 기준**:
- [ ] 사업팀 정책 확정 후 구현 가능
- [ ] 현재 코드 작업 불가 (정책 미확정)

---

## 구현 우선순위 (의존성 기반)

### Phase A — Backend 기반 모델/API (선행)
1. **#67** 학원 내부 역할 분리 (모델 변경)
2. **#69** 서버사이드 페이지네이션 (API 변경)
3. **#76** CS 내부 메모 (신규 모델)
4. **#75** CS 리포트 (기존 ticket 데이터 활용)
5. **#68** ERP 연동 API 키 + Webhook (신규 모듈)
6. **#71** 월간 보고서 API

### Phase B — Mobile 기능
7. **#62** 함께 타는 친구 표시
8. **#64** 탑승 진행 바
9. **#63** 안전 퀴즈
10. **#65** 음성 안내/TTS
11. **#66** 수동 노선 순서 변경
12. **#77** 기사 배차표 자동 전송

### Phase C — Web/Site
13. **#70** 학원 브랜딩 (모델 + UI)
14. **#73** 비용 시뮬레이터
15. **#72** SSR/SSG

### Phase D — 사업 의사결정 (코드 불가)
16. **#74** 리퍼럴 프로그램
17. **#78** 가격 전략 재검토

---

## 코드 구현 가능 항목 요약: 15건

| # | 항목 | Phase | 복잡도 |
|---|------|-------|--------|
| 62 | 함께 타는 친구 표시 | B | Low |
| 63 | 안전 퀴즈 | B | Medium |
| 64 | 탑승 진행 바 | B | Low |
| 65 | 음성 안내/TTS | B | Medium |
| 66 | 수동 노선 순서 변경 | B | High |
| 67 | 학원 내부 역할 분리 | A | High |
| 68 | ERP 연동 API 키/Webhook | A | High |
| 69 | 서버사이드 페이지네이션 | A | Medium |
| 70 | 학원 브랜딩 커스터마이징 | C | Medium |
| 71 | 월간 경영 보고서 PDF | A | Medium |
| 72 | SSR/SSG | C | Medium |
| 73 | 비용 절감 시뮬레이터 | C | Medium |
| 75 | CS 일일/주간 리포트 | A | Low |
| 76 | CS 내부 메모 | A | Low |
| 77 | 기사 배차표 자동 전송 | B | Low |

코드 불가 2건 (#74, #78)은 기획서에 기록하되 개발 대상에서 제외.
