"""Pydantic schemas for inventory items."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ItemCreate(BaseModel):
    """Schema for creating a new item."""

    name: str = Field(min_length=1, max_length=255, description="Item name")
    description: str | None = Field(default=None, description="Item description")
    quantity: int = Field(default=1, ge=1, description="Item quantity")
    weight: int | None = Field(default=None, ge=0, description="Weight in ounces")
    value: int | None = Field(default=None, ge=0, description="Value in copper pieces")
    category: str | None = Field(default=None, max_length=100, description="Item category")


class ItemUpdate(BaseModel):
    """Schema for updating an item."""

    name: str | None = Field(default=None, min_length=1, max_length=255, description="Item name")
    description: str | None = Field(default=None, description="Item description")
    quantity: int | None = Field(default=None, ge=1, description="Item quantity")
    weight: int | None = Field(default=None, ge=0, description="Weight in ounces")
    value: int | None = Field(default=None, ge=0, description="Value in copper pieces")
    category: str | None = Field(default=None, max_length=100, description="Item category")


class ItemResponse(BaseModel):
    """Schema for item response."""

    id: UUID
    inventory_id: UUID
    name: str
    description: str | None
    quantity: int
    weight: int | None
    value: int | None
    category: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
