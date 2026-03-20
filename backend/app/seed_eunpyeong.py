"""Seed data — 은평뉴타운 3개 학원 데모 데이터.

Usage: python -m app.seed_eunpyeong

학원:
  1. 튼튼영어마스터클럽 은평은빛점  (북한산로 2)
  2. 대교하이캠퍼스 진관학원         (진관3로 37)
  3. 칸타빌레바하음악교습소           (진관2로 77)

생성 데이터:
  - 플랫폼 관리자 1명
  - 학원 관리자 3명 (학원별 1명)
  - 기사 2명 + 차량 2대 (공유)
  - 학부모 9명 + 학생 15명 (학원별 3부모 5학생)
  - 등록 / 동의 / 스케줄 템플릿 / 차량 배정
  - 오늘 + 내일 일일 파이프라인 실행

좌표 출처:
  - 학원 3곳: Kakao Geocoding API 직접 조회 (2026-03-17)
  - 픽업 위치: Kakao 키워드 검색 + Geocoding API (2026-03-17)
  - 모든 픽업 좌표: Kakao API 실측값

Idempotent: 플랫폼 관리자(EP_ADMIN_ID)가 존재하면 스킵.
"""

import asyncio
import logging
import uuid
from datetime import date, time, timedelta

from app.database import async_session_factory
from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.compliance.models import GuardianConsent
from app.modules.scheduling.models import ScheduleTemplate
from app.modules.student_management.models import Enrollment, Student
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Fixed UUIDs (idempotency) ───────────────────────────────────────────────
EP_ADMIN_ID   = uuid.UUID("a1000000-0000-0000-0000-000000000000")  # 플랫폼 관리자

ACADEMY_IDS = [
    uuid.UUID("a1000000-0000-0000-0000-000000000001"),  # 튼튼영어
    uuid.UUID("a1000000-0000-0000-0000-000000000002"),  # 대교하이캠퍼스
    uuid.UUID("a1000000-0000-0000-0000-000000000003"),  # 칸타빌레바하
]
ACADEMY_ADMIN_IDS = [
    uuid.UUID("a1000000-0000-0000-0000-000000000011"),
    uuid.UUID("a1000000-0000-0000-0000-000000000012"),
    uuid.UUID("a1000000-0000-0000-0000-000000000013"),
]
DRIVER_IDS = [
    uuid.UUID("a1000000-0000-0000-0000-000000000021"),
    uuid.UUID("a1000000-0000-0000-0000-000000000022"),
]
VEHICLE_IDS = [
    uuid.UUID("a1000000-0000-0000-0000-000000000031"),
    uuid.UUID("a1000000-0000-0000-0000-000000000032"),
]
# 학원별 학부모 3명씩
PARENT_IDS = [
    # 튼튼영어 학부모
    uuid.UUID("a1000000-0000-0000-0000-000000000041"),
    uuid.UUID("a1000000-0000-0000-0000-000000000042"),
    uuid.UUID("a1000000-0000-0000-0000-000000000043"),
    # 대교하이캠퍼스 학부모
    uuid.UUID("a1000000-0000-0000-0000-000000000044"),
    uuid.UUID("a1000000-0000-0000-0000-000000000045"),
    uuid.UUID("a1000000-0000-0000-0000-000000000046"),
    # 칸타빌레바하 학부모
    uuid.UUID("a1000000-0000-0000-0000-000000000047"),
    uuid.UUID("a1000000-0000-0000-0000-000000000048"),
    uuid.UUID("a1000000-0000-0000-0000-000000000049"),
]

# ── 학원 정보 ────────────────────────────────────────────────────────────────
# 좌표: Kakao Geocoding API 직접 조회 (2026-03-17)
ACADEMIES_DATA = [
    {
        "id": ACADEMY_IDS[0],
        "admin_id": ACADEMY_ADMIN_IDS[0],
        "name": "튼튼영어마스터클럽 은평은빛점",
        "address": "서울특별시 은평구 북한산로 2",
        "latitude": 37.64224333,   # Kakao API ✓
        "longitude": 126.91623596,
        "phone": "02-356-1001",
        "admin_name": "튼튼영어 관리자",
        "admin_phone": "01071110001",
    },
    {
        "id": ACADEMY_IDS[1],
        "admin_id": ACADEMY_ADMIN_IDS[1],
        "name": "대교하이캠퍼스 진관학원",
        "address": "서울특별시 은평구 진관3로 37",
        "latitude": 37.64039165,   # Kakao API ✓
        "longitude": 126.92043837,
        "phone": "02-356-2002",
        "admin_name": "대교하이캠퍼스 관리자",
        "admin_phone": "01071110002",
    },
    {
        "id": ACADEMY_IDS[2],
        "admin_id": ACADEMY_ADMIN_IDS[2],
        "name": "칸타빌레바하음악교습소",
        "address": "서울특별시 은평구 진관2로 77",
        "latitude": 37.63456957,   # Kakao API ✓
        "longitude": 126.92683488,
        "phone": "02-356-3003",
        "admin_name": "칸타빌레바하 관리자",
        "admin_phone": "01071110003",
    },
]

# ── 학생 픽업 위치 15곳 ──────────────────────────────────────────────────────
# 출처: Kakao API 직접 조회 (✓) / 추정 (★)
# 학원별 5명씩: [0-4] 튼튼영어, [5-9] 대교하이캠퍼스, [10-14] 칸타빌레바하
PICKUP_LOCATIONS = [
    # ── 튼튼영어 학생 픽업 (북쪽권) ─────────────────────────────────────────
    (37.64411775, 126.92041831, "진관동 구파발9단지래미안"),   # Kakao ✓
    (37.64446939, 126.92507400, "진관동 진관4로 37 일대"),     # Kakao ✓
    (37.64183625, 126.92145181, "진관동 64-19 일대"),          # Kakao ✓
    (37.63963050, 126.91901446, "진관동 진관3로 21 일대"),     # Kakao ✓
    (37.64217428, 126.91772599, "진관동 구파발10단지어울림"),   # Kakao ✓

    # ── 대교하이캠퍼스 학생 픽업 (중부권) ───────────────────────────────────
    (37.63946305, 126.91826807, "진관동 진관3로 11 일대"),     # Kakao ✓
    (37.63643579, 126.91885282, "진관동 구파발역 인근"),       # Kakao ✓
    (37.63574173, 126.91934165, "진관동 드림스퀘어 인근"),     # Kakao ✓
    (37.63364452, 126.92148423, "진관동 박석고개1단지힐스테이트"), # Kakao ✓
    (37.63364595, 126.92399156, "진관동 마고정2단지"),         # Kakao ✓

    # ── 칸타빌레바하 학생 픽업 (남부권) ─────────────────────────────────────
    (37.63553978, 126.92644907, "진관동 우물골2단지"),         # Kakao ✓
    (37.63251501, 126.93219020, "진관동 디에트르더퍼스트"),    # Kakao ✓
    (37.63116320, 126.93007747, "진관동 폭포동4단지 A"),       # Kakao ✓
    (37.62894868, 126.93336480, "진관동 폭포동4단지 B"),       # Kakao ✓
    (37.63231377, 126.92568074, "진관동 마고정11단지"),         # Kakao ✓
]

# ── 학부모 + 학생 데이터 ──────────────────────────────────────────────────────
# 구조: (학부모명, 전화, [(학생명, 생년월일, 학년)])
# 학원 인덱스별로 3명 학부모, 학생 총 5명 배정
PARENT_STUDENT_DATA = [
    # [0] 튼튼영어 학부모 3명 → 학생 5명 (픽업 0~4)
    ("김은평", "01081110001", [
        ("김지율", "2018-04-10", "2학년"),
        ("김민서", "2020-09-03", "유치원"),
    ]),
    ("이진관", "01081110002", [
        ("이하준", "2017-06-15", "3학년"),
    ]),
    ("박북한", "01081110003", [
        ("박수아", "2019-02-28", "1학년"),
        ("박도현", "2016-11-11", "4학년"),
    ]),

    # [1] 대교하이캠퍼스 학부모 3명 → 학생 5명 (픽업 5~9)
    ("최구파", "01081110004", [
        ("최예린", "2018-08-22", "2학년"),
        ("최시우", "2021-01-17", "유치원"),
    ]),
    ("정힐스", "01081110005", [
        ("정우진", "2017-03-05", "3학년"),
    ]),
    ("한마고", "01081110006", [
        ("한나연", "2019-07-14", "1학년"),
        ("한태양", "2015-12-25", "5학년"),
    ]),

    # [2] 칸타빌레바하 학부모 3명 → 학생 5명 (픽업 10~14)
    ("오우물", "01081110007", [
        ("오재원", "2018-01-30", "2학년"),
        ("오하늘", "2020-05-19", "유치원"),
    ]),
    ("임폭포", "01081110008", [
        ("임지민", "2017-10-08", "3학년"),
    ]),
    ("송디에", "01081110009", [
        ("송아린", "2019-03-21", "1학년"),
        ("송준혁", "2016-07-07", "4학년"),
    ]),
]


async def seed() -> None:
    async with async_session_factory() as db:
        # 멱등성 체크
        existing = await db.get(User, EP_ADMIN_ID)
        if existing:
            logger.info("은평뉴타운 seed 데이터가 이미 존재합니다. 스킵.")
            return

        logger.info("은평뉴타운 seed 데이터 생성 시작...")

        # ── 플랫폼 관리자 ──
        platform_admin = User(
            id=EP_ADMIN_ID,
            role=UserRole.PLATFORM_ADMIN,
            phone="01000000099",
            name="플랫폼관리자(은평)",
        )
        db.add(platform_admin)
        await db.flush()

        # ── 학원 관리자 + 학원 ──
        for acad_data in ACADEMIES_DATA:
            acad_admin = User(
                id=acad_data["admin_id"],
                role=UserRole.ACADEMY_ADMIN,
                phone=acad_data["admin_phone"],
                name=acad_data["admin_name"],
            )
            db.add(acad_admin)
        await db.flush()

        for acad_data in ACADEMIES_DATA:
            academy = Academy(
                id=acad_data["id"],
                name=acad_data["name"],
                address=acad_data["address"],
                latitude=acad_data["latitude"],
                longitude=acad_data["longitude"],
                phone=acad_data["phone"],
                admin_id=acad_data["admin_id"],
            )
            db.add(academy)

        # ── 기사 ──
        driver_info = [
            ("이기사", "01061110001"),
            ("박운전", "01061110002"),
        ]
        for did, (dname, dphone) in zip(DRIVER_IDS, driver_info):
            db.add(User(
                id=did,
                role=UserRole.DRIVER,
                phone=dphone,
                name=dname,
            ))
        await db.flush()

        # ── 차량 (2대 공유) ──
        vehicle_info = [
            ("45버 1234", 12, "은평안전운수(주)"),
            ("67버 5678", 15, "은평안전운수(주)"),
        ]
        for vid, (plate, cap, op) in zip(VEHICLE_IDS, vehicle_info):
            db.add(Vehicle(
                id=vid,
                license_plate=plate,
                capacity=cap,
                operator_name=op,
            ))

        # ── 학부모 + 학생 ──
        all_students: list[tuple[Student, int]] = []  # (student, pickup_idx)
        pickup_idx = 0

        for pi, (pname, pphone, children) in enumerate(PARENT_STUDENT_DATA):
            parent_id = PARENT_IDS[pi]
            db.add(User(
                id=parent_id,
                role=UserRole.PARENT,
                phone=pphone,
                name=pname,
            ))
            for sname, dob, grade in children:
                student = Student(
                    guardian_id=parent_id,
                    name=sname,
                    date_of_birth=date.fromisoformat(dob),
                    grade=grade,
                )
                db.add(student)
                all_students.append((student, pickup_idx))
                pickup_idx += 1

        await db.flush()  # student.id 확정

        # ── 등록 + 동의 ──
        # 학원 인덱스: 부모 0-2 → 학원0, 3-5 → 학원1, 6-8 → 학원2
        for pi, (pname, pphone, children) in enumerate(PARENT_STUDENT_DATA):
            acad_idx = pi // 3
            parent_id = PARENT_IDS[pi]
            parent_students = [s for s, _ in all_students if s.guardian_id == parent_id]
            for student in parent_students:
                db.add(Enrollment(
                    student_id=student.id,
                    academy_id=ACADEMY_IDS[acad_idx],
                ))
                db.add(GuardianConsent(
                    guardian_id=parent_id,
                    child_id=student.id,
                    consent_scope={"location_tracking": True, "push_notification": True},
                    consent_method="app",
                ))

        # ── 스케줄 템플릿 (월~금) ──
        # 각 학원별 픽업 시간 설정
        base_times = [
            [time(14, 0), time(14, 10), time(14, 20), time(14, 30), time(14, 40)],  # 튼튼영어
            [time(15, 0), time(15, 10), time(15, 20), time(15, 30), time(15, 40)],  # 대교하이캠퍼스
            [time(16, 0), time(16, 10), time(16, 20), time(16, 30), time(16, 40)],  # 칸타빌레바하
        ]

        for student, pidx in all_students:
            acad_idx = pidx // 5  # 학원 구분 (0~4:튼튼, 5~9:대교, 10~14:칸타)
            slot = pidx % 5       # 학원 내 순서 (0~4)
            lat, lng, addr = PICKUP_LOCATIONS[pidx]
            pickup_time = base_times[acad_idx][slot]

            for day in range(5):  # 월~금
                db.add(ScheduleTemplate(
                    student_id=student.id,
                    academy_id=ACADEMY_IDS[acad_idx],
                    day_of_week=day,
                    pickup_time=pickup_time,
                    pickup_latitude=lat,
                    pickup_longitude=lng,
                    pickup_address=addr,
                ))

        # ── 차량 배정 (오늘 + 내일) ──
        today = date.today()
        for delta in (0, 1):
            target = today + timedelta(days=delta)
            for i, vid in enumerate(VEHICLE_IDS):
                db.add(VehicleAssignment(
                    vehicle_id=vid,
                    driver_id=DRIVER_IDS[i],
                    assigned_date=target,
                ))

        await db.commit()
        logger.info("Seed 완료!")
        for ad in ACADEMIES_DATA:
            logger.info("  학원: %s (lat=%.7f, lng=%.7f)",
                        ad["name"], ad["latitude"], ad["longitude"])
        logger.info("  학생: %d명, 픽업 좌표 %d곳 (모두 Kakao API 실측값)",
                    len(all_students), len(PICKUP_LOCATIONS))

        # ── 일일 파이프라인 ──
        logger.info("일일 파이프라인 실행 (오늘: %s)...", today)
        from app.modules.scheduling.scheduler import run_daily_pipeline
        async with async_session_factory() as db2:
            result = await run_daily_pipeline(db2, today)
            await db2.commit()
            logger.info("파이프라인 결과: %s", result)


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
