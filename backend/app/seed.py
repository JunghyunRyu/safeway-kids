"""Seed data CLI for SAFEWAY KIDS demo.

Usage: python -m app.seed

Creates a complete demo dataset:
- 1 academy (강남 코딩학원)
- 2 vehicles with 2 drivers
- 3 parents with 5 students
- Enrollments, schedule templates (Mon-Fri), guardian consents
- Vehicle assignments for today
- Runs daily pipeline (materialize + route generation)

Idempotent: skips if academy already exists.
"""

import asyncio
import logging
import uuid
from datetime import date, time, timedelta

from sqlalchemy import select

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

# Fixed UUIDs for idempotency
ACADEMY_ID = uuid.UUID("a0000000-0000-0000-0000-000000000001")
VEHICLE_IDS = [
    uuid.UUID("b0000000-0000-0000-0000-000000000001"),
    uuid.UUID("b0000000-0000-0000-0000-000000000002"),
]
DRIVER_IDS = [
    uuid.UUID("d0000000-0000-0000-0000-000000000001"),
    uuid.UUID("d0000000-0000-0000-0000-000000000002"),
]
PARENT_IDS = [
    uuid.UUID("c0000000-0000-0000-0000-000000000001"),
    uuid.UUID("c0000000-0000-0000-0000-000000000002"),
    uuid.UUID("c0000000-0000-0000-0000-000000000003"),
]
ADMIN_ID = uuid.UUID("e0000000-0000-0000-0000-000000000001")

# Gangnam-area pickup coordinates
PICKUP_LOCATIONS = [
    (37.5010, 127.0280, "역삼동 12-1"),
    (37.5045, 127.0245, "역삼동 45-3"),
    (37.4985, 127.0320, "대치동 23-5"),
    (37.5080, 127.0200, "논현동 78-2"),
    (37.4920, 127.0380, "대치동 67-9"),
]


async def seed() -> None:
    async with async_session_factory() as db:
        # Check idempotency — check admin user (inserted first)
        existing_admin = await db.get(User, ADMIN_ID)
        if existing_admin:
            logger.info("Seed data already exists (admin user found), skipping")
            return

        logger.info("Seeding demo data...")

        # --- Platform Admin ---
        admin = User(
            id=ADMIN_ID,
            role=UserRole.PLATFORM_ADMIN,
            phone="01000000000",
            name="관리자",
        )
        db.add(admin)
        await db.flush()  # Flush admin user before academy FK

        # --- Academy ---
        academy = Academy(
            id=ACADEMY_ID,
            name="강남 코딩학원",
            address="서울특별시 강남구 테헤란로 152",
            latitude=37.5000,
            longitude=127.0365,
            phone="02-555-1234",
            admin_id=ADMIN_ID,
        )
        db.add(academy)

        # --- Drivers ---
        drivers = []
        driver_names = ["김운전", "이기사"]
        driver_phones = ["01011111111", "01022222222"]
        for i, did in enumerate(DRIVER_IDS):
            driver = User(
                id=did,
                role=UserRole.DRIVER,
                phone=driver_phones[i],
                name=driver_names[i],
            )
            db.add(driver)
            drivers.append(driver)

        await db.flush()  # Flush drivers before FK references

        # --- Vehicles ---
        vehicles = []
        plates = ["12가3456", "34나5678"]
        for i, vid in enumerate(VEHICLE_IDS):
            vehicle = Vehicle(
                id=vid,
                license_plate=plates[i],
                capacity=15,
                operator_name="안전운수(주)",
            )
            db.add(vehicle)
            vehicles.append(vehicle)

        # --- Parents + Students ---
        parent_data = [
            ("박보호자", "01033333333", [("박민준", "2018-03-15", "2학년"), ("박서윤", "2020-07-22", "유치원")]),
            ("최학부모", "01044444444", [("최도윤", "2017-09-10", "3학년")]),
            ("정엄마", "01055555555", [("정하은", "2019-01-05", "1학년"), ("정지호", "2016-11-30", "4학년")]),
        ]

        all_students: list[Student] = []
        for i, (pname, pphone, children) in enumerate(parent_data):
            parent = User(
                id=PARENT_IDS[i],
                role=UserRole.PARENT,
                phone=pphone,
                name=pname,
            )
            db.add(parent)

            for sname, dob, grade in children:
                student = Student(
                    guardian_id=PARENT_IDS[i],
                    name=sname,
                    date_of_birth=date.fromisoformat(dob),
                    grade=grade,
                )
                db.add(student)
                all_students.append(student)

        await db.flush()  # Generate student IDs

        # --- Enrollments ---
        for student in all_students:
            enrollment = Enrollment(
                student_id=student.id,
                academy_id=ACADEMY_ID,
            )
            db.add(enrollment)

        # --- Guardian Consents ---
        for i, parent_id in enumerate(PARENT_IDS):
            parent_students = [s for s in all_students if s.guardian_id == parent_id]
            for student in parent_students:
                consent = GuardianConsent(
                    guardian_id=parent_id,
                    child_id=student.id,
                    consent_scope={"location_tracking": True, "push_notification": True},
                    consent_method="app",
                )
                db.add(consent)

        # --- Schedule Templates (Mon-Fri) ---
        pickup_times = [
            time(14, 0),   # 2:00 PM
            time(14, 10),  # 2:10 PM
            time(14, 20),  # 2:20 PM
            time(14, 30),  # 2:30 PM
            time(14, 40),  # 2:40 PM
        ]

        for day in range(5):  # Mon=0 to Fri=4
            for si, student in enumerate(all_students):
                lat, lng, addr = PICKUP_LOCATIONS[si]
                template = ScheduleTemplate(
                    student_id=student.id,
                    academy_id=ACADEMY_ID,
                    day_of_week=day,
                    pickup_time=pickup_times[si],
                    pickup_latitude=lat,
                    pickup_longitude=lng,
                    pickup_address=addr,
                )
                db.add(template)

        # --- Vehicle Assignments for today ---
        today = date.today()
        for i, vid in enumerate(VEHICLE_IDS):
            assignment = VehicleAssignment(
                vehicle_id=vid,
                driver_id=DRIVER_IDS[i],
                assigned_date=today,
            )
            db.add(assignment)

        # Also assign for tomorrow
        tomorrow = today + timedelta(days=1)
        for i, vid in enumerate(VEHICLE_IDS):
            assignment = VehicleAssignment(
                vehicle_id=vid,
                driver_id=DRIVER_IDS[i],
                assigned_date=tomorrow,
            )
            db.add(assignment)

        await db.commit()
        logger.info("Seed data created successfully!")
        logger.info("  Academy: %s (%s)", academy.name, ACADEMY_ID)
        logger.info("  Vehicles: %d", len(vehicles))
        logger.info("  Drivers: %d", len(drivers))
        logger.info("  Parents: %d", len(PARENT_IDS))
        logger.info("  Students: %d", len(all_students))

        # --- Run daily pipeline for today ---
        logger.info("Running daily pipeline for today (%s)...", today)
        from app.modules.scheduling.scheduler import run_daily_pipeline

        async with async_session_factory() as db2:
            result = await run_daily_pipeline(db2, today)
            await db2.commit()
            logger.info("Pipeline result: %s", result)


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
