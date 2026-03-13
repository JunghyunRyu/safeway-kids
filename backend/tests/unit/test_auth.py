import uuid

import pytest
from jose import jwt

from app.config import settings
from app.modules.auth.models import UserRole
from app.modules.auth.service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
)


class TestJWT:
    def test_create_access_token(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id, UserRole.PARENT)
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        assert payload["sub"] == str(user_id)
        assert payload["role"] == "parent"
        assert payload["type"] == "access"

    def test_create_refresh_token(self) -> None:
        user_id = uuid.uuid4()
        token = create_refresh_token(user_id)
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"

    def test_decode_valid_token(self) -> None:
        user_id = uuid.uuid4()
        token = create_access_token(user_id, UserRole.DRIVER)
        payload = decode_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["role"] == "driver"

    def test_decode_invalid_token(self) -> None:
        from app.common.exceptions import UnauthorizedError
        with pytest.raises(UnauthorizedError):
            decode_token("invalid.token.here")


class TestOTP:
    def test_generate_otp_length(self) -> None:
        code = generate_otp()
        assert len(code) == 6
        assert code.isdigit()

    def test_generate_otp_uniqueness(self) -> None:
        codes = {generate_otp() for _ in range(100)}
        # Not all 100 should be the same (probabilistic but near-certain)
        assert len(codes) > 1
