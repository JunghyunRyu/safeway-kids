"""C-14 UI Demo Seed.

UI 흐름 전용:
  - owner / walker / admin 생성
  - walker 자격 + 승인 + 가용시간 등록
  - owner pet 등록
  - **booking, walk 시작은 시드하지 않음** (사용자가 UI에서 직접 진행)

출력:
  - OWNER_TOKEN, OWNER_PHONE, WALKER_ID, PET_ID, WALKER_TOKEN
  - 사용자가 ① 토큰을 브라우저 SecureStore/localStorage에 주입
            ② SearchScreen → WalkerProfile → 예약 → 실시간 추적까지 UI로 진행

동행 GPS 시뮬레이션:
  walker가 산책을 시작한 뒤 별도 스크립트(`c14_gps_loop.py session_id walker_token`)로
  GPS를 5초 간격으로 송신.
"""

import json
import sys
import time
import urllib.error
import urllib.request

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

    print("[1] login owner / walker / admin")
    owner = dev_login(owner_phone, "데모오너", "pet_owner")
    walker = dev_login(walker_phone, "친절한김산책", "walker")
    admin = dev_login(admin_phone, "관리자", "platform_admin", app_context="safeway_kids")

    owner_tok = owner["access_token"]
    walker_tok = walker["access_token"]
    admin_tok = admin["access_token"]
    walker_id = walker["user"]["id"]

    print("[2] walker qualification + approve + availability")
    post(
        "/pt/walkers/qualification",
        {
            "background_check_doc_url": "https://example/bg.pdf",
            "certification_type": "동물보건사",
            "certification_doc_url": "https://example/cert.jpg",
            "experience_years": 5,
            # 브라우저 geolocation(37.647, 126.927)과 서울 시청 양쪽 모두 cover
            "service_areas": [
                {"lat": 37.647, "lon": 126.927, "radius_km": 5},
                {"lat": 37.5665, "lon": 126.978, "radius_km": 5},
            ],
            "bio": "5년 경력의 친절한 산책 도우미입니다 🐾",
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

    print("[3] owner pet 등록")
    pet = post(
        "/pt/pets",
        {
            "name": "코코",
            "species": "dog",
            "breed": "말티즈",
            "weight_kg": 4.5,
            "temperament": "calm",
            "vaccination_status": "complete",
            "medical_notes": None,
        },
        token=owner_tok,
    )
    pet_id = pet["id"]

    print("\n=== READY FOR UI DEMO ===")
    print(f"OWNER_PHONE  : {owner_phone}")
    print(f"OWNER_NAME   : 데모오너")
    print(f"WALKER_NAME  : 친절한김산책 (lat 37.5665, lng 126.978, today available 09~21시)")
    print(f"PET_NAME     : 코코")
    print(f"WALKER_ID    : {walker_id}")
    print(f"WALKER_TOKEN : {walker_tok}")
    print(f"\nOWNER_TOKEN  :\n{owner_tok}")
    print(f"\nPET_ID       : {pet_id}")
    print()
    print("브라우저 콘솔에서 다음 코드 실행 (web preview에서 토큰 주입):")
    print(f"  localStorage.setItem('access_token', '{owner_tok}');")
    print(f"  location.reload();")


if __name__ == "__main__":
    main()
