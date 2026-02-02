"""Pydantic schemas for currency operations."""

from enum import Enum

from pydantic import BaseModel, Field


class CurrencyType(str, Enum):
    """D&D currency denominations."""

    copper = "copper"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"


class CurrencyUpdate(BaseModel):
    """Schema for currency update request (deltas)."""

    copper: int = Field(default=0, description="Copper delta (positive=add, negative=subtract)")
    silver: int = Field(default=0, description="Silver delta (positive=add, negative=subtract)")
    gold: int = Field(default=0, description="Gold delta (positive=add, negative=subtract)")
    platinum: int = Field(default=0, description="Platinum delta (positive=add, negative=subtract)")
    note: str | None = Field(default=None, max_length=500, description="Optional note for history")


class CurrencyResponse(BaseModel):
    """Schema for currency response (current totals)."""

    copper: int
    silver: int
    gold: int
    platinum: int

    model_config = {"from_attributes": True}


class CurrencyConvert(BaseModel):
    """Schema for currency conversion request."""

    from_currency: CurrencyType = Field(alias="from", description="Source currency type")
    to: CurrencyType = Field(description="Target currency type")
    amount: int = Field(gt=0, description="Amount to convert (must be positive)")

    model_config = {"populate_by_name": True}


# Conversion rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP
# Stored as multipliers to copper (base unit)
CURRENCY_VALUES = {
    "copper": 1,
    "silver": 10,
    "gold": 100,
    "platinum": 1000,
}
