from app.modules.notification.providers.base import NotificationProvider, SmsProvider
from app.modules.notification.providers.fcm import FCMProvider
from app.modules.notification.providers.sms import NHNCloudSmsProvider

# Singleton providers
_push_provider: NotificationProvider = FCMProvider()
_sms_provider: SmsProvider = NHNCloudSmsProvider()


async def send_boarding_notification(
    device_token: str, student_name: str, vehicle_plate: str
) -> bool:
    """학생 탑승 알림"""
    return await _push_provider.send_push(
        device_token=device_token,
        title="탑승 완료",
        body=f"{student_name} 학생이 차량({vehicle_plate})에 탑승했습니다.",
        data={"type": "boarding", "student_name": student_name},
    )


async def send_alighting_notification(
    device_token: str, student_name: str
) -> bool:
    """학생 하차 알림"""
    return await _push_provider.send_push(
        device_token=device_token,
        title="하차 완료",
        body=f"{student_name} 학생이 안전하게 하차했습니다.",
        data={"type": "alighting", "student_name": student_name},
    )


async def send_schedule_cancelled_notification(
    device_token: str, student_name: str, schedule_date: str
) -> bool:
    """스케줄 취소 알림"""
    return await _push_provider.send_push(
        device_token=device_token,
        title="스케줄 취소",
        body=f"{student_name} 학생의 {schedule_date} 스케줄이 취소되었습니다.",
        data={"type": "schedule_cancelled"},
    )


async def send_critical_alert_sms(phone: str, message: str) -> bool:
    """안전 관련 긴급 SMS (FCM + SMS 이중 경로)"""
    return await _sms_provider.send_sms(phone, message)


async def send_otp_sms(phone: str, code: str) -> bool:
    """OTP 인증번호 SMS"""
    return await _sms_provider.send_sms(
        phone, f"[SAFEWAY KIDS] 인증번호: {code} (3분 내 입력해주세요)"
    )
