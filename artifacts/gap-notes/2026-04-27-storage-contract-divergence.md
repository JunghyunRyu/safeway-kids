# Gap Note — Storage contract divergence between Tech Spec FR-3.x and deployed code

**작성일:** 2026-04-27
**작성 시점:** Milestone C 모바일 통합 트랙 진입(C-9/C-10) 직후
**관련 spec:** [`artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`](../specs/2026-04-24-pt-quality-uplift-final-tech-spec.md) §4.3 (FR-3.1~FR-3.6)
**관련 검증:** [`artifacts/verification/2026-04-24-milestone-c-pay-storage-verification.md`](../verification/2026-04-24-milestone-c-pay-storage-verification.md)

---

## 1. Context

C-9 `useImageUpload` 클라이언트 hook을 작성하면서 Tech Spec FR-3.x를 다시 비교한 결과,
C-7에서 합의된 백엔드 구현(`/storage/upload-url` endpoint)과 spec 사이에 4건의 divergence가 확인되었다.
Spec discipline 규칙(CLAUDE.md non-negotiable rule 6)에 따라 본 Gap Note를 작성하고,
C-9/C-10 V1 통합은 deployed contract에 맞춘 절충안으로 진행했다.

## 2. Divergences

### D-1. object_key 발급 주체

| 구분 | Tech Spec FR-3.2 | 현 백엔드 (C-7) | C-9 절충 |
|---|---|---|---|
| 입력 | `app_context`, `entity_type`, `content_type` | `object_key`, `content_type`, `expires_in` | client가 spec FR-3.3 prefix를 합성해 `object_key` 전송 |
| object_key 생성자 | server | client | client (hook 내 helper) |
| user_id 주입 | server (인증 컨텍스트) | client 책임 | client (hook 호출자가 `userId` param 전달) |

**리스크:** 
- 클라이언트가 `userId`를 위조할 수 있어 다른 사용자 prefix로 업로드 가능
- 백엔드는 IAM 정책 + (향후) S3 버킷 prefix 인가 정책으로 방어해야 함
- 현재 `S3StorageProvider`는 prefix 기반 인가 미적용(IAM의 `s3:PutObject` 단일 권한만으로 동작)

### D-2. /storage/confirm endpoint 부재

Tech Spec FR-3.5는 클라이언트 PUT 완료 후 `POST /api/v1/storage/confirm` 호출 → `s3:HeadObject` 검증 → 도메인 모델 업데이트(예: `WalkerQualification.profile_photo_url`)를 명시.
현 백엔드는 confirm endpoint 미구현.

**리스크:**
- 클라이언트가 PUT 실패해도 download_url을 그대로 사용 가능 → broken image link
- S3 버킷에 업로드된 객체의 무결성/존재 확인 누락
- 도메인 모델(예: 프로필 사진 URL)이 업로드 결과와 동기화되지 않음

### D-3. 도메인 모델 persistence 누락

C-10에서 walker가 프로필 사진을 업로드해도 `WalkerQualification.profile_photo_url` 컬럼에 저장하는 PATCH endpoint가 없다.
현재 PT 백엔드에는 다음 endpoint만 존재:
- `POST /pt/walkers/qualification` — 자격 제출 시 한 번만 set 가능
- `WalkerQualification.profile_photo_url` 컬럼은 자격 제출 body에서도 누락(`api/walkers.ts` `submitQualification` 시그니처 확인 시 미포함)

**리스크:** UI는 업로드 직후 download_url을 표시하지만, 화면 새로고침 시 서버에서 사진 사라짐. UX 일시적, 데이터 영구 미저장.

### D-4. 산책 사진(walk_photo) persistence 누락

`WalkScreen`은 산책 중 사진 1장 업로드 가능하지만, `endWalk` body에 `photo_urls` 또는 `arrival_photo_url` 같은 필드 없음. `WalkSession` 모델에도 사진 컬럼 없음(추정 — 별도 확인 필요).

**리스크:** 산책 종료 후 보호자가 산책 리포트(`/walks/{session_id}/report`)에서 사진을 볼 수 없음. spec FR-6.3(V1.1 trust feature)와도 직접 연결.

## 3. C-9/C-10 V1 절충 결정

| 결정 | 이유 |
|---|---|
| Hook이 spec prefix(`{app_context}/{entity_type}/{user_id}/{ts}-{rand}.{ext}`)를 client-side에서 합성 | deployed `/storage/upload-url` contract 유지하면서 spec 의도(prefix 패턴 기반 분리)는 보존 |
| Hook은 PUT 2xx 응답을 성공으로 간주, server confirm 호출 없음 | confirm endpoint 백엔드 미구현. 빌드 차단보다 V1 출시 critical path 우선 |
| 모바일 화면(WalkerProfileScreen, WalkScreen)은 download_url을 component state에만 저장 | 백엔드 PATCH endpoint 부재 → 화면 reload 시 사라지는 임시 상태로 출시 |
| 신규 의존성 도입 없음 (uuid 패키지 등) | `Date.now() + Math.random()` 조합으로 객체 키 충돌 회피. dev/prod 모두 충돌 가능성 무시 가능 수준 |

## 4. V1.1 해소 계획

다음 항목은 PT V1.1 트러스트 사이클(Milestone E 또는 별도 backend gap)에서 일괄 처리한다.

| 항목 | 작업 |
|---|---|
| D-1 (server-generated object_key) | `UploadUrlRequest` 스키마 변경 → `(entity_type, content_type)`만 받고 server가 prefix 합성. `useImageUpload`도 새 contract로 마이그레이션. |
| D-2 (/storage/confirm) | `POST /api/v1/storage/confirm` 신설. `s3:HeadObject` 검증 + `entity_type`별 모델 업데이트 라우팅(`walker_profile` → `WalkerQualification`, `walk_photo` → `WalkSession`, `incident_photo` → `IncidentReport`). |
| D-3 (프로필 사진 persistence) | `PATCH /pt/walkers/me/profile_photo` (또는 confirm endpoint 일임) 신설. WalkerProfileScreen 통합 강화. |
| D-4 (산책 사진 persistence) | `WalkSession.photo_urls` 컬럼 추가 + Alembic migration + `endWalk` body 확장. WalkReportScreen owner 측에서 사진 표시. |
| KMS for incident_photo (FR-3.4) | `incident_photo` entity 도입 시(Milestone D 사고 신고) 별도 CMK 적용. 현재 미사용. |
| Confirm 패턴 hook 통합 | `useImageUpload` API 확장: `upload(...)` 결과에 `confirm()` 메서드 포함. |

## 5. 영향 범위

- **PT 출시 critical path 유지 가능**: V1 통합으로 picker→upload→화면 표시 흐름은 동작. 출시일(2026-06-04) 영향 없음.
- **CC 사이클 진입 시 동일 패턴 사용 가능**: hook은 `entityType: 'caregiver_profile' | 'child_photo'`까지 지원 (이미 타입 정의됨).
- **V1.1 작업량 추가**: 백엔드 `/storage/confirm` 1 endpoint + 모델 컬럼 1~2개 + 마이그레이션 1~2개 + hook API 확장. 추정 0.5~1일.

## 6. 결론

**Tech Spec FR-3.x와 deployed code의 divergence를 명시적으로 인정**하며, V1 출시는 deployed contract를 따른다.
spec align은 V1.1에서 일괄 수행한다(spec discipline 규칙에 따라 spec을 먼저 V1 절충에 맞게 업데이트하는 것보다 V1.1 후속 처리가 더 안전).

본 Gap Note는 다음 세션이 이 결정을 부담 없이 발견하도록 STATE.md `Gap Notes` 섹션에 인덱스되어야 한다.
