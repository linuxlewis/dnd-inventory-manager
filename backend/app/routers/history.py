"""History tracking and undo endpoints."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_authenticated_inventory
from app.database import get_db
from app.db.history import HistoryAction, HistoryEntry
from app.models.history import (
    HistoryEntryRead,
    HistoryListResponse,
    HistoryQueryParams,
    UndoResponse,
)
from app.services.history import log_currency_changed, log_undo

router = APIRouter(prefix="/api/inventories", tags=["history"])


@router.get("/{slug}/history", response_model=HistoryListResponse)
async def list_history(
    slug: str,
    params: HistoryQueryParams = Depends(),
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
    if params.action is not None:
        query = query.where(HistoryEntry.action == params.action.value)
    if params.item_id is not None:
        query = query.where(HistoryEntry.item_id == str(params.item_id))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply ordering and pagination
    query = query.order_by(HistoryEntry.created_at.desc()).offset(params.offset).limit(params.limit)

    result = await db.execute(query)
    entries = result.scalars().all()

    return HistoryListResponse(
        items=[HistoryEntryRead.model_validate(e) for e in entries],
        total=total,
        limit=params.limit,
        offset=params.offset,
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
