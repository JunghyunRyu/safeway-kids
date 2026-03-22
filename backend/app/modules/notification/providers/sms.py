import logging

import httpx

from app.config import settings
from app.modules.notification.providers.base import SmsProvider

logger = logging.getLogger(__name__)


class NHNCloudSmsProvider(SmsProvider):
    """NHN Cloud SMS provider for Korean phone numbers."""

    BASE_URL = "https://sms.api.nhncloudservice.com/sms/v3.0"

    async def send_sms(self, phone: str, message: str) -> bool:
        if settings.environment != "production":
            logger.info("[DEV SMS] %s: %s", phone, message)
            return True

        url = f"{self.BASE_URL}/appKeys/{settings.nhn_sms_app_key}/sender/sms"
        headers = {
            "Content-Type": "application/json",
            "X-Secret-Key": settings.nhn_sms_secret_key,
        }
        payload = {
            "body": message,
            "sendNo": settings.nhn_sms_sender_number,
            "recipientList": [{"recipientNo": phone}],
        }

        try:
            async with httpx.AsyncClient(timeout=settings.external_api_timeout_seconds) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return True
        except httpx.TimeoutException:
            logger.error("[SMS TIMEOUT] phone=%s", phone)
            return False
        except httpx.HTTPStatusError as e:
            logger.error(
                "[SMS HTTP %d] phone=%s detail=%s",
                e.response.status_code, phone, e.response.text[:200],
            )
            return False
        except Exception as e:
            logger.error("[SMS UNEXPECTED] phone=%s error=%s", phone, e)
            return False
