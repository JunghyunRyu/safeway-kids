# 모바일 앱 GPS 화면 캡처 가이드 (사용자 5/7~5/8 작업)

**문서 분류**: 신청서 첨부 이미지 슬롯 1·2 자산 확보 SOP
**작성일**: 2026-05-06 (D-9)
**대상 마감**: 2026-05-08 16:00 (D-7) — v2 작성 시점 inject 가능하도록
**연결 신청서**: `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md` v1.4 §부록 A 슬롯 매트릭스

---

## 0. 캡처 목표 (옵션 Y, 모바일 2장)

| 슬롯 | 화면 | 기술 입증 포인트 | 5축 정합 |
|---|---|---|---|
| **슬롯 1** | `LiveTrackScreen` — 워커 GPS 실시간 추적 + 산책 경로 polyline | WebSocket 라이브 채널 + HTTP polling fallback (이중 채널) | **가능성**·차별성 |
| **슬롯 2** | `WalkScreen` 또는 사고 신고 진입 화면 | AI 5축 entry point | **차별성**·구체성 |

**평가위원 30초 인식 원칙**: 화면이 실제 동작 중인 것처럼 보여야 하므로 **시드 데이터(워커 위치·산책 경로 polyline 5점 이상)가 채워진 상태로 캡처**. 빈 지도·로딩 spinner는 신뢰도 -50%.

---

## 1. 사전 준비 (5/7 오전)

### 1.1 환경 확인

```powershell
# 백엔드 실행 (포트 8000)
cd C:\jhryu\01_project\safeway_kids\backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000
```

별도 터미널:
```powershell
# 모바일 dev 환경 시작 (Metro + 프록시 + ngrok)
cd C:\jhryu\01_project\safeway_kids\mobile
.\start-dev.sh
```

QR 코드가 출력되면 iPhone Expo Go 앱에서 스캔.

### 1.2 시드 데이터 준비

**옵션 A (권장)** — 웹 관리자 대시보드 시드:
```powershell
cd C:\jhryu\01_project\safeway_kids\web
npm run dev
# http://localhost:5173 → "플랫폼 관리자 로그인" → 사이드바 "시드 데이터" → "시드 데이터 생성"
```

시드 데이터에 포함되어야 할 것:
- PT 보호자 계정 1개 (테스트용 산책 예약 보유)
- PT 워커 계정 1개 (시드 GPS 좌표 5점 이상 — 마포구 또는 용산구 인근)
- 활성 walk session 1건 (보호자가 LiveTrackScreen 진입할 수 있어야 함)
- session에 polyline 5점 이상 미리 기록되어 있어야 함

**옵션 B** — 수동 시뮬레이션:
1. iPhone Expo Go에서 워커 계정 로그인 → WalkScreen에서 "시작" 버튼 → 워커 폰 GPS 발신
2. 동시에 다른 폰(또는 시뮬레이터)에서 보호자 계정 로그인 → LiveTrackScreen 진입
3. 워커 폰을 들고 5분 산책하여 polyline 자연스럽게 채우기

옵션 A가 안정적·재현 가능. 옵션 B는 실 동작 신뢰도 +지만 시간 소요.

---

## 2. 슬롯 1 캡처 — `LiveTrackScreen`

### 2.1 화면 진입 경로

iPhone Expo Go → PT 앱 → 보호자 로그인 → "내 산책 일정" → 활성 session 탭 → **LiveTrackScreen** 진입.

### 2.2 캡처 시점

화면에 다음이 모두 보이는 시점:
- ✅ 지도 위 워커 위치 마커 (lat/lng)
- ✅ 산책 경로 polyline (점선 또는 실선, 5점 이상 곡선)
- ✅ 경과 시간 표시 (`elapsedSeconds`, 예: "12:34")
- ✅ WebSocket 연결 상태 표시 (있다면 "실시간 연결됨" 또는 유사 UI)

### 2.3 캡처 방법

**iPhone**: 우측 사이드 버튼 + 음량 ↑ 버튼 동시 누르기 → 좌측 하단 썸네일 탭 → 편집 → 저장.
**iOS 시뮬레이터** (Mac): `Cmd + S` 또는 File → Export Screen.

**파일명 권장**: `slot1-livetrack-gps-2026-05-08.png` (PNG 권장 — modoo.or.kr 공고 Page 7 명시 jpg/png/gif 모두 허용).

### 2.4 저장 위치

`C:\jhryu\01_project\safeway_kids\artifacts\business\fundraising\_assets\modoo-application-images\` 폴더 생성 후 저장.

---

## 3. 슬롯 2 캡처 — `WalkScreen` 또는 사고 신고

### 3.1 옵션 비교

| 후보 | 화면 내용 | 차별성 입증 강도 |
|---|---|---|
| **A. WalkScreen (워커 산책 시작)** | 워커가 GPS 시작 + 사고 신고 버튼 + 사진 업로드 entry | AI 5축 entry point 시각화 — 평가위원에 다중 기능 입증 |
| **B. 사고 신고 모달/화면** | 사고 발생 시 1탭으로 119/동물병원/구조 분류 | 사고 자동 분류 차별화 직접 시연 (1차 차별 anchor) |
| **C. BookingDetailScreen** | 매칭 정보 + 워커 프로필 | 신원 검증 layer 시각화 |

**권장: B (사고 신고)** — 174건 동기 white space에서 가장 강한 anchor가 "사고 신고 자동화" cell이므로 시각적 1:1 입증이 §차별성 강화.

### 3.2 캡처 시점

화면에 다음이 보여야 함:
- ✅ 사고 신고 버튼 또는 모달
- ✅ AI 자동 분류 옵션 ("119 / 동물병원 / 동물구조" 또는 자연어 입력)
- ✅ 활성 산책 session 컨텍스트 (워커 누구·언제 진행 중)

V1.0 출시 전이라 사고 신고 화면 UI가 일부 placeholder일 수 있음. **그 경우 옵션 A (WalkScreen)로 fallback** 후 v2(5/13) 시점 사고 신고 화면 보강 캡처 재고려.

### 3.3 파일명·저장 위치

`slot2-walkscreen-or-incident-2026-05-08.png` → 슬롯 1과 동일 폴더.

---

## 4. 캡처 후 검증 체크리스트

| # | 항목 | 통과 기준 |
|---|---|---|
| C1 | 해상도 | 최소 1170×2532 (iPhone 13/14 Pro 표준) 또는 시뮬레이터 native res |
| C2 | 파일 크기 | 1MB 이내 (modoo.or.kr 양식 업로드 한도 추정) |
| C3 | 개인 정보 | 워커 본명·전화번호 노출 없음 (시드 데이터 = "테스트 워커 1" 형태) |
| C4 | 시드 데이터 자연스러움 | "테스트1·테스트2" 같은 부자연스러운 이름 X. "강아지 콩이" 같이 자연스럽게 |
| C5 | 시간대 표시 | 합리적 시간대 (현재 시간 기준 진행 중 산책으로 보이게) |

---

## 5. 신청서 v2 (5/13) 시점 inject 방법

캡처 자산이 확보되면 v2 작성 시 다음 위치에 inject:

1. **§부록 A 슬롯 1·2 cell** — "캡처 source" 행에 파일명 명시 (`slot1-livetrack-gps-2026-05-08.png`).
2. **§4 실행 계획**, "1인 창업 가능성 mitigation" 직후 — "(첨부 이미지 슬롯 1 참조 — LiveTrackScreen WebSocket+polling 이중 채널 GPS 추적 V1.0 동작)" 한 줄 inline.
3. **§6 영상 시나리오 0~25초 실녹화 구간** — 영상 캡처 시 동일 화면 재현하여 이미지·영상 일관성 확보.

5/15 신청 시 modoo.or.kr 도전신청서 양식의 이미지 업로드 단계에서 PNG 파일 직접 첨부.

---

## 6. fallback — 캡처 실패 시

| 상황 | 대응 |
|---|---|
| 시드 데이터 작동 X | 모바일 시뮬레이터에서 mock 좌표 직접 입력. WebView leaflet/maps 라이브러리 mock URL 임시 사용 |
| LiveTrackScreen 빈 화면 | session_id를 backend 직접 INSERT (`SELECT id FROM walk_sessions LIMIT 1` 후 polyline 기록) |
| 사고 신고 UI 미완성 | 슬롯 2를 WalkScreen으로 대체 (옵션 A) |
| 시간 부족 (5/8 미달성) | Figma·디자인 mockup으로 대체 — 단 신청서 §부록 A에 "(UI 시안)" 명시 (구체성 -40%이지만 5/15 안전성 +) |

---

**End of mobile capture guide.**

**서명**: 2026-05-06 D-9 시점 모바일 자산 확보 SOP. 사용자 직접 작업, 5/8 EOD 마감, v2(5/13) inject 의존.
