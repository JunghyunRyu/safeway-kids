"""C-14 Full Demo bootstrap.

  1. owner / walker / admin 생성
  2. walker 자격 + 승인 + 가용시간
  3. owner pet
  4. booking + walker accept + start_walk → session_id
  5. 출력: OWNER_TOKEN, WALKER_TOKEN, SESSION_ID, GPS loop 명령

사용자가 폰에서 OWNER_TOKEN을 paste 화면에 붙여넣은 후 GPS loop를 별도 터미널에서 실행.
"""

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

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
        print(f"[ERR] POST {path} → {e.code} {e.read().decode()}")
        raise


def dev_login(phone: str, name: str, role: str, app_context: str | None = None) -> dict:
    body = {"phone": phone, "code": "000000", "name": name, "role": role}
    if app_context:
        body["app_context"] = app_context
    return post("/auth/dev-login", body)


def main() -> None:
    rand = str(int(time.time()))[-5:]
    owner_phone = f"01011{rand}"
    walker_phone = f"01022{rand}"
    admin_phone = f"01099{rand}"

    print("[1/5] login owner / walker / admin")
    owner = dev_login(owner_phone, "데모오너", "pet_owner")
    walker = dev_login(walker_phone, "친절한김산책", "walker")
    admin = dev_login(admin_phone, "관리자", "platform_admin", app_context="safeway_kids")
    owner_tok = owner["access_token"]
    walker_tok = walker["access_token"]
    walker_id = walker["user"]["id"]

    print("[2/5] walker qualification + approve + availability")
    post(
        "/pt/walkers/qualification",
        {
            "background_check_doc_url": "https://example/bg.pdf",
            "certification_type": "동물보건사",
            "certification_doc_url": "https://example/cert.jpg",
            "experience_years": 5,
            "service_areas": [
                {"lat": 37.5665, "lon": 126.978, "radius_km": 5},
                {"lat": 37.647, "lon": 126.927, "radius_km": 5},
            ],
            "bio": "5년 경력의 친절한 산책 도우미입니다 🐾",
        },
        token=walker_tok,
    )
    post(f"/pt/admin/walkers/{walker_id}/approve?approve=true", {}, token=admin["access_token"])
    from datetime import date as _date
    today = _date.today().isoformat()
    post(
        "/pt/walkers/availability",
        {"available_date": today, "start_time": "09:00:00", "end_time": "21:00:00"},
        token=walker_tok,
    )

    print("[3/5] owner pet")
    pet = post(
        "/pt/pets",
        {"name": "코코", "species": "dog", "breed": "말티즈", "weight_kg": 4.5,
         "temperament": "calm", "vaccination_status": "complete"},
        token=owner_tok,
    )

    print("[4/5] booking + walker accept + start walk")
    booking = post(
        "/pt/bookings",
        {
            "walker_id": walker_id,
            "pet_id": pet["id"],
            "service_type": "walk",
            "duration_minutes": 30,
            "scheduled_at": datetime.now(timezone.utc).isoformat(),
            "pickup_latitude": 37.5665,
            "pickup_longitude": 126.978,
            "pickup_address": "서울 종로구 광화문로 1",
            "price": 15000,
        },
        token=owner_tok,
    )
    booking_id = booking["id"]
    post(f"/pt/bookings/{booking_id}/accept", {}, token=walker_tok)
    started = post(f"/pt/walks/{booking_id}/start", {}, token=walker_tok)
    session_id = started["session_id"]

    print("[5/5] DONE\n")
    print("=" * 70)
    print("📱 폰 화면 (DevTokenPasteScreen)에 아래 OWNER_TOKEN 붙여넣기:")
    print("=" * 70)
    print(owner_tok)
    print()
    print("=" * 70)
    print("🛰️  토큰 저장 완료 후, 별도 터미널에서 GPS 시뮬레이터 실행:")
    print("=" * 70)
    print(f"cd /c/jhryu/01_project/safeway_kids/backend")
    print(f".venv/Scripts/python.exe scripts/c14_gps_loop.py {session_id} {walker_tok} 30 3")
    print()
    print("폰에서: 홈 → 예약 탭 → '산책 중' 카드 → 실시간 추적 → LIVE 배지 확인")


if __name__ == "__main__":
    main()
