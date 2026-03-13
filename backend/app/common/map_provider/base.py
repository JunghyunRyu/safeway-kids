from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import timedelta


@dataclass
class GeoPoint:
    latitude: float
    longitude: float


@dataclass
class RouteInfo:
    distance_km: float
    duration: timedelta
    polyline: list[GeoPoint] | None = None


class MapProvider(ABC):
    @abstractmethod
    async def geocode(self, address: str) -> GeoPoint | None:
        """Convert address to coordinates."""
        ...

    @abstractmethod
    async def reverse_geocode(self, point: GeoPoint) -> str | None:
        """Convert coordinates to address."""
        ...

    @abstractmethod
    async def get_route(
        self,
        origin: GeoPoint,
        destination: GeoPoint,
        waypoints: list[GeoPoint] | None = None,
    ) -> RouteInfo | None:
        """Calculate route between points."""
        ...

    @abstractmethod
    async def get_eta(self, origin: GeoPoint, destination: GeoPoint) -> timedelta | None:
        """Get estimated time of arrival."""
        ...
