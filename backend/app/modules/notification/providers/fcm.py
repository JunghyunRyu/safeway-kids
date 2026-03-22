import logging

from app.config import settings
from app.modules.notification.providers.base import NotificationProvider

logger = logging.getLogger(__name__)


class FCMProvider(NotificationProvider):
    """Firebase Cloud Messaging push notification provider."""

    async def send_push(
        self, device_token: str, title: str, body: str, data: dict | None = None
    ) -> bool:
        if settings.environment != "production":
            logger.info("[DEV FCM] token=%s... title=%s body=%s", device_token[:20], title, body)
            return True

        try:
            from firebase_admin import messaging  # type: ignore[import-untyped]

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=device_token,
            )
            messaging.send(message)
            return True
        except ImportError:
            logger.error("[FCM IMPORT] firebase_admin not available")
            return False
        except Exception as e:
            err_type = type(e).__name__
            if "Unregistered" in err_type or "NotFound" in err_type:
                logger.warning("[FCM UNREGISTERED] token=%s...", device_token[:20])
            elif "SenderIdMismatch" in err_type:
                logger.error("[FCM SENDER_MISMATCH] token=%s...", device_token[:20])
            else:
                logger.error("[FCM ERROR] token=%s... error=%s (%s)", device_token[:20], e, err_type)
            return False

    async def send_topic(
        self, topic: str, title: str, body: str, data: dict | None = None
    ) -> bool:
        if settings.environment != "production":
            logger.info("[DEV FCM TOPIC] topic=%s title=%s body=%s", topic, title, body)
            return True

        try:
            from firebase_admin import messaging  # type: ignore[import-untyped]

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                topic=topic,
            )
            messaging.send(message)
            return True
        except ImportError:
            logger.error("[FCM IMPORT] firebase_admin not available")
            return False
        except Exception as e:
            err_type = type(e).__name__
            if "Unregistered" in err_type or "NotFound" in err_type:
                logger.warning("[FCM TOPIC UNREGISTERED] topic=%s", topic)
            elif "SenderIdMismatch" in err_type:
                logger.error("[FCM TOPIC SENDER_MISMATCH] topic=%s", topic)
            else:
                logger.error("[FCM TOPIC ERROR] topic=%s error=%s (%s)", topic, e, err_type)
            return False
