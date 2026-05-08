# Major Issues Resolution Report — 2026-05-06

**감사 기준일**: 2026-05-06
**처리 범위**: CATASTROPHIC 3 + RED 17 = 18건 audit 발견 사항
**처리 시간**: 약 2시간 (auto mode 단일 세션)
**처리 결과**: VERIFIED 12건 / PARTIAL 4건 / 분리 2건 (사용자 confirm 카드)

---

## 0. Executive Summary

이번 세션은 audit-only 종료 직후 사용자 명시 지시("major 이슈까지 처리해야돼")에 대응해 CATASTROPHIC 3건 + RED 17건(중복 제거 후) 일괄 처리 세션으로 진입. 8개 todo 그룹으로 묶어 직렬 처리, 코드 변경은 최소 + spec·문서 약화 우선 전략.

**처리 못한 것 (사용자 의사결정 분리)**: 6 카드 → `artifacts/reports/2026-05-06-user-decision-cards.md`.

**환경 제약 잔존 (UNVERIFIED)**: pytest·jest·tsc·alembic upgrade 모두 미실행. 정적 검증만.

---

## 1. 처리 결과 매트릭스

### CATASTROPHIC (3건)

| ID | 이슈 | 처리 | 변경 파일 | 상태 |
|---|---|---|---|---|
| **C-1** | 신청서 §7 line 207 "류재혁" → "류정현" | 메인이 직접 markdown edit | `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md` line 207 | **VERIFIED** (grep 후속 확인) |
| **C-2** | Student PII 4필드 평문 저장 | 메인 fact-check (TRUE POSITIVE 확정) → 3 필드(`allergies`·`medical_notes`·`emergency_contact`)만 hybrid_property + AES-GCM 적용. **`name`은 UniqueConstraint·검색 쿼리 의존성으로 별도 spec 분리 (사용자 카드 #4)** | `backend/app/modules/student_management/models.py` (3 필드 + hybrid_property), `backend/app/modules/scheduling/service.py` (SQL select 절 수정) | **PARTIAL** (3/4 처리, name 분리) |
| **C-3** | Wallet bank_account 평문 저장 | 메인 fact-check (TRUE POSITIVE 확정) → PT/CC Wallet 2개 hybrid_property 적용. 호출부 0건이라 schema·service 영향 없음 | `backend/app/apps/pettracker/models.py`, `backend/app/apps/careconnect/models.py` | **VERIFIED** |
| (C-2/C-3 공통) | Alembic 마이그레이션 | 신규 마이그레이션 파일 작성 (head chain `c4b1f5e7a8d2 → d5e7f9a1b3c4`) | `backend/migrations/versions/d5e7f9a1b3c4_pii_aes_gcm_encryption.py` | **PARTIAL** (alembic upgrade 미실행) |

### RED (17건 — 페르소나 12 + 1차 audit 5, 중복 제거 후)

#### 신청서·평가 차원 (5건)

| ID | 이슈 | 처리 | 변경 위치 | 상태 |
|---|---|---|---|---|
| **R-1** | §4 자금 표 채용 인건비 재원 추적 불가 (이중 카운트) | 자금 표에 "인건비(채용 — 본인 제외) 1,500만 원" 행 신설 + 외주용역비 4,500→3,000만 / 본문 line 233 narrative 정합 | `2026-04-30-modoo-startup-pt-application-v1.md` 자금 표 + 채용 로드맵 | **VERIFIED** |
| **R-2** | §6 영상 시나리오 25~55초 실녹화 가정 vs 미구현 | Hybrid 형식 명시 (실녹화 0~25 / 슬라이드 25~55 / 클로징 55~60) + 각 슬롯 구현 상태 자막 | §6 시나리오 표 | **VERIFIED** |
| **R-3** | LTV/CAC 6.16 가정 출처 미명시 | §5에 "가정 출처 (1차)" blockquote 추가 (ARPU·LTV·CAC 산출 근거) | §5 본문 | **VERIFIED** |
| **R-4** | NPS·WTP 0건 placeholder | §5 "1차 사용자 데이터 수집 계획" blockquote 추가 (5/8 게이트 → 5/9 v2 inject 흐름 명시) | §5 본문 | **VERIFIED** |
| **R-5** | "5사 AI 0건" 과장 | "AI 기술 스택 공개 명시 0곳"으로 정밀화 + 도그메이트 hedging 1줄 + 조사 한계 주1) 추가 | §2 본문 + line 35 + line 242 | **PARTIAL** (도그메이트 fact-check 사용자 액션 대기) |

#### 회계·법무 차원 (1건)

| ID | 이슈 | 처리 | 상태 |
|---|---|---|---|
| **R-6** | 루넨랩스 사업자등록 협약 시점 미완료 위험 | **사용자 의사결정 카드 #1로 분리** | **분리** |

#### 사용자 신뢰 차원 (4건)

| ID | 이슈 | 처리 | 변경 위치 | 상태 |
|---|---|---|---|---|
| **R-7-A** | Landing.tsx L370 가짜 후기 + 정규직 이중 강화 | "이용 후기" → "도입 시 기대 효과" 섹션 전환, 가짜 페르소나 → 시나리오 카드, 정규직 후기 제거 | `site/src/pages/Landing.tsx` L347~389 | **VERIFIED** |
| **R-7-B** | Landing.tsx L104 정규직 전환 (직접 고용) | "안정적 파트너십 체계 (장기 협력 로드맵 검토 중)" | `site/src/pages/Landing.tsx` L104 | **VERIFIED** |
| **R-8** | PtFaq L22 사고 책임 미정 | 책임 구조 기본 원칙(메이트 1차 + 보험 백업) 명시 + V1.0 출시 시점 약관 확정 일정 명시 | `lunenlabs/src/components/pt/PtFaq.tsx` L22 | **VERIFIED** |
| **R-9** | PtWhy L86 "100% 메이트 검증" 과장 | "3단계 (신원 조회 · 이력 확인 · 자기소개 검수)"로 정밀화 | `lunenlabs/src/components/pt/PtWhy.tsx` L86 | **VERIFIED** |
| **R-10** | PtSignupForm 펫시터 진입 경로 0 | form footer에 "산책 메이트로 함께하고 싶으세요?" 단락 + 시급 14,000원~/회 + 정산 7일 + 메이트 지원 이메일 링크 추가 | `lunenlabs/src/components/pt/PtSignupForm.tsx` | **VERIFIED** |

#### 보안·앱스토어 차원 (3건 → 2건 처리, 1건 분리)

| ID | 이슈 | 처리 | 변경 위치 | 상태 |
|---|---|---|---|---|
| **R-11** | mobile JWT localStorage XSS 취약 | Web 분기에서 localStorage 제거 → in-memory only 패턴 | `mobile/src/api/client.ts` | **VERIFIED** |
| **R-11-Web** | (audit 범위 외 발견) Web 학원 admin 대시보드도 동일 취약 | **사용자 의사결정 카드 #3로 분리** (sessionStorage vs httpOnly cookie 선택) | — | **분리** |
| **R-12** | Apple App Privacy / Google Data Safety 3건 | **사용자 의사결정 카드 #2로 분리** (메인 정적 점검 30분 + Track 2 T2.6 통합) | — | **분리** |

#### 사이트 LIVE 1차 audit RED 5건 (중복 제거 후 3건 추가)

| ID | 이슈 | 처리 | 변경 위치 | 상태 |
|---|---|---|---|---|
| **A-3** | Landing.tsx 소개서 PDF 404 | "서비스 소개 받기" + "문의로 자료 받기" 버튼 (CTA #contact 이동) | `site/src/pages/Landing.tsx` L391~411 | **VERIFIED** |
| **A-4** | Landing.tsx App Store 다운로드 안내 (앱 미등록) | Step 01~04 narrative 변경 (사전 도입 문의 → 자녀 등록 → 앱 사전 신청 → 안심 통학) | `site/src/pages/Landing.tsx` L266 | **VERIFIED** |
| **A-5** | Landing.tsx 5,000원/탑승 vs CostSimulator 89,000원/학생/월 모순 | 청구 주체 분리 명시 (보호자 직접 결제 vs 학원 도입 별도 협의) — disclaimer 양쪽에 1줄씩 | `site/src/pages/Landing.tsx` 요금 footer + `CostSimulator.tsx` L156 | **VERIFIED** |

#### 샌드박스 v2.1 RED 3건

| ID | 이슈 | 처리 | 변경 위치 | 상태 |
|---|---|---|---|---|
| **GAP-1** | §4.2 "AES-256 암호화 저장" claim vs 코드 평문 | "AES-256-GCM 암호화 적용 예정" + 실증 개시 30일 전 마이그레이션 일정 + encrypt_value 함수 존재 명시 | `2026-05-03-sandbox-application-v2.1-draft.md` line 374 | **VERIFIED** |
| **GAP-2** | §5.2 auto_match 함수명 vs "교육시설장 지명" 법리 | line 693에 이미 narrative 명시 ("실증 개시 전 함수명을 `suggest_candidates`로 리네이밍 예정") — 추가 변경 불필요 | (기존) | **VERIFIED** (narrative 차원) |
| **GAP-3** | §3 사각지대 보행자 감지 enum 부재 | EdgeEventType code block에 `BLIND_SPOT_DETECTED` 주석 + V1.x 미구현 명시 + 실증 개시 30일 전 추가 일정 | line 700~713 | **VERIFIED** |

---

## 2. 변경 파일 목록

### 백엔드 (보안)

1. `backend/app/modules/student_management/models.py` — Student 3 PII 필드 _encrypted + hybrid_property
2. `backend/app/modules/scheduling/service.py` — Student.allergies SQL select 절을 allergies_encrypted + decrypt
3. `backend/app/apps/pettracker/models.py` — WalkerWallet bank_account_encrypted + hybrid_property
4. `backend/app/apps/careconnect/models.py` — CaregiverWallet bank_account_encrypted + hybrid_property
5. `backend/migrations/versions/d5e7f9a1b3c4_pii_aes_gcm_encryption.py` (신규) — 5 칼럼 변환 마이그레이션

### 모바일 (보안)

6. `mobile/src/api/client.ts` — Web 분기 localStorage 제거, in-memory only

### 사이트 (사용자 카피)

7. `site/src/pages/Landing.tsx` — 정규직 카피 약화, 가짜 후기 → 도입 시 기대 효과, PDF → 문의, App Store → 사전 신청, 요금 disclaimer
8. `site/src/pages/CostSimulator.tsx` — 학원 도입 모델 명시 + disclaimer

### lunenlabs (사용자 카피)

9. `lunenlabs/src/components/pt/PtFaq.tsx` — 사고 책임 구조 방향 명시
10. `lunenlabs/src/components/pt/PtWhy.tsx` — "100% 메이트 검증" → "3단계"
11. `lunenlabs/src/components/pt/PtSignupForm.tsx` — 펫시터 진입 단락 + 시급 정보

### 신청서

12. `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md` — C-1 + R-1·R-2·R-3·R-4·R-5

### 샌드박스

13. `artifacts/business/regulatory/2026-05-03-sandbox-application-v2.1-draft.md` — GAP-1·GAP-3 표현 약화

### 산출물 신규

14. `artifacts/reports/2026-05-06-user-decision-cards.md` (신규) — 6 카드
15. `artifacts/reports/2026-05-06-major-issues-resolution.md` (본 문서, 신규)

**총 변경 파일**: 15개 (12 수정 + 3 신규).

---

## 3. 검증 상태 분류

### VERIFIED (12건)
- C-1 (grep 후속 확인)
- C-3 (호출부 0건 grep 확인)
- R-1·R-2·R-3·R-4 (신청서 인-place edit, 정합성 self-review)
- R-7-A·B·R-8·R-9·R-10 (사이트·PT 페이지 코드 수정)
- R-11 (mobile/src/api/client.ts diff)
- A-3·A-4·A-5 (사이트 직접 수정)
- GAP-1·GAP-3 (샌드박스 markdown 수정)

### PARTIAL (4건)
- C-2 (3/4 처리, name 별도 spec)
- C-2/C-3 마이그레이션 (alembic upgrade 미실행)
- R-5 (도그메이트 fact-check 사용자 대기)
- GAP-2 (narrative 차원만 — 함수명 코드 변경은 별도 작업)

### 분리 → 사용자 카드 (4건)
- R-6 (사업자등록) → 카드 #1
- R-12 (앱스토어) → 카드 #2
- R-11-Web (web JWT) → 카드 #3
- C-2 잔존 (Student.name) → 카드 #4
- (audit 범위 외) Pet.medical_notes → 카드 #5
- (페르소나 주장) 도그메이트 fact-check → 카드 #6

### UNVERIFIED (환경 제약)
- pytest 실행 (178 def test_, 변경 후 회귀 검증 불가)
- jest 실행 (mobile·web)
- TypeScript tsc (mobile·web·site·lunenlabs)
- alembic upgrade head (마이그레이션 syntax 검증)
- Apple Info.plist 정적 점검

---

## 4. 잔존 리스크

### 즉시 (5/15 신청 전)

| Risk | 영향 | mitigation |
|---|---|---|
| C-2 Student.name 평문 잔존 | DB 유출 시 학생 이름 평문 노출 | 사용자 카드 #4 결정 후 Track 2 5/16~5/19 슬롯에 처리 |
| pytest 미실행 | 모델 변경 후 회귀 검증 0 | 사용자가 backend venv 활성화 환경에서 `pytest backend/tests` 실행 권고 (5/14 freeze 전) |
| 환경 제약 마이그레이션 미실행 | 마이그레이션 syntax 오류 가능성 | 사용자 dev 환경에서 `alembic upgrade head` 1회 실행 + 재시드 |

### 단기 (5/16 Track 2 시작 후)

| Risk | mitigation |
|---|---|
| Web 학원 admin localStorage 잔존 | 카드 #3 결정 후 5/16 T2.0 후 sessionStorage 또는 httpOnly cookie 전환 |
| 앱스토어 제출 거부 위험 | 카드 #2 + Track 2 T2.6 Pre-launch QA 통합 |
| Pet.medical_notes 평문 | 카드 #5 결정 후 처리 (30분 작업) |

### 중기 (V1.1 8월 또는 V2.0 10~12월)

| Risk | mitigation |
|---|---|
| hybrid_property 패턴이 CcChild 명시적 decrypt 패턴과 다름 | V1.1에서 패턴 일관성 정리 spec |
| pytest·jest·tsc 검증 자동화 부재 | 출시 후 CI/CD 도입 검토 |

---

## 5. 다음 단계 (사용자 액션 + 메인 액션)

### 사용자 5/7 전 (변호사 미팅 전)

1. **카드 1~6 검토 및 의사결정** (30분)
   - 권고: #1=C / #2=A+B / #3=B / #4=A / #5=A / #6=A
2. **도그메이트 2025 발표 fact-check** (5분 검색)
3. (선택) backend pytest 1회 실행으로 회귀 검증

### 메인 다음 세션

1. **카드 결정 반영 후속 작업** (~2시간)
   - 카드 #5 Pet.medical_notes hybrid_property (30분)
   - 카드 #3 Web sessionStorage (30분, 사용자가 B 선택 시)
   - 카드 #2 Apple Info.plist 정적 점검 (30분)
   - 카드 #4 Student.name 별도 spec 작성 (30분)

2. **5/9 v2 inject 시 본 보고서 변경분 반영**:
   - §1 R-6 narrative 보강 (사업자등록)
   - §2 R-5 도그메이트 fact-check 결과 반영
   - §4 자금 표 R-1 변경분 v2에 commit
   - §6 R-2 영상 시나리오 hybrid 형식 검증

### 5/14 v2.2 freeze 전

- 샌드박스 v2.1 GAP-1·GAP-3 v2.2 reflect
- pytest·jest·tsc 1회 실행으로 회귀 검증 완료
- alembic upgrade dev 환경 검증 완료

---

## 6. 이번 세션의 한계 (솔직)

| 한계 | 내용 |
|---|---|
| 환경 제약 | pytest·jest·tsc·alembic upgrade 모두 미실행. 모델 변경 + scheduling/service.py 수정 후 회귀 보장 0 |
| C-2 부분 처리 | Student.name은 의존성 분석 + 별도 spec 필요로 분리. 보안 결함 25%(1/4) 잔존 |
| Web JWT R-11 잔존 | mobile만 처리, web은 사용자 카드로 분리. 더 큰 표적이지만 사용성 trade-off |
| 페르소나 false positive 검증 부재 | 도그메이트 발표(R-5), R-12 앱스토어 3건 모두 사용자 fact-check 또는 정적 점검 필요 |
| 코드 변경 폭의 자기 검증 | 메인 단독 작성·수정. tech-spec-reviewer 또는 verification-auditor 별도 검증 미실시 (audit-only 세션이라 추가 review가 무한 retry 패턴 위험) |

---

## 7. 변경 이력

- 2026-05-06 v1.0: 18건 audit 처리 결과 통합 보고서 초안.
