# Final Tech Spec — PT 결제 플로우 완성 + Firebase 기반 가입 시스템 (2026-06-11)

Phase 3 산출물. Brief: [`2026-06-11-pt-payment-ui-signup-brief.md`](2026-06-11-pt-payment-ui-signup-brief.md) / Consensus: [`../reviews/2026-06-11-pt-payment-signup-consensus.md`](../reviews/2026-06-11-pt-payment-signup-consensus.md)
선행 스펙 계승: 2026-04-24 pt-quality-uplift FR-2.x (Firebase Auth), FR-1.x (PortOne)

## 1. Problem Statement
PT 모바일은 (a) 결제 호출부가 전무해 백엔드 PortOne 인프라가 사장되어 있고, (b) 약관·개인정보·위치정보 동의 없이 OTP 자동가입되어 법적 출시 요건 미달이며, (c) 4월 스펙의 Firebase 전환(B-7~B-9)이 중단된 상태다.

## 2. Goals / Non-goals
**Goals**: G1 동의 기반 명시적 가입 플로우(법적 요건 충족) / G2 Firebase 인증 연결고리 완성(custom token 브리지, 소셜 config-gate) / G3 예약→결제→내역 end-to-end (mock 채널) / G4 회귀 0
**Non-goals**: 실 PG 가맹 호출, 만 14세 미만 법정대리인 동의 플로우, 위치정보 §24 audit log(V1.1), python-jose 교체, SafeWay/CC 변경

## 3. User Scenarios
- S1 신규 보호자: 온보딩 → 약관·개인정보·만14세 동의 → 전화 OTP → 가입 완료 → 홈 (펫 등록 배너)
- S2 신규 워커: 동일 + 위치정보 동의 필수 → 홈 (자격 신청 배너)
- S3 기존 사용자: 전화 OTP → 바로 홈 (name 미전송, 동의 재요구 없음 — 단 신규 필수 동의 미보유 시 동의 화면)
- S4 보호자 결제: 예약 생성 → 결제 화면(modal) → 결제 진행(mock) → 성공 → 예약 상세. 내역 화면에서 영수증 확인
- S5 (config 설정 시) Kakao 로그인 → 미가입자면 동의+phone OTP로 이어서 가입

## 4. Functional Requirements

### 4.1 Backend — 동의 (FR-C)
- FR-C1 `UserConsent` 모델 (modules/auth/models.py): id, user_id FK(users, index), doc_type String(20) [terms|privacy|location|marketing|age14], doc_version String(64), consent_method String(40) default "mobile_checkbox_v1", granted_at, withdrawn_at nullable, ip_address String(45) nullable. Index (user_id, doc_type). Alembic 마이그레이션 1건 (직접 작성, down_revision=f7c2d4a91b3e)
- FR-C2 동의 문서 버전 레지스트리: `modules/auth/consent_docs.py` 상수 `CONSENT_DOC_VERSIONS: dict[doc_type, version]` (e.g. "2026-06-11"). 요청 doc_version은 레지스트리와 일치 검증
- FR-C3 `POST /auth/otp/verify` 확장: optional `consents: list[{doc_type, doc_version}]`. **app_context ∈ {pettracker, careconnect} 신규 가입 시** 필수 동의(terms, privacy, age14 + walker면 location) 누락이면 422 + `missing_consents` 목록. 기존 사용자는 동의 보유 검사 → 미보유 시 응답에 `required_consents` 포함(403 아님, 클라이언트 유도). SafeWay(app_context=safeway_kids)는 동작 불변
- FR-C4 `GET /auth/consents` (인증): 내 동의 현황. `POST /auth/consents` : 추가 동의(마케팅 등)/철회(withdrawn_at)

### 4.2 Backend — Firebase 연결 (FR-F)
- FR-F1 `POST /auth/firebase/custom-token` (JWT 인증, rate limit OTP와 동일): uid는 **server-side current_user에서만 유래**. firebase_uid 없으면 `pt:{user.id}` 형식으로 생성·저장 후 발급. `create_custom_token`은 executor wrap. 발급은 audit log 기록
- FR-F2 `POST /auth/firebase/link` (Firebase ID token 인증): token uid를 current JWT 사용자에 연결. 이미 다른 사용자에 연결된 uid면 409. 동일 사용자 재호출은 200 (멱등)
- FR-F3 `POST /auth/firebase/register`: body = firebase ID token + name + phone + role + app_context + consents. ID token 검증 → phone+app_context 기존 사용자면 firebase_uid 연결, 신규면 생성. 필수 동의 FR-C3 규칙 동일 적용
- FR-F4 firebase_auth.py 위생: `get_running_loop()`, 전용 `ThreadPoolExecutor(max_workers=4)`, `asyncio.wait_for(…, 5.0)`, 예외 분리 — `InvalidIdTokenError/ExpiredIdTokenError/RevokedIdTokenError` → 401, 그 외 인프라 오류 → 503
- FR-F5 듀얼 인증 dependency `get_current_user_dual` (middleware/firebase_auth.py): ① 로컬 JWT decode 시도 (jose JWTError만 잡음) ② 실패 시 Firebase verify (FR-F4 예외 규칙) ③ 모두 실패 → 401. PT 전용 role checker `require_pt_owner_dual`/`require_pt_walker_dual`/`require_pt_any_dual` (middleware/rbac.py에 추가, 기존 체커 불변) → `apps/pettracker/router.py` 의존성 교체
- FR-F6 Kakao 하드닝: `KakaoLoginRequest.redirect_uri`는 `settings.kakao_allowed_redirect_uris`(콤마 구분 env) allowlist 검증, 불일치 422. allowlist 미설정 시 settings.kakao_redirect_uri만 허용

### 4.3 Backend — 결제 (FR-P)
- FR-P1 `GET /pt/payments` (owner 전용): 내 결제 목록. PtBooking join으로 owner 필터 + scheduled_at, duration_minutes, pet_name 포함. query: status?, limit(기본 20, 최대 100), offset. 응답에 cancel_amount/cancel_reason/cancelled_at/merchant_uid 포함
- FR-P2 PortOne dev-mode 하드닝: `_is_dev = settings.environment in ("development", "test")`, mock 경로 로그 `logger.warning("[DEV-MOCK-PAYMENT] …")`. production+secret 미설정 시 호출 시점 RuntimeError (fail-closed)

### 4.4 Mobile — 가입 (FR-M)
- FR-M1 App.tsx 재작성: 미인증 루트 = `AuthFlow` (Onboarding → Consent → Login). 인증 시 tokenStorage의 user role로 Owner/Walker 네비게이터 분기 (하드코딩 제거). DevTokenPaste는 `__DEV__` 시 Login 하단 진입으로 보존. 로그인 성공 시 role 저장
- FR-M2 `ConsentScreen` 신규: 전체 동의 토글 + 개별 항목 (필수: 이용약관/개인정보/만14세 확인, walker 선택 시 위치정보 필수, 선택: 마케팅). 각 항목에서 PolicyScreen(pre-auth 스택에 등록) 열람. 필수 미체크 시 다음 버튼 비활성
- FR-M3 LoginScreen 개선: role 선택 유지 → Consent 통과 후 phone 단계. OTP 재전송 타이머(60s), 기존 사용자 로그인 시 name 미전송(빈 문자열). verify 응답이 `required_consents` 반환 시 ConsentScreen으로 유도
- FR-M4 Kakao 버튼 (config-gate): `app.json extra.kakaoRestApiKey` + `extra.kakaoRedirectUri` 존재 시에만 노출. expo-auth-session 코드 플로우 → `POST /auth/kakao`. 미설정 시 미노출 (OTP만)
- FR-M5 Firebase JS SDK 어댑터 (config-gate): `extra.firebaseWebConfig` 존재 시 App 엔트리에서 동기적으로 `setFirebaseAuthAdapter()` 주입 (firebase/auth web SDK + AsyncStorage persistence). 미설정 시 어댑터 미등록 = 기존 JWT 동작 (듀얼 인증이 수용)
- FR-M6 온보딩-lite: OwnerHome에 펫 0마리면 등록 유도 배너 / WalkerHome에 자격 미신청이면 신청 유도 배너 (신규 화면 없음 — frontend 리뷰 컷 반영)

### 4.5 Mobile — 결제 (FR-MP)
- FR-MP1 `src/api/payments.ts`: preparePayment/confirmPayment/cancelPayment/listPayments (백엔드 스키마 매핑)
- FR-MP2 `PaymentScreen` (modal): 예약 생성 직후 booking_id로 진입. 금액 요약(산책 시간·펫·일시), 결제 수단(카드 — mock 단계 라벨 "테스트 결제"), 진행 버튼 → prepare → confirm → 성공/실패 상태 in-screen (별도 결과 화면 없음 — frontend 컷 반영) → 예약 목록 이동. 에스크로 카피: "산책 완료 후 정산되며, 취소 시 전액 환불됩니다"
- FR-MP3 `PaymentHistoryScreen` 재구축: listPayments 기반, 상태 라벨 결제 의미론으로 수정 (paid=결제 완료, pending=결제 대기, cancelled=취소, refunded=환불), 합계는 paid만. 항목 탭 → 상세(영수증: 금액/일시/상태/취소 사유/주문번호)
- FR-MP4 BookingCreateScreen: 생성 성공 Alert → PaymentScreen 진입 버튼 ("결제하기") + 나중에 결제 (Bookings로)

## 5. Non-functional
- NFR-1 회귀 0 (백엔드 214/221 기준선, 모바일 tsc 0 errors, 기존 jest 통과)
- NFR-2 Firebase verify 타임아웃 5s, 결제 confirm 응답 p95 < 1s (dev mock)
- NFR-3 신규 백엔드 테스트: 동의 게이트/custom-token 보안/링크 멱등/payments 목록 권한 — 최소 15건
- NFR-4 비밀값 로그 금지, 동의 ip는 INFO 로그 미출력

## 6. Constraints
- Expo Go (SDK 54) — 네이티브 모듈 불가, Firebase는 JS SDK만
- 사업자 계정 부재 — PortOne 실 채널 불가 (dev-mock)
- EXT-12 (NEW): Kakao 콘솔 redirect URI 등록 — 사용자
- EXT-13 (NEW): Firebase web config 발급 — 사용자 (콘솔에서 웹 앱 추가)

## 7. Architecture / Data Flow
```
[가입] Onboarding → Consent(필수 체크) → Login(OTP|Kakao)
  OTP: send → verify(+consents) → JWT+user → (config 시) custom-token → firebase signIn → link
  Kakao: expo-auth-session code → /auth/kakao → JWT → (위와 동일 브리지)
[인증] PT 라우터: get_current_user_dual = JWT decode → 실패 시 Firebase verify
[결제] BookingCreate → POST /pt/bookings → PaymentScreen(modal)
  → POST /pt/payments/prepare (merchant_uid) → POST /pt/payments/confirm (dev-mock PAID)
  → GET /pt/payments (내역/영수증)
```

## 8. Edge Cases
- 동의 일부만 보유한 기존 사용자 → verify 응답 required_consents → ConsentScreen 재진입
- custom-token 요청 시 firebase_uid 부재 → 서버가 생성·저장 후 발급
- link 충돌 (uid 이미 타 계정) → 409 + 안내
- 결제 confirm 중복 호출 → 기존 멱등 동작 유지 (PAID+same imp_uid → 200)
- prepare 후 이탈 → PENDING 잔존 → 내역 화면 "결제 대기" 표시, 재시도 가능
- Kakao config 없음 → 버튼 미노출 / Firebase config 없음 → 어댑터 미등록, JWT로 전 기능 동작

## 9. Failure Handling
- Firebase 인프라 오류 → 503 (401 아님), 클라이언트 재시도 유도
- OTP 발송 실패 → 기존 Alert 유지 + 재전송 타이머 리셋
- confirm 실패 → PaymentScreen 실패 상태 + 재시도 버튼, 예약은 유지

## 10. Testing Strategy
- 백엔드 unit/integration: 동의 게이트(필수 누락 422, walker location 필수, SafeWay 불변), custom-token(uid 서버 유래·rate limit), link 멱등·409, dual auth(JWT 경로·Firebase mock 경로·infra 503), payments 목록(owner 필터·status 필터·페이지네이션), PortOne allowlist(`staging→실호출 경로`)
- 모바일 jest: ConsentScreen 게이트 로직, payments api 매핑, PaymentHistory 라벨, App 미인증 루트 smoke. `expo-auth-session` mock을 setup.ts에 추가
- 전체 회귀: 백엔드 pytest --timeout=120 (KI-2/3/4 기지 제외 fail 0), mobile tsc + jest

## 11. Rollback
- 백엔드: 마이그레이션 downgrade 1건 (user_consents drop). 신규 endpoint는 라우터 제거로 격리. PT 라우터 의존성은 단일 commit revert 가능
- 모바일: App.tsx 이전 버전 revert로 전체 플로우 원복 (화면 추가는 미사용 코드로 무해)

## 12. Acceptance Criteria
1. 신규 PT 사용자는 필수 동의 없이 가입 불가 (백엔드 422 + UI 차단 양쪽)
2. user_consents에 doc_type·doc_version·method·granted_at·ip 기록
3. walker 가입은 location 동의 필수
4. 기존 SafeWay·PT JWT 호출 전부 기존대로 동작 (회귀 0)
5. custom-token이 타 사용자 uid로 발급 불가 (테스트 증명)
6. 예약 생성→결제→내역 end-to-end가 dev-mock으로 완주, pt_payments 행 생성
7. 결제 내역이 pt_payments 실 데이터 표시 (booking 유사 내역 제거)
8. PortOne provider가 staging에서 mock 미작동 (allowlist 테스트)
9. mobile tsc 0 errors + jest 전체 PASS + 백엔드 기지 외 fail 0

## 13. Out of Scope
실 PG 채널, server-side Kakao state(Redis), 위치 audit log §24, 14세 미만 플로우, walker 정산 화면 개편, python-jose 교체

## 14. Code Impact Map
- backend: modules/auth/{models,schemas,service,router,consent_docs*}.py, middleware/{firebase_auth,rbac}.py, apps/pettracker/{router,schemas,service}.py, modules/billing/providers/portone.py, config.py(+kakao_allowed_redirect_uris), migrations/versions/+1, tests/+3 파일
- mobile(PT): App.tsx, src/navigation/AuthStackNavigator.tsx(신규), src/screens/shared/{ConsentScreen(신규),LoginScreen,OnboardingScreen}, src/screens/owner/{PaymentScreen(신규),PaymentHistoryScreen,BookingCreateScreen,OwnerHomeScreen}, src/screens/walker/WalkerHomeScreen, src/api/payments.ts(신규), src/__tests__/+2~3 파일
- packages/core-mobile: api/auth.ts(consents 파라미터, name optional), hooks/useFirebaseAuth.ts(불변 — 어댑터 주입만)
