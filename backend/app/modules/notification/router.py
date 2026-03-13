from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.modules.auth.models import User
from app.modules.notification.providers.fcm import FCMProvider
from app.modules.notification.schemas import RegisterFcmTokenRequest, SendTestPushRequest

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
