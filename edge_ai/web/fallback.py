"""Human Fallback 모드 — AI 장애 시 수동 절차.

Tech Spec 섹션 28:
장애 감지 조건:
- 카메라 프레임 5초 이상 미수신
- AI 추론 시간 5초 이상
- 메모리 사용률 95% 이상
- 3회 연속 추론 실패

장애 시 동작:
- 모든 클라이언트에 'fallback_mode' emit
- 수동 체크리스트 데이터 전송
- AI 복구 시 자동 전환 + 'recovery' emit
"""

import logging
import time
from datetime import datetime, timezone
from typing import Callable

logger = logging.getLogger("edge_ai.fallback")

# 장애 감지 임계값
CAMERA_TIMEOUT_SEC = 5.0
INFERENCE_TIMEOUT_SEC = 5.0
MEMORY_CRITICAL_PERCENT = 95.0
MAX_CONSECUTIVE_FAILURES = 3
CHECK_INTERVAL_SEC = 2.0


class FallbackManager:
    """Human Fallback 모드 관리자."""

    def __init__(self, socketio=None, log_event_fn: Callable | None = None):
        self._socketio = socketio
        self._log_event = log_event_fn

        self._is_active = False
        self._last_camera_time = time.time()
        self._last_inference_time = time.time()
        self._consecutive_failures = 0
        self._memory_critical = False
        self._fallback_history: list[dict] = []

        # 복구 조건 트래킹
        self._recovery_camera_ok = True
        self._recovery_inference_ok = True

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def history(self) -> list[dict]:
        return self._fallback_history

    def report_camera_success(self):
        self._last_camera_time = time.time()
        self._recovery_camera_ok = True

    def report_camera_failure(self):
        # 타이머가 자동으로 만료를 감지
        self._recovery_camera_ok = False

    def report_inference_success(self):
        self._last_inference_time = time.time()
        self._consecutive_failures = 0
        self._recovery_inference_ok = True

    def report_inference_failure(self):
        self._consecutive_failures += 1
        self._recovery_inference_ok = False

    def report_memory_critical(self):
        self._memory_critical = True

    def _check_should_fallback(self) -> str | None:
        """장애 조건 체크. 장애 원인 문자열 반환, 정상이면 None."""
        now = time.time()

        if now - self._last_camera_time > CAMERA_TIMEOUT_SEC:
            return "camera_timeout"

        if now - self._last_inference_time > INFERENCE_TIMEOUT_SEC:
            return "inference_timeout"

        if self._memory_critical:
            return "memory_critical"

        if self._consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
            return "consecutive_failures"

        return None

    def _check_can_recover(self) -> bool:
        """복구 가능 조건 체크."""
        now = time.time()

        camera_ok = (now - self._last_camera_time) < CAMERA_TIMEOUT_SEC
        inference_ok = (
            self._consecutive_failures < MAX_CONSECUTIVE_FAILURES
            and (now - self._last_inference_time) < INFERENCE_TIMEOUT_SEC
        )
        memory_ok = not self._memory_critical

        return camera_ok and inference_ok and memory_ok

    def _activate_fallback(self, reason: str):
        """Fallback 모드 활성화."""
        if self._is_active:
            return

        self._is_active = True
        timestamp = datetime.now(timezone.utc).isoformat()

        reason_kr = {
            "camera_timeout": "카메라 프레임 수신 중단",
            "inference_timeout": "AI 추론 시간 초과",
            "memory_critical": "메모리 사용률 95% 초과",
            "consecutive_failures": "3회 연속 추론 실패",
        }

        record = {
            "event": "fallback_activated",
            "reason": reason,
            "reason_kr": reason_kr.get(reason, reason),
            "timestamp": timestamp,
        }
        self._fallback_history.append(record)

        logger.warning("[Fallback] 수동 확인 모드 활성화 (원인: %s)", reason)

        if self._socketio:
            # 수동 체크리스트 데이터
            checklist = [
                {"id": 1, "task": "탑승 인원 수기 확인", "checked": False},
                {"id": 2, "task": "좌석 벨트 착용 확인", "checked": False},
                {"id": 3, "task": "차량 내부 이상 유무 확인", "checked": False},
                {"id": 4, "task": "비상 연락망 확인", "checked": False},
            ]

            self._socketio.emit("fallback_mode", {
                "active": True,
                "reason": reason,
                "reason_kr": reason_kr.get(reason, reason),
                "message": "수동 확인 모드로 전환되었습니다.",
                "checklist": checklist,
                "timestamp": timestamp,
            })

            self._socketio.emit("alert", {
                "level": "danger",
                "message": f"AI 시스템 장애: {reason_kr.get(reason, reason)}. 수동 확인 필요.",
                "scenario": "fallback",
            })

        if self._log_event:
            self._log_event("fallback", f"수동 확인 모드 전환: {reason_kr.get(reason, reason)}",
                            {"reason": reason})

    def _deactivate_fallback(self):
        """Fallback 모드 해제 (AI 복구)."""
        if not self._is_active:
            return

        self._is_active = False
        self._memory_critical = False
        timestamp = datetime.now(timezone.utc).isoformat()

        record = {
            "event": "fallback_recovered",
            "timestamp": timestamp,
        }
        self._fallback_history.append(record)

        logger.info("[Fallback] AI 시스템 복구 — 자동 모드 전환")

        if self._socketio:
            self._socketio.emit("recovery", {
                "message": "AI 시스템이 복구되었습니다. 자동 모드로 전환합니다.",
                "timestamp": timestamp,
            })

            self._socketio.emit("fallback_mode", {
                "active": False,
                "message": "AI 시스템 복구 완료",
                "timestamp": timestamp,
            })

        if self._log_event:
            self._log_event("recovery", "AI 시스템 복구 — 자동 모드 전환")

    def monitor_loop(self, stop_event):
        """장애 감지 모니터링 루프. 별도 스레드에서 실행."""
        logger.info("[Fallback] 모니터링 시작")

        while not stop_event.is_set():
            if not self._is_active:
                reason = self._check_should_fallback()
                if reason:
                    self._activate_fallback(reason)
            else:
                if self._check_can_recover():
                    self._deactivate_fallback()

            stop_event.wait(CHECK_INTERVAL_SEC)

        logger.info("[Fallback] 모니터링 종료")
