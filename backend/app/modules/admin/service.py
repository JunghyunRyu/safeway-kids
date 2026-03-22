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


async def search_students(db: AsyncSession, query: str) -> list:
    """ITEM-P1-24: Search students by name or guardian phone."""
    from app.modules.student_management.models import Enrollment

    # Search by student name
    name_stmt = (
        select(Student, User, Academy)
        .outerjoin(User, Student.guardian_id == User.id)
        .outerjoin(Enrollment, Enrollment.student_id == Student.id)
        .outerjoin(Academy, Enrollment.academy_id == Academy.id)
        .where(Student.name.ilike(f"%{query}%"))
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
