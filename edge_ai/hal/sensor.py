"""Hardware Abstraction Layer - 센서 인터페이스.

시뮬레이션 센서(PoC) / 실제 센서(Phase 2) 전환을 추상화한다.
Tech Spec 섹션 24 구현.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class SensorInterface(ABC):
    """센서 추상 인터페이스."""

    @abstractmethod
    def read(self) -> dict:
        """센서 데이터 읽기. JS 프론트엔드에서 사용할 설정 반환."""

    @abstractmethod
    def get_spec(self) -> dict:
        """센서 사양 정보 반환."""


class SimulatedSensor(SensorInterface):
    """PoC용 시뮬레이션 센서.

    실제 데이터 생성은 JS 프론트엔드에서 수행.
    Python 측은 센서 사양과 파라미터만 제공한다.
    """

    def __init__(self):
        self._lidar_spec = {
            "type": "LiDAR",
            "model": "VLP-16 (시뮬레이션)",
            "rays": 360,
            "range_m": 15.0,
            "noise_sigma_m": 0.03,
            "dropout_rate": 0.02,
            "position": "roof_center",
        }
        self._ultrasonic_spec = {
            "type": "Ultrasonic",
            "count": 12,
            "layout": {"front": 4, "rear": 4, "side": 4},
            "beam_angle_deg": 15,
            "range_m": 4.0,
            "noise_sigma_m": 0.01,
            "position": "bumper_level",
        }

    def read(self) -> dict:
        return {
            "mode": "simulation",
            "lidar": self._lidar_spec,
            "ultrasonic": self._ultrasonic_spec,
            "vehicle": {
                "width_m": 2.0,
                "length_m": 7.0,
            },
            "fusion": {
                "lidar_weight": 0.7,
                "ultrasonic_weight": 0.3,
            },
            "alert_distances": {
                "caution_m": 4.0,
                "warning_m": 2.5,
                "danger_m": 1.0,
            },
        }

    def get_spec(self) -> dict:
        return {
            "lidar": self._lidar_spec,
            "ultrasonic": self._ultrasonic_spec,
        }


class HardwareSensor(SensorInterface):
    """실제 센서 인터페이스 (Phase 2 파일럿)."""

    def read(self) -> dict:
        raise NotImplementedError(
            "HardwareSensor는 Phase 2 파일럿에서 구현 예정입니다."
        )

    def get_spec(self) -> dict:
        raise NotImplementedError("HardwareSensor 미구현")


def create_sensor(mode: str = "simulation") -> SensorInterface:
    """센서 팩토리. EDGE_SENSOR_MODE 값에 따라 생성."""
    if mode == "simulation":
        return SimulatedSensor()
    elif mode == "hardware":
        return HardwareSensor()
    else:
        raise ValueError(f"지원하지 않는 센서 모드: {mode}")
