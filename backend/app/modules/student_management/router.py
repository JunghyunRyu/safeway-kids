import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.student_management import service
from app.modules.student_management.schemas import (
    EnrollmentCreateRequest,
    EnrollmentResponse,
    StudentCreateRequest,
    StudentResponse,
    StudentUpdateRequest,
)

router = APIRouter()


@router.post("", response_model=StudentResponse, status_code=201)
async def create_student(
    body: StudentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> StudentResponse:
    """자녀 등록"""
    student = await service.create_student(db, current_user.id, body)
    return StudentResponse.model_validate(student)


@router.get("", response_model=list[StudentResponse])
async def list_students(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> list[StudentResponse]:
    """내 자녀 목록"""
    students = await service.list_students_by_guardian(db, current_user.id)
    return [StudentResponse.model_validate(s) for s in students]


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> StudentResponse:
    """자녀 상세 조회"""
    student = await service.get_student(db, student_id)
    return StudentResponse.model_validate(student)


@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: uuid.UUID,
    body: StudentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> StudentResponse:
    """자녀 정보 수정"""
    student = await service.update_student(db, student_id, current_user.id, body)
    return StudentResponse.model_validate(student)


@router.delete("/{student_id}", response_model=StudentResponse)
async def deactivate_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> StudentResponse:
    """자녀 비활성화 (소프트 삭제)"""
    student = await service.deactivate_student(db, student_id, current_user.id)
    return StudentResponse.model_validate(student)


@router.get("/{student_id}/enrollments", response_model=list[EnrollmentResponse])
async def list_enrollments(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> list[EnrollmentResponse]:
    """자녀 학원 등록 목록"""
    enrollments = await service.list_enrollments(db, student_id, current_user.id)
    return [EnrollmentResponse.model_validate(e) for e in enrollments]


@router.post("/{student_id}/enrollments", response_model=EnrollmentResponse, status_code=201)
async def enroll_student(
    student_id: uuid.UUID,
    body: EnrollmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> EnrollmentResponse:
    """학원 등록"""
    enrollment = await service.enroll_student(db, student_id, current_user.id, body)
    return EnrollmentResponse.model_validate(enrollment)


@router.delete(
    "/{student_id}/enrollments/{enrollment_id}", response_model=EnrollmentResponse
)
async def withdraw_enrollment(
    student_id: uuid.UUID,
    enrollment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> EnrollmentResponse:
    """학원 등록 철회"""
    enrollment = await service.withdraw_enrollment(db, enrollment_id, current_user.id)
    return EnrollmentResponse.model_validate(enrollment)
