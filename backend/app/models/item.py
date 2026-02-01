"""Pydantic schemas for items."""

from datetime import datetime

from pydantic import BaseModel, Field


class ItemCreate(BaseModel):
    """Schema for creating a new item."""

    name: str = Field(min_length=1, description="Item name")
    description: str | None = Field(default=None, description="Item description")
    item_type: str | None = Field(default=None, description="Type of item (weapon, armor, etc.)")
    category: str | None = Field(default=None, description="Category (e.g., magical, mundane)")
    rarity: str | None = Field(default=None, description="Rarity (common, rare, legendary, etc.)")
    quantity: int = Field(default=1, ge=1, description="Quantity")


class ItemUpdate(BaseModel):
    """Schema for updating an item."""

    name: str | None = Field(default=None, min_length=1, description="Item name")
    description: str | None = Field(default=None, description="Item description")
    item_type: str | None = Field(default=None, description="Type of item")
    category: str | None = Field(default=None, description="Category")
    rarity: str | None = Field(default=None, description="Rarity")
    quantity: int | None = Field(default=None, ge=1, description="Quantity")
    thumbnail_url: str | None = Field(default=None, description="Thumbnail URL")


class ItemResponse(BaseModel):
    """Schema for item response."""

    id: str
    inventory_id: str
    name: str
    description: str | None
    item_type: str | None
    category: str | None
    rarity: str | None
    quantity: int
    thumbnail_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
