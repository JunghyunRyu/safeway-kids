import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ConsentCreateRequest(BaseModel):
    child_id: uuid.UUID
    consent_scope: dict = Field(
        default_factory=lambda: {
            "location_tracking": True,
            "push_notification": True,
            "facial_recognition": False,
        },
        description="동의 범위",
    )
    consent_method: str = Field(default="phone_otp", description="동의 방법")


class ConsentResponse(BaseModel):
    id: uuid.UUID
    guardian_id: uuid.UUID
    child_id: uuid.UUID
    consent_scope: dict
    consent_method: str
    granted_at: datetime
    withdrawn_at: datetime | None

    model_config = {"from_attributes": True}


class ConsentWithdrawRequest(BaseModel):
    reason: str | None = Field(default=None, description="철회 사유")


class ContractCreateRequest(BaseModel):
    academy_id: uuid.UUID
    operator_name: str
    vehicle_id: uuid.UUID
    contract_type: str = "charter_transport"
    effective_from: datetime
    effective_until: datetime
    terms: dict | None = None


class ContractResponse(BaseModel):
    id: uuid.UUID
    academy_id: uuid.UUID
    operator_name: str
    vehicle_id: uuid.UUID
    contract_type: str
    effective_from: datetime
    effective_until: datetime
    terms: dict | None
    signed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Compliance Document schemas ---


class DocumentUploadRequest(BaseModel):
    academy_id: uuid.UUID
    document_type: str = Field(
        description=(
            "문서 유형: insurance_cert, police_report, safety_training, vehicle_inspection, other"
        ),
    )
    expires_at: datetime | None = Field(default=None, description="만료일")


class DocumentResponse(BaseModel):
    id: uuid.UUID
    academy_id: uuid.UUID
    document_type: str
    file_name: str
    file_path: str
    uploaded_at: datetime
    expires_at: datetime | None
    uploaded_by: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True}
