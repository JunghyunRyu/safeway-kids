# Final Tech Spec — PetTracker 모바일 UX 86건 수정

- **작성일**: 2026-06-03
- **상태**: APPROVED (사용자 "모두 구현" 지시 — 결정 우선순위 #1)
- **입력**: [`artifacts/reviews/2026-06-03-pt-mobile-ux-audit-consolidated.md`](../reviews/2026-06-03-pt-mobile-ux-audit-consolidated.md)
- **범위**: `apps/pettracker/mobile` 전체 + 일부 `backend/`
- **워크스트림 충돌 고지**: D-8(6/15까지 가벼운 슬라이스) / R-3(burnout)와 충돌하나 사용자 명시 오버라이드. 마일스톤 분할 + 검증 게이트로 리스크 관리.

## 1. 문제 정의
UX 감사 86건(P0 10 / P1 41 / P2 28 / P3 7). 최상위는 인증 진입/역할 분기가 데모 스캐폴딩(GATE-1/2, 코드 검증 완료). 나머지는 stub·신뢰공백·현장조작·카피·접근성·폼.

## 2. Goals / Non-goals
**Goals**: 86건을 구현 가능한 범위 전부 처리. 외부 자원 의존 항목은 UI 완성 + 백엔드 스텁 + 차단 플래그로 정직 처리. 회귀 0.
**Non-goals**: 신규 디자인 시스템. SafeWay(D-7 동결). OpenAI 의존 AI 기능(P2 Track 2). EAS 빌드(별도). 실 SMS/PG 계약(사업자 의존).

## 3. 차단(외부 자원 의존) 항목 — 정직 처리 정책
| 항목 | 의존 | 처리 |
|------|------|------|
| O-34/O-36 펫·워커 사진 | 이미지 스토리지(S3 미배선, WalkPhoto 모델만 존재) | UI 이미지 피커 + 업로드 함수 스텁. 실 업로드는 P2-2 |
| S-06 OTP 재전송 / 실 OTP | SMS 게이트웨이 | 재전송 버튼 + 쿨다운 UI 구현, 기존 sendOtp 재호출(백엔드 dev OTP) |
| S-08 Chat / U-11 | Chat 백엔드 엔드포인트 유무 확인 후 | 엔드포인트 있으면 연동, 없으면 낙관적 업데이트 + 전송실패 표시 + TODO 플래그 |
| O-01 SOS 실번호 | 워커 전화번호 필드 | placeholder 제거, walker phone 있으면 사용 / 없으면 버튼 비활성+채팅 유도 |

## 4. 아키텍처/데이터 흐름 — 핵심 변경
### GATE-1/2 (App.tsx)
```
mount → tokenStorage.getItem(access_token)
  null  → <LoginScreen onLogin={(role)=>{setRole(role);setHasToken(true)}} />   (DevTokenPaste는 __DEV__ 보조 경로)
  exists→ getMe() → setRole(resp.role) → role==='walker'? Walker : Owner
logout 이벤트 → setHasToken(false)
```
role을 `useState`로 관리(setter 추가), 부팅 시 `getMe()` 1회. 실패 시 토큰 무효로 보고 LoginScreen.

## 5. 마일스톤 (Todo Plan 매핑)
- **M-UX-A** 인증게이트: App.tsx, LoginScreen 배선, getMe role, logout. (#2)
- **M-UX-B** stub 처리: C2 8건. (#3)
- **M-UX-C** Walker 현장: W-01/02/03/15/16/11. (#4)
- **M-UX-D** 신뢰표시 + 백엔드 필드: C4 + booking walker_name. (#5)
- **M-UX-E** 지도/리포트: C5. (#6)
- **M-UX-F** 카피/B2C: C6. (#7)
- **M-UX-G** 접근성: C7. (#8)
- **M-UX-H** 폼/빈상태 + 법무플래그: C8 + S-19. (#9)
- **M-UX-V** 검증·리포트. (#10)

## 6. 검증 전략
- 각 마일스톤 후: `npx tsc --noEmit`(apps/pettracker/mobile), 영향 jest.
- 백엔드 변경(M-D): `pytest` 영향 모듈 + 회귀.
- 전체 종료: tsc 0, jest 회귀 0, pytest 회귀 0, 증거 artifact.

## 7. 롤백
마일스톤별 커밋 분리. 회귀 발생 시 해당 마일스톤 커밋 revert.

## 8. Acceptance Criteria
- P0 10건 전부 수정 또는 (차단 항목) UI완성+스텁+플래그.
- tsc/jest/pytest 회귀 0.
- B2C 카피 제약(내부용어·워커·포지셔닝) 위반 0.
- 차단 항목 핸드오프에 명시.

## 9. Code Impact Map (요약)
- `App.tsx`, `screens/shared/{LoginScreen,DevTokenPaste,Onboarding,Chat,Profile,NotificationSettings,Policy}.tsx`
- `screens/owner/*` 13파일, `screens/walker/*` 5파일
- `navigation/{Owner,Walker}*.tsx`, `constants/theme.ts`
- `backend/app/apps/pettracker/{schemas,service,router}.py` (walker_name, size filter, session_id)
- 신규: WalkerStackNavigator(Chat 등록용) 검토
