# Requirement Brief: Push Notification ID Fix + Edge Gateway Auth

**Date:** 2026-03-29
**Author:** Claude Code

---

## 1. Requirement Brief

### REQ-A: Expo Push Notification Project ID 수정
- **현상**: `mobile/src/hooks/useNotifications.ts:87`에 `projectId: "your-expo-project-id"` 플레이스홀더
- **영향**: 프로덕션에서 푸시 알림 토큰 등록 실패 → 모든 푸시 알림 불가
- **수정**: `app.json`의 실제 프로젝트 ID를 `expo-constants`를 통해 동적으로 참조

### REQ-B: Edge Gateway API 키 인증 추가
- **현상**: `POST /api/v1/edge/events`에 인증 없음 → 누구나 가짜 AI 이벤트 전송 가능
- **영향**: 보안 취약점 — 가짜 얼굴인식/이상행동/잔류승객 이벤트 주입 가능
- **수정**: API 키 기반 인증 추가. Edge AI 클라이언트는 이미 `Authorization: Bearer {token}` 헤더 지원

---

## 2. Goals / Non-goals

### Goals
- [G1] 푸시 알림 토큰 등록이 실제 Expo 프로젝트 ID로 동작
- [G2] Edge Gateway 이벤트 수신 엔드포인트에 API 키 인증 적용
- [G3] 기존 Edge AI 클라이언트(`BackendBridge`)와 호환 유지
- [G4] `GET /events` (이벤트 조회)는 기존 플랫폼 관리자 JWT 인증 유지

### Non-goals
- Toss Payments 위젯 통합 (별도 작업)
- 알림 탭 딥링크 네비게이션 (별도 작업)
- Edge AI JetsonBackend 구현 (하드웨어 의존)

---

## 3. Assumption Register

| ID | 가정 | 근거 |
|----|------|------|
| A1 | `expo-constants`가 이미 Expo 54에 포함됨 | Expo SDK 기본 패키지 |
| A2 | `app.json`의 `extra.eas.projectId`가 정확한 값 | EAS 빌드에서 사용 중 |
| A3 | Edge AI 디바이스는 환경변수로 API 키를 받음 | `EDGE_DEMO_API_TOKEN` 이미 존재 |
| A4 | 개발 환경에서는 Edge Gateway 인증을 선택적으로 건너뛸 수 있어야 함 | 로컬 개발 편의 |

---

## 4. Open Questions

| ID | 질문 | 결정 |
|----|------|------|
| Q1 | Edge API 키 인증은 `X-Edge-API-Key` 헤더 vs `Authorization: Bearer` 중 어느 것? | `Authorization: Bearer` — BackendBridge가 이미 이 방식 사용 |
| Q2 | 개발 환경에서 API 키 없이도 Edge 이벤트 수신 허용? | Yes — `environment != "production"`일 때 빈 키 허용 |

---

## 5. Acceptance Criteria

### REQ-A
- [AC-A1] `useNotifications.ts`에 플레이스홀더 문자열이 없을 것
- [AC-A2] `app.json`의 EAS 프로젝트 ID를 동적으로 참조할 것
- [AC-A3] 기존 모바일 테스트가 통과할 것

### REQ-B
- [AC-B1] `POST /api/v1/edge/events`에 유효한 API 키 없이 요청 시 401 반환
- [AC-B2] 유효한 API 키로 요청 시 201 반환 (기존 동작 유지)
- [AC-B3] 개발 환경에서 API 키 미설정 시에도 이벤트 수신 가능
- [AC-B4] `GET /api/v1/edge/events`는 기존 인증(플랫폼 관리자 JWT) 유지
- [AC-B5] `config.py`에 `edge_api_key` 설정 추가, 프로덕션 validator에 포함
- [AC-B6] Edge AI `BackendBridge`와 호환 (`Authorization: Bearer` 헤더)
- [AC-B7] 기존 백엔드 테스트가 통과할 것
