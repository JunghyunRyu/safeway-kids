import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class StudentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="학생 이름")
    date_of_birth: date = Field(..., description="생년월일")
    grade: str | None = Field(default=None, max_length=20, description="학년")
    guardian_phone: str | None = Field(default=None, pattern=r"^01[0-9]{8,9}$", description="보호자 전화번호")


class StudentUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    grade: str | None = None


class StudentResponse(BaseModel):
    id: uuid.UUID
    guardian_id: uuid.UUID
    name: str
    date_of_birth: date
    grade: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EnrollmentCreateRequest(BaseModel):
    academy_id: uuid.UUID


class EnrollmentResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    academy_id: uuid.UUID
    enrolled_at: datetime
    withdrawn_at: datetime | None

    model_config = {"from_attributes": True}


class PaginatedStudentListResponse(BaseModel):
    items: list[StudentResponse]
    total: int


class BulkUploadRowResult(BaseModel):
    row: int = Field(..., description="엑셀 행 번호")
    status: str = Field(..., description="success 또는 error")
    message: str = Field(..., description="결과 메시지")


class BulkUploadResponse(BaseModel):
    total: int = Field(..., description="전체 행 수")
    success_count: int = Field(..., description="성공 건수")
    error_count: int = Field(..., description="실패 건수")
    results: list[BulkUploadRowResult] = Field(..., description="행별 결과")
