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
        except Exception as e:
            logger.error("[FCM ERROR] %s", e)
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
        except Exception as e:
            logger.error("[FCM TOPIC ERROR] %s", e)
            return False
