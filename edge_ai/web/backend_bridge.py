"""백엔드 연동 + Standalone 모드 브릿지.

Tech Spec FR7.1~FR7.4:
- 시작 시 localhost:8000 헬스체크 → 연동/standalone 자동 판별
- 연동 모드: 이벤트 POST /api/v1/edge/events
- standalone 모드: 이벤트 로컬 메모리 저장
- UI에 연결 상태 표시
"""

import logging
from datetime import datetime, timezone

import requests

logger = logging.getLogger("edge_ai.bridge")


class BackendBridge:
    """SafeWay Kids 백엔드 연동 브릿지."""

    def __init__(
        self,
        backend_url: str = "http://localhost:8000",
        api_token: str = "",
        standalone_setting: str = "auto",
    ):
        self._backend_url = backend_url.rstrip("/")
        self._api_base = f"{self._backend_url}/api/v1"
        self._api_token = api_token
        self._standalone_setting = standalone_setting  # auto | true | false

        self._connected = False
        self._mode = "standalone"  # "connected" | "standalone"
        self._local_events: list[dict] = []

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def mode(self) -> str:
        return self._mode

    @property
    def local_events(self) -> list[dict]:
        return self._local_events

    def check_backend(self) -> bool:
        """백엔드 헬스체크. 연동/standalone 모드 결정."""
        if self._standalone_setting == "true":
            self._connected = False
            self._mode = "standalone"
            logger.info("[Bridge] standalone 모드 (설정에 의한 강제)")
            return False

        if self._standalone_setting == "false":
            # 강제 연동 모드 — 실패해도 connected 시도
            pass

        try:
            resp = requests.get(
                f"{self._api_base}/health",
                timeout=3,
            )
            if resp.status_code == 200:
                self._connected = True
                self._mode = "connected"
                logger.info("[Bridge] 백엔드 연동 모드 (URL: %s)", self._backend_url)
                return True
        except requests.RequestException as e:
            logger.info("[Bridge] 백엔드 연결 실패: %s", e)

        self._connected = False
        self._mode = "standalone"
        logger.info("[Bridge] standalone 모드 (백엔드 미응답)")
        return False

    def send_event(self, event_type: str, details: dict) -> bool:
        """이벤트 전송. 연동 모드면 POST, standalone이면 로컬 저장."""
        payload = {
            "event_type": event_type,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if not self._connected:
            self._local_events.append(payload)
            if len(self._local_events) > 500:
                self._local_events.pop(0)
            return True

        headers = {"Content-Type": "application/json"}
        if self._api_token:
            headers["Authorization"] = f"Bearer {self._api_token}"

        try:
            resp = requests.post(
                f"{self._api_base}/edge/events",
                json=payload,
                headers=headers,
                timeout=5,
            )
            if resp.status_code in (200, 201):
                logger.debug("[Bridge] 이벤트 전송 성공: %s", event_type)
                return True
            else:
                logger.warning("[Bridge] 이벤트 전송 실패: %d", resp.status_code)
                self._local_events.append(payload)
                return False
        except requests.RequestException as e:
            logger.warning("[Bridge] 이벤트 전송 오류: %s", e)
            self._local_events.append(payload)
            # 연결 끊김 감지
            self._connected = False
            self._mode = "standalone"
            return False

    def retry_connection(self) -> bool:
        """연결 재시도."""
        return self.check_backend()

    def flush_local_events(self) -> int:
        """로컬 저장된 이벤트를 백엔드로 일괄 전송 (연동 모드일 때)."""
        if not self._connected or not self._local_events:
            return 0

        sent = 0
        remaining = []
        for payload in self._local_events:
            headers = {"Content-Type": "application/json"}
            if self._api_token:
                headers["Authorization"] = f"Bearer {self._api_token}"
            try:
                resp = requests.post(
                    f"{self._api_base}/edge/events",
                    json=payload,
                    headers=headers,
                    timeout=5,
                )
                if resp.status_code in (200, 201):
                    sent += 1
                else:
                    remaining.append(payload)
            except requests.RequestException:
                remaining.append(payload)
                break  # 연결 실패 시 중단

        self._local_events = remaining
        if sent:
            logger.info("[Bridge] 로컬 이벤트 %d건 전송 완료", sent)
        return sent
