"""승하차 관리 모듈.

승차/하차 명단을 관리하고, 안면인식 결과를 기반으로
승차 기록, 하차 체크, 미하차 경고를 처리한다.

Tech Spec 섹션 20 구현.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class BoardingMode(str, Enum):
    BOARDING = "boarding"
    ALIGHTING = "alighting"
    IDLE = "idle"


class BoardingStatus(str, Enum):
    BOARDED = "boarded"
    ALIGHTED = "alighted"
    NOT_ALIGHTED = "not_alighted"


class CheckResult(str, Enum):
    BOARDING_OK = "boarding_ok"           # 정상 승차
    ALIGHTING_OK = "alighting_ok"         # 정상 하차
    ALREADY_BOARDED = "already_boarded"   # 이미 승차된 인원
    NOT_BOARDED = "not_boarded"           # 승차 기록 없는 인원 하차 (오탈승 가능성)
    UNREGISTERED = "unregistered"         # 미등록 얼굴
    ALL_ALIGHTED = "all_alighted"         # 전원 하차 완료


@dataclass
class PassengerRecord:
    name: str
    boarded_at: datetime | None = None
    alighted_at: datetime | None = None
    confidence: float = 0.0

    @property
    def status(self) -> BoardingStatus:
        if self.alighted_at is not None:
            return BoardingStatus.ALIGHTED
        if self.boarded_at is not None:
            return BoardingStatus.BOARDED
        return BoardingStatus.NOT_ALIGHTED


@dataclass
class CheckResponse:
    result: CheckResult
    name: str
    message: str
    record: PassengerRecord | None = None
    alert_level: str = "normal"  # normal | warning | danger


class BoardingManager:
    """승하차 명단 관리자."""

    def __init__(self, on_event: Any = None):
        """
        Args:
            on_event: 이벤트 콜백 (event_type: str, data: dict) -> None
        """
        self._passengers: dict[str, PassengerRecord] = {}
        self._mode = BoardingMode.IDLE
        self._on_event = on_event

    @property
    def mode(self) -> BoardingMode:
        return self._mode

    def set_mode(self, mode: BoardingMode) -> None:
        """승하차 모드 전환."""
        prev = self._mode
        self._mode = mode
        logger.info("[Boarding] 모드 전환: %s → %s", prev.value, mode.value)

        if mode == BoardingMode.ALIGHTING:
            not_alighted = self.get_not_alighted()
            if not_alighted:
                logger.info("[Boarding] 하차 대기 인원: %d명", len(not_alighted))

    def record_boarding(self, name: str, confidence: float) -> CheckResponse:
        """승차 기록. 안면인식 결과를 받아 승차 처리."""
        now = datetime.now(timezone.utc)

        if name in self._passengers:
            rec = self._passengers[name]
            if rec.boarded_at is not None and rec.alighted_at is None:
                return CheckResponse(
                    result=CheckResult.ALREADY_BOARDED,
                    name=name,
                    message=f"{name} 원생은 이미 탑승 중입니다",
                    record=rec,
                    alert_level="normal",
                )

        rec = PassengerRecord(name=name, boarded_at=now, confidence=confidence)
        self._passengers[name] = rec

        logger.info("[Boarding] 승차: %s (confidence=%.2f)", name, confidence)
        self._emit_event("boarding_confirmed", {
            "student_name": name,
            "confidence": confidence,
            "boarded_at": now.isoformat(),
        })

        return CheckResponse(
            result=CheckResult.BOARDING_OK,
            name=name,
            message=f"{name} 원생 탑승 확인",
            record=rec,
            alert_level="normal",
        )

    def record_alighting(self, name: str, confidence: float) -> CheckResponse:
        """하차 기록. 승차 명단에서 대조하여 하차 처리."""
        now = datetime.now(timezone.utc)

        if name not in self._passengers:
            logger.warning("[Boarding] 미등록 하차 감지: %s", name)
            self._emit_event("unregistered_alighting", {
                "student_name": name,
                "confidence": confidence,
            })
            return CheckResponse(
                result=CheckResult.NOT_BOARDED,
                name=name,
                message=f"{name} 원생: 승차 기록 없음 (오탈승 가능성)",
                alert_level="warning",
            )

        rec = self._passengers[name]
        if rec.alighted_at is not None:
            return CheckResponse(
                result=CheckResult.ALIGHTING_OK,
                name=name,
                message=f"{name} 원생은 이미 하차 완료",
                record=rec,
                alert_level="normal",
            )

        rec.alighted_at = now
        logger.info("[Boarding] 하차: %s", name)

        time_str = now.strftime("%H:%M")
        self._emit_event("alighting_confirmed", {
            "student_name": name,
            "confidence": confidence,
            "alighted_at": now.isoformat(),
        })

        # 전원 하차 확인
        if self.is_all_alighted():
            logger.info("[Boarding] 전원 하차 완료!")
            self._emit_event("all_alighted", {
                "total": len(self._passengers),
            })
            return CheckResponse(
                result=CheckResult.ALL_ALIGHTED,
                name=name,
                message=f"{name} 원생 하차 확인 ({time_str}) — 전원 하차 완료",
                record=rec,
                alert_level="normal",
            )

        return CheckResponse(
            result=CheckResult.ALIGHTING_OK,
            name=name,
            message=f"{name} 원생 하차 확인 ({time_str})",
            record=rec,
            alert_level="normal",
        )

    def process_recognition(self, name: str, confidence: float) -> CheckResponse:
        """현재 모드에 따라 승차 또는 하차를 자동 처리."""
        if self._mode == BoardingMode.BOARDING:
            return self.record_boarding(name, confidence)
        elif self._mode == BoardingMode.ALIGHTING:
            return self.record_alighting(name, confidence)
        else:
            return CheckResponse(
                result=CheckResult.UNREGISTERED,
                name=name,
                message="현재 승하차 모드가 아닙니다",
                alert_level="normal",
            )

    def get_not_alighted(self) -> list[PassengerRecord]:
        """미하차 인원 목록."""
        return [
            rec for rec in self._passengers.values()
            if rec.boarded_at is not None and rec.alighted_at is None
        ]

    def is_all_alighted(self) -> bool:
        """전원 하차 완료 여부."""
        if not self._passengers:
            return False
        return all(
            rec.alighted_at is not None
            for rec in self._passengers.values()
            if rec.boarded_at is not None
        )

    def get_status(self) -> dict:
        """현재 승하차 상태 딕셔너리 (UI 전송용)."""
        boarded = [r for r in self._passengers.values() if r.boarded_at]
        alighted = [r for r in self._passengers.values() if r.alighted_at]
        not_alighted = self.get_not_alighted()

        passengers = []
        for name, rec in self._passengers.items():
            passengers.append({
                "name": name,
                "status": rec.status.value,
                "boarded_at": rec.boarded_at.isoformat() if rec.boarded_at else None,
                "alighted_at": rec.alighted_at.isoformat() if rec.alighted_at else None,
            })

        return {
            "mode": self._mode.value,
            "total_boarded": len(boarded),
            "total_alighted": len(alighted),
            "not_alighted_count": len(not_alighted),
            "not_alighted_names": [r.name for r in not_alighted],
            "all_alighted": self.is_all_alighted(),
            "passengers": passengers,
        }

    def reset(self) -> None:
        """전체 상태 초기화 (데모 리셋용)."""
        self._passengers.clear()
        self._mode = BoardingMode.IDLE
        logger.info("[Boarding] 상태 초기화")

    def _emit_event(self, event_type: str, data: dict) -> None:
        """이벤트 콜백 호출."""
        if self._on_event:
            try:
                self._on_event(event_type, data)
            except Exception as e:
                logger.error("[Boarding] 이벤트 콜백 오류: %s", e)
