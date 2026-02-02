"""Currency management endpoints."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_authenticated_inventory
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

# Currency types for validation loop
CURRENCY_TYPES = ["copper", "silver", "gold", "platinum"]


@router.post("/{slug}/currency", response_model=CurrencyResponse)
async def update_currency(
    slug: str,
    data: CurrencyUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Inventory:
    """
    Add or subtract currency from the treasury.

    Positive values add currency, negative values subtract.
    Validates that sufficient funds exist for subtractions.
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Store previous values for history
    previous = {ct: getattr(inventory, ct) for ct in CURRENCY_TYPES}

    # Calculate new values and validate sufficient funds
    new_values = {}
    for currency_type in CURRENCY_TYPES:
        current = getattr(inventory, currency_type)
        delta = getattr(data, currency_type)
        new_value = current + delta
        if new_value < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {currency_type}: have {current}, need {-delta}",
            )
        new_values[currency_type] = new_value

    # Apply changes
    for currency_type, new_value in new_values.items():
        setattr(inventory, currency_type, new_value)

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

    return inventory


@router.post("/{slug}/currency/convert", response_model=CurrencyResponse)
async def convert_currency(
    slug: str,
    data: CurrencyConvert,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Inventory:
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
    previous = {ct: getattr(inventory, ct) for ct in CURRENCY_TYPES}

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
    new_values = {ct: getattr(inventory, ct) for ct in CURRENCY_TYPES}

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

    return inventory
