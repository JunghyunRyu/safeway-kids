"""
SAFEWAY KIDS — GPS Replay Simulation Tool
Simulates vehicle GPS broadcasts for testing the real-time pipeline.
Usage: python scripts/gps_replay.py [--vehicles N] [--interval SECONDS] [--api-url URL]
"""

import argparse
import asyncio
import json
import random
import sys
from pathlib import Path

import httpx

ROUTES_FILE = Path(__file__).parent / "sample_routes.json"
DEFAULT_API_URL = "http://localhost:8000"


async def get_vehicle_ids_and_token(api_url: str) -> tuple[list[str], str]:
    """Get vehicle IDs from the database and a driver token for auth."""
    async with httpx.AsyncClient(base_url=api_url) as client:
        # Login as a driver via OTP
        # First send OTP
        await client.post("/api/v1/auth/otp/send", json={"phone": "01087654321"})

        # For dev mode, we need to get the OTP from logs or use a known driver phone
        # In dev mode, let's use a shortcut — directly fetch vehicles
        # We'll create a simple admin endpoint or use the existing auth flow

        # Get a driver token — use first driver phone from seed data
        # In dev, OTP is printed to console. We'll use the API differently.
        print("⚠️  Getting auth token... (using dev OTP flow)")

        # Send OTP to the admin phone
        phone = "01000000000"
        await client.post("/api/v1/auth/otp/send", json={"phone": phone})

        # In dev mode, OTP is stored in memory. We can't easily retrieve it here.
        # So let's use a direct approach: import the service to get the OTP
        from app.modules.auth.service import _otp_store

        code = _otp_store.get(phone, "000000")

        resp = await client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": phone, "code": code, "name": "시스템관리자", "role": "platform_admin"},
        )
        if resp.status_code != 200:
            print(f"❌ Auth failed: {resp.text}")
            sys.exit(1)

        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get vehicles
        vehicles_resp = await client.get("/api/v1/telemetry/vehicles", headers=headers)
        if vehicles_resp.status_code != 200:
            print(f"❌ Failed to get vehicles: {vehicles_resp.text}")
            sys.exit(1)

        vehicle_ids = [v["id"] for v in vehicles_resp.json()]
        return vehicle_ids, token


async def replay_vehicle(
    api_url: str,
    vehicle_id: str,
    route: list[list[float]],
    token: str,
    interval: float,
    vehicle_num: int,
) -> None:
    """Replay a single vehicle's GPS route."""
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url=api_url) as client:
        print(f"  🚐 Vehicle {vehicle_num} ({vehicle_id[:8]}...): {len(route)} waypoints")
        for i, (lat, lng) in enumerate(route):
            # Add small random jitter for realism
            lat += random.uniform(-0.0001, 0.0001)
            lng += random.uniform(-0.0001, 0.0001)
            heading = random.uniform(0, 360)
            speed = random.uniform(15, 45)

            resp = await client.post(
                "/api/v1/telemetry/gps",
                json={
                    "vehicle_id": vehicle_id,
                    "latitude": lat,
                    "longitude": lng,
                    "heading": heading,
                    "speed": speed,
                },
                headers=headers,
            )

            status = "✓" if resp.status_code == 200 else f"✗ {resp.status_code}"
            print(
                f"    [{i + 1}/{len(route)}] lat={lat:.4f} lng={lng:.4f} "
                f"speed={speed:.0f}km/h → {status}"
            )
            await asyncio.sleep(interval)


async def main(num_vehicles: int, interval: float, api_url: str) -> None:
    # Load routes
    with open(ROUTES_FILE) as f:
        data = json.load(f)

    route_names = list(data["routes"].keys())
    routes = list(data["routes"].values())

    print(f"🔄 GPS Replay — {num_vehicles} vehicles, {interval}s interval")
    print(f"   API: {api_url}")
    print(f"   Routes: {', '.join(route_names)}")
    print()

    # Get vehicle IDs from the API
    vehicle_ids, token = await get_vehicle_ids_and_token(api_url)

    if not vehicle_ids:
        print("❌ No vehicles found. Run seed.py first.")
        return

    num_vehicles = min(num_vehicles, len(vehicle_ids))
    print(f"   Found {len(vehicle_ids)} vehicles, replaying {num_vehicles}")
    print()

    # Launch concurrent replays
    tasks = []
    for i in range(num_vehicles):
        route = routes[i % len(routes)]
        tasks.append(
            replay_vehicle(
                api_url, vehicle_ids[i], route, token, interval, i + 1
            )
        )

    await asyncio.gather(*tasks)
    print("\n✅ GPS replay complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SAFEWAY KIDS GPS Replay Tool")
    parser.add_argument("--vehicles", type=int, default=3, help="Number of vehicles to simulate")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between GPS pings")
    parser.add_argument("--api-url", type=str, default=DEFAULT_API_URL, help="Backend API URL")
    args = parser.parse_args()

    asyncio.run(main(args.vehicles, args.interval, args.api_url))
