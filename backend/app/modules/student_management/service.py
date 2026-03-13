import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError
from app.middleware.consent import require_consent
from app.modules.student_management.models import Enrollment, Student
from app.modules.student_management.schemas import (
    EnrollmentCreateRequest,
    StudentCreateRequest,
    StudentUpdateRequest,
)


async def create_student(
    db: AsyncSession, guardian_id: uuid.UUID, request: StudentCreateRequest
) -> Student:
    # Consent check is done at registration time (consent must exist before creating student data)
    student = Student(
        guardian_id=guardian_id,
        name=request.name,
        date_of_birth=request.date_of_birth,
        grade=request.grade,
    )
    db.add(student)
    await db.flush()
    return student


async def get_student(db: AsyncSession, student_id: uuid.UUID) -> Student:
    stmt = select(Student).where(Student.id == student_id, Student.deleted_at.is_(None))
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError(detail="학생을 찾을 수 없습니다")
    return student


async def list_students_by_guardian(
    db: AsyncSession, guardian_id: uuid.UUID
) -> list[Student]:
    stmt = (
        select(Student)
        .where(Student.guardian_id == guardian_id, Student.deleted_at.is_(None))
        .order_by(Student.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_student(
    db: AsyncSession,
    student_id: uuid.UUID,
    guardian_id: uuid.UUID,
    request: StudentUpdateRequest,
) -> Student:
    student = await get_student(db, student_id)
    if student.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 자녀만 수정할 수 있습니다")

    if request.name is not None:
        student.name = request.name
    if request.grade is not None:
        student.grade = request.grade

    await db.flush()
    return student


async def deactivate_student(
    db: AsyncSession, student_id: uuid.UUID, guardian_id: uuid.UUID
) -> Student:
    student = await get_student(db, student_id)
    if student.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 자녀만 비활성화할 수 있습니다")

    student.is_active = False
    student.deleted_at = datetime.now(UTC)
    await db.flush()
    return student


async def enroll_student(
    db: AsyncSession,
    student_id: uuid.UUID,
    guardian_id: uuid.UUID,
    request: EnrollmentCreateRequest,
) -> Enrollment:
    student = await get_student(db, student_id)
    if student.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 자녀만 등록할 수 있습니다")

    # Check consent
    await require_consent(db, guardian_id, student_id)

    # Check duplicate
    stmt = select(Enrollment).where(
        Enrollment.student_id == student_id,
        Enrollment.academy_id == request.academy_id,
        Enrollment.withdrawn_at.is_(None),
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise ConflictError(detail="이미 등록된 학원입니다")

    enrollment = Enrollment(
        student_id=student_id,
        academy_id=request.academy_id,
    )
    db.add(enrollment)
    await db.flush()
    return enrollment


async def list_enrollments(
    db: AsyncSession, student_id: uuid.UUID, guardian_id: uuid.UUID
) -> list[Enrollment]:
    """List active enrollments for a student (parent only)."""
    student = await get_student(db, student_id)
    if student.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 자녀 등록만 조회할 수 있습니다")

    stmt = (
        select(Enrollment)
        .where(Enrollment.student_id == student_id, Enrollment.withdrawn_at.is_(None))
        .order_by(Enrollment.enrolled_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def withdraw_enrollment(
    db: AsyncSession,
    enrollment_id: uuid.UUID,
    guardian_id: uuid.UUID,
) -> Enrollment:
    stmt = select(Enrollment).where(Enrollment.id == enrollment_id)
    result = await db.execute(stmt)
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise NotFoundError(detail="등록 정보를 찾을 수 없습니다")

    # Verify ownership via student
    student = await get_student(db, enrollment.student_id)
    if student.guardian_id != guardian_id:
        from app.common.exceptions import ForbiddenError
        raise ForbiddenError(detail="본인의 자녀 등록만 철회할 수 있습니다")

    enrollment.withdrawn_at = datetime.now(UTC)
    await db.flush()
    return enrollment
