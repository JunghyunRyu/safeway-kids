from app.common.security import decrypt_value, encrypt_value


class TestAES256Encryption:
    def test_encrypt_decrypt_roundtrip(self) -> None:
        plaintext = "홍길동의 개인정보"
        encrypted = encrypt_value(plaintext)
        decrypted = decrypt_value(encrypted)
        assert decrypted == plaintext
        assert encrypted != plaintext

    def test_different_encryptions_for_same_input(self) -> None:
        plaintext = "같은 텍스트"
        e1 = encrypt_value(plaintext)
        e2 = encrypt_value(plaintext)
        # Due to random nonce, each encryption should be different
        assert e1 != e2
        # But both should decrypt to the same value
        assert decrypt_value(e1) == plaintext
        assert decrypt_value(e2) == plaintext

    def test_empty_string(self) -> None:
        encrypted = encrypt_value("")
        assert decrypt_value(encrypted) == ""
