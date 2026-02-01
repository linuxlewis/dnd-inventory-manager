"""Pydantic schemas for currency operations."""

from pydantic import BaseModel, Field


class CurrencyUpdate(BaseModel):
    """Schema for updating currency values."""

    copper: int | None = Field(default=None, ge=0, description="Copper pieces")
    silver: int | None = Field(default=None, ge=0, description="Silver pieces")
    gold: int | None = Field(default=None, ge=0, description="Gold pieces")
    platinum: int | None = Field(default=None, ge=0, description="Platinum pieces")


class CurrencyResponse(BaseModel):
    """Schema for currency response."""

    copper: int
    silver: int
    gold: int
    platinum: int

    model_config = {"from_attributes": True}
