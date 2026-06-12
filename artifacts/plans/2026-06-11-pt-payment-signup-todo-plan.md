# Todo Plan — PT 결제 + Firebase 가입 (2026-06-11, Phase 4)

Spec: [`../specs/2026-06-11-pt-payment-signup-final-tech-spec.md`](../specs/2026-06-11-pt-payment-signup-final-tech-spec.md)

## M-A 백엔드 (FR-C, FR-F, FR-P)
- [ ] A1 UserConsent 모델 + consent_docs.py 레지스트리 + 마이그레이션 (down_rev=f7c2d4a91b3e)
- [ ] A2 otp/verify 동의 게이트 (PT/CC 신규만) + GET·POST /auth/consents
- [ ] A3 firebase_auth.py 위생 (running_loop·bounded executor·wait_for·401/503 분리) + get_current_user_dual
- [ ] A4 /auth/firebase/custom-token (+rate limit, uid 서버 유래, audit) · /auth/firebase/link (멱등·409) · /auth/firebase/register
- [ ] A5 rbac PT 듀얼 체커 + pettracker/router.py 의존성 교체
- [ ] A6 Kakao redirect_uri allowlist
- [ ] A7 PortOne _is_dev allowlist + warning 로그 + fail-closed
- [ ] A8 GET /pt/payments (owner·status·pagination) + 스키마
- [ ] A9 백엔드 신규 테스트 (≥15) + 전체 회귀

## M-B 모바일 가입 (FR-M)
- [ ] B1 AuthStackNavigator + App.tsx 재작성 (role 분기·DevTokenPaste __DEV__)
- [ ] B2 ConsentScreen + core-mobile auth.ts consents 파라미터
- [ ] B3 LoginScreen 개선 (OTP 재전송 타이머·name optional·required_consents 유도)
- [ ] B4 Kakao 버튼 config-gate (expo-auth-session) + Firebase 어댑터 config-gate
- [ ] B5 홈 배너 2종 (펫 등록·자격 신청)

## M-C 모바일 결제 (FR-MP)
- [ ] C1 src/api/payments.ts
- [ ] C2 PaymentScreen (modal·성공/실패 in-screen)
- [ ] C3 PaymentHistoryScreen 재구축 + 상세
- [ ] C4 BookingCreateScreen 결제 진입

## M-D 검증·마감
- [ ] D1 mobile tsc + jest + 백엔드 pytest 회귀
- [ ] D2 Verification Report + STATE/CLAUDE 갱신 + Milestone Report + 핸드오프
