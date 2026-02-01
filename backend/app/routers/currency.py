"""Currency router with SSE broadcast integration."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_passphrase
from app.core.sse import SSEEvent, connection_manager
from app.database import get_db
from app.db.inventory import Inventory
from app.models.currency import CurrencyResponse, CurrencyUpdate

router = APIRouter(prefix="/api/inventories/{slug}/currency", tags=["currency"])


async def get_authenticated_inventory(
    slug: str,
    x_passphrase: str | None,
    db: AsyncSession,
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


@router.get("/", response_model=CurrencyResponse)
async def get_currency(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """Get the current currency values for an inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    return CurrencyResponse(
        copper=inventory.copper,
        silver=inventory.silver,
        gold=inventory.gold,
        platinum=inventory.platinum,
    )


@router.patch("/", response_model=CurrencyResponse)
async def update_currency(
    slug: str,
    data: CurrencyUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> CurrencyResponse:
    """Update currency values for an inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inventory, field, value)

    await db.commit()
    await db.refresh(inventory)

    # Broadcast currency_updated event
    event = SSEEvent(
        event="currency_updated",
        data={
            "copper": inventory.copper,
            "silver": inventory.silver,
            "gold": inventory.gold,
            "platinum": inventory.platinum,
        },
    )
    await connection_manager.broadcast(slug, event)

    return CurrencyResponse(
        copper=inventory.copper,
        silver=inventory.silver,
        gold=inventory.gold,
        platinum=inventory.platinum,
    )
