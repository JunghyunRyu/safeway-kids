# Consensus Matrix: Design System Redesign + Role Expansion

**Date:** 2026-03-17
**Reviews:** tech-spec-reviewer (ab5cdb), requirement-analyst (aaa935)

---

## Disagreements & Resolutions

| # | 주제 | Reviewer A 의견 | Reviewer B 의견 | 결정 |
|---|------|----------------|----------------|------|
| 1 | 색상 팔레트 | "Amber Dusk"(A) 추천: 따뜻한 안전감 | "Slate Mint"(B) 추천: 핀테크 느낌 | **"Teal Amber" 채택**: `#0F7A7A` (Ocean Teal) + `#F4A22D` (Saffron Amber). 두 옵션의 장점을 결합, 더 독창적인 Ocean Teal 기반 |
| 2 | 학생(Student) 역할 | 완전 구현 | 플레이스홀더로 처리 | **플레이스홀더 스캐폴딩**: 백엔드 UserRole.STUDENT 부재 → 화면은 구축하되 LoginScreen에서 라우팅 불가 상태로 둠 |
| 3 | 관리자 학생 목록 BLOCKER | 백엔드 RBAC 수정 필요 | 프론트엔드만으로 해결 불가 | **백엔드 RBAC 수정 포함**: `require_roles(UserRole.PARENT)` → `require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN)` 으로 수정. 범위 내 포함 |
| 4 | 스케쥴 픽업 주소 표시 | 템플릿 조인 필요 (추가 API 호출) | 표시 생략 또는 defer | **표시 생략**: pickup_address는 DailySchedule에 없음. 대신 날짜 네비게이션 + 상태 배지 개선에 집중 |
| 5 | 탭 아이콘 | @expo/vector-icons 마이그레이션 | 이모지 유지 | **@expo/vector-icons 마이그레이션**: Expo SDK 54에 번들됨, 추가 패키지 불필요. 프로덕션 품질에 기여 |
| 6 | platform_admin vs academy_admin | 별도 네비게이터 | 공유 네비게이터 | **공유 AdminTabNavigator**: role에 따른 조건부 렌더링으로 처리 |

---

## Agreed Points (공통 합의)

1. ✅ 중앙화된 `theme.ts` 필수 (인라인 hex 코드 제거)
2. ✅ Schedule: 날짜 네비게이션 추가
3. ✅ Billing: 미납 요약 헤더 + 카드 확장/축소
4. ✅ Profile: 아바타 이니셜 + 이메일 표시
5. ✅ Admin: academy_id는 `GET /academies/mine` 호출로 획득
6. ✅ WCAG AA 대비율 준수
7. ✅ TypeScript strict mode 유지

---

## Final Decisions Summary

### 색상 팔레트 "Teal Amber"
```
Primary:        #0F7A7A  (Ocean Teal) — 메인 브랜드, 부모 역할
Primary Dark:   #095E5E
Primary Light:  #E0F2F2
Accent:         #F4A22D  (Saffron Amber) — 강조, 경고, 기사 역할
Accent Dark:    #C47D10
Background:     #F5F8F8  (Mist)
Surface:        #FFFFFF
Text Primary:   #1C2E2E  (Dark Teal)
Text Secondary: #5A7272  (Muted Teal)

Role Accents:
  Parent:   #0F7A7A  (Ocean Teal)
  Driver:   #F4A22D  (Saffron Amber)
  Escort:   #7B5EA7  (Soft Purple)
  Admin:    #D44C3E  (Safety Red)
  Student:  #2E9E6B  (Leaf Green)

Status:
  Success:  #2D9E6B
  Warning:  #F4A22D
  Danger:   #D44C3E
  Info:     #3B82C4
  Neutral:  #9EB3B3
```

### 구현 범위 확정
1. `mobile/src/constants/theme.ts` — 색상 토큰 시스템
2. 모든 기존 네비게이터 → 테마 토큰 적용 + @expo/vector-icons
3. 관리자 탭 (AdminTabNavigator + 4 screens)
4. 학생 탭 (StudentTabNavigator + 2 screens, placeholder)
5. Schedule/Billing/Profile 리디자인
6. 백엔드 RBAC 1건 수정 (students 엔드포인트)
7. 사이트 Tailwind 토큰 동기화
