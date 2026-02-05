"""Tests for history API endpoints."""

from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import (
    HistoryAction,
    HistoryEntityType,
    HistoryEntry,
    Inventory,
)
from app.routers.inventories import hash_passphrase


@pytest.fixture
async def inventory_with_history(test_db: AsyncSession) -> tuple[Inventory, str]:
    """Create a sample inventory for history testing."""
    passphrase = "test-history-pass"
    inventory = Inventory(
        slug="test-history-party",
        name="Test History Party",
        description="An inventory for testing history",
        passphrase_hash=hash_passphrase(passphrase),
        copper=100,
        silver=50,
        gold=25,
        platinum=10,
    )
    test_db.add(inventory)
    await test_db.commit()
    await test_db.refresh(inventory)
    return inventory, passphrase


class TestItemHistoryLogging:
    """Tests for history logging on item operations."""

    async def test_create_item_adds_history_entry(
        self,
        client: AsyncClient,
        inventory_with_history: tuple[Inventory, str],
        test_db: AsyncSession,
    ) -> None:
        """Test that creating an item logs a history entry."""
        inventory, passphrase = inventory_with_history

        # Create an item
        response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": "Magic Sword", "type": "equipment", "rarity": "rare", "quantity": 2},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        item_data = response.json()
        item_id = UUID(item_data["id"])

        # Verify history entry was created
        result = await test_db.execute(
            select(HistoryEntry).where(
                HistoryEntry.inventory_id == inventory.id,
                HistoryEntry.action == HistoryAction.item_added,
            )
        )
        entry = result.scalar_one_or_none()
        assert entry is not None
        assert entry.entity_type == HistoryEntityType.item
        assert entry.entity_id == item_id
        assert entry.entity_name == "Magic Sword"
        assert entry.details["name"] == "Magic Sword"
        assert entry.details["quantity"] == 2
        assert entry.details["type"] == "equipment"
        assert entry.details["rarity"] == "rare"

    async def test_update_item_adds_history_entry_with_changes(
        self,
        client: AsyncClient,
        inventory_with_history: tuple[Inventory, str],
        test_db: AsyncSession,
    ) -> None:
        """Test that updating an item logs a history entry with changes."""
        inventory, passphrase = inventory_with_history

        # Create an item first
        create_response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": "Healing Potion", "type": "potion", "quantity": 3},
            headers={"X-Passphrase": passphrase},
        )
        assert create_response.status_code == 200
        item_data = create_response.json()
        item_id = UUID(item_data["id"])

        # Update the item
        update_response = await client.patch(
            f"/api/inventories/{inventory.slug}/items/{item_id}",
            json={"quantity": 5, "notes": "Found in dungeon"},
            headers={"X-Passphrase": passphrase},
        )
        assert update_response.status_code == 200

        # Verify history entry was created with changes
        result = await test_db.execute(
            select(HistoryEntry).where(
                HistoryEntry.inventory_id == inventory.id,
                HistoryEntry.action == HistoryAction.item_updated,
            )
        )
        entry = result.scalar_one_or_none()
        assert entry is not None
        assert entry.entity_type == HistoryEntityType.item
        assert entry.entity_id == item_id
        assert entry.entity_name == "Healing Potion"
        assert "changes" in entry.details
        changes = entry.details["changes"]
        assert changes["quantity"]["old"] == 3
        assert changes["quantity"]["new"] == 5
        assert changes["notes"]["old"] is None
        assert changes["notes"]["new"] == "Found in dungeon"

    async def test_delete_item_adds_history_entry(
        self,
        client: AsyncClient,
        inventory_with_history: tuple[Inventory, str],
        test_db: AsyncSession,
    ) -> None:
        """Test that deleting an item logs a history entry."""
        inventory, passphrase = inventory_with_history

        # Create an item first
        create_response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": "Scroll of Fireball", "type": "scroll", "quantity": 1},
            headers={"X-Passphrase": passphrase},
        )
        assert create_response.status_code == 200
        item_data = create_response.json()
        item_id = UUID(item_data["id"])

        # Delete the item
        delete_response = await client.delete(
            f"/api/inventories/{inventory.slug}/items/{item_id}",
            headers={"X-Passphrase": passphrase},
        )
        assert delete_response.status_code == 204

        # Verify history entry was created
        result = await test_db.execute(
            select(HistoryEntry).where(
                HistoryEntry.inventory_id == inventory.id,
                HistoryEntry.action == HistoryAction.item_removed,
            )
        )
        entry = result.scalar_one_or_none()
        assert entry is not None
        assert entry.entity_type == HistoryEntityType.item
        assert entry.entity_id == item_id
        assert entry.entity_name == "Scroll of Fireball"
        assert entry.details["name"] == "Scroll of Fireball"
        assert entry.details["quantity"] == 1
        assert entry.details["reason"] == "deleted"


class TestCurrencyHistoryLogging:
    """Tests for history logging on currency operations."""

    async def test_update_currency_adds_history_entry(
        self,
        client: AsyncClient,
        inventory_with_history: tuple[Inventory, str],
        test_db: AsyncSession,
    ) -> None:
        """Test that updating currency logs a history entry."""
        inventory, passphrase = inventory_with_history

        # Update currency
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 50, "note": "Sold gems"},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200

        # Verify history entry was created
        result = await test_db.execute(
            select(HistoryEntry).where(
                HistoryEntry.inventory_id == inventory.id,
                HistoryEntry.action == HistoryAction.currency_updated,
            )
        )
        entry = result.scalar_one_or_none()
        assert entry is not None
        assert entry.entity_type == HistoryEntityType.currency
        assert entry.entity_id is None
        assert entry.entity_name is None
        assert "changes" in entry.details
        changes = entry.details["changes"]
        assert changes["gold"]["old"] == 25
        assert changes["gold"]["new"] == 75
        assert entry.details["note"] == "Sold gems"


class TestHistoryEndpoint:
    """Tests for GET /api/v1/inventories/{slug}/history endpoint."""

    @pytest.fixture
    async def inventory_with_multiple_history(
        self, test_db: AsyncSession
    ) -> tuple[Inventory, str, list[HistoryEntry]]:
        """Create an inventory with multiple history entries."""
        passphrase = "test-history-endpoint"
        inventory = Inventory(
            slug="test-history-endpoint-party",
            name="Test History Endpoint Party",
            passphrase_hash=hash_passphrase(passphrase),
        )
        test_db.add(inventory)
        await test_db.commit()
        await test_db.refresh(inventory)

        # Create multiple history entries
        entries = []
        for i in range(25):
            action = [
                HistoryAction.item_added,
                HistoryAction.item_updated,
                HistoryAction.item_removed,
                HistoryAction.currency_updated,
            ][i % 4]
            entity_type = (
                HistoryEntityType.item
                if action != HistoryAction.currency_updated
                else HistoryEntityType.currency
            )
            entry = HistoryEntry(
                inventory_id=inventory.id,
                action=action,
                entity_type=entity_type,
                entity_name=f"Item {i}" if entity_type == HistoryEntityType.item else None,
                details={"index": i},
            )
            entries.append(entry)
            test_db.add(entry)

        await test_db.commit()
        for entry in entries:
            await test_db.refresh(entry)

        return inventory, passphrase, entries

    async def test_get_history_returns_entries_in_desc_order(
        self,
        client: AsyncClient,
        inventory_with_multiple_history: tuple[Inventory, str, list[HistoryEntry]],
        test_db: AsyncSession,
    ) -> None:
        """Test that history entries are returned in reverse chronological order."""
        inventory, passphrase, _ = inventory_with_multiple_history

        response = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()

        entries = data["entries"]
        assert len(entries) == 20  # Default limit
        assert data["total"] == 25
        assert data["limit"] == 20
        assert data["offset"] == 0

        # Verify descending order by created_at
        for i in range(len(entries) - 1):
            assert entries[i]["created_at"] >= entries[i + 1]["created_at"]

    async def test_get_history_pagination_works(
        self,
        client: AsyncClient,
        inventory_with_multiple_history: tuple[Inventory, str, list[HistoryEntry]],
        test_db: AsyncSession,
    ) -> None:
        """Test that pagination works correctly."""
        inventory, passphrase, _ = inventory_with_multiple_history

        # Get first page
        response1 = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
            params={"limit": 10, "offset": 0},
            headers={"X-Passphrase": passphrase},
        )
        assert response1.status_code == 200
        data1 = response1.json()
        assert len(data1["entries"]) == 10
        assert data1["total"] == 25

        # Get second page
        response2 = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
            params={"limit": 10, "offset": 10},
            headers={"X-Passphrase": passphrase},
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2["entries"]) == 10
        assert data2["total"] == 25

        # Verify no overlap between pages
        ids1 = {e["id"] for e in data1["entries"]}
        ids2 = {e["id"] for e in data2["entries"]}
        assert ids1.isdisjoint(ids2)

    async def test_get_history_action_filter_works(
        self,
        client: AsyncClient,
        inventory_with_multiple_history: tuple[Inventory, str, list[HistoryEntry]],
        test_db: AsyncSession,
    ) -> None:
        """Test that action filter works correctly."""
        inventory, passphrase, _ = inventory_with_multiple_history

        response = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
            params={"action": "item_added", "limit": 100},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()

        # All entries should be item_added
        for entry in data["entries"]:
            assert entry["action"] == "item_added"

        # We created 25 entries, 1/4 should be item_added (indices 0, 4, 8, ...)
        assert data["total"] == 7  # ceil(25/4)

    async def test_get_history_entity_type_filter_works(
        self,
        client: AsyncClient,
        inventory_with_multiple_history: tuple[Inventory, str, list[HistoryEntry]],
        test_db: AsyncSession,
    ) -> None:
        """Test that entity_type filter works correctly."""
        inventory, passphrase, _ = inventory_with_multiple_history

        response = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
            params={"entity_type": "currency", "limit": 100},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()

        # All entries should be currency type
        for entry in data["entries"]:
            assert entry["entity_type"] == "currency"

        # We created 25 entries, 1/4 should be currency (indices 3, 7, 11, ...)
        assert data["total"] == 6  # 25/4 rounded down

    async def test_get_history_requires_auth(
        self,
        client: AsyncClient,
        inventory_with_multiple_history: tuple[Inventory, str, list[HistoryEntry]],
    ) -> None:
        """Test that accessing history requires authentication."""
        inventory, passphrase, _ = inventory_with_multiple_history

        # No passphrase
        response = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
        )
        assert response.status_code == 401

        # Wrong passphrase
        response = await client.get(
            f"/api/v1/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": "wrong-passphrase"},
        )
        assert response.status_code == 401

    async def test_get_history_nonexistent_inventory(
        self, client: AsyncClient
    ) -> None:
        """Test that requesting history for nonexistent inventory returns 404."""
        response = await client.get(
            "/api/v1/inventories/nonexistent-slug/history",
            headers={"X-Passphrase": "any-pass"},
        )
        assert response.status_code == 404
