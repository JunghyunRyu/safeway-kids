"""GPS validation utilities — speed/accuracy sanity checks for anti-spoofing."""

import math
from datetime import datetime


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two GPS coordinates."""
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Maximum plausible speed for a walking person (km/h → m/s)
MAX_WALK_SPEED_MS = 15 * 1000 / 3600  # 15 km/h ≈ 4.2 m/s (running pace)
MAX_VEHICLE_SPEED_MS = 200 * 1000 / 3600  # 200 km/h for general use

# Minimum GPS accuracy to accept (meters)
MIN_GPS_ACCURACY_M = 100


def validate_gps_speed(
    prev_lat: float, prev_lon: float, prev_time: datetime,
    curr_lat: float, curr_lon: float, curr_time: datetime,
    max_speed_ms: float = MAX_WALK_SPEED_MS,
) -> tuple[bool, float]:
    """Check if movement between two GPS points is plausible.

    Returns (is_valid, speed_ms).
    If time delta is 0, returns (True, 0) to avoid division by zero.
    """
    dt_seconds = abs((curr_time - prev_time).total_seconds())
    if dt_seconds < 1:
        return True, 0.0

    distance_m = haversine_m(prev_lat, prev_lon, curr_lat, curr_lon)
    speed_ms = distance_m / dt_seconds

    return speed_ms <= max_speed_ms, speed_ms


def validate_gps_accuracy(accuracy: float | None, threshold: float = MIN_GPS_ACCURACY_M) -> bool:
    """Check if GPS accuracy is within acceptable threshold."""
    if accuracy is None:
        return True  # No accuracy data — accept (can't validate)
    return accuracy <= threshold
