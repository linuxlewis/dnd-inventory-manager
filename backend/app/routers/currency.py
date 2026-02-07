"""Currency API endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_authenticated_inventory
from app.database import get_db
from app.models import CurrencyResponse, CurrencyUpdate
from app.services import log_currency_updated
from app.services.currency import apply_currency_delta

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
    When spending, automatically makes change from higher denominations
    if needed (e.g., spending 15 GP when you have 1 PP and 10 GP).
    Returns 400 if total funds are insufficient.
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Capture old currency values for history logging
    old_currency = inventory.get_snapshot()

    # Apply the delta (raises HTTPException on insufficient funds)
    response = apply_currency_delta(inventory, data)

    # Update timestamp
    inventory.updated_at = datetime.now(UTC)

    # Commit changes
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)

    # Log history entry after successful commit
    new_currency = inventory.get_snapshot()
    await log_currency_updated(db, inventory.id, old_currency, new_currency, data.note)

    # TODO: Broadcast SSE 'currency_updated' event when SSE manager exists

    return response
