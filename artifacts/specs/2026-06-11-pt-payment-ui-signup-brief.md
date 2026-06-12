# Requirement Brief — PT 결제 UI 개선 + 회원가입 시스템 (2026-06-11, Phase 0 draft)

**User report (verbatim 요지)**: "결제 시스템 UI가 너무 후지고, 회원 가입 시스템도 부재해"
**대상 앱 (가정 A-1)**: PetTracker mobile (`apps/pettracker/mobile`) — 유일하게 출시 트랙에 있는 앱

## 현황 실측 (read-only 탐색, 2026-06-11)

### 결제 — "후지다"의 실체: UI 이전에 **플로우 자체가 placeholder**
| 레이어 | 상태 |
|---|---|
| 백엔드 | ✅ PortOne v2 prepare/confirm/cancel/webhook 완비 (`/pt/payments/*`) + dev-mode mock 분기 + 6/11 테스트 7건 |
| 모바일 결제 호출부 | ❌ **없음** — `src/api/`에 payments 모듈 자체가 부재. 백엔드 prepare/confirm을 아무도 호출하지 않음 |
| 예약 생성 화면 | `BookingCreateScreen`: "결제 금액" 표시 + "산책 완료 후 안심 결제가 확정됩니다" 문구뿐, 결제창 미연동 |
| 결제 내역 화면 | `PaymentHistoryScreen`: **bookings를 필터링**해 보여주는 유사 내역 (실 `pt_payments` 데이터 미사용). 영수증 상세·환불 요청 없음 |

### 회원가입 — "부재"의 실체: 백엔드는 암묵 가입 지원, **모바일 UX가 가입 단계 생략**
| 레이어 | 상태 |
|---|---|
| 백엔드 | ✅ `otp_login_or_register` — OTP 검증 시 신규면 자동 가입 (이름·역할 포함) |
| 모바일 | `LoginScreen` 단일: 역할선택 → 이름+전화번호 → OTP 6자리 끝. **약관·개인정보 동의 없음**, 신규/기존 구분 없음, 가입 온보딩(프로필·펫 등록 유도) 없음, walker 자격 신청 진입 없음 |
| 법적 리스크 | 개인정보보호법상 수집·이용 동의를 UI에서 받지 않고 가입 처리 — **출시 전 필수 보완** |

## Goals (draft)
1. 결제: 예약 → 결제 prepare → 결제 수단 UI → confirm → 결과/영수증까지 끊김 없는 플로우 + `pt_payments` 기반 실 결제 내역 화면
2. 회원가입: 약관·개인정보 동의 → OTP 인증 → 신규 사용자 온보딩(프로필 완성, 보호자=펫 등록 유도 / walker=자격 신청 유도)의 명시적 가입 플로우

## Non-goals (draft)
- PortOne 실 가맹 계약·실 카드 결제 (사업자 계정 = fallback 결정 종속, P2)
- SafeWay Kids / CareConnect 결제·가입 (동결/보류 유지)

## Assumption Register
- A-1: 대상은 PT mobile (SafeWay 동결 D-7 유지)
- A-2: 실 PG 호출 없이 백엔드 dev-mode mock으로 결제 플로우 end-to-end 구성 가능 (검증됨 — provider dev 분기 존재)
- A-3: OTP SMS 실 발송 인프라는 본 범위 밖 (기존 백엔드 동작 유지)

## Open Questions → 사용자 결정 (2026-06-11 회신)
- Q-1 결제 범위: **무응답** → 추천안 채택 가정 (A-4): **결제 플로우 전체** (prepare→수단 UI→confirm→결과→pt_payments 기반 내역). 실 카드 결제는 mock 채널, 출시 시 채널 키 교체
- Q-2 가입 방식: ✅ **"Firebase 기반 + 소셜 로그인"** (사용자 직접 입력). 4월 승인 스펙(2026-04-24 pt-quality-uplift FR-2.x)의 Firebase 전환 설계와 합치 — 미들웨어 존재, B-7(라우터 전환·가입 endpoint) 미구현 상태에서 재개
- Q-3 착수 시점: ✅ **지금 바로 착수** (D-8 예외 — 사용자 명시 지시)

## Assumption Register (갱신)
- A-1: 대상은 PT mobile (SafeWay 동결 D-7 유지)
- A-2: 실 PG 호출 없이 백엔드 dev-mode mock으로 결제 플로우 end-to-end 구성 가능 (검증됨)
- A-3: OTP SMS 실 발송 인프라는 본 범위 밖 (기존 백엔드 동작 유지)
- A-4: Q-1 무응답 → 결제 플로우 전체 범위로 진행 (사용자 이의 시 축소)
- A-5: Expo Go 테스트 유지 제약 → Firebase는 JS SDK(web) + custom token 방식, 네이티브 Firebase SDK 미사용. Firebase web config 미설정 시 legacy JWT로 동작하는 config-gate 패턴

## Acceptance Criteria (draft — Q 답변 후 확정)
- 예약 생성에서 결제 완료까지 mock 채널로 끊김 없이 진행, `pt_payments`에 기록 생성
- 결제 내역이 `pt_payments` 실 데이터 기반으로 표시, 항목 탭 시 상세(금액·상태·취소 사유)
- 첫 로그인 시 약관·개인정보 동의 없이는 가입 불가, 동의 기록 저장
- 신규 가입 직후 역할별 온보딩 1화면 이상 노출
- mobile `npx tsc --noEmit` 0 errors + 신규 화면 단위 테스트
