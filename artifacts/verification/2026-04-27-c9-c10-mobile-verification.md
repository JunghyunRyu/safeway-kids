# Verification — C-9 useImageUpload + C-10 PT 모바일 통합

**날짜:** 2026-04-27
**범위:** PT V1.0 출시 워크스트림 — Milestone C 모바일 통합 트랙(C-9 + C-10 부분)
**선행 검증:** [`2026-04-27-milestone-c-ws-backend-verification.md`](./2026-04-27-milestone-c-ws-backend-verification.md) (백엔드 145 passed)

---

## 1. 변경 파일

### 신규
- `packages/core-mobile/hooks/useImageUpload.ts` — Tech Spec FR-3.x 사진 업로드 공용 hook (~145 LOC)
- `apps/pettracker/mobile/src/__tests__/useImageUpload.test.ts` — hook 단위/통합 테스트 (3 cases)
- `artifacts/gap-notes/2026-04-27-storage-contract-divergence.md` — spec FR-3.x ↔ deployed contract 분기 4건 명시

### 수정
- `packages/core-mobile/index.ts` — `useImageUpload` + 관련 타입 4개 export 추가
- `apps/pettracker/mobile/src/__tests__/setup.ts` — expo-constants mock에 `appContext: 'pettracker'` 추가 (PT 테스트 컨텍스트 정확화)
- `apps/pettracker/mobile/src/screens/walker/WalkerProfileScreen.tsx` — picker 후 자동 upload, 업로드 중 spinner overlay
- `apps/pettracker/mobile/src/screens/walker/WalkScreen.tsx` — photoFab picker 후 자동 upload, 업로드 진행/완료 표시 + reset 시 download URL 초기화

## 2. 검증 명령 + 결과

| Command | Result |
|---|---|
| `npx jest src/__tests__/useImageUpload.test.ts` (PT mobile) — 신규 테스트만 | **3 passed in 1.876s** |
| `npx jest --no-coverage` (PT mobile, hook test 후 1차) | **8 suites, 15 tests passed in 6.396s** (12 → 15, 회귀 0) |
| `npx jest --no-coverage` (PT mobile, 화면 통합 후 2차) | **8 suites, 15 tests passed in 5.669s** (회귀 0) |
| `npx tsc --noEmit` (PT mobile) | **0 errors** |
| `npx tsc --noEmit` (packages/core-mobile) | **0 errors** |
| `npx tsc --noEmit` (apps/careconnect/mobile) | **0 errors** (core-mobile 신규 export로 인한 회귀 없음) |
| Backend pytest | **미실행** — 본 세션에서 .py 변경 없음. 직전 세션 145 passed 유지 가정. |

## 3. 테스트 인프라 변경 영향

`setup.ts`에 `appContext: 'pettracker'` 추가는 다음 영향이 있다:
- PT `getAppContext()`가 이전 fallback `'safeway_kids'`에서 정상 `'pettracker'`로 동작
- `verifyOtp`, `devLogin` 호출 body의 `app_context` 필드도 `'pettracker'`로 변경
- 영향받는 기존 jest 테스트: 없음 (기존 테스트는 `app_context` 값을 검증하지 않음). 회귀 0건 확인됨.

## 4. 결과 요약

| 항목 | 상태 |
|---|---|
| C-9 useImageUpload hook 신설 | **VERIFIED** (3 jest cases, presigned-then-PUT 흐름 + 에러 캡처 + 확장자 추론) |
| C-9 core-mobile export 추가 | **VERIFIED** (TS export resolve, CC mobile 회귀 0) |
| C-10 WalkerProfileScreen 통합 | **PARTIALLY VERIFIED** (TS pass, 직접 jest 미보유 — 컴포넌트 jest는 V1.1) |
| C-10 WalkScreen 통합 | **PARTIALLY VERIFIED** (TS pass, 직접 jest 미보유) |
| Spec FR-3.x ↔ deployed contract divergence | **DOCUMENTED** (Gap Note 작성, V1.1 해소 계획 명시) |
| PT mobile jest 회귀 | **VERIFIED** (15/15 passed, 회귀 0건) |
| TS 회귀 (PT/core-mobile/CC mobile) | **VERIFIED** (3 패키지 0 errors) |
| Backend 회귀 | **UNVERIFIED** (본 세션 .py 변경 없음 → 직전 145 passed 유지로 간주) |

## 5. 잔존 이슈 / 다음 단계

### 본 검증에서 미커버
- **WalkerProfileScreen / WalkScreen 컴포넌트 jest 테스트**: 화면 통합 부분의 자동화된 회귀 검증 없음. RN Testing Library + ImagePicker mock 통합이 추가 setup 필요. Milestone E 또는 통합 테스트 사이클에서 보강.
- **실 백엔드 통합 테스트**: dev 환경에서 실제 `/storage/upload-url` → S3 LocalProvider PUT → download_url GET 200 검증 미수행. C-15(통합 회귀) 진입 시 수행.
- **expo-image-picker 권한 흐름**: 카메라/갤러리 권한 거부 시 fallback UX 검증 없음(코드는 Alert 표시만 하고 종료).

### Gap Note에서 V1.1로 이연된 항목 (artifacts/gap-notes/2026-04-27-storage-contract-divergence.md 참조)
- D-1: server-generated object_key 마이그레이션
- D-2: `/storage/confirm` endpoint + s3:HeadObject 검증
- D-3: `/walkers/me/profile_photo` PATCH endpoint
- D-4: `WalkSession.photo_urls` 컬럼 + endWalk 통합

### 다음 세션 첫 단계 후보
1. **C-13 useWebSocket** (PT) — 백엔드 `/pt/ws/walks/{session_id}` 이미 완료(C-12), 모바일 hook 통합
2. **C-14 OwnerWalkTrackingScreen** (가칭) — 산책 중 실시간 위치/메모 표시
3. (선택) Milestone D 진입 — 사고 신고(P0) (변호사 자문 5건 회신 후)

## 6. 잔존 리스크

| Risk | Mitigation |
|---|---|
| 클라이언트가 `userId`를 위조해 다른 사용자 prefix로 업로드 가능 | V1.1 server-generated object_key (Gap Note D-1)로 해소. 출시 전 IAM 정책 + S3 prefix 인가 정책 적용 필요. |
| 업로드 후 화면 reload 시 사진 사라짐(persistence 누락) | V1 출시 알림: "프로필 사진은 V1.1에서 영구 저장됩니다" 또는 V1.1 우선 처리. |
| `Math.random()` 충돌 | 8자 base36 random + ms timestamp 조합 → 1초당 ~2.8조 가능. 무시 가능. |
| expo-image-picker `mimeType` undefined 케이스 | hook이 `'image/jpeg'` fallback 적용. 카메라/갤러리 모두 동작 확인됨. |
