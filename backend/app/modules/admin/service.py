"""Admin services: seed data, audit logging.

Seed data: Creates a comprehensive test dataset when invoked via the admin API.
Idempotent: checks by phone number before inserting.

Audit logging: Records key operations for compliance and traceability.
"""

import json
import random
import uuid
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import AuditLog
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.academy_management.models import Academy
from app.modules.auth.models import User, UserRole
from app.modules.billing.models import BillingPlan, Invoice
from app.modules.compliance.models import GuardianConsent
from app.modules.scheduling.models import DailyScheduleInstance, ScheduleTemplate
from app.modules.student_management.models import Enrollment, Student
from app.modules.vehicle_telemetry.models import Vehicle, VehicleAssignment

UTC = timezone.utc

# Seed phone number used to check idempotency
SEED_CHECK_PHONE = "01090000001"

# Academy data — 5개 학원 (다양한 지역)
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
    {
        "name": "서울 마포 코딩학원",
        "address": "서울특별시 마포구 양화로 45",
        "latitude": 37.5565,
        "longitude": 126.9220,
        "phone": "02-555-0004",
    },
    {
        "name": "서울 용산 미술학원",
        "address": "서울특별시 용산구 이태원로 200",
        "latitude": 37.5340,
        "longitude": 126.9870,
        "phone": "02-555-0005",
    },
]

# Academy admin phones — 5명
ACADEMY_ADMIN_PHONES = ["01080000001", "01080000002", "01080000003", "01080000004", "01080000005"]
ACADEMY_ADMIN_NAMES = ["강남학원 김원장", "서초학원 이원장", "송파학원 박원장", "마포학원 최원장", "용산학원 정원장"]

# Driver data — 8명 (다양한 이름)
DRIVER_PHONES = [
    "01070000001", "01070000002", "01070000003", "01070000004",
    "01070000005", "01070000006", "01070000007", "01070000008",
]
DRIVER_NAMES = ["김안전", "이기사", "박운전", "최기사", "정드라이버", "한운수", "오기사", "장운전"]

# Safety escort data — 5명
ESCORT_PHONES = ["01060000001", "01060000002", "01060000003", "01060000004", "01060000005"]
ESCORT_NAMES = ["안전도우미 김", "안전도우미 이", "안전도우미 박", "안전도우미 최", "안전도우미 정"]

# Parent data: 15명 (실감 있는 이름)
PARENT_PHONES = [f"0109000000{i}" if i < 10 else f"010900000{i}" for i in range(1, 16)]
PARENT_NAMES = [
    "김민지맘", "이서윤맘", "박하준맘", "최지우맘", "정수아맘",
    "한도윤맘", "오시우맘", "장예준맘", "윤하은맘", "임지호맘",
    "강서준맘", "조은서맘", "신유나맘", "권지민맘", "황준서맘",
]

# Student names (2 per parent = 30명, 실감 있는 이름)
STUDENT_NAMES = [
    ("김민준", "김서연"),
    ("이서윤", "이도현"),
    ("박하준", "박지유"),
    ("최지우", "최시우"),
    ("정수아", "정예준"),
    ("한도윤", "한하은"),
    ("오시우", "오지호"),
    ("장예준", "장은서"),
    ("윤하은", "윤서준"),
    ("임지호", "임유나"),
    ("강서준", "강수빈"),
    ("조은서", "조민재"),
    ("신유나", "신태윤"),
    ("권지민", "권서현"),
    ("황준서", "황예린"),
]

# Vehicle data — 8대 (다양한 정원)
VEHICLE_DATA = [
    ("11가1001", 15, "현대유니버스", "안전운수(주)"),
    ("22나2002", 15, "현대카운티", "안전운수(주)"),
    ("33다3003", 25, "기아그랜버드", "강남교통(주)"),
    ("44라4004", 15, "현대카운티", "강남교통(주)"),
    ("55마5005", 25, "현대유니버스", "서초운수(주)"),
    ("66바6006", 15, "현대카운티", "서초운수(주)"),
    ("77사7007", 15, "기아봉고III", "송파교통(주)"),
    ("88아8008", 25, "현대유니버스", "마포운수(주)"),
]

# Gangnam-area pickup coordinates for schedule templates
PICKUP_LOCATIONS = [
    (37.5010, 127.0280, "강남구 역삼동 12-1"),
    (37.5045, 127.0245, "강남구 역삼동 45-3"),
    (37.4985, 127.0320, "강남구 대치동 23-5"),
    (37.5080, 127.0200, "강남구 논현동 78-2"),
    (37.4920, 127.0380, "강남구 대치동 67-9"),
    (37.5565, 126.9220, "마포구 합정동 33-7"),
    (37.5340, 126.9870, "용산구 한남동 15-2"),
    (37.5130, 127.1020, "송파구 잠실동 42-8"),
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

    # --- 1명 비활성 사용자 (탈퇴 사용자 시뮬레이션) ---
    inactive_user = User(
        role=UserRole.PARENT,
        phone="01099990099",
        name="탈퇴한학부모",
        is_active=False,
    )
    db.add(inactive_user)
    await db.flush()

    # --- Vehicles ---
    vehicles: list[Vehicle] = []
    for plate, cap, vtype, operator in VEHICLE_DATA:
        vehicle = Vehicle(
            license_plate=plate,
            capacity=cap,
            vehicle_type=vtype,
            operator_name=operator,
            is_yellow_painted=random.choice([True, False]),
            has_cctv=random.choice([True, True, False]),
            has_stop_sign=True,
            manufacture_year=random.randint(2020, 2025),
            insurance_expiry=date.today() + timedelta(days=random.randint(30, 365)),
            last_inspection_date=date.today() - timedelta(days=random.randint(10, 90)),
        )
        db.add(vehicle)
        vehicles.append(vehicle)
    await db.flush()
    counts["vehicles"] = len(vehicles)

    # --- Vehicle Assignments (오늘 기사 배차) ---
    today = date.today()
    assignment_count = 0
    for i, driver in enumerate(drivers):
        if i < len(vehicles):
            assignment = VehicleAssignment(
                vehicle_id=vehicles[i].id,
                driver_id=driver.id,
                assigned_date=today,
            )
            db.add(assignment)
            assignment_count += 1
    await db.flush()
    counts["vehicle_assignments"] = assignment_count

    # --- Guardian Consents (동의서 — 학부모 중 12명 동의) ---
    consent_count = 0
    consented_students = []
    for i, student in enumerate(all_students):
        if i < 24:  # 24명 학생 동의 (80%)
            consent = GuardianConsent(
                child_id=student.id,
                guardian_id=student.guardian_id,
                consent_scope={
                    "service_terms": True,
                    "privacy_policy": True,
                    "child_info_collection": True,
                    "location_tracking": True,
                },
                consent_method="app",
            )
            db.add(consent)
            consent_count += 1
            consented_students.append(student)
    await db.flush()
    counts["consents"] = consent_count

    # --- Schedule Templates (weekdays, random pickup time 14:00-17:00) ---
    template_count = 0
    for student in consented_students:
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

    # --- Billing Plans (각 학원에 1개씩) ---
    plan_data = [
        ("기본 요금제", 5000, 150000),
        ("프리미엄 요금제", 7000, 200000),
        ("경제 요금제", 4000, 120000),
        ("코딩학원 요금제", 6000, 180000),
        ("미술학원 요금제", 5500, 165000),
    ]
    billing_plans = []
    for i, academy in enumerate(academies):
        name, price, cap = plan_data[i] if i < len(plan_data) else ("기본", 5000, 150000)
        plan = BillingPlan(
            academy_id=academy.id,
            name=name,
            price_per_ride=price,
            monthly_cap=cap,
        )
        db.add(plan)
        billing_plans.append(plan)
    await db.flush()
    counts["billing_plans"] = len(billing_plans)

    # --- Invoices (지난달 청구서 — 다양한 상태) ---
    invoice_count = 0
    statuses = ["paid", "paid", "paid", "pending", "pending", "overdue"]
    for i, student in enumerate(all_students[:18]):
        stmt = select(Enrollment).where(Enrollment.student_id == student.id)
        result = await db.execute(stmt)
        enrollment = result.scalar_one_or_none()
        if not enrollment:
            continue
        rides = random.randint(10, 25)
        price = random.choice([4000, 5000, 6000, 7000])
        status = statuses[i % len(statuses)]
        invoice = Invoice(
            parent_id=student.guardian_id,
            academy_id=enrollment.academy_id,
            student_id=student.id,
            billing_month="2026-03",
            total_rides=rides,
            amount=rides * price,
            status=status,
            due_date=date(2026, 4, 10),
            paid_at=datetime.now(UTC) - timedelta(days=random.randint(1, 15)) if status == "paid" else None,
        )
        db.add(invoice)
        invoice_count += 1
    await db.flush()
    counts["invoices"] = invoice_count

    # --- Audit Logs (시드 생성 기록 + 샘플 활동) ---
    audit_actions = [
        ("CREATE", "academy", academies[0].id, "강남학원관리자", "학원 등록: 서울 강남 수학학원"),
        ("CREATE", "user", drivers[0].id, "플랫폼관리자", "기사 등록: 김안전"),
        ("CREATE", "student", all_students[0].id, "김민지맘", "학생 등록: 김민준"),
        ("UPDATE", "vehicle", vehicles[0].id, "강남학원관리자", "차량 정보 수정: 11가1001"),
        ("CREATE", "billing_plan", billing_plans[0].id, "강남학원관리자", "요금제 생성: 기본 요금제"),
        ("UPDATE", "user", drivers[1].id, "플랫폼관리자", "기사 자격 갱신: 이기사"),
        ("DELETE", "user", inactive_user.id, "플랫폼관리자", "사용자 비활성화: 탈퇴한학부모"),
        ("CREATE", "student", all_students[5].id, "한도윤맘", "학생 등록: 한도윤"),
    ]
    for action, entity_type, entity_id, user_name, details_text in audit_actions:
        log = AuditLog(
            user_id=str(academy_admin_users[0].id) if user_name.endswith("관리자") else str(parents[0].id),
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details_text,
            ip_address="127.0.0.1",
        )
        db.add(log)
    await db.flush()
    counts["audit_logs"] = len(audit_actions)

    # Add summary keys for web dashboard compatibility
    counts["users"] = counts.get("academy_admins", 0) + counts.get("drivers", 0) + counts.get("safety_escorts", 0) + counts.get("parents", 0) + 1  # +1 inactive
    counts["academies"] = len(academies)
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


async def search_students(db: AsyncSession, query: str) -> list:
    """ITEM-P1-24: Search students by name or guardian phone."""
    from app.modules.student_management.models import Enrollment

    # Search by student name — name_hash 기반 정확 일치 검색 (AES ciphertext 부분 일치 불가)
    # 부분 일치 검색은 보호자 전화번호로 가능 (phone_stmt). 추후 V1.x에 token-index 추가 예정.
    from app.common.security import compute_name_hash
    name_stmt = (
        select(Student, User, Academy)
        .outerjoin(User, Student.guardian_id == User.id)
        .outerjoin(Enrollment, Enrollment.student_id == Student.id)
        .outerjoin(Academy, Enrollment.academy_id == Academy.id)
        .where(Student.name_hash == compute_name_hash(query))
        .limit(50)
    )

    # Search by guardian phone
    phone_stmt = (
        select(Student, User, Academy)
        .outerjoin(User, Student.guardian_id == User.id)
        .outerjoin(Enrollment, Enrollment.student_id == Student.id)
        .outerjoin(Academy, Enrollment.academy_id == Academy.id)
        .where(User.phone.ilike(f"%{query}%"))
        .limit(50)
    )

    results = []
    seen_ids = set()

    for stmt in [name_stmt, phone_stmt]:
        rows = (await db.execute(stmt)).all()
        for student, guardian, academy in rows:
            if student.id in seen_ids:
                continue
            seen_ids.add(student.id)
            # P1-24 법률: 보호자 전화번호 마스킹 (개인정보보호법 §16 최소수집 원칙)
            raw_phone = guardian.phone if guardian else None
            masked_phone = _mask_phone_cs(raw_phone) if raw_phone else None
            results.append({
                "id": student.id,
                "name": student.name,
                "date_of_birth": str(student.date_of_birth) if student.date_of_birth else None,
                "grade": student.grade,
                "guardian_name": guardian.name if guardian else None,
                "guardian_phone": masked_phone,
                "academy_name": academy.name if academy else None,
                "is_active": student.is_active,
            })

    return results


def _mask_phone_cs(phone: str) -> str:
    """마스킹: 010-1234-5678 → 010-****-5678 (앞3 + **** + 뒤4)"""
    digits = phone.replace("-", "").replace(" ", "")
    if len(digits) >= 7:
        return digits[:3] + "****" + digits[-4:]
    return "***"


async def list_notification_logs(
    db: AsyncSession,
    user_id: str | None = None,
    notification_type: str | None = None,
    channel: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """ITEM-P1-25: List notification logs with filters."""
    from app.modules.notification.models import NotificationLog

    query = select(NotificationLog).order_by(NotificationLog.sent_at.desc())
    if user_id:
        query = query.where(NotificationLog.recipient_user_id == user_id)
    if notification_type:
        query = query.where(NotificationLog.notification_type == notification_type)
    if channel:
        query = query.where(NotificationLog.channel == channel)
    if status:
        query = query.where(NotificationLog.status == status)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    items = (await db.execute(query.offset(skip).limit(limit))).scalars().all()
    return {"items": list(items), "total": total or 0}


async def list_academy_drivers(db: AsyncSession, academy_id) -> list:
    """ITEM-P1-31: List drivers assigned to vehicles operating for an academy."""
    from app.modules.auth.models import DriverQualification
    from app.modules.scheduling.models import DailyScheduleInstance
    from app.modules.vehicle_telemetry.models import VehicleAssignment

    # Find drivers through VehicleAssignment → vehicle → DailyScheduleInstance.academy_id
    # or directly through DailyScheduleInstance which links vehicle_id to academy_id
    driver_ids_stmt = (
        select(VehicleAssignment.driver_id)
        .join(DailyScheduleInstance, DailyScheduleInstance.vehicle_id == VehicleAssignment.vehicle_id)
        .where(DailyScheduleInstance.academy_id == academy_id)
        .distinct()
    )

    stmt = (
        select(User, DriverQualification)
        .outerjoin(DriverQualification, DriverQualification.user_id == User.id)
        .where(
            User.role == UserRole.DRIVER,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
            User.id.in_(driver_ids_stmt),
        )
    )

    rows = (await db.execute(stmt)).all()
    results = []
    for user, dq in rows:
        results.append({
            "id": user.id,
            "name": user.name,
            "phone": user.phone[:3] + "****" + user.phone[-4:] if len(user.phone) >= 7 else user.phone,
            "is_active": user.is_active,
            "license_number": dq.license_number if dq else None,
            "license_type": dq.license_type if dq else None,
            "license_expiry": str(dq.license_expiry) if dq and dq.license_expiry else None,
            "criminal_check_date": str(dq.criminal_check_date) if dq and dq.criminal_check_date else None,
            "criminal_check_clear": dq.criminal_check_clear if dq else False,
            "safety_training_date": str(dq.safety_training_date) if dq and dq.safety_training_date else None,
            "safety_training_expiry": str(dq.safety_training_expiry) if dq and dq.safety_training_expiry else None,
            "is_qualified": dq.is_qualified if dq else False,
        })
    return results


async def get_academy_stats(
    db: AsyncSession, academy_id, start_date, end_date,
) -> dict:
    """ITEM-P2-54: Academy operation stats for a date range."""
    from app.modules.scheduling.models import DailyScheduleInstance

    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.academy_id == academy_id,
        DailyScheduleInstance.schedule_date >= start_date,
        DailyScheduleInstance.schedule_date <= end_date,
    )
    result = await db.execute(stmt)
    instances = list(result.scalars().all())

    total = len(instances)
    completed = sum(1 for i in instances if i.status == "completed")
    cancelled = sum(1 for i in instances if i.status == "cancelled")
    no_show = sum(1 for i in instances if i.status == "no_show")

    # On-time rate: completed without delay_notified_at
    on_time = sum(1 for i in instances if i.status == "completed" and not i.delay_notified_at)
    on_time_rate = (on_time / completed * 100) if completed > 0 else 100.0

    # Avg delay (only delayed instances)
    delayed = [i for i in instances if i.delay_notified_at and i.boarded_at]
    avg_delay = 0.0
    if delayed:
        delays = []
        for i in delayed:
            from datetime import datetime, time as time_type
            scheduled_dt = datetime.combine(i.schedule_date, i.pickup_time)
            actual_dt = i.boarded_at.replace(tzinfo=None) if i.boarded_at else scheduled_dt
            diff = (actual_dt - scheduled_dt).total_seconds() / 60
            delays.append(max(0, diff))
        avg_delay = sum(delays) / len(delays) if delays else 0.0

    return {
        "total_schedules": total,
        "completed": completed,
        "cancelled": cancelled,
        "no_show": no_show,
        "on_time_rate": round(on_time_rate, 1),
        "avg_delay_minutes": round(avg_delay, 1),
    }


async def create_support_ticket(db: AsyncSession, user, body) -> dict:
    """ITEM-P2-57: Create a support ticket."""
    from app.modules.admin.models import SupportTicket

    ticket = SupportTicket(
        user_id=user.id,
        category=body.category,
        subject=body.subject,
        description=body.description,
    )
    db.add(ticket)
    await db.flush()
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "user_name": user.name,
        "category": ticket.category,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "assigned_to": ticket.assigned_to,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
    }


async def list_support_tickets(db: AsyncSession, user, status_filter, skip, limit) -> dict:
    """ITEM-P2-57: List support tickets."""
    from app.modules.admin.models import SupportTicket
    from app.modules.auth.models import UserRole

    query = select(SupportTicket).order_by(SupportTicket.created_at.desc())

    # Non-admin users see only their own tickets
    if user.role not in (UserRole.PLATFORM_ADMIN, UserRole.ACADEMY_ADMIN):
        query = query.where(SupportTicket.user_id == user.id)

    if status_filter:
        query = query.where(SupportTicket.status == status_filter)

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    items = (await db.execute(query.offset(skip).limit(limit))).scalars().all()

    # Enrich with user_name
    user_ids = {t.user_id for t in items}
    users_map = {}
    if user_ids:
        u_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        users_map = {u.id: u.name for u in u_result.scalars().all()}

    ticket_list = []
    for t in items:
        ticket_list.append({
            "id": t.id,
            "user_id": t.user_id,
            "user_name": users_map.get(t.user_id),
            "category": t.category,
            "subject": t.subject,
            "description": t.description,
            "status": t.status,
            "assigned_to": t.assigned_to,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
        })
    return {"items": ticket_list, "total": total or 0}


async def update_support_ticket(db: AsyncSession, ticket_id, body) -> dict:
    """ITEM-P2-57: Update ticket status."""
    from app.modules.admin.models import SupportTicket
    from app.common.exceptions import NotFoundError

    ticket = (await db.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )).scalar_one_or_none()
    if not ticket:
        raise NotFoundError(detail="문의를 찾을 수 없습니다")

    if body.status:
        ticket.status = body.status
    if body.assigned_to:
        import uuid as _uuid
        ticket.assigned_to = _uuid.UUID(body.assigned_to)
    await db.flush()

    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "user_name": None,
        "category": ticket.category,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "assigned_to": ticket.assigned_to,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
    }


async def get_boarding_status(db: AsyncSession, target_date, current_user) -> dict:
    """ITEM-P2-58: Get boarding status for a date."""
    from app.modules.academy_management.models import Academy
    from app.modules.auth.models import UserRole
    from app.modules.scheduling.models import DailyScheduleInstance
    from app.modules.student_management.models import Student

    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.schedule_date == target_date,
    )
    # Academy admin sees only their academy
    if current_user.role == UserRole.ACADEMY_ADMIN:
        academy = (await db.execute(
            select(Academy).where(Academy.admin_id == current_user.id)
        )).scalar_one_or_none()
        if academy:
            stmt = stmt.where(DailyScheduleInstance.academy_id == academy.id)

    result = await db.execute(stmt.order_by(DailyScheduleInstance.pickup_time))
    instances = list(result.scalars().all())

    # Batch-load students and academies
    student_ids = {i.student_id for i in instances}
    academy_ids = {i.academy_id for i in instances}
    students_map = {}
    if student_ids:
        s_result = await db.execute(select(Student).where(Student.id.in_(student_ids)))
        students_map = {s.id: s.name for s in s_result.scalars().all()}
    academies_map = {}
    if academy_ids:
        a_result = await db.execute(select(Academy).where(Academy.id.in_(academy_ids)))
        academies_map = {a.id: a.name for a in a_result.scalars().all()}

    scheduled = sum(1 for i in instances if i.status == "scheduled" and not i.boarded_at)
    boarded = sum(1 for i in instances if i.boarded_at and not i.alighted_at and i.status != "completed")
    completed = sum(1 for i in instances if i.status == "completed")
    cancelled = sum(1 for i in instances if i.status == "cancelled")
    no_show = sum(1 for i in instances if i.status == "no_show")

    items = []
    for inst in instances:
        items.append({
            "student_id": inst.student_id,
            "student_name": students_map.get(inst.student_id, ""),
            "academy_name": academies_map.get(inst.academy_id),
            "status": inst.status,
            "pickup_time": str(inst.pickup_time) if inst.pickup_time else None,
            "boarded_at": inst.boarded_at,
            "alighted_at": inst.alighted_at,
        })

    return {
        "total": len(instances),
        "scheduled": scheduled,
        "boarded": boarded,
        "completed": completed,
        "cancelled": cancelled,
        "no_show": no_show,
        "items": items,
    }


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


# ---------------------------------------------------------------------------
# P3-75: CS support stats
# ---------------------------------------------------------------------------


async def get_support_stats(db: AsyncSession, period: str = "daily") -> dict:
    """P3-75: CS 일일/주간 리포트."""
    from datetime import datetime, timedelta, timezone
    from app.modules.admin.models import SupportTicket

    now = datetime.now(timezone.utc)
    if period == "weekly":
        start = now - timedelta(days=7)
    else:
        start = now - timedelta(days=1)

    query = select(SupportTicket).where(SupportTicket.created_at >= start)
    result = await db.execute(query)
    tickets = list(result.scalars().all())

    total = len(tickets)
    by_status: dict[str, int] = {}
    by_category: dict[str, int] = {}
    resolved_times: list[float] = []

    for t in tickets:
        by_status[t.status] = by_status.get(t.status, 0) + 1
        by_category[t.category] = by_category.get(t.category, 0) + 1
        if t.status in ("resolved", "closed") and t.updated_at and t.created_at:
            diff = (t.updated_at - t.created_at).total_seconds() / 3600
            resolved_times.append(diff)

    avg_resolution = round(sum(resolved_times) / len(resolved_times), 1) if resolved_times else None

    return {
        "total": total,
        "by_status": by_status,
        "by_category": by_category,
        "avg_resolution_hours": avg_resolution,
    }


# ---------------------------------------------------------------------------
# P3-76: Internal notes CRUD
# ---------------------------------------------------------------------------


async def create_internal_note(db: AsyncSession, user, body) -> dict:
    """P3-76: Create an internal note."""
    from app.modules.admin.models import InternalNote

    note = InternalNote(
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        author_id=user.id,
        author_name=user.name,
        content=body.content,
    )
    db.add(note)
    await db.flush()
    return {
        "id": note.id,
        "entity_type": note.entity_type,
        "entity_id": note.entity_id,
        "author_id": note.author_id,
        "author_name": note.author_name,
        "content": note.content,
        "created_at": note.created_at,
    }


async def list_internal_notes(db: AsyncSession, entity_type: str, entity_id: str) -> list[dict]:
    """P3-76: List internal notes for an entity."""
    from app.modules.admin.models import InternalNote

    stmt = (
        select(InternalNote)
        .where(InternalNote.entity_type == entity_type, InternalNote.entity_id == entity_id)
        .order_by(InternalNote.created_at.desc())
    )
    result = await db.execute(stmt)
    notes = result.scalars().all()
    return [
        {
            "id": n.id,
            "entity_type": n.entity_type,
            "entity_id": n.entity_id,
            "author_id": n.author_id,
            "author_name": n.author_name,
            "content": n.content,
            "created_at": n.created_at,
        }
        for n in notes
    ]


# ---------------------------------------------------------------------------
# P3-71: Monthly report
# ---------------------------------------------------------------------------


async def get_monthly_report(db: AsyncSession, academy_id, month_str: str) -> dict:
    """P3-71: Generate monthly report data."""
    from datetime import date as date_type, timedelta
    from app.modules.scheduling.models import DailyScheduleInstance

    # Parse month
    year, mon = month_str.split("-")
    start_date = date_type(int(year), int(mon), 1)
    if int(mon) == 12:
        end_date = date_type(int(year) + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date_type(int(year), int(mon) + 1, 1) - timedelta(days=1)

    stmt = select(DailyScheduleInstance).where(
        DailyScheduleInstance.academy_id == academy_id,
        DailyScheduleInstance.schedule_date >= start_date,
        DailyScheduleInstance.schedule_date <= end_date,
    )
    result = await db.execute(stmt)
    instances = list(result.scalars().all())

    total = len(instances)
    completed = sum(1 for i in instances if i.status == "completed")
    cancelled = sum(1 for i in instances if i.status == "cancelled")
    no_show = sum(1 for i in instances if i.status == "no_show")
    on_time = sum(1 for i in instances if i.status == "completed" and not i.delay_notified_at)
    on_time_rate = (on_time / completed * 100) if completed > 0 else 100.0

    from datetime import datetime
    delayed = [i for i in instances if i.delay_notified_at and i.boarded_at]
    avg_delay = 0.0
    if delayed:
        delays = []
        for i in delayed:
            scheduled_dt = datetime.combine(i.schedule_date, i.pickup_time)
            actual_dt = i.boarded_at.replace(tzinfo=None) if i.boarded_at else scheduled_dt
            diff = (actual_dt - scheduled_dt).total_seconds() / 60
            delays.append(max(0, diff))
        avg_delay = sum(delays) / len(delays) if delays else 0.0

    daily: dict[str, dict] = {}
    for i in instances:
        key = str(i.schedule_date)
        if key not in daily:
            daily[key] = {"date": key, "total": 0, "completed": 0, "cancelled": 0, "no_show": 0}
        daily[key]["total"] += 1
        if i.status == "completed":
            daily[key]["completed"] += 1
        elif i.status == "cancelled":
            daily[key]["cancelled"] += 1
        elif i.status == "no_show":
            daily[key]["no_show"] += 1

    return {
        "month": month_str,
        "total_schedules": total,
        "completed": completed,
        "cancelled": cancelled,
        "no_show": no_show,
        "on_time_rate": round(on_time_rate, 1),
        "avg_delay_minutes": round(avg_delay, 1),
        "daily_breakdown": sorted(daily.values(), key=lambda d: d["date"]),
    }
