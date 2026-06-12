# Milestone Report — PT 결제 플로우 완성 + 회원가입 시스템 (2026-06-11)

**Trigger**: 사용자 보고 "결제 시스템 UI가 너무 후지고, 회원 가입 시스템도 부재해" + 결정 (가입=Firebase 기반+소셜, 즉시 착수)
**Workflow**: Phase 0 Brief → Phase 1 독립 리뷰 3건 (backend/frontend/security) → Phase 2 Consensus(14쟁점) → Phase 3 Final Tech Spec → Phase 4 Todo → Phase 5 구현 (M-A/B/C) → Phase 6 검증 → 본 closure

## 완료된 것 (커밋 5개: b3ca19b → efed742 → 30843c4 → 17cfb3d + 본 마감)
**백엔드 (M-A)**: UserConsent 모델+마이그레이션, OTP 가입 동의 게이트(PT/CC만, SafeWay 불변), `/auth/consents`, `/auth/firebase/{custom-token,link,register}`, 듀얼 인증(JWT→Firebase) + PT 라우터 전환, Kakao redirect allowlist + PT용 app_context/role, `GET /pt/payments`, PortOne dev-mock allowlist 하드닝
**모바일 (M-B/C)**: App.tsx 재작성(미인증 루트=Onboarding→Login, role 동적 분기), ConsentScreen(필수 게이트+약관 열람), LoginScreen(동의 단계+OTP 재전송 타이머+재동의 유도), Kakao·Firebase config-gate, PaymentScreen(modal, dev-mock), PaymentHistoryScreen 재구축(pt_payments+영수증), BookingCreate 결제 진입, WalkerHome 자격 배너
**부수 수정**: confirm_payment 두 동강 선재 버그 (HIGH, gap-note) / package-lock expo-speech 정합화

## 검증 (상세: [verification](../verification/2026-06-11-pt-payment-signup-verification.md))
- 백엔드 **240 passed / 247** (신규 26 전부 PASS, 기지 KI-2/3/4 외 fail 0 = 회귀 0)
- 모바일 PT 30/30 + SafeWay 71/71 jest, tsc 3앱 0 errors
- user_consents 마이그레이션 실 PG up/down/up 검증

## 남은 것 (UNVERIFIED / 사용자 액션)
- **EXT-12**: Kakao 콘솔 앱 등록 + redirect URI → `app.json extra.kakaoRestApiKey/kakaoRedirectUri` 설정 시 버튼 활성화
- **EXT-13**: Firebase 콘솔 웹 앱 추가 → `extra.firebaseWebConfig` + 백엔드 service account → Firebase 세션 브리지 활성화
- 실 PG 채널 (사업자 계정 — fallback 결정 종속) / Expo Go 실기기 확인 (사용자 환경)

## Residual Risks
- 동의 문서 버전이 모바일/백엔드 두 곳 상수 (불일치 시 422로 fail-loud — 무해하지만 동기 필요)
- KI-5 (fresh DB alembic 체인) 여전 — 신규 환경 프로비저닝 시 본 마이그레이션 2건도 체인 뒤에 있어 동일 영향
- 위치정보 §24 접근 audit log·14세 미만 보호자 동의 플로우는 V1.1 범위로 명시 이연
