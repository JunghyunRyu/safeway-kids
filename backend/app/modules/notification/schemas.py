from pydantic import BaseModel, Field


class SendTestPushRequest(BaseModel):
    device_token: str = Field(..., description="FCM 디바이스 토큰")
    title: str = Field(default="테스트 알림")
    body: str = Field(default="SAFEWAY KIDS 테스트 메시지입니다.")


class RegisterFcmTokenRequest(BaseModel):
    fcm_token: str = Field(..., min_length=1, max_length=500, description="FCM 디바이스 토큰")
