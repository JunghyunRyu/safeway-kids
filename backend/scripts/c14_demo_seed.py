"""C-14 Manual Demo Seed + GPS Simulator.

흐름:
  1. owner / walker / admin dev-login으로 토큰 획득
  2. walker 자격 제출 → admin 승인
  3. owner pet 등록 → booking → walker accept → walker walk start
  4. 5초 간격으로 N개 GPS 송신 (POST /pt/walks/{sid}/gps)
  5. session_id + owner access_token 출력 → 사용자가 LiveTrackScreen에서 관찰

전제: backend가 http://localhost:8000 에서 실행 중, environment=development.
"""

import asyncio
import json
import sys
import time
import urllib.error
import urllib.request
import uuid

API = "http://localhost:8000/api/v1"


def post(path: str, body: dict, token: str | None = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode(),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        print(f"[ERR] POST {path} → {e.code} {msg}")
        raise


def dev_login(phone: str, name: str, role: str, app_context: str | None = None) -> dict:
    body = {
        "phone": phone,
        "code": "000000",
        "name": name,
        "role": role,
    }
    if app_context:
        body["app_context"] = app_context
    return post("/auth/dev-login", body)


def main(num_points: int = 12, interval_sec: float = 3.0) -> None:
    print("=== C-14 Demo Seed ===")

    # 1. Login (3 users)
    # phone format: ^01[0-9]{8,9}$ → 010 + 8 digits (total 11 chars)
    # PT_OWNER_PHONE/PT_WALKER_PHONE/PT_ADMIN_PHONE env vars override the random
    # defaults — useful when seeding for the PT app's hardcoded dev-login phone.
    import os as _os
    rand = str(int(time.time()))[-5:]
    owner_phone = _os.environ.get("PT_OWNER_PHONE", f"01011{rand}")
    walker_phone = _os.environ.get("PT_WALKER_PHONE", f"01022{rand}")
    admin_phone = _os.environ.get("PT_ADMIN_PHONE", f"01099{rand}")

    print("[1] dev-login owner / walker / admin")
    owner = dev_login(owner_phone, "데모오너", "pet_owner")
    walker = dev_login(walker_phone, "데모워커", "walker")
    admin = dev_login(admin_phone, "데모관리자", "platform_admin", app_context="safeway_kids")
    owner_tok = owner["access_token"]
    walker_tok = walker["access_token"]
    admin_tok = admin["access_token"]
    walker_id = walker["user"]["id"]
    print(f"     owner_id={owner['user']['id'][:8]} walker_id={walker_id[:8]}")

    # 2. Walker qualification + admin approve + availability for today
    print("[2] walker qualification + admin approve + availability")
    post(
        "/pt/walkers/qualification",
        {
            "background_check_doc_url": "https://example/bg.pdf",
            "certification_type": "동물보건사",
            "certification_doc_url": "https://example/cert.jpg",
            "experience_years": 3,
            "service_areas": [{"lat": 37.5665, "lon": 126.978, "radius_km": 5}],
            "bio": "데모용 친절한 워커입니다 🐾",
        },
        token=walker_tok,
    )
    post(f"/pt/admin/walkers/{walker_id}/approve?approve=true", {}, token=admin_tok)
    from datetime import date as _date
    today = _date.today().isoformat()
    post(
        "/pt/walkers/availability",
        {
            "available_date": today,
            "start_time": "09:00:00",
            "end_time": "21:00:00",
        },
        token=walker_tok,
    )

    # 3. Owner pet + booking
    print("[3] pet + booking")
    pet = post(
        "/pt/pets",
        {
            "name": "데모코코",
            "species": "dog",
            "breed": "말티즈",
            "weight_kg": 4.5,
            "temperament": "calm",
            "vaccination_status": "complete",
        },
        token=owner_tok,
    )
    pet_id = pet["id"]
    from datetime import datetime, timezone
    scheduled = datetime.now(timezone.utc).isoformat()
    booking = post(
        "/pt/bookings",
        {
            "walker_id": walker_id,
            "pet_id": pet_id,
            "service_type": "walk",
            "duration_minutes": 30,
            "scheduled_at": scheduled,
            "pickup_latitude": 37.5665,
            "pickup_longitude": 126.9780,
            "pickup_address": "서울 중구",
            "price": 15000,
        },
        token=owner_tok,
    )
    booking_id = booking["id"]
    print(f"     booking_id={booking_id[:8]}")

    # 4. Walker accepts + start walk
    print("[4] walker accept + start walk")
    post(f"/pt/bookings/{booking_id}/accept", {}, token=walker_tok)
    started = post(f"/pt/walks/{booking_id}/start", {}, token=walker_tok)
    session_id = started["session_id"]
    print(f"     session_id={session_id}")

    # 5. Print observation info
    print("\n=== HUMAN ACTION REQUIRED ===")
    print(f"OWNER ACCESS TOKEN (set in PT mobile localStorage / SecureStore):")
    print(owner_tok)
    print(f"\nWALKER ACCESS TOKEN (for live GPS streaming to this session):")
    print(walker_tok)
    print(f"\nSESSION ID for LiveTrackScreen:")
    print(session_id)
    print(f"\nOpen Web preview: http://localhost:8081 → login as owner → navigate to")
    print(f"  LiveTrackScreen with route.params.sessionId = {session_id}")
    print(f"\nOR observe Redis publish in VM:")
    print(f"  redis-cli SUBSCRIBE pt:walk:{session_id}:updates")

    # 6. Send N GPS points
    print(f"\n=== GPS Simulator: sending {num_points} points every {interval_sec}s ===")
    base_lat, base_lng = 37.5665, 126.9780
    for i in range(num_points):
        lat = base_lat + i * 0.0003
        lng = base_lng + i * 0.0002
        post(
            f"/pt/walks/{session_id}/gps",
            {
                "latitude": lat,
                "longitude": lng,
                "heading": 90.0,
                "speed": 1.4,
                "accuracy": 5.0,
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            },
            token=walker_tok,
        )
        print(f"  [{i + 1:2}/{num_points}] sent ({lat:.4f}, {lng:.4f})")
        if i < num_points - 1:
            time.sleep(interval_sec)

    # 7. End walk (skipped when PT_KEEP_WALK_OPEN=1 so the LiveTrack demo can show
    #    a booking with status=in_progress and live GPS trail).
    if _os.environ.get("PT_KEEP_WALK_OPEN") == "1":
        print(f"\n[7] walk LEFT IN_PROGRESS (PT_KEEP_WALK_OPEN=1) session_id={session_id}")
    else:
        end = post(f"/pt/walks/{session_id}/end", {}, token=walker_tok)
        print(f"\n[7] walk end: distance={end.get('distance_meters')}m")
    print("\n=== DONE ===")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    iv = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
    main(n, iv)
