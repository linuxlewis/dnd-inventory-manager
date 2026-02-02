"""Tests for history API endpoints."""

from typing import TYPE_CHECKING

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.history import HistoryAction, HistoryEntry

if TYPE_CHECKING:
    from app.db.inventory import Inventory


@pytest.fixture
async def history_entry(
    test_db: AsyncSession, test_inventory: tuple["Inventory", str]
) -> HistoryEntry:
    """Create a single history entry for testing."""
    inventory, _ = test_inventory
    entry = HistoryEntry(
        inventory_id=inventory.id,
        action=HistoryAction.currency_changed.value,
        previous_value={"gold": 0},
        new_value={"gold": 100},
        note="Test entry",
    )
    test_db.add(entry)
    await test_db.commit()
    await test_db.refresh(entry)
    return entry


async def create_history_entries(
    db: AsyncSession,
    inventory_id: str,
    count: int,
    action: HistoryAction = HistoryAction.currency_changed,
) -> list[HistoryEntry]:
    """Helper to create multiple history entries directly."""
    entries = []
    for i in range(count):
        entry = HistoryEntry(
            inventory_id=inventory_id,
            action=action.value,
            previous_value={"gold": i},
            new_value={"gold": i + 1},
            note=f"Entry {i + 1}",
        )
        db.add(entry)
        entries.append(entry)
    await db.commit()
    for entry in entries:
        await db.refresh(entry)
    return entries


class TestListHistory:
    """Tests for GET /api/inventories/{slug}/history endpoint."""

    async def test_history_empty_initially(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test history is empty for a new inventory."""
        inventory, passphrase = test_inventory
        response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_history_returns_entries(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test history returns created entries."""
        inventory, passphrase = test_inventory

        # Create history entry directly
        entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            previous_value={"gold": 0},
            new_value={"gold": 100},
            note="Dragon hoard",
        )
        test_db.add(entry)
        await test_db.commit()

        # Check history
        response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["action"] == "currency_changed"
        assert data["items"][0]["note"] == "Dragon hoard"

    async def test_history_filter_by_action(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test filtering history by action type."""
        inventory, passphrase = test_inventory

        # Create entries directly with different actions
        await create_history_entries(test_db, inventory.id, 2, HistoryAction.currency_changed)

        # Create an item_added entry (different action)
        item_entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.item_added.value,
            item_name="Sword",
            note="Found sword",
        )
        test_db.add(item_entry)
        await test_db.commit()

        # Filter by currency_changed
        response = await client.get(
            f"/api/inventories/{inventory.slug}/history?action=currency_changed",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(item["action"] == "currency_changed" for item in data["items"])

    async def test_history_pagination(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test history pagination."""
        inventory, passphrase = test_inventory

        # Create 5 history entries directly
        await create_history_entries(test_db, inventory.id, 5)

        # Get first page (limit 2)
        response = await client.get(
            f"/api/inventories/{inventory.slug}/history?limit=2&offset=0",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0

        # Get second page
        response = await client.get(
            f"/api/inventories/{inventory.slug}/history?limit=2&offset=2",
            headers={"X-Passphrase": passphrase},
        )
        data = response.json()
        assert len(data["items"]) == 2
        assert data["offset"] == 2

    async def test_history_newest_first(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test history returns entries ordered by created_at (newest first)."""
        from datetime import datetime, timedelta, timezone

        inventory, passphrase = test_inventory

        # Create entries with explicit timestamps
        now = datetime.now(timezone.utc)
        first_entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            note="First",
        )
        first_entry.created_at = now - timedelta(seconds=10)
        test_db.add(first_entry)

        second_entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            note="Second",
        )
        second_entry.created_at = now
        test_db.add(second_entry)
        await test_db.commit()

        # Check order
        response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        data = response.json()
        assert data["items"][0]["note"] == "Second"
        assert data["items"][1]["note"] == "First"

    async def test_history_requires_auth(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test history endpoint requires authentication."""
        inventory, _ = test_inventory
        response = await client.get(f"/api/inventories/{inventory.slug}/history")
        assert response.status_code == 401


class TestUndoAction:
    """Tests for POST /api/inventories/{slug}/history/{entry_id}/undo endpoint."""

    async def test_undo_currency_change(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test undoing a currency change restores previous values."""
        from sqlalchemy import select

        from app.db.inventory import Inventory as InventoryModel

        inventory, passphrase = test_inventory

        # Set inventory currency to 100 gold first
        inventory.gold = 100
        test_db.add(inventory)
        await test_db.commit()

        # Create a history entry with previous value
        entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            previous_value={"copper": 0, "silver": 0, "gold": 0, "platinum": 0},
            new_value={"copper": 0, "silver": 0, "gold": 100, "platinum": 0},
            note="Added gold",
        )
        test_db.add(entry)
        await test_db.commit()
        await test_db.refresh(entry)

        # Undo the change
        response = await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry.id}/undo",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "undo_entry_id" in data

        # Verify currency was restored in database (fresh query)
        result = await test_db.execute(
            select(InventoryModel).where(InventoryModel.id == inventory.id)
        )
        db_inventory = result.scalar_one()
        assert db_inventory.gold == 0

    async def test_undo_already_undone_fails(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test undoing an already-undone action fails."""
        inventory, passphrase = test_inventory

        # Create an already-undone history entry
        entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            previous_value={"gold": 0},
            new_value={"gold": 50},
            is_undone=True,
        )
        test_db.add(entry)
        await test_db.commit()
        await test_db.refresh(entry)

        # Try to undo
        response = await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry.id}/undo",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 400
        assert "already been undone" in response.json()["detail"]

    async def test_undo_nonexistent_entry(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test undoing a non-existent entry fails."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/history/nonexistent-id/undo",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 404

    async def test_undo_requires_auth(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test undo endpoint requires authentication."""
        inventory, _ = test_inventory
        response = await client.post(f"/api/inventories/{inventory.slug}/history/some-id/undo")
        assert response.status_code == 401

    async def test_undo_creates_history_entries(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test undoing creates new history entries."""
        from sqlalchemy import func, select

        inventory, passphrase = test_inventory

        # Create a history entry with previous values
        entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            previous_value={"copper": 0, "silver": 0, "gold": 0, "platinum": 0},
            new_value={"copper": 0, "silver": 200, "gold": 0, "platinum": 0},
        )
        test_db.add(entry)
        await test_db.commit()
        await test_db.refresh(entry)

        # Count entries before undo
        count_result = await test_db.execute(
            select(func.count())
            .select_from(HistoryEntry)
            .where(HistoryEntry.inventory_id == inventory.id)
        )
        initial_count = count_result.scalar()

        # Undo
        await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry.id}/undo",
            headers={"X-Passphrase": passphrase},
        )

        # Check history grew
        count_result = await test_db.execute(
            select(func.count())
            .select_from(HistoryEntry)
            .where(HistoryEntry.inventory_id == inventory.id)
        )
        new_count = count_result.scalar()
        assert new_count > initial_count

    async def test_undo_marks_original_as_undone(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test undoing marks the original entry as undone in database."""
        inventory, passphrase = test_inventory

        # Create a history entry
        entry = HistoryEntry(
            inventory_id=inventory.id,
            action=HistoryAction.currency_changed.value,
            previous_value={"copper": 0, "silver": 0, "gold": 0, "platinum": 0},
            new_value={"copper": 0, "silver": 0, "gold": 0, "platinum": 10},
        )
        test_db.add(entry)
        await test_db.commit()
        await test_db.refresh(entry)
        entry_id = entry.id

        # Undo
        await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry_id}/undo",
            headers={"X-Passphrase": passphrase},
        )

        # Check original entry is marked as undone in database
        await test_db.refresh(entry)
        assert entry.is_undone is True
