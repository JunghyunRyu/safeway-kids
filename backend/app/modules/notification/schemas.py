from pydantic import BaseModel, Field


class SendTestPushRequest(BaseModel):
    device_token: str = Field(..., description="FCM 디바이스 토큰")
    title: str = Field(default="테스트 알림")
    body: str = Field(default="SAFEWAY KIDS 테스트 메시지입니다.")


class RegisterFcmTokenRequest(BaseModel):
    fcm_token: str = Field(..., min_length=1, max_length=500, description="FCM 디바이스 토큰")


class SosRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="GPS 위도")
    longitude: float = Field(..., ge=-180, le=180, description="GPS 경도")
    sos_type: str = Field(default="emergency", description="SOS 유형")
    message: str | None = Field(default=None, max_length=500, description="추가 메시지")


class SosResponse(BaseModel):
    success: bool
    emergency_numbers: dict = Field(default_factory=lambda: {"police": "112", "fire": "119"})


class ManualSendRequest(BaseModel):
    recipient_ids: list[str] = Field(..., min_length=1, description="수신자 UUID 목록")
    channel: str = Field(default="both", description="발송 채널: sms / fcm / both")
    message: str = Field(..., min_length=1, max_length=200, description="메시지 내용")
    purpose: str = Field(
        default="기타 운영 안내",
        description="발송 목적: 긴급 안전 안내 / 시스템 장애 공지 / 운행 변경 안내 / 기타 운영 안내",
    )


class NotificationPreferenceItem(BaseModel):
    channel: str = Field(..., description="fcm / sms")
    notification_type: str = Field(..., description="boarding / alighting / delay / arrival / no_show / sos")
    enabled: bool


class NotificationPreferencesResponse(BaseModel):
    preferences: list[NotificationPreferenceItem]


class NotificationPreferencesUpdateRequest(BaseModel):
    preferences: list[NotificationPreferenceItem] = Field(..., min_length=1)
