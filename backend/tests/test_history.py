"""Tests for history API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    HistoryAction,
    HistoryEntityType,
    HistoryEntry,
    Inventory,
)
from app.routers.inventories import hash_passphrase


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
