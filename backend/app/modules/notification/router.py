import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.modules.auth.models import User, UserRole
from app.modules.notification import service as notif_service
from app.modules.notification.providers.fcm import FCMProvider
from app.middleware.rbac import require_platform_admin
from app.modules.notification.schemas import (
    ManualSendRequest,
    NotificationPreferenceItem,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdateRequest,
    RegisterFcmTokenRequest,
    SendTestPushRequest,
    SosRequest,
    SosResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

_fcm = FCMProvider()


@router.post("/register-token")
async def register_fcm_token(
    body: RegisterFcmTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """FCM 디바이스 토큰 등록"""
    current_user.fcm_token = body.fcm_token
    await db.flush()
    return {"message": "토큰이 등록되었습니다"}


@router.post("/test-push")
async def send_test_push(
    body: SendTestPushRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """테스트 푸시 알림 발송"""
    success = await _fcm.send_push(body.device_token, body.title, body.body)
    if success:
        return {"message": "테스트 알림이 발송되었습니다"}
    return {"message": "알림 발송에 실패했습니다"}


@router.post("/sos", response_model=SosResponse)
async def sos_alert(
    body: SosRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SosResponse:
    """SOS/긴급 호출 — 플랫폼 관리자에게 즉시 알림 + 감사 로그"""
    from app.modules.admin.service import log_audit

    # 감사 로그 기록
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="SOS",
        entity_type="sos_alert",
        entity_id="",
        details={
            "latitude": body.latitude,
            "longitude": body.longitude,
            "sos_type": body.sos_type,
            "message": body.message,
            "user_role": current_user.role.value if hasattr(current_user.role, "value") else current_user.role,
        },
        ip_address=request.client.host if request.client else None,
    )

    # 플랫폼 관리자 전원에게 알림
    admin_stmt = select(User).where(
        User.role == UserRole.PLATFORM_ADMIN,
        User.is_active.is_(True),
        User.deleted_at.is_(None),
    )
    result = await db.execute(admin_stmt)
    admins = result.scalars().all()

    sos_msg = (
        f"[SOS 긴급] {current_user.name}({current_user.role.value if hasattr(current_user.role, 'value') else current_user.role}) "
        f"위치: ({body.latitude:.6f}, {body.longitude:.6f}) "
        f"유형: {body.sos_type}"
    )
    if body.message:
        sos_msg += f" 메시지: {body.message}"

    for admin in admins:
        try:
            if admin.fcm_token:
                await _fcm.send_push(
                    device_token=admin.fcm_token,
                    title="🚨 SOS 긴급 호출",
                    body=sos_msg,
                    data={"type": "sos", "latitude": str(body.latitude), "longitude": str(body.longitude)},
                )
            if admin.phone and not admin.phone.startswith("kakao_"):
                await notif_service.send_critical_alert_sms(admin.phone, sos_msg)
        except Exception:
            logger.warning("Failed to send SOS alert to admin %s", admin.id, exc_info=True)

    logger.info("[SOS] Alert from user=%s type=%s", current_user.id, body.sos_type)

    return SosResponse(success=True)


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesResponse:
    """ITEM-P2-41: 알림 설정 조회"""
    from app.modules.notification.models import NotificationPreference

    stmt = select(NotificationPreference).where(
        NotificationPreference.user_id == current_user.id
    )
    result = await db.execute(stmt)
    prefs = result.scalars().all()

    # Return all known types with defaults if not set
    all_types = ["boarding", "alighting", "delay", "arrival", "no_show", "sos"]
    all_channels = ["fcm", "sms"]
    pref_map = {(p.channel, p.notification_type): p.enabled for p in prefs}

    items = []
    for ch in all_channels:
        for nt in all_types:
            items.append(NotificationPreferenceItem(
                channel=ch,
                notification_type=nt,
                enabled=pref_map.get((ch, nt), True),
            ))
    return NotificationPreferencesResponse(preferences=items)


@router.patch("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    body: NotificationPreferencesUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesResponse:
    """ITEM-P2-41: 알림 설정 업데이트 (SOS는 항상 enabled)"""
    from app.modules.notification.models import NotificationPreference

    for item in body.preferences:
        # SOS notifications cannot be disabled
        enabled = True if item.notification_type == "sos" else item.enabled

        stmt = select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.channel == item.channel,
            NotificationPreference.notification_type == item.notification_type,
        )
        result = await db.execute(stmt)
        pref = result.scalar_one_or_none()
        if pref:
            pref.enabled = enabled
        else:
            pref = NotificationPreference(
                user_id=current_user.id,
                channel=item.channel,
                notification_type=item.notification_type,
                enabled=enabled,
            )
            db.add(pref)
    await db.flush()

    # Return updated prefs
    return await get_notification_preferences(db=db, current_user=current_user)


@router.post("/manual-send")
async def manual_send(
    body: ManualSendRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
) -> dict:
    """ITEM-P1-32: 수동 SMS/FCM 발송 (플랫폼 관리자 전용)"""
    import uuid as _uuid

    from app.modules.admin.service import log_audit
    from app.modules.notification.models import NotificationLog

    sent_count = 0
    failed_count = 0

    for rid_str in body.recipient_ids:
        try:
            rid = _uuid.UUID(rid_str)
        except ValueError:
            failed_count += 1
            continue

        recipient = (await db.execute(
            select(User).where(User.id == rid)
        )).scalar_one_or_none()
        if not recipient:
            failed_count += 1
            continue

        success = False

        # FCM
        if body.channel in ("fcm", "both") and recipient.fcm_token:
            fcm_ok = await notif_service._push_provider.send_push(
                device_token=recipient.fcm_token,
                title="[세이프웨이키즈] 안내",
                body=body.message,
                data={"type": "manual", "purpose": body.purpose},
            )
            if fcm_ok:
                success = True
            db.add(NotificationLog(
                recipient_user_id=recipient.id,
                recipient_phone=recipient.phone,
                channel="fcm",
                notification_type="manual",
                title=f"[{body.purpose}]",
                body=body.message,
                status="sent" if fcm_ok else "failed",
            ))

        # SMS
        if body.channel in ("sms", "both") and recipient.phone and not recipient.phone.startswith("kakao_"):
            sms_ok = await notif_service._sms_provider.send_sms(
                recipient.phone,
                f"[세이프웨이키즈] {body.message}",
            )
            if sms_ok:
                success = True
            db.add(NotificationLog(
                recipient_user_id=recipient.id,
                recipient_phone=recipient.phone,
                channel="sms",
                notification_type="manual",
                title=f"[{body.purpose}]",
                body=body.message,
                status="sent" if sms_ok else "failed",
            ))

        if success:
            sent_count += 1
        else:
            failed_count += 1

    # P1-32 법률: 발송자 + 목적 + 수신자 감사 로그
    await log_audit(
        db,
        user_id=str(current_user.id),
        user_name=current_user.name,
        action="MANUAL_SEND",
        entity_type="notification",
        details={
            "purpose": body.purpose,
            "channel": body.channel,
            "recipient_count": len(body.recipient_ids),
            "sent": sent_count,
            "failed": failed_count,
        },
        ip_address=request.client.host if request.client else None,
    )

    await db.flush()
    return {"sent": sent_count, "failed": failed_count}
