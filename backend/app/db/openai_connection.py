"""OpenAI connection database model with encrypted API key storage."""

import base64
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config import settings
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.inventory import Inventory


def _get_fernet() -> Fernet:
    """Create Fernet instance from encryption key.

    Derives a 32-byte key from the encryption_key setting using PBKDF2.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"dnd-inventory-salt",  # Static salt is fine since key is unique per deployment
        iterations=100_000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.encryption_key.encode()))
    return Fernet(key)


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key using AES-256 (via Fernet)."""
    fernet = _get_fernet()
    encrypted = fernet.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an encrypted API key."""
    fernet = _get_fernet()
    decrypted = fernet.decrypt(encrypted_key.encode())
    return decrypted.decode()


class OpenAIConnection(Base):
    """OpenAI API connection for an inventory."""

    __tablename__ = "openai_connections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    inventory_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("inventories.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    encrypted_api_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    connected_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationship
    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="openai_connection")

    def get_api_key(self) -> str:
        """Decrypt and return the API key."""
        return decrypt_api_key(self.encrypted_api_key)

    def set_api_key(self, api_key: str) -> None:
        """Encrypt and store the API key."""
        self.encrypted_api_key = encrypt_api_key(api_key)
