"""SQLModel-based Inventory models.

This module contains a single Inventory class that serves as both:
1. ORM model (with table=True) for database operations
2. Pydantic schema (through SQLModel) for API serialization

Plus Create/Read/Update schemas for API endpoints.
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import field_validator
from sqlalchemy import func
from sqlmodel import Field, SQLModel


class InventoryBase(SQLModel):
    """Base fields shared across all Inventory schemas."""

    name: str = Field(min_length=1, description="Party name")
    description: str | None = Field(default=None, description="Optional description")


class Inventory(InventoryBase, table=True):
    """Party inventory model - serves as both ORM and Pydantic schema.

    This is the core model stored in the database. It includes all fields
    including sensitive data like passphrase_hash.
    """

    __tablename__ = "inventories"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    slug: str = Field(index=True, unique=True, max_length=255)
    passphrase_hash: str = Field(max_length=255)

    # Currency fields
    copper: int = Field(default=0)
    silver: int = Field(default=0)
    gold: int = Field(default=0)
    platinum: int = Field(default=0)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={"onupdate": func.now()},
    )

    def get_snapshot(self) -> dict[str, int]:
        """Get a snapshot of currency values for change tracking.

        Returns a dict with all currency denominations.
        """
        return {
            "copper": self.copper,
            "silver": self.silver,
            "gold": self.gold,
            "platinum": self.platinum,
        }


class InventoryCreate(SQLModel):
    """Schema for creating a new inventory."""

    name: str = Field(min_length=1, description="Party name")
    passphrase: str = Field(min_length=6, description="Passphrase for authentication")
    description: str | None = Field(default=None, description="Optional description")
    slug: str | None = Field(default=None, description="Optional custom slug")


class InventoryRead(InventoryBase):
    """Schema for inventory response (excludes passphrase_hash)."""

    id: UUID
    slug: str
    copper: int
    silver: int
    gold: int
    platinum: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryUpdate(SQLModel):
    """Schema for updating an inventory (all fields optional)."""

    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    copper: int | None = None
    silver: int | None = None
    gold: int | None = None
    platinum: int | None = None

    @field_validator("copper", "silver", "gold", "platinum", mode="before")
    @classmethod
    def validate_currency(cls, v):
        """Ensure currency values are non-negative."""
        if v is not None and v < 0:
            raise ValueError("Currency cannot be negative")
        return v


class InventoryAuth(SQLModel):
    """Schema for inventory authentication."""

    passphrase: str


class AuthResponse(SQLModel):
    """Schema for authentication response."""

    success: bool
    message: str | None = None
