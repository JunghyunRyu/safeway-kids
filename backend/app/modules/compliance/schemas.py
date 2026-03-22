import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ConsentScopeModel(BaseModel):
    """구조화된 동의 범위 (필수/선택 구분)"""
    # 필수 동의
    service_terms: bool = Field(..., description="서비스 이용약관 동의")
    privacy_policy: bool = Field(..., description="개인정보 처리방침 동의")
    child_info_collection: bool = Field(..., description="아동 개인정보 수집 동의")
    # 선택 동의
    location_tracking: bool = Field(default=False, description="위치정보 수집 동의")
    push_notification: bool = Field(default=True, description="푸시 알림 수신 동의")
    marketing: bool = Field(default=False, description="마케팅 정보 수신 동의")
    third_party_sharing: bool = Field(default=False, description="제3자 제공 동의")


class ConsentCreateRequest(BaseModel):
    child_id: uuid.UUID
    consent_scope: dict = Field(
        default_factory=lambda: {
            "service_terms": True,
            "privacy_policy": True,
            "child_info_collection": True,
            "location_tracking": False,
            "push_notification": True,
            "marketing": False,
            "third_party_sharing": False,
        },
        description="동의 범위 (필수: service_terms, privacy_policy, child_info_collection)",
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
