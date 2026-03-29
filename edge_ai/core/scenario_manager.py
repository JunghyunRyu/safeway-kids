"""시나리오 관리자 + 모델 활성화 맵.

4개 모드(BOARDING, TRANSIT, ALIGHTING, POST_TRIP) 간 전환을 관리하고,
모드별 AI 모듈 활성화/비활성화를 제어한다.

Tech Spec 섹션 25 (운행 모드 자동 전환), Consensus P4 구현.
"""

import logging
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger(__name__)


class ScenarioMode(str, Enum):
    BOARDING = "boarding"       # 승차: 안면인식 + 사각지대
    TRANSIT = "transit"         # 운행: 이상행동
    ALIGHTING = "alighting"     # 하차: 안면인식 + 사각지대
    POST_TRIP = "post_trip"     # 하차 후: 잔류인원
    BLINDSPOT = "blindspot"     # 사각지대 전용 (데모 시나리오 ④)


# 모드별 AI 모듈 활성화 맵 (Tech Spec 25.2)
MODEL_ACTIVATION_MAP: dict[ScenarioMode, dict[str, bool]] = {
    ScenarioMode.BOARDING: {
        "face_recognizer": True,
        "behavior_analyzer": False,
        "passenger_scanner": False,
        "blindspot_simulation": True,
    },
    ScenarioMode.TRANSIT: {
        "face_recognizer": False,
        "behavior_analyzer": True,
        "passenger_scanner": False,
        "blindspot_simulation": False,
    },
    ScenarioMode.ALIGHTING: {
        "face_recognizer": True,
        "behavior_analyzer": False,
        "passenger_scanner": False,
        "blindspot_simulation": True,
    },
    ScenarioMode.POST_TRIP: {
        "face_recognizer": False,
        "behavior_analyzer": False,
        "passenger_scanner": True,
        "blindspot_simulation": False,
    },
    ScenarioMode.BLINDSPOT: {
        "face_recognizer": False,
        "behavior_analyzer": False,
        "passenger_scanner": False,
        "blindspot_simulation": True,
    },
}

# 모드 전환 허용 경로 (Tech Spec 25.1)
VALID_TRANSITIONS: dict[ScenarioMode, list[ScenarioMode]] = {
    ScenarioMode.BOARDING: [ScenarioMode.TRANSIT, ScenarioMode.ALIGHTING, ScenarioMode.BLINDSPOT],
    ScenarioMode.TRANSIT: [ScenarioMode.ALIGHTING, ScenarioMode.BOARDING, ScenarioMode.BLINDSPOT],
    ScenarioMode.ALIGHTING: [ScenarioMode.POST_TRIP, ScenarioMode.BOARDING, ScenarioMode.TRANSIT, ScenarioMode.BLINDSPOT],
    ScenarioMode.POST_TRIP: [ScenarioMode.BOARDING, ScenarioMode.BLINDSPOT],
    ScenarioMode.BLINDSPOT: [ScenarioMode.BOARDING, ScenarioMode.TRANSIT, ScenarioMode.ALIGHTING, ScenarioMode.POST_TRIP],
}

# 데모 시나리오 순서 (스텝 위저드)
DEMO_SEQUENCE = [
    ScenarioMode.BOARDING,
    ScenarioMode.TRANSIT,
    ScenarioMode.POST_TRIP,
    ScenarioMode.BLINDSPOT,
]

# 시나리오별 데모 표시 정보
SCENARIO_INFO: dict[ScenarioMode, dict[str, str]] = {
    ScenarioMode.BOARDING: {
        "number": "①",
        "title": "승하차 안면인식",
        "domain": "도메인 3: 안면인식 터미널",
        "description": "웹캠으로 원생 얼굴을 등록하고 인식합니다.",
        "guide": "등록할 원생의 이름을 입력하고 카메라 앞에 서세요. 정면/좌/우 3각도로 등록합니다.",
    },
    ScenarioMode.TRANSIT: {
        "number": "②",
        "title": "운행 중 이상행동 감지",
        "domain": "도메인 2: CCTV",
        "description": "차량 내부를 촬영하여 일어서기/넘어짐 등 이상 행동을 감지합니다.",
        "guide": "카메라 앞에서 정상 착석 → 일어서기 → 다시 앉기를 시연합니다.",
    },
    ScenarioMode.ALIGHTING: {
        "number": "①-B",
        "title": "하차 안면인식",
        "domain": "도메인 3: 안면인식 터미널",
        "description": "하차 시 얼굴을 인식하여 미하차 인원을 확인합니다.",
        "guide": "승차된 원생이 하차할 때 카메라 앞을 지나갑니다.",
    },
    ScenarioMode.POST_TRIP: {
        "number": "③",
        "title": "시동 OFF 잔류인원 감지",
        "domain": "도메인 2: CCTV",
        "description": "시동 OFF 후 차량 내 잔류 인원을 감지합니다.",
        "guide": "'시동 OFF' 버튼을 클릭하면 잔류 인원 스캔이 시작됩니다.",
    },
    ScenarioMode.BLINDSPOT: {
        "number": "④",
        "title": "사각지대 어린이 감지",
        "domain": "도메인 4: LiDAR + 초음파 센서",
        "description": "차량 주변 사각지대에서 어린이를 센서로 감지합니다.",
        "guide": "시나리오 자동 재생을 관찰하거나, 마우스로 어린이를 이동시켜 보세요.",
    },
}


class ScenarioManager:
    """시나리오 관리자.

    모드 전환, 모델 활성화 맵 관리, 데모 순서 제어를 담당한다.
    """

    def __init__(
        self,
        on_mode_change: Callable[[ScenarioMode, ScenarioMode, dict[str, bool]], None] | None = None,
    ):
        """
        Args:
            on_mode_change: 모드 변경 콜백 (old_mode, new_mode, activation_map)
        """
        self._current_mode = ScenarioMode.BOARDING
        self._on_mode_change = on_mode_change
        self._demo_step = 0
        self._transition_time_ms: float = 0.0

    @property
    def current_mode(self) -> ScenarioMode:
        return self._current_mode

    @property
    def active_models(self) -> dict[str, bool]:
        """현재 모드의 모델 활성화 맵."""
        return MODEL_ACTIVATION_MAP.get(self._current_mode, {})

    @property
    def scenario_info(self) -> dict[str, str]:
        """현재 시나리오 정보."""
        return SCENARIO_INFO.get(self._current_mode, {})

    def set_mode(self, new_mode: ScenarioMode, force: bool = False) -> bool:
        """모드 전환.

        Args:
            new_mode: 전환할 모드
            force: 전환 경로 제한 무시 (데모 스텝 위저드용)

        Returns:
            전환 성공 여부
        """
        if new_mode == self._current_mode:
            return True

        if not force:
            valid = VALID_TRANSITIONS.get(self._current_mode, [])
            if new_mode not in valid:
                logger.warning(
                    "[Scenario] 잘못된 전환: %s → %s (허용: %s)",
                    self._current_mode.value, new_mode.value,
                    [v.value for v in valid],
                )
                return False

        t0 = time.perf_counter()
        old_mode = self._current_mode
        self._current_mode = new_mode
        self._transition_time_ms = (time.perf_counter() - t0) * 1000

        activation = MODEL_ACTIVATION_MAP[new_mode]
        active_names = [k for k, v in activation.items() if v]
        logger.info(
            "[Scenario] 모드 전환: %s → %s (활성 모듈: %s)",
            old_mode.value, new_mode.value, active_names,
        )

        if self._on_mode_change:
            try:
                self._on_mode_change(old_mode, new_mode, activation)
            except Exception as e:
                logger.error("[Scenario] 모드 변경 콜백 오류: %s", e)

        return True

    def next_demo_step(self) -> ScenarioMode:
        """데모 스텝 위저드: 다음 시나리오로 전환."""
        self._demo_step = (self._demo_step + 1) % len(DEMO_SEQUENCE)
        next_mode = DEMO_SEQUENCE[self._demo_step]
        self.set_mode(next_mode, force=True)
        return next_mode

    def prev_demo_step(self) -> ScenarioMode:
        """데모 스텝 위저드: 이전 시나리오로 전환."""
        self._demo_step = (self._demo_step - 1) % len(DEMO_SEQUENCE)
        prev_mode = DEMO_SEQUENCE[self._demo_step]
        self.set_mode(prev_mode, force=True)
        return prev_mode

    def go_to_demo_step(self, step: int) -> ScenarioMode:
        """데모 스텝 위저드: 특정 시나리오로 이동."""
        step = max(0, min(step, len(DEMO_SEQUENCE) - 1))
        self._demo_step = step
        target_mode = DEMO_SEQUENCE[step]
        self.set_mode(target_mode, force=True)
        return target_mode

    def is_module_active(self, module_name: str) -> bool:
        """특정 AI 모듈이 현재 모드에서 활성화되어 있는지 확인."""
        return self.active_models.get(module_name, False)

    def get_status(self) -> dict:
        """현재 상태 딕셔너리 (UI 전송용)."""
        info = SCENARIO_INFO.get(self._current_mode, {})
        return {
            "mode": self._current_mode.value,
            "scenario_number": info.get("number", ""),
            "scenario_title": info.get("title", ""),
            "domain": info.get("domain", ""),
            "description": info.get("description", ""),
            "guide": info.get("guide", ""),
            "active_models": self.active_models,
            "demo_step": self._demo_step,
            "demo_total_steps": len(DEMO_SEQUENCE),
            "transition_time_ms": round(self._transition_time_ms, 1),
        }

    def reset(self) -> None:
        """초기 상태로 리셋."""
        self._current_mode = ScenarioMode.BOARDING
        self._demo_step = 0
        self._transition_time_ms = 0.0
        logger.info("[Scenario] 초기 상태 리셋")
