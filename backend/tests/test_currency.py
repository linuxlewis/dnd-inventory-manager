"""Tests for currency API endpoints."""

from typing import TYPE_CHECKING

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from app.db.inventory import Inventory


class TestUpdateCurrency:
    """Tests for POST /api/inventories/{slug}/currency endpoint."""

    async def test_add_currency_success(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str], test_db: AsyncSession
    ) -> None:
        """Test adding currency successfully and persists to database."""
        from app.db.inventory import Inventory as InventoryModel

        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"copper": 100, "gold": 50},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["copper"] == 100
        assert data["gold"] == 50
        assert data["silver"] == 0
        assert data["platinum"] == 0

        # Verify persistence to database
        result = await test_db.execute(
            select(InventoryModel).where(InventoryModel.id == inventory.id)
        )
        db_inventory = result.scalar_one()
        assert db_inventory.copper == 100
        assert db_inventory.gold == 50

    async def test_subtract_currency_success(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test subtracting currency when funds are sufficient."""
        inventory, passphrase = test_inventory

        # First add some currency
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 100},
            headers={"X-Passphrase": passphrase},
        )

        # Then subtract
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": -30},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gold"] == 70

    async def test_subtract_insufficient_funds(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test subtracting more currency than available fails."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": -100},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 400
        assert "Insufficient gold" in response.json()["detail"]

    async def test_currency_update_with_note(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test currency update with note is recorded."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 50, "note": "Treasure found in dungeon"},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200

    async def test_currency_requires_auth(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test currency endpoint requires authentication."""
        inventory, _ = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 50},
        )
        assert response.status_code == 401

    async def test_currency_wrong_passphrase(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test currency endpoint rejects wrong passphrase."""
        inventory, _ = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 50},
            headers={"X-Passphrase": "wrong-passphrase"},
        )
        assert response.status_code == 401


class TestConvertCurrency:
    """Tests for POST /api/inventories/{slug}/currency/convert endpoint."""

    async def test_convert_gold_to_silver(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test converting gold to silver (1 GP = 10 SP)."""
        inventory, passphrase = test_inventory

        # Add gold first
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 10},
            headers={"X-Passphrase": passphrase},
        )

        # Convert 5 gold to silver
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={"from": "gold", "to": "silver", "amount": 5},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gold"] == 5
        assert data["silver"] == 50  # 5 GP * 10 = 50 SP

    async def test_convert_copper_to_gold(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test converting copper to gold (100 CP = 1 GP)."""
        inventory, passphrase = test_inventory

        # Add copper first
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"copper": 500},
            headers={"X-Passphrase": passphrase},
        )

        # Convert 200 copper to gold
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={"from": "copper", "to": "gold", "amount": 200},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["copper"] == 300
        assert data["gold"] == 2

    async def test_convert_insufficient_funds(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test conversion fails when insufficient source currency."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={"from": "gold", "to": "silver", "amount": 100},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 400
        assert "Insufficient" in response.json()["detail"]

    async def test_convert_same_currency_fails(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test converting currency to same type fails."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={"from": "gold", "to": "gold", "amount": 10},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 400
        assert "same type" in response.json()["detail"]

    async def test_convert_uneven_fails(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test conversion that doesn't divide evenly fails."""
        inventory, passphrase = test_inventory

        # Add copper first
        await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"copper": 55},
            headers={"X-Passphrase": passphrase},
        )

        # Try to convert 55 copper to silver (5.5 SP - not even)
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={"from": "copper", "to": "silver", "amount": 55},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 400
        assert "evenly" in response.json()["detail"]

    async def test_convert_requires_auth(
        self, client: AsyncClient, test_inventory: tuple["Inventory", str]
    ) -> None:
        """Test convert endpoint requires authentication."""
        inventory, _ = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={"from": "gold", "to": "silver", "amount": 5},
        )
        assert response.status_code == 401
