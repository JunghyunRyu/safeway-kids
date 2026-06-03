# PetTracker 모바일 UX 정밀 검증 — 통합 보고서

- **작성일**: 2026-06-03
- **검증 대상**: `apps/pettracker/mobile` 전 화면 (owner 13 + walker 5 + shared 8 + 네비게이터 3 + theme)
- **방법**: `ux-advocate` 에이전트 3개 병렬 (역할별 페르소나) + 메인 에이전트 P0 1차 증거 검증
- **총 발견**: 86건 (P0 10 / P1 41 / P2 28 / P3 7)
- **상태**: UNVERIFIED(에이전트 코드 리딩 기반) — 단, **App.tsx P0 2건은 메인 에이전트가 직접 코드로 VERIFIED**

> ⚠️ 본 보고서는 읽기 전용 UX 검증 결과다. 어떤 코드도 수정하지 않았다. 수정 범위·시점은 사용자 결정 사항이며, 현재 워크스트림(본업 집중 ~6/15, PT 출시 P2-3 7월말~8월초, D-8 가벼운 슬라이스 원칙)을 고려해 별도 결정 필요.

---

## 0. Executive Summary — 최상위 게이트 (VERIFIED)

이번 검증의 단일 최대 발견은 **인증 진입/역할 분기가 아직 데모 스캐폴딩 상태**라는 점이다. 다른 모든 UX 불편보다 상위에 있다.

| ID | 위치 | 심각도 | 사실(코드 검증) | 영향 |
|----|------|--------|------------------|------|
| **GATE-1** | `App.tsx:36-43` | P0 (VERIFIED) | `if (!hasToken)` → `DevTokenPasteScreen` 렌더, `__DEV__` 가드 없음. `LoginScreen`은 App.tsx에 import 안 됨 | 토큰 없는 신규 사용자 **전원**이 JWT 붙여넣기 개발 화면에 도착. 실제 가입/로그인 불가 |
| **GATE-2** | `App.tsx:19,49` | P0 (VERIFIED) | `const [role] = useState<...>("pet_owner")` — setter 없이 하드코딩. `line 49` 삼항이 role로 분기 | `WalkerTabNavigator` **절대 도달 불가**. Walker 5개 화면(W-01~W-25 대상)이 프로덕션에서 무용 |

→ **결론**: Walker 화면 25건 지적은 "도달 가능해진 이후" 의미를 가진다. 출시 경로 P2-3(T2.5 통합)에서 `App.tsx` 인증 배선을 `LoginScreen` + JWT role 디코드로 교체하는 것이 **선행 작업**.

---

## 1. P0 전체 (출시 차단급, 10건)

| ID | 화면 | 불편 지점 | 근거(file:line) |
|----|------|-----------|-----------------|
| GATE-1 | App.tsx | DevTokenPasteScreen 프로덕션 노출, __DEV__ 가드 없음, LoginScreen 미배선 | App.tsx:10,36-43 |
| GATE-2 | App.tsx | role "pet_owner" 하드코딩 → Walker 탭 도달 불가 | App.tsx:19,49 |
| O-01 | LiveTrack | 산책사 연락 버튼 `tel:010-0000-0000` 하드코딩 placeholder | LiveTrackScreen.tsx:107-111 |
| O-02 | Search | size filter chip 값이 `searchWalkers()`에 미전달 → 필터 무동작 | SearchScreen.tsx:44,116-121 |
| O-03 | BookingDetail | `(booking as any).session_id` 캐스팅, 미존재 시 추적 버튼 dead-end | BookingDetailScreen.tsx:79-83 |
| O-04 | BookingDetail | 완료 예약 → WalkReport 이동 CTA 없음(화면은 존재하나 도달 불가) | BookingDetailScreen.tsx:36-101 |
| O-05 | BookingCreate | 날짜 선택 오늘/내일 2일만 → 주말·차주 예약 불가 | BookingCreateScreen.tsx:33,125-137 |
| W-01 | Walk | GPS 실패 시 `Alert` 가 5초 interval마다 반복 팝업 → 산책 중 조작 불능 | WalkScreen.tsx:124 |
| W-02 | Walk | 종료 버튼이 flex 세로 나열 끝 → 화면 밖으로 밀림, 한 손 조작 불가 | WalkScreen.tsx:228-315,329 |
| W-03 | Walk | 탭 전환 시 GPS/timer interval 누수·중복 (생명주기 보호 없음) | WalkScreen.tsx:77-83,109-127 |

---

## 2. 횡단 클러스터 (86건을 패턴으로 묶음)

86건을 화면별로 나열하면 행동이 안 나온다. 근본 패턴 8개로 묶는다.

### C1. 인증/역할 진입이 데모 스캐폴딩 (GATE-1, GATE-2) — **최상위**
출시 전 `App.tsx`를 `LoginScreen` + JWT role 분기로 교체. ChatScreen 미등록(S-11)·WalkerStackNavigator 부재(S-24)도 같은 배선 작업에 포함.

### C2. "완성된 것처럼 보이지만 stub" — 신뢰 최대 위협
보이는데 동작 안 함 = 가장 위험. O-01(tel placeholder)·O-02(size filter no-op)·S-08(Chat 전송 TODO)·S-12(알림 토글 TODO)·W-04(WalkScreen 메모 미전송)·O-22(ActivityFeed "6월" 하드코딩)·W-13(로그아웃 미구현)·W-14(워커 프로필 메뉴 5개 빈 함수).

### C3. Walker 현장 조작 실패 (W-01·W-02·W-03·W-15·W-16)
산책 중 한 손·이동 상태에서 앱 제어 불가. 출시 전 Walk 화면 레이아웃·interval·Alert 정책 재설계 필요.

### C4. "누가 내 강아지를 산책시키나?" 신뢰 공백 — 종합 케어 포지셔닝 정면 충돌
워커 이름/사진/리뷰가 핵심 화면에서 체계적으로 빠짐. O-11(BookingDetail 워커 부재)·O-12(홈 다음예약 워커명 없음)·O-15(리뷰 내용 미표시)·O-34(워커 사진 없음)·O-37(예약카드 펫명 없음)·O-36(펫 사진 없음).

### C5. 산책 후 감성 페이로프 미렌더 (O-09·O-23·O-26)
WalkReport 경로 지도가 placeholder("N개 포인트" 텍스트만). LiveTrack에는 작동하는 Leaflet 지도가 있는데 재사용 안 함. "어디 갔는지 보고 싶다"는 핵심 니즈 미충족.

### C6. 내부 용어 노출 — B2C 카피 제약 위반 (`feedback_b2c_audience_internal_terms`)
O-08("POLLING")·O-16(certification_type 원시 enum)·S-17("워커")·S-14(parent/driver role 노출)·O-23(raw 좌표). 사용자 화면에서 전부 한국어 사용자 언어로 교체.

### C7. 접근성 0 (W-21·S-20, owner 전반)
`accessibilityLabel` Grep 결과 전 영역 0건. 앱스토어 접근성 가이드라인 리스크. 최소 핵심 Pressable(수락/거절/종료/SOS/전송)부터.

### C8. 폼·예약 제약 + 빈상태/로딩/에러 부재
O-05(2일 한정)·O-33(슬롯 4개 고정)·O-13(홈 로딩 없음)·O-21(펫 수정/삭제 없음)·W-06(시간 자유입력 검증 없음)·O-14(펫 없을 때 안내 없음)·S-06(OTP 재전송 없음)·S-10(채팅 빈상태 없음).

### (별도) 법무 플래그 — S-19
`PolicyScreen`은 "이용 시 동의 간주" 방식, `LoginScreen`에 명시적 동의 체크박스 없음. 개인정보보호법상 명시적 동의 의무 측면에서 출시 전 점검 필요. → 필요 시 `korea-regulatory-counsel`.

---

## 3. 잘 된 점 (과잉 수정 방지)

- **LiveTrack 이중화**: WebSocket 실패 시 HTTP 폴링 폴백 + SOS 실패 시 119 직통. 안전 앱 핵심을 실제 구현.
- **에스크로 카피**: "산책 완료 후 안심 결제 확정" — 낯선 사람에게 선결제하는 불안을 정조준.
- **보험 만료 배지**: 만료/N일 남음/가입 색상 구분 — 표면적이 아닌 실질 신뢰 엔지니어링.
- **워커 수수료 투명**: 정산 D+1·수수료율 두 곳 명시. 워커 신뢰 핵심.
- **반려동물 특성 경고 카드**: 산책 전 기질·특수 필요사항 빨간 강조. 현장 안전 직결.
- **알림 기본값 설계**: 안전 알림 opt-in true / 프로모션 false. 사용자 의사 존중.
- **theme 토큰 적용률 높음**: DevToken 화면 제외 일관 사용.
- **로그아웃 confirm 다이얼로그**(owner) / `__DEV__` 가드된 dev 로그인 버튼(LoginScreen) — App.tsx의 미가드와 대비되는 올바른 패턴.

---

## 부록 A. Owner 37건 / Walker 25건 / Shared 24건 원본 표

> 원본 에이전트 출력의 전체 표는 세션 대화에 보존. 본 보고서 §1~§2가 행동 가능한 통합본.
> ID 접두 충돌 주의: Owner=O-, Walker=W-, Shared=S- 로 재명명함(원 에이전트는 Owner/Shared 모두 U- 사용).

## 부록 B. 권장 처리 순서 (현 워크스트림 정렬)

현재 D-8(6/15까지 가벼운 슬라이스, 비용 0) + PT 출시 P2-3(7월말~8월초) 원칙 하에서:

1. **지금 가능한 가벼운 슬라이스 (AI 호출 0, 저비용)**: C6 내부용어 카피 교체, O-22 하드코딩 날짜, O-08 "POLLING" 라벨 — 텍스트 수정 수준.
2. **출시 통합(P2-3, T2.5)에 묶을 선행 작업**: C1 인증 배선(GATE-1/2), ChatScreen 등록, C2 stub 해소.
3. **출시 전 필수 UX(P2-3 직전)**: C3 Walker 현장 조작, C4 워커 신뢰 표시, C5 경로 지도, O-01 SOS 번호.
4. **출시 후 빠른 개선**: C7 접근성, C8 폼 제약, 나머지 P2/P3.
5. **법무 별도 트랙**: S-19 동의 체크박스 → `korea-regulatory-counsel`.
