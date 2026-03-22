import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class GpsUpdateRequest(BaseModel):
    vehicle_id: uuid.UUID
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    heading: float | None = Field(default=None, ge=0, le=360)
    speed: float | None = Field(default=None, ge=0, description="km/h")


class GpsLocationResponse(BaseModel):
    vehicle_id: uuid.UUID
    latitude: float
    longitude: float
    heading: float | None
    speed: float | None
    recorded_at: str


class VehicleCreateRequest(BaseModel):
    license_plate: str = Field(..., max_length=20, description="차량 번호판")
    capacity: int = Field(..., ge=1, le=100, description="탑승 인원")
    operator_name: str | None = Field(default=None, description="운수업체명")
    manufacture_year: int | None = Field(default=None, description="제조연도")
    school_bus_registration_no: str | None = Field(default=None, max_length=30, description="어린이통학버스 신고번호")
    is_yellow_painted: bool = Field(default=False, description="황색 도색 여부")
    vehicle_type: str | None = Field(default=None, max_length=30, description="차량 유형")
    has_cctv: bool = Field(default=False, description="CCTV 장착 여부")
    has_stop_sign: bool = Field(default=False, description="정지 표지판 장착 여부")
    last_inspection_date: date | None = Field(default=None, description="최근 점검일")
    insurance_expiry: date | None = Field(default=None, description="보험 만료일")
    insurance_type: str | None = Field(default=None, max_length=50, description="보험 종류 (대인, 대물, 종합)")
    insurance_coverage_amount: int | None = Field(default=None, description="보장 금액 (만원)")
    registration_expiry: date | None = Field(default=None, description="등록 만료일")
    safety_inspection_expiry: date | None = Field(default=None, description="안전검사 만료일")


class VehicleResponse(BaseModel):
    id: uuid.UUID
    license_plate: str
    capacity: int
    operator_name: str | None
    manufacture_year: int | None = None
    school_bus_registration_no: str | None = None
    is_yellow_painted: bool = False
    vehicle_type: str | None = None
    has_cctv: bool = False
    has_stop_sign: bool = False
    last_inspection_date: date | None = None
    insurance_expiry: date | None = None
    insurance_type: str | None = None
    insurance_coverage_amount: int | None = None
    registration_expiry: date | None = None
    safety_inspection_expiry: date | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VehicleUpdateRequest(BaseModel):
    license_plate: str | None = Field(default=None, max_length=20, description="차량 번호판")
    capacity: int | None = Field(default=None, ge=1, le=100, description="탑승 인원")
    model_name: str | None = Field(default=None, max_length=200, description="차량 모델명")
    is_active: bool | None = Field(default=None, description="활성 상태")
    manufacture_year: int | None = Field(default=None, description="제조연도")
    school_bus_registration_no: str | None = Field(default=None, max_length=30, description="어린이통학버스 신고번호")
    is_yellow_painted: bool | None = Field(default=None, description="황색 도색 여부")
    vehicle_type: str | None = Field(default=None, max_length=30, description="차량 유형")
    has_cctv: bool | None = Field(default=None, description="CCTV 장착 여부")
    has_stop_sign: bool | None = Field(default=None, description="정지 표지판 장착 여부")
    last_inspection_date: date | None = Field(default=None, description="최근 점검일")
    insurance_expiry: date | None = Field(default=None, description="보험 만료일")
    insurance_type: str | None = Field(default=None, max_length=50, description="보험 종류")
    insurance_coverage_amount: int | None = Field(default=None, description="보장 금액 (만원)")
    registration_expiry: date | None = Field(default=None, description="등록 만료일")
    safety_inspection_expiry: date | None = Field(default=None, description="안전검사 만료일")


class VehicleAssignmentResponse(BaseModel):
    vehicle_id: uuid.UUID
    license_plate: str
    capacity: int
    operator_name: str | None
    safety_escort_name: str | None = None
    assigned_date: datetime
