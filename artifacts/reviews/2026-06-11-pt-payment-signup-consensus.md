# Consensus Matrix — PT 결제 플로우 + Firebase 가입 (2026-06-11, Phase 2)

리뷰어: backend-dev / frontend-dev / security-expert (3/3 수신 — 별도 sub-agent 실행, 트랜스크립트 보존)
Brief: [`2026-06-11-pt-payment-ui-signup-brief.md`](../specs/2026-06-11-pt-payment-ui-signup-brief.md)

## 합의/이견 매트릭스

| # | 쟁점 | backend-dev | frontend-dev | security | **결정** |
|---|---|---|---|---|---|
| 1 | Kakao 소셜 V1 포함 | bridge는 2차 분리 | **V1 컷** (Expo Go redirect 제약) | 포함 시 PKCE/state/allowlist MUST | **백엔드 풀 구현 + 모바일 config-gate** — 사용자 지시("Firebase 기반+소셜")가 우선. Kakao 콘솔/Firebase web config 미설정 시 버튼 숨김, OTP가 기본 경로. EXT 의존 2건 blocker 기록 |
| 2 | 듀얼 인증 (Firebase↔JWT) | **컷하고 순수 Firebase 전환** (PT 테스트 0 주장) | config-gate 전제 필요 | downgrade 방지: 예외 클래스 게이팅 + 401/503 분리 MUST | **듀얼 채택, 단 JWT-우선 순서** — backend 주장 반증: `test_persona_scenarios.py`·`test_cross_app_isolation*.py`가 JWT로 `/pt/*` 호출 (실측). 로컬 JWT 검증 먼저(결정적·무네트워크) → 실패 시 Firebase verify. 예외 클래스 엄격 분리, infra 오류는 503 |
| 3 | RBAC 체인 (C-1) | PT 체커 전면 재배선 필요 | — | — | **PT 전용 체커 신설** (`require_pt_roles` → 듀얼 dep). SafeWay `require_roles` 불변 (D-7 보호) |
| 4 | phone NOT NULL (M-1) | 최대 갭, 선결 | 신규/기존 name 덮어쓰기 지적 | — | **스키마 불변** — 소셜 유저도 phone+OTP 본인확인 후 가입 완료 (한국 관행). `otp_login_or_register` name 덮어쓰기는 빈 name 시 미변경 활용, 모바일이 기존 로그인에 name 미전송 |
| 5 | UserConsent 설계 | 별도 테이블 지지, 모듈 위치 지정 필요 | 마케팅 동의 컷 제안 | doc_type에 **location** 추가 MUST + age14 게이트 MUST + consent_method SHOULD + 버전 레지스트리 MUST | **modules/auth/models.py에 UserConsent** — doc_type: terms\|privacy\|location\|marketing\|age14. 필수: terms·privacy·age14 (전원) + location (walker). marketing 선택(opt-in). doc_version은 코드 상수 레지스트리(버전→sha256) 매핑. consent_method 컬럼 포함 |
| 6 | custom-token 브리지 | 2차 분리 제안 | — | uid는 서버 측 current_user에서만 + rate limit MUST | **V1 포함하되 security MUST 전부 반영** (uid 서버 유래, rate limit, audit log). 사용자 지시상 Firebase 연결고리가 핵심이라 분리 안 함 |
| 7 | PortOne dev-mode fail-open | — | — | **allowlist(`development`,`test`) + 프로덕션 시크릿 startup 검증 MUST** + warning 로그 | **채택** — `_is_dev` allowlist 전환, 미설정 환경은 실호출 경로(fail-closed), `[DEV-MOCK-PAYMENT]` warning 로그 |
| 8 | 결제-예약 순서 | webhook 존재 확인 필요 (존재함 — `/billing/webhook/portone` 실측) | **예약 생성 → PaymentScreen(modal) → prepare→confirm** | dev 모드 금액 검증 없음 주의 | frontend 안 채택. 미결제 예약은 pending 유지, 취소 시 전액 환불 카피 (자동 환불 로직은 V1.1) |
| 9 | GET /pt/payments | owner 필터 + cancel 필드 + booking context + status filter | walker wallet은 별도 유지 | owner-scope 검증 테스트 | 전부 채택 (limit/offset 페이지네이션 포함) |
| 10 | 모바일 가입 플로우 | — | App.tsx 재작성 (pre-auth 스택), PolicyScreen pre-auth 노출, OTP 재전송 타이머, 온보딩은 홈 배너로 축소 | 동의 없으면 가입 차단 | 전부 채택. DevTokenPaste는 `__DEV__` 진입으로 보존 |
| 11 | firebase_auth.py 위생 | get_running_loop + create_custom_token executor wrap + bounded pool | — | wait_for(5s) + 401/503 분리 MUST | 전부 채택 |
| 12 | `hmac.new` "치명 버그" | — | — | 주장 | **반증 (REFUTED)** — Python 3 표준 API. 금일 `test_portone_provider.py` HMAC 3건 PASS 실증. 채택 안 함 |
| 13 | python-jose CVE | — | — | SHOULD 교체 | **이연** — 전 앱 공통 의존, 본 범위 밖. Known Issue로 기록 |
| 14 | Kakao state CSRF (Redis) | — | — | MUST(state)/COULD(Redis) | **부분 채택** — redirect_uri allowlist는 V1, server state 검증은 V1.1 이연 (expo-auth-session이 클라이언트 state 검증 수행, 서버 교환 모델 + secret 서버 보관) |

## 리뷰어 공통 (만장일치)
- 동의 없는 현 가입 플로우는 출시 차단급 — ConsentScreen 필수
- PaymentHistory의 booking 기반 유사 내역은 pt_payments 실 데이터로 교체
- 기존 테스트 회귀 0 유지가 게이트

## 미해결 → Open Questions로 이관
- 만 14세 미만 법정대리인 동의 플로우 (V1은 ≥14 self-attestation 게이트만, 미만 차단)
- 위치정보 §24 접근 audit log·180일 보존 (V1.1 — 별도 컴플라이언스 슬라이스)
