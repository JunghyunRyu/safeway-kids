# 개발 마스터 플랜

**작성일**: 2026-03-24
**워크플로우**: CLAUDE.md 9단계 프로세스
**입력 자료**: P0~P3 개선 기획서 (55건) + 코드베이스 현황 분석

---

## 현황 진단

### 코드베이스 분석 결과

P0~P3 기획서에 명시된 55건 중 **구현 완료된 항목과 미완료 항목**을 전수 조사한 결과:

| 우선순위 | 기획 항목 수 | 구현 완료 | 미완료/부분완료 |
|---------|------------|----------|--------------|
| P0 (출시 차단) | 16건 | **14건** | **2건** (부분) |
| P1 (높음) | 11건 | **11건** | **0건** |
| P2 (중간) | 13건 | **12건** | **1건** (부분) |
| P3 (선택) | 15건 | **14건** | **1건** (부분) |
| **합계** | **55건** | **51건** | **4건** |

### 구현 완료 확인된 주요 인프라

**백엔드 (40+ 테이블, 13 라우터)**:
- 인증/보안: OTP secrets + 실패 잠금, IDOR 수정, WS 인가, dev-login 강화 ✅
- 모델: DriverQualification, Vehicle 법정필드, SecondaryGuardian, NotificationPreference, NotificationLog, SupportTicket, InternalNote, Message, ApiKey, Webhook ✅
- 스케줄러: delay_checker (5분), qualification_checker (매일 00:05), compliance_checker (매일 00:10), dispatch_notifier (매일 07:00) ✅
- 알림: FCM + NHN Cloud SMS + 사용자 설정 + 발송 로그 ✅

**모바일 (10 suites, 36 tests)**:
- 학부모: Home, Schedule, Map, Billing(상세포함), ChildProfile, NotificationSettings, Profile ✅
- 기사: Home, Route(TTS+네비+메모+일괄탑승+잔류확인), Profile ✅
- 학생: Schedule(친구표시+진행바), SafetyQuiz(10문제), Map, Profile ✅
- 공통: SOS 버튼, 온보딩, 로그인(dev/prod 분리) ✅

**웹 대시보드 (12 suites, 50 tests)**:
- 플랫폼: Users, Academies, Vehicles, Compliance, Map(관제), StudentSearch, NotificationLogs, Tickets, BoardingStatus, AuditLog ✅
- 학원: Dashboard, Students, Schedules, Vehicles, Drivers, Stats, Billing, MonthlyReport ✅

**랜딩 사이트**: CostSimulator, 사업자정보 Footer, sitemap.xml ✅

### 미완료/부분완료 4건 상세

| # | 항목 | 현재 상태 | 남은 작업 |
|---|------|----------|----------|
| A13/A14 | 위치정보/아동 동의 화면 | 백엔드 GuardianConsent 모델 + API 완료 | **모바일 전용 동의 수집 화면 미구현** — 현재는 시스템 권한 요청만 존재 |
| B01 | 스케줄 템플릿 관리 UI | 웹에서 조회+활성화/비활성화 토글만 존재 | **생성/수정/삭제 폼 미구현** |
| P2-52 | 스케줄 실시간 갱신 | 기사 앱이 useFocusEffect로만 데이터 로드 | **WS/FCM 기반 즉시 갱신 미구현** (30초 polling도 없음) |
| #72 | SSR/SSG (SEO) | 랜딩 사이트가 SPA (Vite + React) | **사전 렌더링 미구현** |

---

## 마일스톤 구조

남은 작업을 4개 마일스톤으로 구성합니다. 각 마일스톤은 9단계 워크플로우를 따릅니다.

```
M10: 동의 플로우 + 템플릿 UI  ──┐
M11: 실시간 갱신 + SEO         ──┼── M12: 통합 검증 ── M13: 프로덕션 릴리스
기존 구현 품질 검증             ──┘
```

---

## M10: 동의 플로우 + 스케줄 템플릿 UI

**범위**: A13, A14, B01
**예상 복잡도**: 중
**의존성**: 없음 (기존 백엔드 API 활용)

### Phase 0 — Intake

**Requirement Brief**:
1. **위치정보/아동 동의 화면**: 학부모가 앱에서 자녀의 위치 추적에 명시적으로 동의하는 화면. 개인정보보호법 + 위치정보법 요구사항. 동의 없이는 실시간 추적 사용 불가.
2. **스케줄 템플릿 CRUD UI**: 학원 관리자가 웹 대시보드에서 주간 반복 스케줄을 생성/수정/삭제할 수 있는 폼.

**Goals**:
- 학부모 앱 최초 진입 시 동의 플로우 → GuardianConsent API 호출
- 동의 철회 시 실시간 추적 비활성화
- 학원 관리자가 스케줄 템플릿을 자체 관리

**Non-goals**:
- 동의서 PDF 출력 (P3)
- 드래그-앤-드롭 스케줄 캘린더 (P3)

**Assumption Register**:
- GuardianConsent API (`POST /compliance/consents`, `GET /compliance/consents`) 정상 작동 확인 필요
- ScheduleTemplate API (`POST /schedules/templates`, `PATCH /schedules/templates/{id}`, `DELETE /schedules/templates/{id}`) 존재 확인 필요

**Acceptance Criteria**:
- [ ] 학부모 첫 로그인 후 동의 화면 표시 (이전 동의 기록 없을 때)
- [ ] 동의 항목: 위치정보 수집/이용, 자녀 위치 추적, 개인정보 제3자 제공
- [ ] 동의 거부 시 실시간 추적 탭 접근 차단 + 안내 메시지
- [ ] 동의 철회 기능 (설정 화면)
- [ ] 스케줄 템플릿 생성 폼: 학생 선택, 요일, 시간, 픽업 주소
- [ ] 스케줄 템플릿 수정/삭제 가능
- [ ] 기존 테스트 전체 통과

### Phase 1~3 — Review & Consensus

- `requirement-analyst` 에이전트로 요구사항 검증
- `tech-spec-reviewer` 에이전트로 스펙 스트레스 테스트
- GuardianConsent API + ScheduleTemplate API 실제 동작 확인

### Phase 4 — Todo Plan

```
M10-1: [백엔드] GuardianConsent API 동작 확인 + 필요 시 보완
M10-2: [모바일] ConsentScreen.tsx 구현 (동의 수집 UI)
M10-3: [모바일] 동의 상태 체크 → MapScreen 접근 제어
M10-4: [모바일] 설정에서 동의 철회 기능
M10-5: [웹] SchedulesPage 템플릿 생성 폼 추가
M10-6: [웹] SchedulesPage 템플릿 수정/삭제 기능
M10-7: [검증] 테스트 실행 + TypeScript 체크
```

### Phase 5~8 — Implementation → Verification → Closure → Handoff

- 구현 → 테스트 → 마일스톤 보고서 → 핸드오프

---

## M11: 실시간 갱신 + SEO

**범위**: P2-52, #72
**예상 복잡도**: 중~높음
**의존성**: M10 완료 불필요 (독립적)

### Phase 0 — Intake

**Requirement Brief**:
1. **스케줄 실시간 갱신 (P2-52)**: 학부모가 취소하면 기사 앱에 즉시 반영. 현재는 화면 전환해야 데이터 갱신됨.
2. **SSR/SSG (#72)**: 랜딩 사이트를 검색 엔진이 인덱싱할 수 있도록 정적 HTML 사전 렌더링.

**Goals**:
- 스케줄 변경 시 10초 이내 기사 앱 반영
- 랜딩 페이지 `npm run build` 시 정적 HTML 생성

**Non-goals**:
- 실시간 채팅 (WS 기반 메시징은 이미 있으나 실시간 스트리밍은 범위 외)
- Next.js 마이그레이션

**구현 방안 (2가지 옵션 검토)**:

**P2-52 옵션 A — WS 채널 확장**:
- 기존 vehicle telemetry WS 인프라에 `schedule_updated` 이벤트 추가
- 백엔드: cancel_daily_schedule() 시 해당 vehicle_id WS 채널로 이벤트 발행
- 모바일: RouteScreen에서 WS 구독 → 자동 리로드

**P2-52 옵션 B — FCM 푸시 + Polling Fallback**:
- 스케줄 변경 시 해당 기사에게 FCM data message 발송
- 기사 앱: FCM 수신 시 load() 재호출
- Fallback: 30초 주기 polling

**#72 구현**:
- `vite-ssg` 플러그인 추가
- 주요 페이지 (/, /pricing, /terms, /privacy) 사전 렌더링
- 기존 SPA 라우팅 유지

**Acceptance Criteria**:
- [ ] 학부모 스케줄 취소 시 기사 앱 10초 이내 반영
- [ ] WS 연결 실패 시 30초 polling fallback
- [ ] `npm run build` 시 주요 페이지 정적 HTML 생성
- [ ] 크롤러가 JS 없이 콘텐츠 접근 가능
- [ ] 기존 SPA 라우팅 정상 동작

### Phase 4 — Todo Plan

```
M11-1: [백엔드] 스케줄 변경 이벤트 발행 로직 (WS 또는 FCM)
M11-2: [모바일] 기사 RouteScreen WS 구독 / FCM 리스너 추가
M11-3: [모바일] 30초 polling fallback
M11-4: [사이트] vite-ssg 플러그인 설정
M11-5: [사이트] 주요 페이지 사전 렌더링 검증
M11-6: [검증] 실시간 갱신 E2E 테스트 + 빌드 검증
```

---

## M12: 통합 검증

**범위**: 전체 시스템 검증
**의존성**: M10, M11 완료 후

### Phase 0 — Intake

**Requirement Brief**:
기존 구현 51건 + 신규 구현 4건 = 전체 55건에 대한 통합 검증. 개별 기능이 아닌 **시스템 전체의 정합성과 품질**을 확인.

**Goals**:
- 백엔드 테스트 전체 통과 (목표: 95+ tests)
- 모바일 테스트 전체 통과 (목표: 36+ tests)
- 웹 테스트 전체 통과 (목표: 50+ tests)
- TypeScript 0 errors (모바일, 웹, 사이트)
- 보안 체크리스트 전체 통과

**검증 체크리스트**:

#### 보안 (P0)
- [ ] OTP: secrets 사용 + 5회 실패 잠금 동작 확인
- [ ] IDOR: 타인 자녀 조회 시 403 반환 확인
- [ ] WS 인가: 미인가 차량 추적 시 4003 종료 확인
- [ ] dev-login: production 환경에서 비활성 확인
- [ ] 미자격 기사 배차 차단 확인
- [ ] 미신고 차량 배차 차단 확인
- [ ] 동의 미수집 시 추적 차단 확인

#### 기능 (P1~P3)
- [ ] 지연 알림: 10분 초과 시 학부모 알림 발송
- [ ] 도착 확인: 하차 후 학원 도착 확인 → 학부모 알림
- [ ] 메시징: 학부모→기사 메시지 발송/수신
- [ ] CS 통합 조회: 학생 검색 → 보호자+학원+스케줄 표시
- [ ] 알림 로그: 발송 이력 조회 + 성공/실패 상태
- [ ] 기사 관리: 학원별 기사 목록 + 자격 상태
- [ ] 탑승 현황: 실시간 상태별 카운트
- [ ] 운행 통계: 기간별 정시율/완료율
- [ ] 월간 보고서: PDF 출력 가능
- [ ] 안전 퀴즈: 10문제 O/X + 점수 표시
- [ ] TTS: 다음 정류장 음성 안내

#### 데이터/컴플라이언스
- [ ] GPS 데이터 180일 후 자동 삭제
- [ ] 위치 접근 로그 6개월 후 자동 삭제
- [ ] 메시지 6개월 retention 적용
- [ ] 감사 로그 기록 정상

### Phase 4 — Todo Plan

```
M12-1: 백엔드 테스트 전체 실행 + 실패 수정
M12-2: 모바일 테스트 전체 실행 + 실패 수정
M12-3: 웹 테스트 전체 실행 + 실패 수정
M12-4: TypeScript 체크 (모바일 + 웹 + 사이트)
M12-5: 보안 체크리스트 수동 검증
M12-6: 기능 체크리스트 수동 검증
M12-7: 컴플라이언스 체크리스트 검증
M12-8: 검증 보고서 작성
```

---

## M13: 프로덕션 릴리스 준비

**범위**: 배포 준비 및 최종 점검
**의존성**: M12 완료 후

### Phase 0 — Intake

**Requirement Brief**:
검증 완료된 코드를 프로덕션 환경에 배포하기 위한 최종 준비. 코드로 해결 가능한 범위에 집중.

**Goals**:
- K8s 매니페스트 최종 검토
- 환경 변수 목록 정리
- 데이터베이스 마이그레이션 계획
- 모니터링 설정 확인

**Non-goals (외부 의존)**:
- 실서버 K8s 프로비저닝 (DevOps 팀)
- PG사 가맹점 계약 (사업팀)
- 앱스토어 제출 (사업팀 + DevOps)
- 규제 샌드박스 심사 대응 (법무팀)

### Phase 4 — Todo Plan

```
M13-1: 환경 변수 목록 + 시크릿 관리 문서 작성
M13-2: Alembic 마이그레이션 순서 확인 + 프로덕션 마이그레이션 스크립트
M13-3: K8s 매니페스트 검토 (리소스 limits, health checks, 스케일링)
M13-4: Prometheus 메트릭 + Grafana 대시보드 확인
M13-5: 에러 모니터링 (Sentry 또는 동등) 설정 확인
M13-6: 프로덕션 배포 체크리스트 작성
M13-7: 최종 세션 핸드오프 패킷
```

---

## 실행 순서 및 일정 예상

```
Week 1:
├── M10 (동의 플로우 + 템플릿 UI)  ← 코드 구현
│   ├── Phase 0-3: Intake → Review → Consensus → Spec
│   ├── Phase 4-5: Todo → Implementation
│   └── Phase 6-8: Verification → Closure → Handoff
│
└── M11 (실시간 갱신 + SEO)  ← 병렬 진행 가능
    ├── Phase 0-3: Intake → Review → Consensus → Spec
    ├── Phase 4-5: Todo → Implementation
    └── Phase 6-8: Verification → Closure → Handoff

Week 2:
├── M12 (통합 검증)  ← 전체 테스트 + 체크리스트
│   └── Phase 0-8
│
└── M13 (프로덕션 릴리스 준비)  ← 배포 준비
    └── Phase 0-8
```

---

## 9단계 워크플로우 적용 방법

각 마일스톤에서 다음 절차를 따릅니다:

| Phase | 활동 | 아티팩트 | 도구 |
|-------|------|---------|------|
| 0. Intake | 요구사항 분석 | Requirement Brief, Assumption Register | `requirement-analyst` 에이전트 |
| 1. Review | 독립 리뷰 | 리뷰 결과 | `tech-spec-reviewer` 에이전트 |
| 2. Consensus | 리뷰 결과 합의 | Consensus Matrix | 수동 |
| 3. Spec | 최종 기술 스펙 | Final Tech Spec | `artifacts/specs/` |
| 4. Plan | Todo 항목 분해 | Todo Plan | `artifacts/plans/` |
| 5. Implement | 코드 작성 | Change Summary, Gap Notes | Edit/Write 도구 |
| 6. Verify | 테스트 실행 | Verification Report | `artifacts/verification/` |
| 7. Closure | 마일스톤 종료 | Milestone Report | `artifacts/reports/` |
| 8. Handoff | 세션 인계 | Handoff Packet | `artifacts/handoffs/` |

---

## 리스크 관리

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 동의 플로우가 법률 요구사항 미충족 | 출시 차단 | 법무팀 검토 요청 (비코드) |
| SSG 플러그인이 기존 라우팅 깨뜨림 | 사이트 장애 | 기존 SPA fallback 유지, 점진 적용 |
| WS 실시간 갱신이 불안정 | 기사 UX 저하 | FCM fallback + 30초 polling 이중 보호 |
| 통합 검증에서 예상 외 실패 발견 | 일정 지연 | M12에 버퍼 포함, 우선순위별 수정 |

---

## 결론

**55건 중 51건이 이미 구현 완료.** 남은 4건(동의 화면, 템플릿 CRUD, 실시간 갱신, SSG)과 통합 검증 + 프로덕션 준비가 잔여 작업.

기존 코드 품질(TypeScript 0 errors, 181 tests passing)을 감안하면, 4개 마일스톤(M10~M13)으로 프로덕션 릴리스 준비를 완료할 수 있습니다.
