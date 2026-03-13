"""
SAFEWAY KIDS — Seed Data Script
Populates the database with pilot test data for Gangnam-gu area.
Usage: python scripts/seed.py
"""

import asyncio
import random
import uuid
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine, Base
from app.modules.auth.models import User, UserRole
from app.modules.student_management.models import Enrollment, Student
from app.modules.academy_management.models import Academy
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment
from app.modules.scheduling.models import ScheduleTemplate
from app.modules.compliance.models import Contract, DataRetentionPolicy, GuardianConsent

# Korean data
FAMILY_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황"]
GIVEN_NAMES_M = ["민수", "준호", "성현", "지훈", "현우", "동현", "승민", "태영", "재현", "영호"]
GIVEN_NAMES_F = ["서연", "지은", "하은", "수빈", "유진", "민지", "예린", "소영", "현주", "다은"]
CHILD_NAMES_M = ["도윤", "시우", "예준", "하준", "지호", "서준", "이준", "유찬", "건우", "주원"]
CHILD_NAMES_F = ["서윤", "하윤", "지유", "서아", "하은", "소율", "다인", "지아", "윤서", "채원"]

ACADEMIES_DATA = [
    {"name": "해피 영어학원", "address": "서울시 강남구 테헤란로 123", "lat": 37.5012, "lng": 127.0396},
    {"name": "브레인 수학학원", "address": "서울시 강남구 역삼로 45", "lat": 37.4987, "lng": 127.0365},
    {"name": "아이비 피아노학원", "address": "서울시 강남구 강남대로 234", "lat": 37.4970, "lng": 127.0280},
    {"name": "스마트 코딩학원", "address": "서울시 강남구 봉은사로 67", "lat": 37.5130, "lng": 127.0580},
    {"name": "챔피언 태권도장", "address": "서울시 강남구 선릉로 89", "lat": 37.5045, "lng": 127.0490},
]

PICKUP_LOCATIONS = [
    {"address": "강남구 대치동 은마아파트", "lat": 37.4943, "lng": 127.0573},
    {"address": "강남구 도곡동 타워팰리스", "lat": 37.4897, "lng": 127.0450},
    {"address": "강남구 역삼동 개나리아파트", "lat": 37.4990, "lng": 127.0360},
    {"address": "강남구 삼성동 아이파크", "lat": 37.5098, "lng": 127.0620},
    {"address": "강남구 청담동 래미안", "lat": 37.5200, "lng": 127.0510},
    {"address": "강남구 논현동 현대아파트", "lat": 37.5140, "lng": 127.0280},
    {"address": "강남구 수서동 까치마을", "lat": 37.4870, "lng": 127.0990},
    {"address": "강남구 일원동 래미안", "lat": 37.4830, "lng": 127.0860},
    {"address": "강남구 개포동 주공아파트", "lat": 37.4810, "lng": 127.0550},
    {"address": "강남구 세곡동 강남보금자리", "lat": 37.4670, "lng": 127.0790},
]


def korean_name(is_child: bool = False, is_male: bool = True) -> str:
    family = random.choice(FAMILY_NAMES)
    if is_child:
        given = random.choice(CHILD_NAMES_M if is_male else CHILD_NAMES_F)
    else:
        given = random.choice(GIVEN_NAMES_M if is_male else GIVEN_NAMES_F)
    return f"{family}{given}"


def korean_phone() -> str:
    return f"010{random.randint(10000000, 99999999)}"


async def seed_data() -> None:
    async with async_session_factory() as db:
        print("🔄 Seeding SAFEWAY KIDS pilot data...")

        # 0. Clean existing data (reverse FK order)
        for table in [
            "daily_schedule_instances", "schedule_templates", "guardian_consents",
            "enrollments", "contracts", "vehicle_assignments", "route_plans",
            "gps_history", "students", "vehicles", "academies",
            "data_retention_policies", "users",
        ]:
            await db.execute(text(f"DELETE FROM {table}"))
        print("   Cleaned existing data.")

        # 1. Data retention policies
        policies = [
            DataRetentionPolicy(data_category="gps_history", retention_days=90, legal_basis="서비스 운영 목적", auto_purge=True),
            DataRetentionPolicy(data_category="boarding_logs", retention_days=365, legal_basis="운송 기록 보관", auto_purge=True),
            DataRetentionPolicy(data_category="consent_records", retention_days=1095, legal_basis="개인정보보호법 제39조", auto_purge=False),
            DataRetentionPolicy(data_category="facial_embeddings", retention_days=7, legal_basis="생체정보 최소보관", auto_purge=True),
            DataRetentionPolicy(data_category="cctv_inference_logs", retention_days=30, legal_basis="사고 조사 목적", auto_purge=True),
        ]
        for p in policies:
            db.add(p)

        # 2. Platform admin
        admin = User(role=UserRole.PLATFORM_ADMIN, phone="01000000000", name="시스템관리자")
        db.add(admin)

        # 3. Academy admins + Academies
        academies = []
        for adata in ACADEMIES_DATA:
            admin_user = User(
                role=UserRole.ACADEMY_ADMIN,
                phone=korean_phone(),
                name=korean_name(is_male=random.choice([True, False])),
            )
            db.add(admin_user)
            await db.flush()

            academy = Academy(
                name=adata["name"],
                address=adata["address"],
                latitude=adata["lat"],
                longitude=adata["lng"],
                phone=f"02-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                admin_id=admin_user.id,
            )
            db.add(academy)
            academies.append(academy)

        await db.flush()

        # 4. Drivers + Safety Escorts
        drivers = []
        for i in range(10):
            driver = User(role=UserRole.DRIVER, phone=korean_phone(), name=korean_name(is_male=True))
            db.add(driver)
            drivers.append(driver)

        escorts = []
        for i in range(10):
            escort = User(role=UserRole.SAFETY_ESCORT, phone=korean_phone(), name=korean_name(is_male=False))
            db.add(escort)
            escorts.append(escort)

        await db.flush()

        # 5. Vehicles
        vehicles = []
        for i in range(5):
            plate_num = f"{random.randint(10, 99)}가 {random.randint(1000, 9999)}"
            vehicle = Vehicle(
                license_plate=plate_num,
                capacity=random.choice([15, 25, 35]),
                operator_name=f"안전운수 제{i + 1}호",
            )
            db.add(vehicle)
            vehicles.append(vehicle)

        await db.flush()

        # 6. Vehicle Assignments (today)
        today = date.today()
        for i, vehicle in enumerate(vehicles):
            assignment = VehicleAssignment(
                vehicle_id=vehicle.id,
                driver_id=drivers[i].id,
                safety_escort_id=escorts[i].id,
                assigned_date=today,
            )
            db.add(assignment)

        # 7. Contracts
        for i, vehicle in enumerate(vehicles):
            academy = academies[i % len(academies)]
            contract = Contract(
                academy_id=academy.id,
                operator_name=vehicle.operator_name or f"운수업체{i}",
                vehicle_id=vehicle.id,
                contract_type="charter_transport",
                effective_from=datetime.now(UTC),
                effective_until=datetime.now(UTC) + timedelta(days=365),
            )
            db.add(contract)

        # 8. Parents + Students + Enrollments + Consents + Schedules
        parents = []
        students = []
        for i in range(50):
            is_male_parent = random.choice([True, False])
            parent = User(
                role=UserRole.PARENT,
                phone=korean_phone(),
                name=korean_name(is_male=is_male_parent),
            )
            db.add(parent)
            parents.append(parent)

        await db.flush()

        for i in range(50):
            parent = parents[i]
            is_male_child = random.choice([True, False])
            child_name = korean_name(is_child=True, is_male=is_male_child)
            birth_year = random.randint(2016, 2020)
            birth_month = random.randint(1, 12)
            birth_day = random.randint(1, 28)

            student = Student(
                guardian_id=parent.id,
                name=child_name,
                date_of_birth=date(birth_year, birth_month, birth_day),
                grade=f"초등 {2026 - birth_year - 6}학년" if birth_year <= 2019 else "미취학",
            )
            db.add(student)
            students.append(student)

        await db.flush()

        for i, student in enumerate(students):
            parent = parents[i]

            # Guardian consent
            consent = GuardianConsent(
                guardian_id=parent.id,
                child_id=student.id,
                consent_scope={
                    "location_tracking": True,
                    "push_notification": True,
                    "facial_recognition": False,
                },
                consent_method="phone_otp",
            )
            db.add(consent)

            # Enroll in 1-2 academies
            num_academies = random.randint(1, 2)
            enrolled_academies = random.sample(academies, num_academies)
            for academy in enrolled_academies:
                enrollment = Enrollment(
                    student_id=student.id,
                    academy_id=academy.id,
                )
                db.add(enrollment)

                # Schedule templates (weekdays)
                pickup = random.choice(PICKUP_LOCATIONS)
                days = random.sample(range(5), random.randint(2, 5))  # Mon-Fri
                hour = random.choice([14, 15, 16, 17])
                minute = random.choice([0, 15, 30, 45])

                for day in days:
                    template = ScheduleTemplate(
                        student_id=student.id,
                        academy_id=academy.id,
                        day_of_week=day,
                        pickup_time=time(hour, minute),
                        pickup_latitude=pickup["lat"] + random.uniform(-0.002, 0.002),
                        pickup_longitude=pickup["lng"] + random.uniform(-0.002, 0.002),
                        pickup_address=pickup["address"],
                    )
                    db.add(template)

        await db.commit()
        print("✅ Seed data complete!")
        print(f"   - 1 platform admin")
        print(f"   - 5 academy admins + 5 academies")
        print(f"   - 10 drivers + 10 safety escorts")
        print(f"   - 5 vehicles with contracts")
        print(f"   - 50 parents + 50 students")
        print(f"   - Enrollments, consents, and schedule templates generated")


if __name__ == "__main__":
    asyncio.run(seed_data())
