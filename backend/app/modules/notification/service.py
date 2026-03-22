import logging
import uuid

from app.modules.notification.providers.base import NotificationProvider, SmsProvider
from app.modules.notification.providers.fcm import FCMProvider
from app.modules.notification.providers.sms import NHNCloudSmsProvider

logger = logging.getLogger(__name__)

# Singleton providers
_push_provider: NotificationProvider = FCMProvider()
_sms_provider: SmsProvider = NHNCloudSmsProvider()


async def _log_notification(
    channel: str,
    notification_type: str,
    title: str | None,
    body: str | None,
    status: str,
    recipient_user_id: uuid.UUID | None = None,
    recipient_phone: str | None = None,
    error_message: str | None = None,
) -> None:
    """Record a notification dispatch to the notification_logs table."""
    try:
        from app.database import async_session_factory
        from app.modules.notification.models import NotificationLog

        log = NotificationLog(
            recipient_user_id=recipient_user_id,
            recipient_phone=recipient_phone,
            channel=channel,
            notification_type=notification_type,
            title=title,
            body=body,
            status=status,
            error_message=error_message,
        )
        async with async_session_factory() as db:
            db.add(log)
            await db.commit()
    except Exception:
        logger.warning("Failed to write notification log", exc_info=True)


async def _is_notification_enabled(
    user_id: uuid.UUID, notification_type: str, channel: str
) -> bool:
    """Check if a user has this notification type enabled. Default=True if no pref set."""
    try:
        from sqlalchemy import select

        from app.database import async_session_factory
        from app.modules.notification.models import NotificationPreference

        async with async_session_factory() as db:
            stmt = select(NotificationPreference).where(
                NotificationPreference.user_id == user_id,
                NotificationPreference.channel == channel,
                NotificationPreference.notification_type == notification_type,
            )
            pref = (await db.execute(stmt)).scalar_one_or_none()
            if pref is None:
                return True  # default enabled
            return pref.enabled
    except Exception:
        logger.warning("Failed to check notification preference", exc_info=True)
        return True  # fail-open


async def send_boarding_notification(
    device_token: str, student_name: str, vehicle_plate: str,
    parent_phone: str | None = None,
    recipient_user_id: uuid.UUID | None = None,
) -> bool:
    """학생 탑승 알림 (FCM 실패 시 SMS 폴백) — P2-41: preference check"""
    # P2-41: check user preference before sending
    if recipient_user_id and not await _is_notification_enabled(recipient_user_id, "boarding", "fcm"):
        logger.info("[NOTIFICATION] boarding FCM disabled for user=%s", recipient_user_id)
        return True  # treated as success (user opted out)
    title = "탑승 완료"
    body = f"{student_name} 학생이 차량({vehicle_plate})에 탑승했습니다."
    success = await _push_provider.send_push(
        device_token=device_token,
        title=title,
        body=body,
        data={"type": "boarding", "student_name": student_name},
    )
    await _log_notification(
        channel="fcm", notification_type="boarding", title=title, body=body,
        status="sent" if success else "failed",
        recipient_user_id=recipient_user_id,
    )
    if not success and parent_phone:
        logger.warning("[NOTIFICATION] FCM failed for boarding, falling back to SMS: %s", parent_phone)
        sms_body = f"[세이프웨이키즈] {body}"
        success = await _sms_provider.send_sms(parent_phone, sms_body)
        await _log_notification(
            channel="sms", notification_type="boarding", title=title, body=sms_body,
            status="sent" if success else "failed",
            recipient_user_id=recipient_user_id, recipient_phone=parent_phone,
        )
    return success


async def send_alighting_notification(
    device_token: str, student_name: str,
    parent_phone: str | None = None,
    recipient_user_id: uuid.UUID | None = None,
) -> bool:
    """학생 하차 알림 (FCM 실패 시 SMS 폴백) — P2-41: preference check"""
    if recipient_user_id and not await _is_notification_enabled(recipient_user_id, "alighting", "fcm"):
        logger.info("[NOTIFICATION] alighting FCM disabled for user=%s", recipient_user_id)
        return True
    title = "하차 완료"
    body = f"{student_name} 학생이 안전하게 하차했습니다."
    success = await _push_provider.send_push(
        device_token=device_token,
        title=title,
        body=body,
        data={"type": "alighting", "student_name": student_name},
    )
    await _log_notification(
        channel="fcm", notification_type="alighting", title=title, body=body,
        status="sent" if success else "failed",
        recipient_user_id=recipient_user_id,
    )
    if not success and parent_phone:
        logger.warning("[NOTIFICATION] FCM failed for alighting, falling back to SMS: %s", parent_phone)
        sms_body = f"[세이프웨이키즈] {body}"
        success = await _sms_provider.send_sms(parent_phone, sms_body)
        await _log_notification(
            channel="sms", notification_type="alighting", title=title, body=sms_body,
            status="sent" if success else "failed",
            recipient_user_id=recipient_user_id, recipient_phone=parent_phone,
        )
    return success


async def send_schedule_cancelled_notification(
    device_token: str, student_name: str, schedule_date: str,
    parent_phone: str | None = None,
    recipient_user_id: uuid.UUID | None = None,
) -> bool:
    """스케줄 취소 알림 (FCM 실패 시 SMS 폴백)"""
    title = "스케줄 취소"
    body = f"{student_name} 학생의 {schedule_date} 스케줄이 취소되었습니다."
    success = await _push_provider.send_push(
        device_token=device_token,
        title=title,
        body=body,
        data={"type": "schedule_cancelled"},
    )
    await _log_notification(
        channel="fcm", notification_type="schedule_cancelled", title=title, body=body,
        status="sent" if success else "failed",
        recipient_user_id=recipient_user_id,
    )
    if not success and parent_phone:
        logger.warning("[NOTIFICATION] FCM failed for schedule cancel, falling back to SMS: %s", parent_phone)
        sms_body = f"[세이프웨이키즈] {body}"
        success = await _sms_provider.send_sms(parent_phone, sms_body)
        await _log_notification(
            channel="sms", notification_type="schedule_cancelled", title=title, body=sms_body,
            status="sent" if success else "failed",
            recipient_user_id=recipient_user_id, recipient_phone=parent_phone,
        )
    return success


async def send_critical_alert_sms(phone: str, message: str) -> bool:
    """안전 관련 긴급 SMS (실패 시 1회 재시도)"""
    success = await _sms_provider.send_sms(phone, message)
    if not success:
        logger.warning("[NOTIFICATION] SMS failed, retrying once: %s", phone)
        success = await _sms_provider.send_sms(phone, message)
    return success


async def send_otp_sms(phone: str, code: str) -> bool:
    """OTP 인증번호 SMS"""
    return await _sms_provider.send_sms(
        phone, f"[SAFEWAY KIDS] 인증번호: {code} (3분 내 입력해주세요)"
    )


async def get_additional_notification_recipients(
    student_id: uuid.UUID,
) -> list[dict]:
    """ITEM-P2-40/P2-46: Get secondary guardians + student user for additional notifications.

    Returns list of dicts with keys: user_id, fcm_token, phone, role.
    """
    try:
        from sqlalchemy import select

        from app.database import async_session_factory
        from app.modules.auth.models import User
        from app.modules.student_management.models import SecondaryGuardian, Student

        recipients: list[dict] = []
        async with async_session_factory() as db:
            # Secondary guardians
            sg_stmt = (
                select(SecondaryGuardian.guardian_id)
                .where(
                    SecondaryGuardian.student_id == student_id,
                    SecondaryGuardian.is_active.is_(True),
                )
            )
            sg_ids = list((await db.execute(sg_stmt)).scalars().all())
            for gid in sg_ids:
                user = (await db.execute(
                    select(User).where(User.id == gid, User.is_active.is_(True))
                )).scalar_one_or_none()
                if user:
                    recipients.append({
                        "user_id": user.id,
                        "fcm_token": user.fcm_token,
                        "phone": user.phone if user.phone and not user.phone.startswith("kakao_") else None,
                        "role": "secondary_guardian",
                    })

            # Student user account (P2-46)
            student = (await db.execute(
                select(Student).where(Student.id == student_id)
            )).scalar_one_or_none()
            if student and student.user_id:
                stu_user = (await db.execute(
                    select(User).where(User.id == student.user_id, User.is_active.is_(True))
                )).scalar_one_or_none()
                if stu_user:
                    recipients.append({
                        "user_id": stu_user.id,
                        "fcm_token": stu_user.fcm_token,
                        "phone": None,  # students don't get SMS
                        "role": "student",
                    })

        return recipients
    except Exception:
        logger.warning("Failed to get additional notification recipients", exc_info=True)
        return []
