from app.config import settings
from app.modules.notification.providers.base import NotificationProvider


class FCMProvider(NotificationProvider):
    """Firebase Cloud Messaging push notification provider."""

    async def send_push(
        self, device_token: str, title: str, body: str, data: dict | None = None
    ) -> bool:
        if settings.environment != "production":
            print(f"[DEV FCM] token={device_token[:20]}... title={title} body={body}")
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
            print(f"[FCM ERROR] {e}")
            return False

    async def send_topic(
        self, topic: str, title: str, body: str, data: dict | None = None
    ) -> bool:
        if settings.environment != "production":
            print(f"[DEV FCM TOPIC] topic={topic} title={title} body={body}")
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
            print(f"[FCM TOPIC ERROR] {e}")
            return False
