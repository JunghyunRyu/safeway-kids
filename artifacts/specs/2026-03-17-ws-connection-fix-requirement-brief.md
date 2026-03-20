# Requirement Brief: 실시간 추적 WebSocket 연결 끊김 수정

**Date:** 2026-03-17
**Reporter:** 사용자 (학부모 앱 테스트 중)
**Status:** Phase 0 — Intake

---

## 1. Problem Statement

학부모 앱(Expo Go / iPhone)에서 "실시간 추적" 화면 진입 시 "연결 끊김" 상태가 지속된다.
지도는 로딩되나 WebSocket 연결이 수립되지 않아 차량 위치가 표시되지 않음.

## 2. Goals

- G1: 학부모 앱에서 실시간 추적 화면 진입 시 WebSocket 연결이 정상 수립된다
- G2: GPS 시뮬레이션 데이터가 지도 위 버스 마커로 실시간 표시된다
- G3: 연결 상태 표시가 "연결됨"(녹색)으로 전환된다

## 3. Non-Goals

- 프로덕션 배포 (현재 개발/테스트 단계)
- Expo Go 이외 빌드 환경 지원
- 백그라운드 GPS 추적

## 4. Root Cause Analysis

### 1차 원인: ngrok 무료 플랜 인터스티셜 페이지
- ngrok 무료 플랜은 첫 방문 시 브라우저 경고 페이지를 표시
- HTTP 요청은 `ngrok-skip-browser-warning` 헤더로 우회 가능
- **WebSocket upgrade 요청은 커스텀 헤더 설정 불가** (브라우저/RN WebSocket API 제한)
- 결과: WS 핸드셰이크가 인터스티셜 HTML을 받아 실패

### 2차 원인: proxy.js WebSocket 라우팅 (이미 수정 완료)
- 모든 WS를 Metro로 보내던 버그 → `/api/*`는 백엔드로 라우팅하도록 수정됨

### 확인 필요 원인:
- JWT 토큰이 올바르게 전달되는지
- Redis pubsub이 정상 동작하는지

## 5. Assumption Register

| ID | Assumption | Risk |
|----|-----------|------|
| A1 | ngrok 인터스티셜이 WS 차단의 주 원인 | 중 — 직접 WS 테스트로 확인 필요 |
| A2 | proxy.js를 통한 WS 라우팅은 정상 동작 | 중 — 실제 WS 연결 테스트 필요 |
| A3 | JWT 토큰은 SecureStore에 정상 저장됨 | 저 — 로그인 성공 확인됨 |
| A4 | Redis pubsub은 정상 동작 | 저 — GPS API 200 응답 확인됨 |

## 6. Open Questions

| ID | Question | Impact |
|----|----------|--------|
| Q1 | ngrok 인터스티셜 우회 가능한가? proxy 레벨에서 헤더 추가? | 전체 접근 방식 결정 |
| Q2 | proxy.js에서 WS upgrade에 헤더를 주입할 수 있는가? | 해결 방안 A |
| Q3 | ngrok 대신 cloudflared 같은 대안이 더 나은가? | 해결 방안 B |
| Q4 | 백엔드 직접 폴링(HTTP)으로 대체하는 것이 안정적인가? | 해결 방안 C (fallback) |

## 7. Solution Candidates

### Solution A: proxy.js에서 ngrok 인터스티셜 우회
- proxy.js가 WS upgrade 요청을 localhost 백엔드로 직접 전달하므로, ngrok → proxy → backend 경로에서 proxy가 이미 localhost로 포워딩
- **핵심 인사이트**: 문제는 ngrok이 WS upgrade를 proxy에 전달하기 전에 인터스티셜을 보여주는 것
- proxy에서 `ngrok-skip-browser-warning` 헤더를 추가해도 ngrok 측에서는 이미 인터스티셜 반환

### Solution B: ngrok에 User-Agent 헤더 활용
- ngrok은 "브라우저"에서 온 요청만 인터스티셜 표시
- WebSocket 요청은 비브라우저로 판단될 수 있음 → 테스트 필요

### Solution C: HTTP 폴링 fallback
- WebSocket 연결 실패 시 `/vehicles/{id}/location` REST 엔드포인트를 3초 간격 폴링
- 안정적이지만 실시간성 저하

### Solution D: WS 연결을 ngrok 우회하여 직접 연결
- ngrok 터널이 아닌, 같은 네트워크 내 직접 IP로 WS 연결
- VMware 환경에서 iPhone과 직접 통신 불가 (네트워크 제약)

### Solution E: 백엔드에서 WS → SSE 대체 또는 하이브리드
- Server-Sent Events는 일반 HTTP이므로 헤더 설정 가능
- ngrok-skip-browser-warning 헤더 추가 가능

## 8. Acceptance Criteria

- AC1: 학부모 앱 실시간 추적 화면에서 "연결됨" 상태 표시
- AC2: GPS 시뮬레이션 실행 시 지도 위 버스 마커가 이동
- AC3: 앱 재시작 후에도 재연결 성공
- AC4: 연결 실패 시 사용자에게 의미 있는 피드백 제공
