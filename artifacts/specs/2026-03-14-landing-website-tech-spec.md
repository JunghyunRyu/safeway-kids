# Final Tech Spec: SAFEWAY KIDS 랜딩 웹사이트

## Problem Statement
SAFEWAY KIDS 서비스를 소개하는 공식 웹사이트가 없어 신규 고객 유치, 앱스토어 제출, 브랜드 신뢰 구축이 불가능한 상태.

## Goals
- 서비스 소개 원페이지 랜딩 (한국어)
- 학부모/학원/기사 3개 타겟 대상 CTA
- 앱스토어 제출용 개인정보처리방침 + 이용약관
- 모바일/데스크톱 반응형
- UX 우선 디자인

## Non-goals
- CMS/블로그, 회원가입/로그인, 결제 연동, 다국어(영어)

## Architecture
- 별도 `site/` 디렉토리 (기존 web/ 대시보드와 분리)
- Vite + React 19 + Tailwind CSS 4 (기존 스택 동일)
- React Router: `/` (랜딩), `/privacy` (개인정보), `/terms` (이용약관)

## Pages
1. **Landing (`/`)**: Hero → Features → 타겟별 소개 → 신뢰 요소 → CTA → Footer
2. **Privacy (`/privacy`)**: 개인정보처리방침
3. **Terms (`/terms`)**: 이용약관

## Design System
- Primary: #2196F3, Accent: #4CAF50, BG: #f8f9fa, Text: #1a1a2e
- Font: system-ui (Pretendard fallback)
- Card radius: 16px, Section padding: 80px vertical

## Acceptance Criteria
- 3페이지 정상 렌더링
- 모바일 반응형 (375px~)
- 빌드 성공 (vite build)
- TypeScript 에러 0
