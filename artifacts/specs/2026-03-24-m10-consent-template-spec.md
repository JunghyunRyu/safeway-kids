# M10 Final Tech Spec — 동의 플로우 + 스케줄 템플릿 UI

**작성일**: 2026-03-24
**상태**: APPROVED (Phase 0-3 압축)

---

## 문제 정의

### 동의 플로우
백엔드에 GuardianConsent (학부모), DriverLocationConsent (기사/안전도우미) API가 완비되어 있으나, **모바일 앱에 동의 수집 UI가 전혀 없음**. 법적 요구사항(위치정보법, 개인정보보호법, 아동복지법) 충족 불가.

**역할별 현황**:
| 역할 | 백엔드 API | 모바일 UI | 상태 |
|------|-----------|----------|------|
| 학부모 | POST/GET/WITHDRAW consents ✅ | 없음 | **미충족** |
| 기사 | POST/GET driver-consent ✅ | 없음 | **미충족** |
| 안전도우미 | POST/GET driver-consent ✅ | 없음 | **미충족** |
| 학생 | 학부모 동의로 커버 | 별도 불필요 | OK |
| 관리자 | 직접 동의 불필요 (플랫폼 운영자) | 별도 불필요 | OK |

### 스케줄 템플릿
POST /templates (생성) 엔드포인트만 존재. PATCH/DELETE 미구현. 웹에서 토글 UI가 PATCH를 호출하지만 404 발생.

---

## 구현 범위

### A. 학부모 동의 화면 (ConsentScreen.tsx)
- 자녀별 동의 수집 (POST /compliance/consents)
- 필수 3항목: 서비스 이용약관, 개인정보 처리방침, 아동 개인정보 수집
- 선택 5항목: 위치추적, 푸시알림, 마케팅, 제3자제공, 건강정보공유
- 동의 철회 (프로필 설정에서)
- **미동의 시 MapScreen(실시간 추적) 접근 차단**

### B. 기사/안전도우미 GPS 동의
- 첫 운행 시작 시 GPS 동의 팝업 (POST /compliance/driver-consent)
- 동의 후 GPS 추적 시작
- 동의 여부 체크 (GET /compliance/driver-consent/check)

### C. 동의 체크 통합
- RootNavigator에서 학부모 로그인 시 자녀별 동의 상태 확인
- 미동의 자녀 존재 시 ConsentScreen으로 자동 이동
- 기사/안전도우미는 RouteScreen 진입 시 동의 체크

### D. 백엔드 — 템플릿 PATCH/DELETE
- PATCH /templates/{id} (is_active 토글 + 필드 수정)
- DELETE /templates/{id} (소프트 삭제 = is_active=False)

### E. 웹 — 템플릿 생성/수정 폼
- SchedulesPage에 "템플릿 추가" 버튼 + 모달 폼
- 기존 템플릿 편집 (요일, 시간, 주소 수정)

---

## 수락 기준

- [ ] 학부모: 자녀별 동의 수집 화면 동작
- [ ] 학부모: 필수 3항목 미동의 시 제출 불가
- [ ] 학부모: 미동의 시 MapScreen "동의 필요" 안내 + 동의 화면 이동 버튼
- [ ] 기사: 첫 운행 시 GPS 동의 팝업 표시
- [ ] 기사: 미동의 시 GPS 전송 안 됨
- [ ] 백엔드: PATCH /templates/{id} 정상 동작
- [ ] 웹: 템플릿 생성 폼 동작
- [ ] 전체 테스트 통과 + TypeScript 0 errors
