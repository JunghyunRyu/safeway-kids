"""ITEM-P1-23: Messaging router.

메시지 보관 정책 (통신비밀보호법 §3 준수):
- 메시지 보관 기간: 발송 후 6개월, 이후 자동 파기 대상
- CS/관제 목적 열람: 서비스 이용약관에 고지
  "분쟁 해결 및 안전 관리 목적으로 메시지 내용을 확인할 수 있습니다"
- 광고성 메시지 차단: message_type은 operational/notice만 허용
  학원 공지는 운영 공지로 한정, 마케팅/광고 전송 불가 (정보통신망법 §50)
"""

import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.modules.auth.models import User, UserRole
from app.modules.messaging.models import Message
from app.modules.messaging.schemas import MessageCreateRequest, MessageResponse

MESSAGE_RETENTION_DAYS = 180  # 6개월 보관 후 파기 대상

router = APIRouter()


@router.post("", response_model=MessageResponse, status_code=201)
async def send_message(
    body: MessageCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """메시지 발송 (학부모→기사/학원, 학원→전체 학부모 공지)"""
    from app.common.exceptions import ForbiddenError, ValidationError

    receiver_role = None

    if current_user.role == UserRole.PARENT:
        # Parent can message driver or academy_admin
        if not body.receiver_id:
            raise ValidationError(detail="수신자를 지정해야 합니다")
        receiver = (await db.execute(
            select(User).where(User.id == body.receiver_id)
        )).scalar_one_or_none()
        if not receiver or receiver.role not in (UserRole.DRIVER, UserRole.ACADEMY_ADMIN):
            raise ValidationError(detail="기사 또는 학원 관리자에게만 메시지를 보낼 수 있습니다")
    elif current_user.role == UserRole.ACADEMY_ADMIN:
        # Academy admin can broadcast to all parents (receiver_id=None, academy_id required)
        if not body.receiver_id and body.academy_id:
            receiver_role = "parent"  # broadcast
        elif body.receiver_id:
            pass  # direct message
        else:
            raise ValidationError(detail="수신자 또는 학원 ID를 지정해야 합니다")
    elif current_user.role == UserRole.DRIVER:
        # Driver can reply to parents
        if not body.receiver_id:
            raise ValidationError(detail="수신자를 지정해야 합니다")
    else:
        raise ForbiddenError(detail="메시지 발송 권한이 없습니다")

    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    message = Message(
        sender_id=current_user.id,
        receiver_id=body.receiver_id,
        receiver_role=receiver_role,
        academy_id=body.academy_id,
        content=body.content,
        message_type=body.message_type,
        retention_expires_at=now + timedelta(days=MESSAGE_RETENTION_DAYS),
    )
    db.add(message)
    await db.flush()

    return MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        sender_name=current_user.name,
        receiver_id=message.receiver_id,
        receiver_role=message.receiver_role,
        academy_id=message.academy_id,
        content=message.content,
        message_type=message.message_type,
        is_read=message.is_read,
        sent_at=message.sent_at,
    )


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageResponse]:
    """내 수신 메시지 조회"""
    stmt = (
        select(Message, User.name.label("sender_name"))
        .join(User, Message.sender_id == User.id)
        .where(
            or_(
                Message.receiver_id == current_user.id,
                # Broadcast messages for parent role
                (Message.receiver_role == "parent") & (Message.receiver_id.is_(None)),
            )
        )
        .order_by(Message.sent_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).all()
    results = []
    for msg, sender_name in rows:
        results.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            sender_name=sender_name,
            receiver_id=msg.receiver_id,
            receiver_role=msg.receiver_role,
            academy_id=msg.academy_id,
            content=msg.content,
            message_type=msg.message_type,
            is_read=msg.is_read,
            sent_at=msg.sent_at,
        ))
    return results


@router.patch("/{message_id}/read")
async def mark_read(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """메시지 읽음 표시"""
    msg = (await db.execute(
        select(Message).where(Message.id == message_id)
    )).scalar_one_or_none()
    if not msg:
        from app.common.exceptions import NotFoundError
        raise NotFoundError(detail="메시지를 찾을 수 없습니다")
    msg.is_read = True
    await db.flush()
    return {"status": "ok"}
