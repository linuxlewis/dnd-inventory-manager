"""Tests for history API endpoints."""

from typing import TYPE_CHECKING

from httpx import AsyncClient

if TYPE_CHECKING:
    from app.db.inventory import Inventory


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

    async def test_history_after_currency_change(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test history records currency changes."""
        inventory, passphrase = test_inventory

        # Add some currency
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 100, "note": "Dragon hoard"},
            headers={"X-Passphrase": passphrase},
        )

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
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test filtering history by action type."""
        inventory, passphrase = test_inventory

        # Add currency twice
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 50},
            headers={"X-Passphrase": passphrase},
        )
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"silver": 100},
            headers={"X-Passphrase": passphrase},
        )

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
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test history pagination."""
        inventory, passphrase = test_inventory

        # Add currency 5 times
        for i in range(5):
            await client.post(
                f"/api/inventories/{inventory.slug}/currency",
                json={"copper": i + 1},
                headers={"X-Passphrase": passphrase},
            )

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
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test history returns entries ordered by timestamp (newest first)."""
        import asyncio

        inventory, passphrase = test_inventory

        # Add currency twice with different notes
        # Add small delay to ensure different timestamps
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 10, "note": "First"},
            headers={"X-Passphrase": passphrase},
        )
        await asyncio.sleep(0.01)  # Small delay to ensure timestamp difference
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 20, "note": "Second"},
            headers={"X-Passphrase": passphrase},
        )

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
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test undoing a currency change."""
        inventory, passphrase = test_inventory

        # Add currency
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 100},
            headers={"X-Passphrase": passphrase},
        )

        # Get the history entry ID
        history_response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        entry_id = history_response.json()["items"][0]["id"]

        # Undo the change
        response = await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry_id}/undo",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "undo_entry_id" in data

        # Verify currency was restored
        inv_response = await client.get(
            f"/api/inventories/{inventory.slug}",
            headers={"X-Passphrase": passphrase},
        )
        assert inv_response.json()["gold"] == 0

    async def test_undo_already_undone_fails(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test undoing an already-undone action fails."""
        inventory, passphrase = test_inventory

        # Add currency
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 50},
            headers={"X-Passphrase": passphrase},
        )

        # Get the history entry ID
        history_response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        entry_id = history_response.json()["items"][0]["id"]

        # Undo once
        await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry_id}/undo",
            headers={"X-Passphrase": passphrase},
        )

        # Try to undo again
        response = await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry_id}/undo",
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
        response = await client.post(
            f"/api/inventories/{inventory.slug}/history/some-id/undo"
        )
        assert response.status_code == 401

    async def test_undo_creates_history_entry(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test undoing creates a new history entry."""
        inventory, passphrase = test_inventory

        # Add currency
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"silver": 200},
            headers={"X-Passphrase": passphrase},
        )

        # Get history count
        history_response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        initial_count = history_response.json()["total"]
        entry_id = history_response.json()["items"][0]["id"]

        # Undo
        await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry_id}/undo",
            headers={"X-Passphrase": passphrase},
        )

        # Check history grew (undo creates 2 entries: currency_changed + undo)
        history_response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        # Should have at least 2 more entries
        assert history_response.json()["total"] > initial_count

    async def test_undo_marks_original_as_undone(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test undoing marks the original entry as undone."""
        inventory, passphrase = test_inventory

        # Add currency
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"platinum": 10},
            headers={"X-Passphrase": passphrase},
        )

        # Get the history entry ID
        history_response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        entry_id = history_response.json()["items"][0]["id"]

        # Undo
        await client.post(
            f"/api/inventories/{inventory.slug}/history/{entry_id}/undo",
            headers={"X-Passphrase": passphrase},
        )

        # Check original entry is marked as undone
        history_response = await client.get(
            f"/api/inventories/{inventory.slug}/history",
            headers={"X-Passphrase": passphrase},
        )
        # Find the original entry (it won't be first anymore)
        items = history_response.json()["items"]
        original = next((item for item in items if item["id"] == entry_id), None)
        assert original is not None
        assert original["is_undone"] is True
