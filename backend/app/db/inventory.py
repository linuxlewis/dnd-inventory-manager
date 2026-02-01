from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.item import Item
    from app.db.openai_connection import OpenAIConnection


class Inventory(Base):
    """Party inventory model storing metadata and currency."""

    __tablename__ = "inventories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    passphrase_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Currency fields
    copper: Mapped[int] = mapped_column(Integer, default=0)
    silver: Mapped[int] = mapped_column(Integer, default=0)
    gold: Mapped[int] = mapped_column(Integer, default=0)
    platinum: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    items: Mapped[list["Item"]] = relationship(
        "Item", back_populates="inventory", cascade="all, delete-orphan"
    )
    openai_connection: Mapped["OpenAIConnection | None"] = relationship(
        "OpenAIConnection", back_populates="inventory", uselist=False, cascade="all, delete-orphan"
    )
