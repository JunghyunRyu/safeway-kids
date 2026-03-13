from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://safeway:safeway@localhost:5432/safeway_kids"
    database_url_sync: str = "postgresql://safeway:safeway@localhost:5432/safeway_kids"

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

    # Encryption
    aes_encryption_key: str = "change-me-32-byte-key-for-prod!!"

    # Scheduling
    pipeline_cron_hour: int = 0  # 0 = midnight KST
    pipeline_cron_minute: int = 0
    gps_flush_interval_seconds: int = 30

    # Environment
    environment: str = "development"
    debug: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
