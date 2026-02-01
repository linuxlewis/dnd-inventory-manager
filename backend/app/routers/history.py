"""History tracking and undo endpoints."""

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_passphrase
from app.database import get_db
from app.db.history import HistoryAction, HistoryEntry
from app.db.inventory import Inventory
from app.models.history import (
    HistoryEntryRead,
    HistoryListResponse,
    UndoResponse,
)
from app.services.history import log_currency_changed, log_undo

router = APIRouter(prefix="/api/inventories", tags=["history"])


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


@router.get("/{slug}/history", response_model=HistoryListResponse)
async def list_history(
    slug: str,
    action: HistoryAction | None = Query(default=None, description="Filter by action type"),
    item_id: str | None = Query(default=None, description="Filter by item ID"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum entries to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> HistoryListResponse:
    """
    Get the history of changes to an inventory.

    Returns entries newest first with optional filtering.
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Build query
    query = select(HistoryEntry).where(HistoryEntry.inventory_id == inventory.id)

    # Apply filters
    if action is not None:
        query = query.where(HistoryEntry.action == action.value)
    if item_id is not None:
        query = query.where(HistoryEntry.item_id == item_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply ordering and pagination
    query = query.order_by(HistoryEntry.timestamp.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    entries = result.scalars().all()

    return HistoryListResponse(
        items=[HistoryEntryRead.model_validate(e) for e in entries],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/{slug}/history/{entry_id}/undo", response_model=UndoResponse)
async def undo_action(
    slug: str,
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> UndoResponse:
    """
    Undo a specific history entry.

    Reverses the action based on stored previous values:
    - item_added: removes the item
    - item_removed: restores item from snapshot
    - item_updated: restores previous values
    - currency_changed: reverses the currency change
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Find the history entry
    result = await db.execute(
        select(HistoryEntry).where(
            HistoryEntry.id == entry_id,
            HistoryEntry.inventory_id == inventory.id,
        )
    )
    entry = result.scalar_one_or_none()

    if entry is None:
        raise HTTPException(status_code=404, detail="History entry not found")

    if entry.is_undone:
        raise HTTPException(status_code=400, detail="This action has already been undone")

    action = HistoryAction(entry.action)

    # Handle undo based on action type
    if action == HistoryAction.currency_changed:
        # Reverse the currency change
        if entry.previous_value is None:
            raise HTTPException(status_code=400, detail="Cannot undo: no previous value stored")

        # Get current values
        current = {
            "copper": inventory.copper,
            "silver": inventory.silver,
            "gold": inventory.gold,
            "platinum": inventory.platinum,
        }

        # Restore previous values
        prev = entry.previous_value
        inventory.copper = prev.get("copper", inventory.copper)
        inventory.silver = prev.get("silver", inventory.silver)
        inventory.gold = prev.get("gold", inventory.gold)
        inventory.platinum = prev.get("platinum", inventory.platinum)

        restored = {
            "copper": inventory.copper,
            "silver": inventory.silver,
            "gold": inventory.gold,
            "platinum": inventory.platinum,
        }

        # Log the currency restoration (separate entry)
        await log_currency_changed(
            db,
            inventory.id,
            current,
            restored,
            note=f"Undo: restored from entry {entry_id}",
        )

        # Log the undo action
        undo_entry = await log_undo(
            db,
            inventory.id,
            entry_id,
            entry.action,
            restored,
            note="Undid currency change",
        )

    elif action == HistoryAction.item_added:
        # Would remove the item - but we need item support for this
        # For now, return not implemented
        raise HTTPException(
            status_code=501,
            detail="Undo for item_added requires item support (not yet implemented)",
        )

    elif action == HistoryAction.item_removed:
        # Would restore the item from snapshot - but we need item support
        raise HTTPException(
            status_code=501,
            detail="Undo for item_removed requires item support (not yet implemented)",
        )

    elif action == HistoryAction.item_updated:
        # Would restore previous item values - but we need item support
        raise HTTPException(
            status_code=501,
            detail="Undo for item_updated requires item support (not yet implemented)",
        )

    elif action == HistoryAction.quantity_changed:
        # Would restore previous quantity - but we need item support
        raise HTTPException(
            status_code=501,
            detail="Undo for quantity_changed requires item support (not yet implemented)",
        )

    elif action in (HistoryAction.undo, HistoryAction.rollback):
        raise HTTPException(status_code=400, detail="Cannot undo an undo or rollback action")

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action type: {action}")

    # Mark original entry as undone
    entry.is_undone = True
    entry.undone_by = undo_entry.id

    await db.commit()

    return UndoResponse(
        success=True,
        message=f"Successfully undid {action.value}",
        undo_entry_id=undo_entry.id,
    )
