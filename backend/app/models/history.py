"""SQLModel-based History models.

This module contains the HistoryEntry model for tracking inventory changes.
"""

from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, SQLModel


class HistoryAction(str, Enum):
    """Type of history action."""

    item_added = "item_added"
    item_updated = "item_updated"
    item_removed = "item_removed"
    currency_updated = "currency_updated"


class HistoryEntityType(str, Enum):
    """Type of entity the history entry refers to."""

    item = "item"
    currency = "currency"


class HistoryEntry(SQLModel, table=True):
    """History entry model - tracks changes to inventory items and currency.

    This is an immutable log - entries are created but never updated or deleted.
    """

    __tablename__ = "history_entries"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    inventory_id: UUID = Field(foreign_key="inventories.id", index=True)

    action: HistoryAction = Field(description="Type of action performed")
    entity_type: HistoryEntityType = Field(description="Type of entity affected")
    entity_id: UUID | None = Field(default=None, description="ID of the item (null for currency)")
    entity_name: str | None = Field(
        default=None, description="Name snapshot (e.g., 'Potion of Healing')"
    )

    # JSON column for action-specific details
    details: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    # Timestamp
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)


class HistoryEntryRead(SQLModel):
    """Schema for history entry response."""

    id: UUID
    inventory_id: UUID
    action: HistoryAction
    entity_type: HistoryEntityType
    entity_id: UUID | None
    entity_name: str | None
    details: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryListResponse(SQLModel):
    """Response schema for listing history entries with pagination info."""

    entries: list[HistoryEntryRead]
    total: int
    limit: int
    offset: int
