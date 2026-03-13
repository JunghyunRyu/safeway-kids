from datetime import timedelta

import httpx

from app.common.map_provider.base import GeoPoint, MapProvider, RouteInfo
from app.config import settings


class KakaoMapsProvider(MapProvider):
    """Kakao Maps API provider for Korean addresses and routing."""

    BASE_URL = "https://dapi.kakao.com/v2"
    MOBILITY_URL = "https://apis-navi.kakaomobility.com/v1"

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"KakaoAK {settings.kakao_maps_api_key}"}

    async def geocode(self, address: str) -> GeoPoint | None:
        url = f"{self.BASE_URL}/local/search/address.json"
        params = {"query": address}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
                documents = data.get("documents", [])
                if documents:
                    doc = documents[0]
                    return GeoPoint(
                        latitude=float(doc["y"]),
                        longitude=float(doc["x"]),
                    )
                return None
        except Exception:
            return None

    async def reverse_geocode(self, point: GeoPoint) -> str | None:
        url = f"{self.BASE_URL}/local/geo/coord2address.json"
        params = {"x": str(point.longitude), "y": str(point.latitude)}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
                documents = data.get("documents", [])
                if documents:
                    return documents[0].get("address", {}).get("address_name")
                return None
        except Exception:
            return None

    async def get_route(
        self,
        origin: GeoPoint,
        destination: GeoPoint,
        waypoints: list[GeoPoint] | None = None,
    ) -> RouteInfo | None:
        url = f"{self.MOBILITY_URL}/directions"
        params = {
            "origin": f"{origin.longitude},{origin.latitude}",
            "destination": f"{destination.longitude},{destination.latitude}",
        }
        if waypoints:
            wp_str = "|".join(f"{wp.longitude},{wp.latitude}" for wp in waypoints)
            params["waypoints"] = wp_str

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
                routes = data.get("routes", [])
                if routes:
                    route = routes[0]
                    summary = route.get("summary", {})
                    return RouteInfo(
                        distance_km=summary.get("distance", 0) / 1000,
                        duration=timedelta(seconds=summary.get("duration", 0)),
                    )
                return None
        except Exception:
            return None

    async def get_eta(self, origin: GeoPoint, destination: GeoPoint) -> timedelta | None:
        route = await self.get_route(origin, destination)
        if route:
            return route.duration
        return None
