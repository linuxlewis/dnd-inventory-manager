"""Currency management endpoints."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_passphrase
from app.database import get_db
from app.db.inventory import Inventory
from app.models.currency import (
    CURRENCY_VALUES,
    CurrencyConvert,
    CurrencyResponse,
    CurrencyUpdate,
)
from app.services.history import log_currency_changed

router = APIRouter(prefix="/api/inventories", tags=["currency"])


async def get_authenticated_inventory(
    slug: str,
    db: AsyncSession,
    x_passphrase: str | None,
) -> Inventory:
    """Get inventory and verify authentication."""
    if x_passphrase is None:
        raise HTTPException(status_code=401, detail="Passphrase required")

    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if not verify_passphrase(x_passphrase, inventory.passphrase_hash):
        raise HTTPException(status_code=401, detail="Invalid passphrase")

    return inventory


@router.post("/{slug}/currency", response_model=CurrencyResponse)
async def update_currency(
    slug: str,
    data: CurrencyUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """
    Add or subtract currency from the treasury.

    Positive values add currency, negative values subtract.
    Validates that sufficient funds exist for subtractions.
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Store previous values for history
    previous = {
        "copper": inventory.copper,
        "silver": inventory.silver,
        "gold": inventory.gold,
        "platinum": inventory.platinum,
    }

    # Calculate new values and validate
    new_copper = inventory.copper + data.copper
    new_silver = inventory.silver + data.silver
    new_gold = inventory.gold + data.gold
    new_platinum = inventory.platinum + data.platinum

    # Validate sufficient funds for subtractions
    if new_copper < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient copper: have {inventory.copper}, need {-data.copper}",
        )
    if new_silver < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient silver: have {inventory.silver}, need {-data.silver}",
        )
    if new_gold < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient gold: have {inventory.gold}, need {-data.gold}",
        )
    if new_platinum < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient platinum: have {inventory.platinum}, need {-data.platinum}",
        )

    # Apply changes
    inventory.copper = new_copper
    inventory.silver = new_silver
    inventory.gold = new_gold
    inventory.platinum = new_platinum

    # Store new values for history
    new_values = {
        "copper": inventory.copper,
        "silver": inventory.silver,
        "gold": inventory.gold,
        "platinum": inventory.platinum,
    }

    # Log to history
    await log_currency_changed(
        db,
        inventory.id,
        previous,
        new_values,
        note=data.note,
    )

    await db.commit()
    await db.refresh(inventory)

    return CurrencyResponse(
        copper=inventory.copper,
        silver=inventory.silver,
        gold=inventory.gold,
        platinum=inventory.platinum,
    )


@router.post("/{slug}/currency/convert", response_model=CurrencyResponse)
async def convert_currency(
    slug: str,
    data: CurrencyConvert,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """
    Convert currency between denominations.

    Conversion rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    from_type = data.from_currency
    to_type = data.to

    if from_type == to_type:
        raise HTTPException(status_code=400, detail="Cannot convert currency to the same type")

    # Store previous values for history
    previous = {
        "copper": inventory.copper,
        "silver": inventory.silver,
        "gold": inventory.gold,
        "platinum": inventory.platinum,
    }

    # Get current amount of source currency
    current_from = getattr(inventory, from_type)

    if current_from < data.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {from_type}: have {current_from}, need {data.amount}",
        )

    # Calculate conversion
    # Convert to copper (base unit), then to target
    from_value = CURRENCY_VALUES[from_type]
    to_value = CURRENCY_VALUES[to_type]

    # Total copper value being converted
    copper_value = data.amount * from_value

    # Check if cleanly divisible
    if copper_value % to_value != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot convert {data.amount} {from_type} to {to_type} evenly. "
            f"Would result in {copper_value / to_value:.2f} {to_type}.",
        )

    target_amount = copper_value // to_value

    # Apply changes
    setattr(inventory, from_type, current_from - data.amount)
    current_to = getattr(inventory, to_type)
    setattr(inventory, to_type, current_to + target_amount)

    # Store new values for history
    new_values = {
        "copper": inventory.copper,
        "silver": inventory.silver,
        "gold": inventory.gold,
        "platinum": inventory.platinum,
    }

    # Log to history
    await log_currency_changed(
        db,
        inventory.id,
        previous,
        new_values,
        note=f"Converted {data.amount} {from_type} to {target_amount} {to_type}",
    )

    await db.commit()
    await db.refresh(inventory)

    return CurrencyResponse(
        copper=inventory.copper,
        silver=inventory.silver,
        gold=inventory.gold,
        platinum=inventory.platinum,
    )
