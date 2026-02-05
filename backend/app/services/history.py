"""History service layer for logging inventory changes.

This module provides functions to log item and currency operations to the history table.
"""

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from app.models import (
    HistoryAction,
    HistoryEntityType,
    HistoryEntry,
    HistoryListResponse,
    Inventory,
    Item,
)


def compute_changes(old_values: dict[str, Any], new_values: dict[str, Any]) -> dict[str, Any]:
    """Compute a changes dict from old and new values.

    Returns a dict in format: { field: { "old": x, "new": y } }
    Only includes fields that actually changed.
    """
    changes: dict[str, Any] = {}
    all_keys = set(old_values.keys()) | set(new_values.keys())

    for key in all_keys:
        old_val = old_values.get(key)
        new_val = new_values.get(key)
        if old_val != new_val:
            changes[key] = {"old": old_val, "new": new_val}

    return changes


async def log_item_added(session: AsyncSession, inventory_id: UUID, item: Item) -> HistoryEntry:
    """Log an item_added history entry.

    Args:
        session: Database session
        inventory_id: ID of the inventory
        item: The newly created item

    Returns:
        The created HistoryEntry
    """
    details = {
        "name": item.name,
        "quantity": item.quantity,
        "type": item.type.value if item.type else None,
        "rarity": item.rarity.value if item.rarity else None,
    }

    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.item_added,
        entity_type=HistoryEntityType.item,
        entity_id=item.id,
        entity_name=item.name,
        details=details,
    )

    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def log_item_updated(
    session: AsyncSession, inventory_id: UUID, item: Item, changes: dict[str, Any]
) -> HistoryEntry:
    """Log an item_updated history entry.

    Args:
        session: Database session
        inventory_id: ID of the inventory
        item: The updated item
        changes: Dict of changes in format { field: { "old": x, "new": y } }

    Returns:
        The created HistoryEntry
    """
    details = {"changes": changes}

    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.item_updated,
        entity_type=HistoryEntityType.item,
        entity_id=item.id,
        entity_name=item.name,
        details=details,
    )

    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def log_item_removed(session: AsyncSession, inventory_id: UUID, item: Item) -> HistoryEntry:
    """Log an item_removed history entry.

    Args:
        session: Database session
        inventory_id: ID of the inventory
        item: The item being removed

    Returns:
        The created HistoryEntry
    """
    details = {
        "name": item.name,
        "quantity": item.quantity,
        "reason": "deleted",
    }

    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.item_removed,
        entity_type=HistoryEntityType.item,
        entity_id=item.id,
        entity_name=item.name,
        details=details,
    )

    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def log_currency_updated(
    session: AsyncSession,
    inventory_id: UUID,
    old_currency: dict[str, int],
    new_currency: dict[str, int],
    note: str | None = None,
) -> HistoryEntry | None:
    """Log a currency_updated history entry.

    Args:
        session: Database session
        inventory_id: ID of the inventory
        old_currency: Dict with old currency values (copper, silver, gold, platinum)
        new_currency: Dict with new currency values
        note: Optional note for the transaction

    Returns:
        The created HistoryEntry, or None if no changes
    """
    changes = compute_changes(old_currency, new_currency)

    # Only log if there were actual changes
    if not changes:
        return None

    details: dict[str, Any] = {"changes": changes}
    if note:
        details["note"] = note

    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.currency_updated,
        entity_type=HistoryEntityType.currency,
        entity_id=None,
        entity_name=None,
        details=details,
    )

    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


def get_currency_snapshot(inventory: Inventory) -> dict[str, int]:
    """Get a snapshot of current currency values from an inventory."""
    return {
        "copper": inventory.copper,
        "silver": inventory.silver,
        "gold": inventory.gold,
        "platinum": inventory.platinum,
    }


async def get_history(
    session: AsyncSession,
    inventory_id: UUID,
    limit: int = 20,
    offset: int = 0,
    action_filter: HistoryAction | None = None,
    entity_filter: HistoryEntityType | None = None,
) -> HistoryListResponse:
    """Get paginated history entries for an inventory.

    Args:
        session: Database session
        inventory_id: ID of the inventory
        limit: Maximum entries to return (default 20)
        offset: Pagination offset (default 0)
        action_filter: Optional filter by action type
        entity_filter: Optional filter by entity type

    Returns:
        HistoryListResponse with entries, total count, limit, and offset
    """
    # Build base query
    query = select(HistoryEntry).where(HistoryEntry.inventory_id == inventory_id)

    # Apply filters
    if action_filter is not None:
        query = query.where(HistoryEntry.action == action_filter)
    if entity_filter is not None:
        query = query.where(HistoryEntry.entity_type == entity_filter)

    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination and ordering (newest first)
    query = query.order_by(HistoryEntry.created_at.desc()).offset(offset).limit(limit)

    result = await session.execute(query)
    entries = result.scalars().all()

    return HistoryListResponse(
        entries=list(entries),
        total=total,
        limit=limit,
        offset=offset,
    )
