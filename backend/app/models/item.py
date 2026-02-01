"""SQLModel-based Item models.

This module contains the Item model and related schemas for inventory items.
"""

from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, SQLModel


class ItemType(str, Enum):
    """Type of inventory item."""

    equipment = "equipment"
    potion = "potion"
    scroll = "scroll"
    consumable = "consumable"
    misc = "misc"


class ItemRarity(str, Enum):
    """Rarity level of an item."""

    common = "common"
    uncommon = "uncommon"
    rare = "rare"
    very_rare = "very_rare"
    legendary = "legendary"
    artifact = "artifact"


class ItemBase(SQLModel):
    """Base fields shared across all Item schemas."""

    name: str = Field(min_length=1, description="Item name")
    type: ItemType = Field(default=ItemType.misc, description="Item type")
    category: str | None = Field(default=None, description="Item category (e.g., Weapon, Armor)")
    rarity: ItemRarity = Field(default=ItemRarity.common, description="Item rarity")
    description: str | None = Field(default=None, description="Item description")
    quantity: int = Field(default=1, ge=1, description="Number of this item")
    weight: float | None = Field(default=None, ge=0, description="Weight in pounds")
    estimated_value: float | None = Field(default=None, ge=0, description="Estimated value in gold")


class Item(ItemBase, table=True):
    """Inventory item model - serves as both ORM and Pydantic schema.

    This is the core model stored in the database.
    """

    __tablename__ = "items"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    inventory_id: UUID = Field(foreign_key="inventories.id", index=True)

    # Additional fields not in base
    notes: str | None = Field(default=None, description="User notes about this item")
    thumbnail_url: str | None = Field(default=None, description="URL to item thumbnail image")
    is_standard_item: bool = Field(default=False, description="Whether this is from the SRD")
    standard_item_id: str | None = Field(default=None, description="ID in SRD if standard item")

    # JSON column for type-specific properties (damage_dice, ac_bonus, etc.)
    properties: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ItemCreate(ItemBase):
    """Schema for creating a new item."""

    notes: str | None = Field(default=None, description="User notes about this item")
    properties: dict[str, Any] | None = Field(default=None, description="Type-specific properties")
    is_standard_item: bool = Field(default=False)
    standard_item_id: str | None = Field(default=None)


class ItemRead(ItemBase):
    """Schema for item response."""

    id: UUID
    inventory_id: UUID
    notes: str | None
    thumbnail_url: str | None
    is_standard_item: bool
    standard_item_id: str | None
    properties: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItemUpdate(SQLModel):
    """Schema for updating an item (all fields optional for partial update)."""

    name: str | None = Field(default=None, min_length=1)
    type: ItemType | None = None
    category: str | None = None
    rarity: ItemRarity | None = None
    description: str | None = None
    notes: str | None = None
    quantity: int | None = Field(default=None, ge=1)
    weight: float | None = Field(default=None, ge=0)
    estimated_value: float | None = Field(default=None, ge=0)
    thumbnail_url: str | None = None
    properties: dict[str, Any] | None = None


class ItemListResponse(SQLModel):
    """Response schema for listing items with pagination info."""

    items: list[ItemRead]
    total: int
