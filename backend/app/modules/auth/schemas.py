import uuid
from datetime import datetime

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


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


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
