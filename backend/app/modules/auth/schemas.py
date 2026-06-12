import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.modules.auth.models import UserRole


class KakaoLoginRequest(BaseModel):
    code: str = Field(..., description="카카오 인가 코드")
    redirect_uri: str | None = None
    # PT/CC 소셜 로그인 (FR-M4) — 미지정 시 기존 동작(SafeWay parent) 유지
    app_context: str | None = Field(default=None)
    role: UserRole | None = Field(default=None)


class OtpSendRequest(BaseModel):
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$", description="휴대폰 번호 (01012345678)")


class ConsentItem(BaseModel):
    """동의 항목 — doc_version은 consent_docs 레지스트리의 현재 버전과 일치해야 함 (FR-C2)."""

    doc_type: str = Field(..., max_length=20, description="terms|privacy|location|marketing|age14")
    doc_version: str = Field(..., max_length=64)


class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$")
    code: str = Field(..., min_length=6, max_length=6, description="인증번호 6자리")
    # 신규 가입에만 필수 — 기존 사용자 로그인은 빈 값 허용 (이름 덮어쓰기 방지, FR-M3)
    name: str = Field(default="", max_length=100, description="사용자 이름 (신규 가입 시 필수)")
    role: UserRole = Field(default=UserRole.PARENT, description="사용자 역할")
    app_context: str | None = Field(default=None, description="앱 컨텍스트 (미지정시 역할에서 자동 추론)")
    consents: list[ConsentItem] | None = Field(
        default=None, description="동의 항목 (PT/CC 신규 가입 시 필수 동의 포함)"
    )


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
    # 기존 사용자가 현재 버전 필수 동의를 미보유한 경우 — 클라이언트가 동의 화면으로 유도 (FR-C3)
    required_consents: list[str] | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ConsentRecordResponse(BaseModel):
    doc_type: str
    doc_version: str
    consent_method: str
    granted_at: datetime
    withdrawn_at: datetime | None

    model_config = {"from_attributes": True}


class ConsentListResponse(BaseModel):
    consents: list[ConsentRecordResponse]
    missing_required: list[str]


class ConsentUpdateRequest(BaseModel):
    grant: list[ConsentItem] | None = Field(default=None, description="추가 동의")
    withdraw: list[str] | None = Field(default=None, description="철회할 doc_type 목록")


class FirebaseCustomTokenResponse(BaseModel):
    custom_token: str
    firebase_uid: str


class FirebaseLinkRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token (signInWithCustomToken 이후)")


class FirebaseRegisterRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token (소셜 sign-in 직후)")
    name: str = Field(..., min_length=1, max_length=100)
    # 소셜 가입도 phone OTP 본인확인 필수 (Consensus #4 — users.phone 신뢰 유지)
    phone: str = Field(..., pattern=r"^01[0-9]{8,9}$")
    otp_code: str = Field(..., min_length=6, max_length=6, description="phone으로 발송된 인증번호")
    role: UserRole = Field(...)
    app_context: str | None = None
    consents: list[ConsentItem] = Field(default_factory=list)


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
