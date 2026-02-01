"""SSE events endpoint for real-time inventory updates."""

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.core.auth import verify_passphrase
from app.core.sse import connection_manager
from app.database import get_db
from app.db.inventory import Inventory

router = APIRouter(prefix="/api/inventories/{slug}", tags=["events"])


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


@router.get("/events")
async def inventory_events(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
):
    """Server-Sent Events endpoint for real-time inventory updates.

    Subscribes to real-time events for the specified inventory.
    Events include:
    - item_added: A new item was added
    - item_updated: An item was modified
    - item_removed: An item was deleted
    - currency_updated: Currency values changed
    - connection_count: Number of connected viewers changed
    - heartbeat: Keep-alive signal (every 30s)

    Supports reconnection via Last-Event-ID header to receive missed events.
    """
    # Authenticate first
    await get_authenticated_inventory(slug, x_passphrase, db)

    # Register connection
    queue = await connection_manager.connect(slug)

    async def event_generator():
        try:
            async for event_str in connection_manager.event_generator(
                slug, queue, last_event_id
            ):
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                yield event_str
        finally:
            # Clean up connection
            await connection_manager.disconnect(slug, queue)

    return EventSourceResponse(
        event_generator(),
        media_type="text/event-stream",
    )
