"""Currency Pydantic schemas for API validation.

Conversion rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP
"""

from enum import Enum
from typing import TYPE_CHECKING

from pydantic import Field
from sqlmodel import SQLModel

if TYPE_CHECKING:
    from .inventory import Inventory


class CurrencyDenomination(str, Enum):
    """Currency denominations in D&D 5e."""

    copper = "copper"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"


class CurrencyUpdate(SQLModel):
    """Schema for adding/spending currency (delta-based).

    Positive values add funds, negative values spend.
    """

    copper: int | None = Field(default=None, description="Copper pieces delta")
    silver: int | None = Field(default=None, description="Silver pieces delta")
    gold: int | None = Field(default=None, description="Gold pieces delta")
    platinum: int | None = Field(default=None, description="Platinum pieces delta")
    note: str | None = Field(default=None, description="Optional note for the transaction")


class CurrencyConvert(SQLModel):
    """Schema for currency conversion requests."""

    from_denomination: CurrencyDenomination = Field(description="Source denomination")
    to_denomination: CurrencyDenomination = Field(description="Target denomination")
    amount: int = Field(ge=1, description="Amount to convert from source denomination")


class CurrencyResponse(SQLModel):
    """Schema for currency response with total value in GP."""

    copper: int = Field(description="Copper pieces")
    silver: int = Field(description="Silver pieces")
    gold: int = Field(description="Gold pieces")
    platinum: int = Field(description="Platinum pieces")
    total_gp: float = Field(description="Total value in gold pieces")

    model_config = {"from_attributes": True}

    @classmethod
    def from_inventory(cls, inventory: "Inventory") -> "CurrencyResponse":
        """Create a CurrencyResponse from an Inventory model."""
        total_gp = (
            inventory.copper / 100
            + inventory.silver / 10
            + inventory.gold
            + inventory.platinum * 10
        )
        return cls(
            copper=inventory.copper,
            silver=inventory.silver,
            gold=inventory.gold,
            platinum=inventory.platinum,
            total_gp=total_gp,
        )
