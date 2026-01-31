from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class InventoryCreate(BaseModel):
    """Schema for creating a new inventory."""

    name: str = Field(min_length=1, description="Party name")
    passphrase: str = Field(min_length=6, description="Passphrase for authentication")
    description: str | None = Field(default=None, description="Optional description")
    slug: str | None = Field(default=None, description="Optional custom slug")


class InventoryResponse(BaseModel):
    """Schema for inventory response."""

    id: UUID
    slug: str
    name: str
    description: str | None
    copper: int
    silver: int
    gold: int
    platinum: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryAuth(BaseModel):
    """Schema for inventory authentication."""

    passphrase: str


class AuthResponse(BaseModel):
    """Schema for authentication response."""

    success: bool
    message: str | None = None
