import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.modules.auth.models import User, UserRole
from app.modules.notification import service as notif_service
from app.modules.notification.providers.fcm import FCMProvider
from app.modules.notification.schemas import (
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
