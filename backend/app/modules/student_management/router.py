import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rbac import require_roles
from app.modules.auth.models import User, UserRole
from app.modules.student_management import service
from app.modules.student_management.schemas import (
    BulkUploadResponse,
    EnrollmentCreateRequest,
    EnrollmentResponse,
    PaginatedStudentListResponse,
    SecondaryGuardianCreateRequest,
    SecondaryGuardianResponse,
    StudentCreateRequest,
    StudentResponse,
    StudentUpdateRequest,
)

router = APIRouter()


@router.post("", response_model=StudentResponse, status_code=201)
async def create_student(
    body: StudentCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> StudentResponse:
    """자녀 등록"""
    from app.modules.admin.service import log_audit

    student = await service.create_student(db, current_user.id, body)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="CREATE",
        entity_type="student",
        entity_id=str(student.id),
        details={"name": body.name, "grade": body.grade},
        ip_address=request.client.host if request.client else None,
    )
    return StudentResponse.model_validate(student)


MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_students(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> BulkUploadResponse:
    """엑셀 파일로 학생 일괄 등록"""
    # Validate file type
    if file.content_type not in (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
    ):
        filename = file.filename or ""
        if not filename.endswith(".xlsx"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=".xlsx 파일만 업로드할 수 있습니다",
            )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일 크기는 5MB를 초과할 수 없습니다",
        )

    results = await service.bulk_upload_students(db, current_user.id, contents)

    success_count = sum(1 for r in results if r.status == "success")
    error_count = sum(1 for r in results if r.status == "error")

    return BulkUploadResponse(
        total=success_count + error_count,
        success_count=success_count,
        error_count=error_count,
        results=results,
    )


@router.get("", response_model=PaginatedStudentListResponse)
async def list_students(
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> dict:
    """내 자녀 목록 (학부모) / 학원 전체 학생 목록 (학원 관리자) / 전체 학생 (플랫폼 관리자) — 페이지네이션"""
    skip = (page - 1) * page_size
    if current_user.role == UserRole.PLATFORM_ADMIN:
        result = await service.list_all_students(db, skip=skip, limit=page_size)
    elif current_user.role == UserRole.ACADEMY_ADMIN:
        result = await service.list_students_by_academy(db, current_user.id, skip=skip, limit=page_size)
    else:
        result = await service.list_students_by_guardian(db, current_user.id, skip=skip, limit=page_size)
    return result


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN
    )),
) -> StudentResponse:
    """자녀 상세 조회 (소유권 확인)"""
    from app.common.exceptions import ForbiddenError

    student = await service.get_student(db, student_id)
    if current_user.role == UserRole.PARENT and student.guardian_id != current_user.id:
        raise ForbiddenError(detail="본인의 자녀 정보만 조회할 수 있습니다")
    return StudentResponse.model_validate(student)


@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: uuid.UUID,
    body: StudentUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> StudentResponse:
    """자녀 정보 수정 (학부모 본인 / 학원 관리자 / 플랫폼 관리자)"""
    from app.modules.admin.service import log_audit

    student = await service.update_student(db, student_id, current_user, body)
    changes = {}
    if body.name is not None:
        changes["name"] = body.name
    if body.grade is not None:
        changes["grade"] = body.grade
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="UPDATE",
        entity_type="student",
        entity_id=str(student_id),
        details=changes,
        ip_address=request.client.host if request.client else None,
    )
    return StudentResponse.model_validate(student)


@router.delete("/{student_id}", response_model=StudentResponse)
async def deactivate_student(
    student_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)
    ),
) -> StudentResponse:
    """자녀 비활성화 (소프트 삭제) (학부모 본인 / 학원 관리자 / 플랫폼 관리자)"""
    from app.modules.admin.service import log_audit

    student = await service.deactivate_student(db, student_id, current_user)
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="DELETE",
        entity_type="student",
        entity_id=str(student_id),
        ip_address=request.client.host if request.client else None,
    )
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


@router.post("/{student_id}/guardians", response_model=SecondaryGuardianResponse, status_code=201)
async def add_secondary_guardian(
    student_id: uuid.UUID,
    body: SecondaryGuardianCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> SecondaryGuardianResponse:
    """ITEM-P2-40: 보조 보호자 추가 (주 보호자만 가능, 최대 3명)"""
    result = await service.add_secondary_guardian(db, student_id, current_user.id, body)
    return result


@router.get("/{student_id}/guardians", response_model=list[SecondaryGuardianResponse])
async def list_secondary_guardians(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN)),
) -> list[SecondaryGuardianResponse]:
    """ITEM-P2-40: 보조 보호자 목록"""
    return await service.list_secondary_guardians(db, student_id, current_user)


@router.delete("/{student_id}/guardians/{guardian_id}")
async def remove_secondary_guardian(
    student_id: uuid.UUID,
    guardian_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
) -> dict:
    """ITEM-P2-40: 보조 보호자 삭제"""
    await service.remove_secondary_guardian(db, student_id, current_user.id, guardian_id)
    return {"status": "ok"}


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
