"""Distance matrix builder using MapProvider (Kakao Mobility API).

Builds a distance/time matrix for all stop pairs + depot.
Falls back to Euclidean distance if API is unavailable or API key is empty.
Caches results in Redis with 24h TTL.
"""

import hashlib
import json
import logging

from redis.asyncio import Redis

from app.common.map_provider.base import GeoPoint, MapProvider
from app.config import settings
from app.modules.routing_engine.solver import (
    AVERAGE_SPEED_KMH,
    Depot,
    Stop,
    _euclidean_distance_km,
)

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 86400  # 24 hours


def _cache_key(nodes: list[tuple[float, float]]) -> str:
    """Generate deterministic cache key from sorted node coordinates."""
    coords_str = "|".join(f"{lat:.6f},{lng:.6f}" for lat, lng in nodes)
    return f"distance_matrix:{hashlib.md5(coords_str.encode()).hexdigest()}"


async def build_road_distance_matrix(
    depot: Depot,
    stops: list[Stop],
    map_provider: MapProvider,
    redis: Redis | None = None,  # type: ignore[type-arg]
) -> tuple[list[list[int]], list[list[int]]]:
    """Build road distance and time matrices using MapProvider.

    Returns:
        (distance_matrix, time_matrix) — both as integer matrices.
        distance_matrix values are in meters.
        time_matrix values are in minutes.

    Falls back to Euclidean if:
    - Kakao API key is not configured
    - Any API call fails
    """
    nodes: list[tuple[float, float]] = [(depot.latitude, depot.longitude)]
    for s in stops:
        nodes.append((s.latitude, s.longitude))

    n = len(nodes)

    # Check cache first
    if redis:
        cache_key = _cache_key(nodes)
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            logger.info("Distance matrix cache hit (%d nodes)", n)
            return data["distance"], data["time"]

    # Check if API key is configured
    if not settings.kakao_maps_api_key:
        logger.info("No Kakao API key, falling back to Euclidean distance")
        return _euclidean_matrices(nodes)

    # Build matrix via API calls
    distance_matrix: list[list[int]] = [[0] * n for _ in range(n)]
    time_matrix: list[list[int]] = [[0] * n for _ in range(n)]

    api_failures = 0
    for i in range(n):
        for j in range(n):
            if i == j:
                continue

            origin = GeoPoint(latitude=nodes[i][0], longitude=nodes[i][1])
            dest = GeoPoint(latitude=nodes[j][0], longitude=nodes[j][1])

            try:
                route_info = await map_provider.get_route(origin, dest)
                if route_info:
                    distance_matrix[i][j] = int(route_info.distance_km * 1000)
                    time_matrix[i][j] = max(
                        int(route_info.duration.total_seconds() / 60), 1
                    )
                else:
                    # API returned no route — use Euclidean fallback for this pair
                    dist_km = _euclidean_distance_km(
                        nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1]
                    )
                    distance_matrix[i][j] = int(dist_km * 1000)
                    time_matrix[i][j] = max(
                        int((dist_km / AVERAGE_SPEED_KMH) * 60), 1
                    )
                    api_failures += 1
            except Exception:
                # Fallback to Euclidean for this pair
                dist_km = _euclidean_distance_km(
                    nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1]
                )
                distance_matrix[i][j] = int(dist_km * 1000)
                time_matrix[i][j] = max(
                    int((dist_km / AVERAGE_SPEED_KMH) * 60), 1
                )
                api_failures += 1

    if api_failures > 0:
        logger.warning(
            "Distance matrix: %d/%d pairs fell back to Euclidean",
            api_failures, n * (n - 1),
        )

    # Cache result
    if redis:
        cache_data = json.dumps(
            {"distance": distance_matrix, "time": time_matrix}
        )
        await redis.set(cache_key, cache_data, ex=CACHE_TTL_SECONDS)
        logger.info("Distance matrix cached (%d nodes)", n)

    return distance_matrix, time_matrix


def _euclidean_matrices(
    nodes: list[tuple[float, float]],
) -> tuple[list[list[int]], list[list[int]]]:
    """Build Euclidean distance and time matrices as fallback."""
    n = len(nodes)
    distance_matrix: list[list[int]] = [[0] * n for _ in range(n)]
    time_matrix: list[list[int]] = [[0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            dist_km = _euclidean_distance_km(
                nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1]
            )
            distance_matrix[i][j] = int(dist_km * 1000)  # meters
            time_matrix[i][j] = max(
                int((dist_km / AVERAGE_SPEED_KMH) * 60), 1
            )  # minutes

    return distance_matrix, time_matrix
