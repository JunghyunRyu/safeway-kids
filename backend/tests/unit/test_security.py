import unicodedata

from app.common.security import compute_name_hash, decrypt_value, encrypt_value


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


class TestNameHash:
    """compute_name_hash — searchable PII hash (Student.name 등) 단위 검증.

    카드 #4 spec FR-4: 동일 평문 → 동일 hash + NFC 정규화 + strip + 64-hex digest.
    """

    def test_deterministic_same_plaintext_same_hash(self) -> None:
        """동일 평문은 항상 동일 hash → UniqueConstraint·검색 쿼리 정합 보장."""
        h1 = compute_name_hash("김민지")
        h2 = compute_name_hash("김민지")
        assert h1 == h2
        assert len(h1) == 64  # SHA-256 hex digest
        assert all(c in "0123456789abcdef" for c in h1)

    def test_different_plaintext_different_hash(self) -> None:
        """다른 평문 → 다른 hash → 학생 중복 체크 정확성."""
        h_kim = compute_name_hash("김민지")
        h_park = compute_name_hash("박민지")
        h_kim_other = compute_name_hash("김민호")
        assert h_kim != h_park
        assert h_kim != h_kim_other
        assert h_park != h_kim_other

    def test_nfc_normalization(self) -> None:
        """한국어 자모 분리(NFD) vs 결합(NFC)이 동일 hash 생성하는지 확인.

        '김' (NFC, 1 codepoint) vs 'ㄱ+ㅣ+ㅁ' (NFD, 3 codepoints)는 시각적으로 동일하지만
        UTF-8 바이트는 다름. compute_name_hash는 NFC 정규화 후 hash → 동일 결과.
        """
        nfc_form = unicodedata.normalize("NFC", "김민지")
        nfd_form = unicodedata.normalize("NFD", "김민지")
        # 두 form이 시작은 다름(NFC ≠ NFD)
        assert nfc_form != nfd_form or len(nfc_form.encode()) == len(nfd_form.encode())
        # 하지만 hash는 동일 (compute_name_hash가 내부 NFC 정규화)
        h_nfc = compute_name_hash(nfc_form)
        h_nfd = compute_name_hash(nfd_form)
        assert h_nfc == h_nfd

    def test_whitespace_strip(self) -> None:
        """앞뒤 공백 차이가 hash에 영향 없어야 함 (사용자 입력 trim 효과)."""
        h_clean = compute_name_hash("김민지")
        h_leading = compute_name_hash(" 김민지")
        h_trailing = compute_name_hash("김민지 ")
        h_both = compute_name_hash("  김민지  ")
        assert h_clean == h_leading == h_trailing == h_both
