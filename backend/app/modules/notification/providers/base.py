from abc import ABC, abstractmethod


class NotificationProvider(ABC):
    @abstractmethod
    async def send_push(
        self, device_token: str, title: str, body: str, data: dict | None = None
    ) -> bool:
        """Send a push notification to a device."""
        ...

    @abstractmethod
    async def send_topic(
        self, topic: str, title: str, body: str, data: dict | None = None
    ) -> bool:
        """Send a push notification to all subscribers of a topic."""
        ...


class SmsProvider(ABC):
    @abstractmethod
    async def send_sms(self, phone: str, message: str) -> bool:
        """Send an SMS message."""
        ...
