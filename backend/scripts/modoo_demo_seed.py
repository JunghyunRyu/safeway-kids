r"""모두의 창업 2026 신청서 캡처용 PT 시드 데이터.

c14_demo_seed.py를 확장하여 다중 시나리오를 생성한다:
  - 보호자 3명 (김지원 / 박서연 / 이태민)
  - 산책 메이트 3명 (정유진 / 최민호 / 강수아)
  - 강아지 5마리 (콩이·호두·보리·두부·까미)
  - 예약 6건 (활성 1 / 확정 2 / 완료 3) — 마포·용산 beachhead 정합

LiveTrackScreen 캡처용:
  - 첫 번째 시나리오 (콩이 + 정유진, 마포구 홍대~망원) 활성 산책 + GPS 12점 5초 간격 송신
  - lunenlabs.com/pet 사이트 placeholder(콩이/포메라니안 4세/마포구)와 정합

전제: backend가 http://localhost:8000 에서 실행 중, environment=development.

사용:
```
    cd backend
    .\.venv\Scripts\Activate.ps1
    python scripts/modoo_demo_seed.py
```
"""

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone

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
        print(f"[ERR] POST {path} -> {e.code} {msg}")
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


# ── 시나리오 데이터 ────────────────────────────────────────────────

OWNERS = [
    # (phone_suffix, name, district)
    ("11001", "김지원", "마포구"),
    ("11002", "박서연", "용산구"),
    ("11003", "이태민", "마포구"),
]

WALKERS = [
    # (phone_suffix, name, exp_years, bio)
    (
        "22001",
        "정유진",
        3,
        "강아지와 함께한 3년 — 시바견·말티즈·푸들 단골 위주 산책 경험. 천천히 걷는 산책을 선호하며 어린 강아지도 안정적으로 케어합니다.",
    ),
    (
        "22002",
        "최민호",
        1,
        "운동 좋아하는 활발한 강아지와 함께 빠르게 걷거나 가볍게 뛰는 산책을 즐겨요. 한강공원·용산공원 코스를 자주 다닙니다.",
    ),
    (
        "22003",
        "강수아",
        5,
        "5년차 베테랑 산책 메이트. 어린 강아지·시니어견·예민한 친구까지 모두 안정적으로 케어해 드려요. 동물보건사 자격 보유.",
    ),
]

# Pet 정보: (owner_idx, name, breed, birth_offset_years, weight_kg, temperament, vaccination_status)
PETS = [
    # 사이트 placeholder 정합: 콩이 / 포메라니안 / 4세 / 마포구 김지원 보호자
    (0, "콩이", "포메라니안", 4, 3.2, "calm", "complete"),
    (1, "호두", "비숑 프리제", 3, 5.1, "active", "complete"),
    (2, "보리", "시바견", 5, 9.8, "calm", "complete"),
    (0, "두부", "말티즈", 2, 3.5, "anxious", "complete"),
    (1, "까미", "토이 푸들", 6, 4.2, "calm", "complete"),
]

# 산책 GPS 좌표 (실제 마포·용산 도로 따라 자연스러운 polyline)
# 시나리오 1: 마포구 홍대입구 → 망원역 (활성 시연용 — 콩이 + 정유진)
HONGDAE_TO_MANGWON = [
    (37.5563, 126.9237),  # 홍대입구역 9번 출구
    (37.5570, 126.9221),
    (37.5582, 126.9210),
    (37.5598, 126.9195),
    (37.5612, 126.9187),
    (37.5624, 126.9176),
    (37.5631, 126.9162),
    (37.5640, 126.9151),
    (37.5648, 126.9138),
    (37.5655, 126.9124),
    (37.5663, 126.9112),
    (37.5670, 126.9100),  # 망원역 부근
]
# 시나리오 2: 용산구 이태원 → 용산공원 (확정 18:00 — 호두 + 최민호)
ITAEWON_TO_YONGSAN_PARK = [
    (37.5347, 126.9938),  # 이태원역
    (37.5358, 126.9925),
    (37.5371, 126.9910),
    (37.5384, 126.9897),
    (37.5396, 126.9885),
]
# 시나리오 3: 마포구 한강공원 (확정 19:30 — 보리 + 강수아)
HANGANG_PARK_MAPO = [
    (37.5453, 126.9320),  # 망원한강공원
    (37.5460, 126.9305),
    (37.5466, 126.9290),
    (37.5472, 126.9276),
]


def setup_users() -> tuple[list[dict], list[dict], dict]:
    """3 owners + 3 walkers + 1 admin dev-login."""
    print("[1/7] dev-login 시작 — 보호자 3 / 산책 메이트 3 / 관리자 1")
    rand_suffix = str(int(time.time()))[-3:]

    owners = []
    for phone_suffix, name, district in OWNERS:
        phone = f"010{phone_suffix}{rand_suffix}"
        # phone format: ^01[0-9]{8,9}$ (11 chars total)
        phone = phone[:11]
        result = dev_login(phone, name, "pet_owner")
        result["district"] = district
        owners.append(result)
        print(f"  보호자 {name} ({district}) -> id={result['user']['id'][:8]}")

    walkers = []
    for phone_suffix, name, exp_years, bio in WALKERS:
        phone = f"010{phone_suffix}{rand_suffix}"[:11]
        result = dev_login(phone, name, "walker")
        result["bio"] = bio
        result["exp_years"] = exp_years
        walkers.append(result)
        print(f"  산책 메이트 {name} ({exp_years}년차) -> id={result['user']['id'][:8]}")

    admin_phone = f"01099000{rand_suffix}"[:11]
    admin = dev_login(admin_phone, "관리자", "platform_admin", app_context="safeway_kids")
    print(f"  관리자 -> id={admin['user']['id'][:8]}")
    return owners, walkers, admin


def setup_walkers(walkers: list[dict], admin_token: str) -> None:
    """워커 자격 제출 + 관리자 승인 + 오늘 가용 시간 등록."""
    print("\n[2/7] 산책 메이트 자격 제출 + 관리자 승인")
    today = date.today().isoformat()
    for w in walkers:
        post(
            "/pt/walkers/qualification",
            {
                "background_check_doc_url": "https://example.com/bg.pdf",
                "certification_type": "동물보건사" if w["exp_years"] >= 3 else "반려동물행동상담사",
                "certification_doc_url": "https://example.com/cert.jpg",
                "experience_years": w["exp_years"],
                "service_areas": [{"lat": 37.5563, "lon": 126.9237, "radius_km": 5}],
                "bio": w["bio"],
            },
            token=w["access_token"],
        )
        post(
            f"/pt/admin/walkers/{w['user']['id']}/approve?approve=true",
            {},
            token=admin_token,
        )
        post(
            "/pt/walkers/availability",
            {
                "available_date": today,
                "start_time": "09:00:00",
                "end_time": "21:00:00",
            },
            token=w["access_token"],
        )
        print(f"  {w['user']['name']} 승인 + 가용 09:00~21:00 등록 완료")


def setup_pets(owners: list[dict]) -> list[dict]:
    """강아지 5마리 등록."""
    print("\n[3/7] 강아지 등록 — 콩이 / 호두 / 보리 / 두부 / 까미")
    pets = []
    for owner_idx, name, breed, age, weight_kg, temper, vacc in PETS:
        owner = owners[owner_idx]
        birth = (date.today() - timedelta(days=age * 365)).isoformat()
        pet = post(
            "/pt/pets",
            {
                "name": name,
                "species": "dog",
                "breed": breed,
                "birth_date": birth,
                "weight_kg": weight_kg,
                "temperament": temper,
                "vaccination_status": vacc,
            },
            token=owner["access_token"],
        )
        pet["owner_idx"] = owner_idx
        pet["display_name"] = name
        pets.append(pet)
        print(f"  {name} ({breed} {age}세, {weight_kg}kg) -> 보호자 {owner['user']['name']}")
    return pets


def create_booking(
    owner: dict,
    walker_id: str,
    pet_id: str,
    scheduled_at: datetime,
    pickup_lat: float,
    pickup_lng: float,
    address: str,
    duration: int = 30,
    price: int = 15000,
) -> dict:
    """예약 생성."""
    return post(
        "/pt/bookings",
        {
            "walker_id": walker_id,
            "pet_id": pet_id,
            "service_type": "walk",
            "duration_minutes": duration,
            "scheduled_at": scheduled_at.astimezone(timezone.utc).isoformat(),
            "pickup_latitude": pickup_lat,
            "pickup_longitude": pickup_lng,
            "pickup_address": address,
            "price": price,
        },
        token=owner["access_token"],
    )


def send_gps_points(session_id: str, walker_token: str, points: list[tuple[float, float]],
                     interval_sec: float = 0.0) -> None:
    """GPS 포인트들을 세션에 송신."""
    for i, (lat, lng) in enumerate(points):
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
            token=walker_token,
        )
        if interval_sec > 0 and i < len(points) - 1:
            time.sleep(interval_sec)


def create_completed_walk(
    owner: dict,
    walker: dict,
    pet: dict,
    scheduled_at: datetime,
    points: list[tuple[float, float]],
    address: str,
) -> dict:
    """완료된 산책 — 예약 + 수락 + 시작 + GPS 송신 + 종료."""
    booking = create_booking(
        owner=owner,
        walker_id=walker["user"]["id"],
        pet_id=pet["id"],
        scheduled_at=scheduled_at,
        pickup_lat=points[0][0],
        pickup_lng=points[0][1],
        address=address,
    )
    booking_id = booking["id"]
    post(f"/pt/bookings/{booking_id}/accept", {}, token=walker["access_token"])
    started = post(f"/pt/walks/{booking_id}/start", {}, token=walker["access_token"])
    session_id = started["session_id"]
    send_gps_points(session_id, walker["access_token"], points, interval_sec=0.0)
    post(f"/pt/walks/{session_id}/end", {}, token=walker["access_token"])
    return {"booking_id": booking_id, "session_id": session_id}


def main() -> None:
    print("=" * 60)
    print("모두의 창업 2026 신청서 캡처용 PT 시드 데이터")
    print("=" * 60)

    # 1. 사용자 생성
    owners, walkers, admin = setup_users()
    setup_walkers(walkers, admin["access_token"])

    # 2. 강아지 등록
    pets = setup_pets(owners)
    # pets[0] = 콩이 (김지원), pets[1] = 호두 (박서연), pets[2] = 보리 (이태민)
    # pets[3] = 두부 (김지원), pets[4] = 까미 (박서연)

    now = datetime.now(timezone.utc)

    # 3. 완료된 산책 3건 (히스토리)
    print("\n[4/7] 완료된 산책 3건 — 히스토리")
    history_walks = []
    h1 = create_completed_walk(
        owner=owners[0],
        walker=walkers[0],  # 정유진
        pet=pets[0],         # 콩이 (단골)
        scheduled_at=now - timedelta(days=4),
        points=HONGDAE_TO_MANGWON[:8],
        address="서울 마포구 홍대입구역 부근",
    )
    print(f"  완료 1: 콩이 + 정유진 (4일 전, 마포 홍대~망원) session={h1['session_id'][:8]}")
    history_walks.append(h1)

    h2 = create_completed_walk(
        owner=owners[0],
        walker=walkers[0],  # 정유진
        pet=pets[3],         # 두부
        scheduled_at=now - timedelta(days=1),
        points=HONGDAE_TO_MANGWON[2:9],
        address="서울 마포구 합정역 부근",
    )
    print(f"  완료 2: 두부 + 정유진 (어제, 마포 합정) session={h2['session_id'][:8]}")
    history_walks.append(h2)

    h3 = create_completed_walk(
        owner=owners[1],
        walker=walkers[2],  # 강수아
        pet=pets[4],         # 까미
        scheduled_at=now - timedelta(days=3),
        points=ITAEWON_TO_YONGSAN_PARK,
        address="서울 용산구 이태원역 부근",
    )
    print(f"  완료 3: 까미 + 강수아 (3일 전, 용산 이태원) session={h3['session_id'][:8]}")
    history_walks.append(h3)

    # 4. 확정 예약 2건 (오늘 미래)
    print("\n[5/7] 확정 예약 2건 — 오늘 미래 시간")
    today_18 = now.replace(hour=18, minute=0, second=0, microsecond=0)
    if today_18 < now:
        today_18 += timedelta(days=1)
    today_19 = now.replace(hour=19, minute=30, second=0, microsecond=0)
    if today_19 < now:
        today_19 += timedelta(days=1)

    b_yongsan = create_booking(
        owner=owners[1],
        walker_id=walkers[1]["user"]["id"],
        pet_id=pets[1]["id"],
        scheduled_at=today_18,
        pickup_lat=ITAEWON_TO_YONGSAN_PARK[0][0],
        pickup_lng=ITAEWON_TO_YONGSAN_PARK[0][1],
        address="서울 용산구 이태원역 부근",
    )
    post(f"/pt/bookings/{b_yongsan['id']}/accept", {}, token=walkers[1]["access_token"])
    print(f"  확정 1: 호두 + 최민호 ({today_18.astimezone().strftime('%H:%M')}, 용산 이태원~용산공원)")

    b_hangang = create_booking(
        owner=owners[2],
        walker_id=walkers[2]["user"]["id"],
        pet_id=pets[2]["id"],
        scheduled_at=today_19,
        pickup_lat=HANGANG_PARK_MAPO[0][0],
        pickup_lng=HANGANG_PARK_MAPO[0][1],
        address="서울 마포구 망원한강공원",
    )
    post(f"/pt/bookings/{b_hangang['id']}/accept", {}, token=walkers[2]["access_token"])
    print(f"  확정 2: 보리 + 강수아 ({today_19.astimezone().strftime('%H:%M')}, 마포 한강공원)")

    # 5. 활성 산책 1건 — LiveTrackScreen 캡처용 메인 시나리오
    print("\n[6/7] 활성 산책 — 콩이 + 정유진 (마포 홍대~망원, 진행 중)")
    active_booking = create_booking(
        owner=owners[0],         # 김지원 (마포구)
        walker_id=walkers[0]["user"]["id"],  # 정유진
        pet_id=pets[0]["id"],    # 콩이 (사이트 placeholder)
        scheduled_at=now - timedelta(minutes=10),  # 10분 전 시작
        pickup_lat=HONGDAE_TO_MANGWON[0][0],
        pickup_lng=HONGDAE_TO_MANGWON[0][1],
        address="서울 마포구 홍대입구역 9번 출구",
    )
    post(f"/pt/bookings/{active_booking['id']}/accept", {}, token=walkers[0]["access_token"])
    started = post(
        f"/pt/walks/{active_booking['id']}/start",
        {},
        token=walkers[0]["access_token"],
    )
    active_session_id = started["session_id"]
    print(f"  active_session_id={active_session_id}")

    # 활성 세션에 처음 8점 빠르게 기록 (정적 polyline 누적)
    print("  [활성] GPS 8점 polyline 기록 (정적 시드)")
    send_gps_points(
        active_session_id,
        walkers[0]["access_token"],
        HONGDAE_TO_MANGWON[:8],
        interval_sec=0.2,
    )

    # 6. 마지막 4점은 LiveTrackScreen 캡처 직전 송신 (실시간 시연)
    print("\n[7/7] LiveTrackScreen 실시간 시연 GPS 송신 (4점 × 5초)")
    print("=" * 60)
    print(">>> 지금 iPhone Expo Go에서 보호자 김지원 계정으로 로그인 후")
    print(f">>> LiveTrackScreen(sessionId={active_session_id[:8]}...)으로 진입하세요")
    print("=" * 60)
    print("\n5초 안에 시작합니다... (캡처 준비)")
    time.sleep(5)

    send_gps_points(
        active_session_id,
        walkers[0]["access_token"],
        HONGDAE_TO_MANGWON[8:],
        interval_sec=5.0,
    )

    # 7. 완료 보고
    print("\n" + "=" * 60)
    print("=== 시드 완료 ===")
    print("=" * 60)
    print(f"\n[보호자 3 / 산책 메이트 3 / 강아지 5 / 예약 6 (활성 1·확정 2·완료 3)]")
    print(f"\n--- 캡처용 활성 세션 정보 ---")
    print(f"세션 ID: {active_session_id}")
    print(f"보호자 (김지원, 마포) access_token:\n{owners[0]['access_token']}")
    print(f"\n--- 슬롯 1 캡처: LiveTrackScreen ---")
    print(f"  Expo Go iPhone -> 보호자 김지원 로그인 -> LiveTrackScreen(sessionId)")
    print(f"  지도에 마포구 홍대~망원 polyline 12점 + 정유진 워커 마지막 위치 마커 표시")
    print(f"\n--- 슬롯 2 캡처: WalkScreen 또는 사고 신고 ---")
    print(f"  Expo Go iPhone -> 산책 메이트 정유진 로그인 -> WalkScreen 또는 사고 신고 진입")
    print(f"\n--- 활성 산책 외 노출 가능 데이터 ---")
    print(f"  확정 예약 2건 (호두 18:00 용산 / 보리 19:30 한강공원)")
    print(f"  완료 산책 3건 (콩이 4일 전 / 두부 어제 / 까미 3일 전)")


if __name__ == "__main__":
    main()
