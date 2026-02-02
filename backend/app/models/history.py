"""Pydantic schemas for history entries."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.history import HistoryAction


class HistoryEntryRead(BaseModel):
    """Schema for reading history entries."""

    id: UUID
    inventory_id: UUID
    action: HistoryAction
    item_id: UUID | None = None
    item_name: str | None = None
    item_snapshot: dict[str, Any] | None = None
    previous_value: dict[str, Any] | None = None
    new_value: dict[str, Any] | None = None
    note: str | None = None
    is_undone: bool
    undone_by: UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    """Schema for paginated history list response."""

    items: list[HistoryEntryRead]
    total: int
    limit: int
    offset: int


class UndoResponse(BaseModel):
    """Schema for undo action response."""

    success: bool
    message: str
    undo_entry_id: UUID | None = None


class HistoryQueryParams(BaseModel):
    """Query parameters for history list endpoint."""

    action: HistoryAction | None = Field(default=None, description="Filter by action type")
    item_id: UUID | None = Field(default=None, description="Filter by item ID")
    limit: int = Field(default=50, ge=1, le=100, description="Maximum entries to return")
    offset: int = Field(default=0, ge=0, description="Offset for pagination")
