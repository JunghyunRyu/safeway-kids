"""GPS validation unit tests — speed check, accuracy check, geofence."""

from datetime import datetime, timedelta

import pytest

from app.core.gps_validation import (
    MAX_WALK_SPEED_MS,
    haversine_m,
    validate_gps_accuracy,
    validate_gps_speed,
)


class TestHaversine:
    def test_same_point(self) -> None:
        assert haversine_m(37.5665, 126.978, 37.5665, 126.978) == 0.0

    def test_known_distance(self) -> None:
        # Seoul City Hall to Gangnam Station ≈ 8.5km
        dist = haversine_m(37.5665, 126.978, 37.4979, 127.0276)
        assert 8000 < dist < 9000

    def test_short_distance(self) -> None:
        # ~100m offset
        dist = haversine_m(37.5665, 126.978, 37.5674, 126.978)
        assert 90 < dist < 110


class TestGpsSpeedValidation:
    def test_normal_walking_speed(self) -> None:
        """Normal walking: ~1.5 m/s (5.4 km/h) — should pass."""
        t1 = datetime(2026, 4, 3, 10, 0, 0)
        t2 = t1 + timedelta(seconds=60)
        # 90m in 60s = 1.5 m/s
        is_valid, speed = validate_gps_speed(37.5665, 126.978, t1, 37.56731, 126.978, t2)
        assert is_valid is True
        assert speed < MAX_WALK_SPEED_MS

    def test_teleportation_rejected(self) -> None:
        """Impossible speed: 10km in 5s = 2000 m/s — should fail."""
        t1 = datetime(2026, 4, 3, 10, 0, 0)
        t2 = t1 + timedelta(seconds=5)
        # Seoul to Suwon in 5 seconds
        is_valid, speed = validate_gps_speed(37.5665, 126.978, t1, 37.2636, 127.0286, t2)
        assert is_valid is False
        assert speed > 1000  # way over limit

    def test_stationary(self) -> None:
        """Not moving — should pass."""
        t1 = datetime(2026, 4, 3, 10, 0, 0)
        t2 = t1 + timedelta(seconds=30)
        is_valid, speed = validate_gps_speed(37.5665, 126.978, t1, 37.5665, 126.978, t2)
        assert is_valid is True
        assert speed == 0.0

    def test_zero_time_delta(self) -> None:
        """Same timestamp — should pass (avoid division by zero)."""
        t = datetime(2026, 4, 3, 10, 0, 0)
        is_valid, speed = validate_gps_speed(37.5665, 126.978, t, 37.5674, 126.978, t)
        assert is_valid is True

    def test_running_pace_accepted(self) -> None:
        """Fast running: ~4 m/s (14.4 km/h) — just under limit."""
        t1 = datetime(2026, 4, 3, 10, 0, 0)
        t2 = t1 + timedelta(seconds=60)
        # ~240m in 60s = 4 m/s
        is_valid, speed = validate_gps_speed(37.5665, 126.978, t1, 37.5687, 126.978, t2)
        assert is_valid is True


class TestGpsAccuracyValidation:
    def test_good_accuracy(self) -> None:
        assert validate_gps_accuracy(10.0) is True

    def test_borderline_accuracy(self) -> None:
        assert validate_gps_accuracy(100.0) is True

    def test_bad_accuracy(self) -> None:
        assert validate_gps_accuracy(150.0) is False

    def test_none_accuracy(self) -> None:
        """No accuracy data — accept (can't validate)."""
        assert validate_gps_accuracy(None) is True

    def test_geofence_50m(self) -> None:
        """CareConnect uses 50m threshold."""
        assert validate_gps_accuracy(30.0, threshold=50.0) is True
        assert validate_gps_accuracy(60.0, threshold=50.0) is False


class TestGeofenceCheckin:
    def test_within_200m(self) -> None:
        """Point 100m from target — should be within geofence."""
        dist = haversine_m(37.5665, 126.978, 37.5674, 126.978)
        assert dist < 200

    def test_outside_200m(self) -> None:
        """Point 500m from target — should be outside geofence."""
        dist = haversine_m(37.5665, 126.978, 37.5710, 126.978)
        assert dist > 200

    def test_exact_boundary(self) -> None:
        """Test near the 200m boundary."""
        # ~200m north
        dist = haversine_m(37.5665, 126.978, 37.5683, 126.978)
        # Should be roughly 200m
        assert 150 < dist < 250
