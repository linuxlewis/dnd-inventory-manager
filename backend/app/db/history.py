"""History entry database model for tracking inventory changes."""

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    """Get current UTC datetime with timezone info."""
    return datetime.now(timezone.utc)


class HistoryAction(str, Enum):
    """Actions that can be logged in history."""

    item_added = "item_added"
    item_removed = "item_removed"
    item_updated = "item_updated"
    quantity_changed = "quantity_changed"
    currency_changed = "currency_changed"
    rollback = "rollback"
    undo = "undo"


class HistoryEntry(Base):
    """History entry model for tracking all inventory changes."""

    __tablename__ = "history_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    inventory_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("inventories.id"), nullable=False, index=True
    )

    # Action type
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Item-related fields (optional for currency changes)
    item_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    item_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    item_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Change tracking
    previous_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Note for context
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Undo tracking
    is_undone: Mapped[bool] = mapped_column(Boolean, default=False)
    undone_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    # Timestamp (using created_at to match project conventions)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)

    # Version for optimistic locking (future use)
    version: Mapped[int] = mapped_column(Integer, default=1)
