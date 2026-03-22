from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://safeway:safeway@localhost:5433/safeway_kids"
    database_url_sync: str = "postgresql://safeway:safeway@localhost:5433/safeway_kids"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # Kakao OAuth
    kakao_client_id: str = ""
    kakao_client_secret: str = ""
    kakao_redirect_uri: str = "http://localhost:8000/api/v1/auth/kakao/callback"

    # NHN Cloud SMS
    nhn_sms_app_key: str = ""
    nhn_sms_secret_key: str = ""
    nhn_sms_sender_number: str = ""

    # Firebase
    firebase_credentials_path: str = "firebase-credentials.json"

    # Kakao Maps
    kakao_maps_api_key: str = ""

    # Toss Payments
    toss_payments_secret_key: str = ""
    toss_payments_client_key: str = ""
    toss_payments_webhook_secret: str = ""

    # Encryption
    aes_encryption_key: str = "change-me-32-byte-key-for-prod!!"

    # Scheduling
    pipeline_cron_hour: int = 0  # 0 = midnight KST
    pipeline_cron_minute: int = 0
    gps_flush_interval_seconds: int = 30

    # Logging
    log_level: str = "INFO"

    # Environment
    environment: str = "development"
    debug: bool = False

    # Dev login
    dev_login_secret: str = "change-me-dev"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Rate limiting
    rate_limit_auth: str = "100/minute"

    # Database pool
    db_pool_size: int = 20
    db_max_overflow: int = 10

    # WebSocket
    ws_ping_interval_seconds: int = 30

    # Routing
    schedule_time_window_minutes: int = 15
    distance_cache_ttl_seconds: int = 86400

    # GPS
    gps_data_ttl_seconds: int = 300

    # External API
    external_api_timeout_seconds: float = 30.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @model_validator(mode="after")
    def _check_production_secrets(self) -> "Settings":
        if self.environment == "production":
            if self.jwt_secret_key == "change-me-in-production":
                raise ValueError(
                    "jwt_secret_key must be changed from its placeholder "
                    "value in production"
                )
            if "change-me" in self.aes_encryption_key:
                raise ValueError(
                    "aes_encryption_key must be changed from its placeholder "
                    "value in production"
                )
            missing = []
            if not self.nhn_sms_app_key:
                missing.append("nhn_sms_app_key")
            if not self.nhn_sms_secret_key:
                missing.append("nhn_sms_secret_key")
            if not self.nhn_sms_sender_number:
                missing.append("nhn_sms_sender_number")
            if not self.toss_payments_secret_key:
                missing.append("toss_payments_secret_key")
            if not self.toss_payments_client_key:
                missing.append("toss_payments_client_key")
            if missing:
                raise ValueError(
                    f"Production environment requires these keys: {', '.join(missing)}"
                )
        return self


settings = Settings()
