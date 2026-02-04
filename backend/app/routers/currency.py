"""Currency API endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_authenticated_inventory
from app.database import get_db
from app.models import CurrencyConvert, CurrencyResponse, CurrencyUpdate
from app.services.currency import apply_currency_delta, convert_currency

router = APIRouter(prefix="/api/inventories", tags=["currency"])


@router.get("/{slug}/currency", response_model=CurrencyResponse)
async def get_currency(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """Get current treasury balance."""
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)
    return CurrencyResponse.from_inventory(inventory)


@router.post("/{slug}/currency", response_model=CurrencyResponse)
async def update_currency(
    slug: str,
    data: CurrencyUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """Add or spend currency (delta-based).

    Positive values add funds, negative values spend.
    Returns 400 if insufficient funds for any negative delta.
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Apply the delta (raises HTTPException on insufficient funds)
    response = apply_currency_delta(inventory, data)

    # Update timestamp
    inventory.updated_at = datetime.now(UTC)

    # Commit changes
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)

    # TODO: Broadcast SSE 'currency_updated' event when SSE manager exists

    return response


@router.post("/{slug}/currency/convert", response_model=CurrencyResponse)
async def convert_currency_endpoint(
    slug: str,
    data: CurrencyConvert,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """Convert currency between denominations.

    Conversion rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP
    Returns 400 if insufficient funds or invalid conversion.
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Perform conversion (raises HTTPException on insufficient funds/invalid)
    response = convert_currency(
        inventory,
        data.from_denomination,
        data.to_denomination,
        data.amount,
    )

    # Update timestamp
    inventory.updated_at = datetime.now(UTC)

    # Commit changes
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)

    # TODO: Broadcast SSE 'currency_updated' event when SSE manager exists

    return response
