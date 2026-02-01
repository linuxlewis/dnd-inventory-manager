"""History logging service for tracking all inventory changes."""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.history import HistoryAction, HistoryEntry


async def log_item_added(
    session: AsyncSession,
    inventory_id: str,
    item_id: str,
    item_name: str,
    item_data: dict[str, Any],
    note: str | None = None,
) -> HistoryEntry:
    """Log an item being added to inventory."""
    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.item_added.value,
        item_id=item_id,
        item_name=item_name,
        item_snapshot=item_data,
        previous_value=None,
        new_value=item_data,
        note=note,
    )
    session.add(entry)
    await session.flush()
    return entry


async def log_item_removed(
    session: AsyncSession,
    inventory_id: str,
    item_id: str,
    item_name: str,
    item_snapshot: dict[str, Any],
    note: str | None = None,
) -> HistoryEntry:
    """Log an item being removed from inventory. Stores full snapshot for undo."""
    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.item_removed.value,
        item_id=item_id,
        item_name=item_name,
        item_snapshot=item_snapshot,
        previous_value=item_snapshot,
        new_value=None,
        note=note,
    )
    session.add(entry)
    await session.flush()
    return entry


async def log_item_updated(
    session: AsyncSession,
    inventory_id: str,
    item_id: str,
    item_name: str,
    previous: dict[str, Any],
    new: dict[str, Any],
    note: str | None = None,
) -> HistoryEntry:
    """Log an item being updated."""
    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.item_updated.value,
        item_id=item_id,
        item_name=item_name,
        item_snapshot=new,
        previous_value=previous,
        new_value=new,
        note=note,
    )
    session.add(entry)
    await session.flush()
    return entry


async def log_quantity_changed(
    session: AsyncSession,
    inventory_id: str,
    item_id: str,
    item_name: str,
    old_qty: int,
    new_qty: int,
    note: str | None = None,
) -> HistoryEntry:
    """Log an item quantity change."""
    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.quantity_changed.value,
        item_id=item_id,
        item_name=item_name,
        item_snapshot=None,
        previous_value={"quantity": old_qty},
        new_value={"quantity": new_qty},
        note=note,
    )
    session.add(entry)
    await session.flush()
    return entry


async def log_currency_changed(
    session: AsyncSession,
    inventory_id: str,
    previous: dict[str, int],
    new: dict[str, int],
    note: str | None = None,
) -> HistoryEntry:
    """Log a currency change (add/subtract/convert)."""
    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.currency_changed.value,
        item_id=None,
        item_name=None,
        item_snapshot=None,
        previous_value=previous,
        new_value=new,
        note=note,
    )
    session.add(entry)
    await session.flush()
    return entry


async def log_undo(
    session: AsyncSession,
    inventory_id: str,
    original_entry_id: str,
    original_action: str,
    restored_value: dict[str, Any] | None,
    note: str | None = None,
) -> HistoryEntry:
    """Log an undo action."""
    entry = HistoryEntry(
        inventory_id=inventory_id,
        action=HistoryAction.undo.value,
        item_id=None,
        item_name=None,
        item_snapshot=None,
        previous_value={"undone_entry_id": original_entry_id, "original_action": original_action},
        new_value=restored_value,
        note=note or f"Undid {original_action}",
    )
    session.add(entry)
    await session.flush()
    return entry
