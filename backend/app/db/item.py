"""Item database model for inventory items."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Item(Base):
    """Inventory item model."""

    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    inventory_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("inventories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    weight: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in ounces
    value: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in copper pieces
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship back to inventory
    inventory = relationship("Inventory", back_populates="items")
