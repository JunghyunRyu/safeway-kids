# 사용자 의사결정 카드 — 2026-05-06 audit 처리 미완료 항목

**작성일**: 2026-05-06
**컨텍스트**: 35 NEW 이슈(CATASTROPHIC 3 + RED 12 + YELLOW 20) 중 메인이 처리 못 하는 외부 의존 / 사용성 trade-off / 별도 spec 필요 항목을 사용자 의사결정용으로 분리.
**관련 문서**:
- 처리 결과 통합: `artifacts/reports/2026-05-06-major-issues-resolution.md` (Task #8 산출물)
- 1차 audit: `artifacts/reports/2026-05-06-claim-vs-implementation-gap-audit.md`
- 2차 페르소나 audit: `artifacts/reports/2026-05-06-persona-audit-new-issues.md`

---

## 카드 #1 — 루넨랩스 사업자등록 5/15 전 일반과세자 등록 가능 여부 (R-6)

**무엇을 결정해야 하는가**: 5/15 모두의 창업 신청 시점에 루넨랩스 사업자등록(일반과세자)이 완료되어 있어야 협약(7~8월) 시점에 지원금 수령 계좌 + 세금계산서 발행 구조가 정상 작동.

**메모리 anchor**:
- `business_registration.md`: 루넨랩스 사업자등록 진행 중, 간이과세자 불가 → 일반과세자 필요
- 회계·세무 페르소나 N-11: 협약 시점 일반과세자 미완료 시 구조 리셋

**현재 상태**: 신청서 §7 작성 시점은 "예비창업자 자격" 유지 가정. 협약 시점 사업자등록 완료 가능성에 대한 사용자 측 일정 정보 미공유.

**의사결정 옵션**:

| 옵션 | 내용 | 영향 |
|---|---|---|
| **A** | 5/15 전 일반과세자 등록 완료 가능 | 신청서 §1 자격 narrative 그대로 / 협약 시 즉시 지원금 수령 가능 |
| **B** | 5/15 전 등록 못 함 (예비창업자 신청) | 신청서 §1 "예비창업자" narrative 유지, 협약 7월 전 등록 완료 약속 명시. 5/8 게이트 후 v2 inject 시 §1 보강 |
| **C** | 5/15 전 사업자등록 진행 중 (확정 불가) | 신청서 §1에 "예비창업자 자격, 협약 시점까지 일반과세자 등록 완료" 양방 narrative. 가장 안전 |

**메인 권고**: **C** — 협약 시점 등록 완료가 critical path이고, 본 신청서 §1은 이미 "예비창업자 자격"으로 작성되어 있어 추가 보강만 필요. 5/9 v2 inject 시점에 §1 narrative 1줄 추가.

**사용자 액션**: 5/8 게이트 시점에 일반과세자 등록 진척도 확인 (필요 시 등록 일정 가속).

---

## 카드 #2 — Apple App Privacy / Google Data Safety 앱스토어 제출 거부 위험 3건 (R-12)

**무엇을 결정해야 하는가**: 6/9 PT V1.0 출시 + EAS Submit 시 앱스토어 reviewer가 제출 거부할 위험 3건 사전 점검.

**페르소나 발견 (보안 #앱스토어)**:

| # | 항목 | 위험 |
|---|---|---|
| Y-12-A | `NSLocationAlwaysAndWhenInUseUsageDescription` 누락 / 부실 | iOS 백그라운드 위치 권한 거부 |
| Y-12-B | 만 13세 미만 아동 데이터 별도 선언 누락 (Apple App Privacy 필수 항목) | 거부 또는 보정 요청 |
| Y-12-C | OTP 수집 목적 사전 고지 UI 미존재 | 개인정보 수집 동의 정합성 거부 |

**현재 상태 (UNVERIFIED)**: 보안 페르소나 단독 발견 + 메인이 `mobile/ios/Info.plist` / Apple App Privacy questionnaire 정적 점검 미수행.

**의사결정 옵션**:

| 옵션 | 내용 | 작업 |
|---|---|---|
| **A** | 즉시 메인이 Info.plist + Privacy 매니페스트 정적 점검 후 누락분 보강 | 30분~1시간 |
| **B** | 5/16 Track 2 시작 시 T2.6 Pre-launch QA 시점에 통합 점검 | EAS Submit 1주 전 |
| **C** | 사용자가 Apple App Privacy questionnaire 작성 시점에 직접 점검 | EAS Submit 직전 |

**메인 권고**: **A 30분 + B 통합** — 메인이 즉시 정적 점검(Info.plist 존재 여부 + NSLocation* 키 + UIBackgroundModes)으로 base 확인 후, Track 2 T2.6에 본격 점검 통합. 5/15 critical path 영향 최소.

**사용자 액션**: 메인 정적 점검 결과(다음 세션 시작 시 보고 예정) + Apple App Privacy 화면(EAS Submit 시) 캡처 공유.

---

## 카드 #3 — Web 학원 관리자 대시보드 JWT localStorage 저장 (R-11 확장)

**왜 추가**: R-11 audit 범위는 `mobile/src/api/client.ts`만 명시 → mobile은 본 세션에서 in-memory only로 변경 완료. 그러나 메인이 grep 시 동일 취약점이 **`web/`(학원 관리자 대시보드)**에도 존재함을 발견:

| 위치 | 패턴 |
|---|---|
| `web/src/api/client.ts:8` | `localStorage.getItem(key)` (JWT 저장소) |
| `web/src/api/client.ts:16` | `localStorage.setItem(key, value)` |
| `web/src/hooks/useAuth.ts:19~21` | `access_token`, `refresh_token`을 localStorage |

**왜 mobile보다 더 큰 표적**: 학원 관리자 = 학생 PII(이름·생년월일·알레르기·응급연락처) + 차량·결제·청구서 접근 권한. XSS 1건이면 학원 전체 학생 데이터 노출.

**의사결정 옵션**:

| 옵션 | 내용 | 사용성 영향 | 변경 폭 |
|---|---|---|---|
| **A** | mobile과 같은 in-memory only | 새로고침 시 재로그인 강제 | 30분 (web/src/api/client.ts + useAuth.ts) |
| **B** | sessionStorage로 변경 | 새로고침 OK / 탭 닫으면 재로그인 | 30분 |
| **C** | httpOnly cookie 전환 | 새로고침·탭 모두 OK / XSS 무관 | 백엔드 + 프론트 동시 변경 (3~5시간) |
| **D** | 별도 spec으로 분리 (출시 후 처리) | 잔존 위험 유지 | 0 |

**메인 권고**: **B (sessionStorage)** — 학원 admin은 일과 중 페이지 사용 빈도 높아 사용성 영향 최소화 + localStorage 대비 attack surface 감소(persistent → ephemeral). 단, sessionStorage도 동일 origin XSS에 취약하므로 본 변경은 "최소 hardening"이며 6/9 출시 후 C로 점진 전환 권고.

**사용자 액션**: A/B/C/D 중 선택. **B 권고**.

---

## 카드 #4 — Student.name AES-GCM 암호화 별도 spec (C-2 분할 잔존)

**왜 별도 spec**: C-2(Student PII 4 필드 평문) 중 `name`은 다음 3개 의존성으로 즉시 처리 회피:
1. **검색 쿼리** — `service.py:561` `Student.name == name` 엑셀 bulk upload 중복 체크
2. **UniqueConstraint** — `models.py:41` `UniqueConstraint("guardian_id", "name", "date_of_birth")`
3. **검색·정렬** — 학원 admin 학생 리스트 화면

본 세션은 `allergies`·`medical_notes`·`emergency_contact` 3 필드만 처리.

**처리에 필요한 것**:
- `name_hash` 칼럼 추가 (HMAC-SHA256)
- UniqueConstraint를 `(guardian_id, name_hash, date_of_birth)`로 변경
- service.py:561 검색 쿼리 변경
- 시드 데이터 + 테스트 갱신
- Alembic 마이그레이션
- **추정 4~6시간**

**의사결정 옵션**:

| 옵션 | 내용 |
|---|---|
| **A** | 5/15 신청 후 Track 2 5/16~5/19 사이에 처리 (T2.0 pip check 후) |
| **B** | 6/9 출시 후 V1.1 (8월) 처리 — 보안 위험 잔존 |
| **C** | 즉시 처리 (5/7~5/8) — 5/15 critical path와 자원 경합 |

**메인 권고**: **A** — Track 2 시작 직후 별도 spec 작성 + T2.0~T2.1 사이 1.5일 슬롯에 처리. 5/15 신청 자원 보호 + 출시 전 보안 결함 해소.

**사용자 액션**: A/B/C 중 선택. **A 권고**.

---

## 카드 #5 — Pet.medical_notes 평문 저장 (audit 범위 외 발견)

**왜 추가**: C-2 fact-check 중 메인이 `backend/app/apps/pettracker/models.py:64`에서 `medical_notes: Mapped[str | None]` 평문 발견. 반려동물 의료 정보.

**법적 평가**: 개인정보보호법 §29 적용 외 (사람 PII 아님). 단, 보호자 신뢰 측면 risk + 도메인 사용자 인식상 PII로 간주될 가능성.

**의사결정 옵션**:

| 옵션 | 내용 |
|---|---|
| **A** | C-2 동일 패턴(hybrid_property) 적용 — 30분 |
| **B** | 별도 spec V1.1 처리 |
| **C** | 처리 안 함 (반려동물 데이터는 §29 외) |

**메인 권고**: **A** — 일관성 + 향후 V1.x에서 보호자 신뢰 narrative 강화 가능. 30분 작업이라 5/15 영향 0.

**사용자 액션**: A/B/C 중 선택. **A 권고**.

---

## 카드 #6 — 도그메이트 2025 AI 매칭 알고리즘 고도화 발표 사실 검증

**왜 검증 필요**: 페르소나 N-07이 "도그메이트는 2025년 커넥팅더닷츠 인수 이후 AI 매칭 알고리즘 고도화를 공식 발표"라고 주장. 신청서 §2 "AI 기술 스택 공개 명시 0곳" claim의 정확성 좌우.

**현재 처리**: 본 세션 R-5에서 §2 본문에 "조사 한계: 도그메이트 2025 발표가 AI 기술 스택 공개로 분류될 경우 보수 시나리오 §AR-2 갱신" 1줄 hedging 추가 완료. 단, 사용자 fact-check 안 하면 기본 narrative는 유지.

**의사결정 옵션**:

| 옵션 | 내용 |
|---|---|
| **A** | 도그메이트 발표 확인 후 fact 일치하면 §2 narrative 약화 (5분 사용자 + 10분 메인 수정) |
| **B** | hedging 1줄 그대로 유지 — 페르소나가 false positive였다면 5/15 신청에 무해 |
| **C** | 도그메이트 + 우프 + 페티앙 + 펫프렌즈 + 올펫 5개사 모두 재조사 |

**메인 권고**: **A** — 5분 사용자 검색만으로 신청서 신뢰도 한 단계 상승. 페르소나 단독 주장이라 fact-check가 가장 큰 불확실성.

**사용자 액션**: 도그메이트 + 커넥팅더닷츠 인수 + 2025 AI 발표 검색 → 결과 메인에 공유.

---

## 종합 — 사용자 5/7 전 의사결정 권고

| 카드 | 권고 | 데드라인 | 메인 액션 (사용자 결정 후) |
|---|---|---|---|
| #1 R-6 사업자등록 | C (양방 narrative) | 5/8 게이트 | 5/9 v2 inject 시 §1 보강 |
| #2 R-12 앱스토어 | A 30분 + B Track 2 통합 | T2.6 Pre-launch | 다음 세션 첫 30분 정적 점검 |
| #3 Web JWT | **B (sessionStorage)** | 5/15 후 | 5/16 Track 2 T2.0 후 30분 |
| #4 Student.name | A (Track 2) | 5/16~5/19 | 별도 spec 작성 후 처리 |
| #5 Pet.medical_notes | A (즉시) | 5/14 freeze 전 | 30분 작업 |
| #6 도그메이트 fact | A (사용자 5분) | 5/9 v2 inject 전 | 결과에 따라 §2 narrative 갱신 |

**총 사용자 결정 시간**: 약 30분 (카드 6장 검토 + 도그메이트 1건 검색).
**총 메인 후속 작업**: 약 2시간 (Web sessionStorage + Pet.medical_notes + 신청서 § 보강 통합).
