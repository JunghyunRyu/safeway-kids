import base64
import hashlib
import hmac
import os
import unicodedata

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


def _get_key() -> bytes:
    key = settings.aes_encryption_key.encode()
    if len(key) < 32:
        key = key.ljust(32, b"\0")
    return key[:32]


def _get_hash_key() -> bytes:
    """HMAC key for name_hash. Separate from encryption key for defense in depth.
    Falls back to encryption key if HASH_KEY not set (dev convenience)."""
    raw = getattr(settings, "hash_key", None) or settings.aes_encryption_key
    key = raw.encode() if isinstance(raw, str) else raw
    if len(key) < 32:
        key = key.ljust(32, b"\0")
    return key[:32]


def encrypt_value(plaintext: str) -> str:
    """Encrypt a string with AES-256-GCM. Returns base64-encoded nonce+ciphertext."""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt_value(encrypted: str) -> str:
    """Decrypt an AES-256-GCM encrypted base64 string."""
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted)
    nonce = raw[:12]
    ciphertext = raw[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()


def compute_name_hash(name: str) -> str:
    """HMAC-SHA256(NFC-normalized + stripped name, hash_key) hex digest.

    Used for searchable PII fields (e.g., Student.name) where AES ciphertext
    differs each encryption but UniqueConstraint and lookup still required.
    Same plaintext → same hash. Different secret from encryption key.
    """
    normalized = unicodedata.normalize("NFC", name).strip()
    return hmac.new(_get_hash_key(), normalized.encode("utf-8"), hashlib.sha256).hexdigest()
