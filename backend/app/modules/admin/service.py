"""Admin services: seed data, audit logging.

Seed data: Creates a comprehensive test dataset when invoked via the admin API.
Idempotent: checks by phone number before inserting.

Audit logging: Records key operations for compliance and traceability.
"""

import json
import random
from datetime import date, time

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import AuditLog
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.billing.models import BillingPlan
from app.modules.scheduling.models import ScheduleTemplate
from app.modules.student_management.models import Enrollment, Student
from app.modules.vehicle_telemetry.models import Vehicle

# Seed phone number used to check idempotency
SEED_CHECK_PHONE = "01090000001"

# Academy data
ACADEMY_DATA = [
    {
        "name": "서울 강남 수학학원",
        "address": "서울특별시 강남구 테헤란로 152",
        "latitude": 37.5000,
        "longitude": 127.0365,
        "phone": "02-555-0001",
    },
    {
        "name": "서울 서초 영어학원",
        "address": "서울특별시 서초구 서초대로 200",
        "latitude": 37.4920,
        "longitude": 127.0100,
        "phone": "02-555-0002",
    },
    {
        "name": "서울 송파 과학학원",
        "address": "서울특별시 송파구 올림픽로 300",
        "latitude": 37.5145,
        "longitude": 127.1050,
        "phone": "02-555-0003",
    },
]

# Academy admin phones
ACADEMY_ADMIN_PHONES = ["01080000001", "01080000002", "01080000003"]
ACADEMY_ADMIN_NAMES = ["강남학원관리자", "서초학원관리자", "송파학원관리자"]

# Driver data
DRIVER_PHONES = [
    "01070000001",
    "01070000002",
    "01070000003",
    "01070000004",
    "01070000005",
]
DRIVER_NAMES = ["김운전", "이기사", "박드라이버", "최운수", "정기사"]

# Safety escort data
ESCORT_PHONES = ["01060000001", "01060000002", "01060000003"]
ESCORT_NAMES = ["안전도우미1", "안전도우미2", "안전도우미3"]

# Parent data: phones 01090000001 ~ 01090000010
PARENT_PHONES = [f"0109000000{i}" if i < 10 else f"010900000{i}" for i in range(1, 11)]
PARENT_NAMES = [
    "학부모일", "학부모이", "학부모삼", "학부모사", "학부모오",
    "학부모육", "학부모칠", "학부모팔", "학부모구", "학부모십",
]

# Student names (2 per parent = 20 total)
STUDENT_NAMES = [
    ("아이일A", "아이일B"),
    ("아이이A", "아이이B"),
    ("아이삼A", "아이삼B"),
    ("아이사A", "아이사B"),
    ("아이오A", "아이오B"),
    ("아이육A", "아이육B"),
    ("아이칠A", "아이칠B"),
    ("아이팔A", "아이팔B"),
    ("아이구A", "아이구B"),
    ("아이십A", "아이십B"),
]

# Vehicle data
VEHICLE_PLATES = ["11가1001", "22나2002", "33다3003", "44라4004", "55마5005"]

# Gangnam-area pickup coordinates for schedule templates
PICKUP_LOCATIONS = [
    (37.5010, 127.0280, "강남구 역삼동 12-1"),
    (37.5045, 127.0245, "강남구 역삼동 45-3"),
    (37.4985, 127.0320, "강남구 대치동 23-5"),
    (37.5080, 127.0200, "강남구 논현동 78-2"),
    (37.4920, 127.0380, "강남구 대치동 67-9"),
]


async def _user_exists(db: AsyncSession, phone: str) -> bool:
    """Check if a user with the given phone already exists."""
    stmt = select(User.id).where(User.phone == phone, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def seed_data(db: AsyncSession) -> dict:
    """Create test/demo data. Idempotent: skips if seed data already exists."""

    # Idempotency check
    if await _user_exists(db, SEED_CHECK_PHONE):
        return {"status": "skipped", "message": "시드 데이터가 이미 존재합니다"}

    counts: dict[str, int] = {}

    # --- Academy Admins ---
    academy_admin_users: list[User] = []
    for i, (phone, name) in enumerate(zip(ACADEMY_ADMIN_PHONES, ACADEMY_ADMIN_NAMES)):
        if not await _user_exists(db, phone):
            user = User(role=UserRole.ACADEMY_ADMIN, phone=phone, name=name)
            db.add(user)
            academy_admin_users.append(user)
    await db.flush()
    counts["academy_admins"] = len(academy_admin_users)

    # --- Academies ---
    academies: list[Academy] = []
    for i, data in enumerate(ACADEMY_DATA):
        admin_id = academy_admin_users[i].id if i < len(academy_admin_users) else None
        academy = Academy(
            name=data["name"],
            address=data["address"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            phone=data["phone"],
            admin_id=admin_id,
        )
        db.add(academy)
        academies.append(academy)
    await db.flush()
    counts["academies"] = len(academies)

    # --- Drivers ---
    drivers: list[User] = []
    for phone, name in zip(DRIVER_PHONES, DRIVER_NAMES):
        if not await _user_exists(db, phone):
            user = User(role=UserRole.DRIVER, phone=phone, name=name)
            db.add(user)
            drivers.append(user)
    await db.flush()
    counts["drivers"] = len(drivers)

    # --- Safety Escorts ---
    escorts: list[User] = []
    for phone, name in zip(ESCORT_PHONES, ESCORT_NAMES):
        if not await _user_exists(db, phone):
            user = User(role=UserRole.SAFETY_ESCORT, phone=phone, name=name)
            db.add(user)
            escorts.append(user)
    await db.flush()
    counts["safety_escorts"] = len(escorts)

    # --- Parents ---
    parents: list[User] = []
    for phone, name in zip(PARENT_PHONES, PARENT_NAMES):
        if not await _user_exists(db, phone):
            user = User(role=UserRole.PARENT, phone=phone, name=name)
            db.add(user)
            parents.append(user)
    await db.flush()
    counts["parents"] = len(parents)

    # --- Students (2 per parent) ---
    all_students: list[Student] = []
    for i, parent in enumerate(parents):
        child_names = STUDENT_NAMES[i] if i < len(STUDENT_NAMES) else (f"학생{i}A", f"학생{i}B")
        for j, sname in enumerate(child_names):
            # Vary date of birth: 2016-2020 range
            dob = date(2016 + (i % 5), ((i + j) % 12) + 1, ((i * 3 + j * 7) % 28) + 1)
            grade = f"{2026 - dob.year - 6}학년" if dob.year <= 2020 else "유치원"
            student = Student(
                guardian_id=parent.id,
                name=sname,
                date_of_birth=dob,
                grade=grade,
            )
            db.add(student)
            all_students.append(student)
    await db.flush()
    counts["students"] = len(all_students)

    # --- Enrollments (each student enrolled in a random academy) ---
    enrollment_count = 0
    for student in all_students:
        academy = random.choice(academies)
        enrollment = Enrollment(
            student_id=student.id,
            academy_id=academy.id,
        )
        db.add(enrollment)
        enrollment_count += 1
    await db.flush()
    counts["enrollments"] = enrollment_count

    # --- Vehicles (assigned to random academies conceptually) ---
    vehicles: list[Vehicle] = []
    for plate in VEHICLE_PLATES:
        vehicle = Vehicle(
            license_plate=plate,
            capacity=15,
            operator_name="안전운수(주)",
        )
        db.add(vehicle)
        vehicles.append(vehicle)
    await db.flush()
    counts["vehicles"] = len(vehicles)

    # --- Schedule Templates (weekdays, random pickup time 14:00-17:00) ---
    template_count = 0
    for student in all_students:
        # Get the student's enrollment to find the academy
        stmt = select(Enrollment).where(Enrollment.student_id == student.id)
        result = await db.execute(stmt)
        enrollment = result.scalar_one_or_none()
        if not enrollment:
            continue

        for day in range(5):  # Mon=0 to Fri=4
            hour = random.randint(14, 16)
            minute = random.choice([0, 10, 20, 30, 40, 50])
            pickup = random.choice(PICKUP_LOCATIONS)
            template = ScheduleTemplate(
                student_id=student.id,
                academy_id=enrollment.academy_id,
                day_of_week=day,
                pickup_time=time(hour, minute),
                pickup_latitude=pickup[0],
                pickup_longitude=pickup[1],
                pickup_address=pickup[2],
            )
            db.add(template)
            template_count += 1
    await db.flush()
    counts["schedule_templates"] = template_count

    # --- Billing Plans (2 per-ride pricing plans) ---
    billing_plans = [
        BillingPlan(
            academy_id=academies[0].id,
            name="기본 건별 요금제",
            price_per_ride=5000,
            monthly_cap=150000,
        ),
        BillingPlan(
            academy_id=academies[1].id,
            name="프리미엄 건별 요금제",
            price_per_ride=7000,
            monthly_cap=200000,
        ),
    ]
    for plan in billing_plans:
        db.add(plan)
    await db.flush()
    counts["billing_plans"] = len(billing_plans)

    return {"status": "created", "counts": counts}


# ---------------------------------------------------------------------------
# Audit log helpers
# ---------------------------------------------------------------------------


async def log_audit(
    db: AsyncSession,
    user_id: str | None,
    user_name: str | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
) -> None:
    """Record an audit log entry."""
    log = AuditLog(
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details, ensure_ascii=False) if details else None,
        ip_address=ip_address,
    )
    db.add(log)
    await db.flush()


async def list_audit_logs(
    db: AsyncSession,
    entity_type: str | None = None,
    action: str | None = None,
    user_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """List audit logs with optional filters and pagination."""
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if action:
        query = query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    items = (await db.execute(query.offset(skip).limit(limit))).scalars().all()
    return {"items": list(items), "total": total or 0}
