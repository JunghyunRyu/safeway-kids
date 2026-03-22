import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.modules.auth.models import UserRole


class KakaoLoginRequest(BaseModel):
    code: str = Field(..., description="카카오 인가 코드")
    redirect_uri: str | None = None


class OtpSendRequest(BaseModel):
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$", description="휴대폰 번호 (01012345678)")


class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$")
    code: str = Field(..., min_length=6, max_length=6, description="인증번호 6자리")
    name: str = Field(..., min_length=1, max_length=100, description="사용자 이름")
    role: UserRole = Field(default=UserRole.PARENT, description="사용자 역할")


class TokenUserInfo(BaseModel):
    id: str
    phone: str
    name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: TokenUserInfo


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    role: UserRole
    phone: str
    email: str | None
    name: str
    kakao_id: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    id: uuid.UUID
    phone: str
    name: str
    role: UserRole
    academy_sub_role: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserListItem]
    total: int


class UserCreateRequest(BaseModel):
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$", description="휴대폰 번호")
    name: str = Field(..., min_length=1, max_length=100, description="사용자 이름")
    role: UserRole = Field(..., description="사용자 역할")
    academy_sub_role: str | None = Field(default=None, description="P3-67: 학원 내부 역할 (owner/manager/staff)")


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100, description="사용자 이름")
    role: UserRole | None = Field(default=None, description="사용자 역할")
    is_active: bool | None = Field(default=None, description="활성 상태")
    academy_sub_role: str | None = Field(default=None, description="P3-67: 학원 내부 역할 (owner/manager/staff)")


class PaginatedUserListResponse(BaseModel):
    items: list[UserListItem]
    total: int


class DriverQualificationRequest(BaseModel):
    license_number: str = Field(..., max_length=20, description="면허번호")
    license_type: str = Field(..., max_length=50, description="면허 종류 (1종대형, 1종보통 등)")
    license_expiry: date = Field(..., description="면허 만료일")
    criminal_check_date: date | None = Field(default=None, description="범죄경력 조회일")
    criminal_check_clear: bool = Field(default=False, description="범죄경력 결과 (적격)")
    safety_training_date: date | None = Field(default=None, description="안전교육 이수일")
    safety_training_expiry: date | None = Field(default=None, description="안전교육 만료일")


class DriverQualificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    license_number: str
    license_type: str
    license_expiry: date
    criminal_check_date: date | None
    criminal_check_clear: bool
    safety_training_date: date | None
    safety_training_expiry: date | None
    is_qualified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj: object, **kwargs: object) -> "DriverQualificationResponse":
        """Decrypt license_number (AES-256 stored as 고유식별정보)."""
        instance = super().model_validate(obj, **kwargs)
        try:
            from app.common.security import decrypt_value
            instance.license_number = decrypt_value(instance.license_number)
        except Exception:
            pass  # already plaintext or decryption error
        return instance
