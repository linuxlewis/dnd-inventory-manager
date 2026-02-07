"""Tests for currency API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import HistoryAction, HistoryEntityType, HistoryEntry, Inventory
from app.routers.inventories import hash_passphrase


class TestGetCurrency:
    """Tests for GET /api/inventories/{slug}/currency."""

    @pytest.mark.asyncio
    async def test_get_currency_success(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test getting currency returns correct values."""
        inventory, passphrase = test_inventory

        response = await client.get(
            f"/api/inventories/{inventory.slug}/currency",
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["copper"] == 0
        assert data["silver"] == 0
        assert data["gold"] == 0
        assert data["platinum"] == 0
        assert data["total_gp"] == 0.0

    @pytest.mark.asyncio
    async def test_get_currency_with_balance(
        self, client: AsyncClient, inventory_factory
    ) -> None:
        """Test getting currency with existing balance."""
        inventory, passphrase = await inventory_factory(
            slug="rich-party",
            copper=50,
            silver=25,
            gold=100,
            platinum=5,
        )

        response = await client.get(
            f"/api/inventories/{inventory.slug}/currency",
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["copper"] == 50
        assert data["silver"] == 25
        assert data["gold"] == 100
        assert data["platinum"] == 5
        # Total: (50/100) + (25/10) + 100 + (5*10) = 0.5 + 2.5 + 100 + 50 = 153
        assert data["total_gp"] == 153.0

    @pytest.mark.asyncio
    async def test_get_currency_no_passphrase(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test missing passphrase returns 401."""
        inventory, _ = test_inventory

        response = await client.get(f"/api/inventories/{inventory.slug}/currency")

        assert response.status_code == 401
        assert "Passphrase required" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_currency_invalid_passphrase(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test invalid passphrase returns 401."""
        inventory, _ = test_inventory

        response = await client.get(
            f"/api/inventories/{inventory.slug}/currency",
            headers={"X-Passphrase": "wrong-passphrase"},
        )

        assert response.status_code == 401
        assert "Invalid passphrase" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_currency_not_found(self, client: AsyncClient) -> None:
        """Test unknown inventory returns 404."""
        response = await client.get(
            "/api/inventories/unknown-slug/currency",
            headers={"X-Passphrase": "any"},
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


class TestUpdateCurrency:
    """Tests for POST /api/inventories/{slug}/currency."""

    @pytest.mark.asyncio
    async def test_add_currency(
        self,
        client: AsyncClient,
        test_inventory: tuple[Inventory, str],
        test_db: AsyncSession,
    ) -> None:
        """Test adding currency increases balance."""
        inventory, passphrase = test_inventory

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 100, "silver": 50},
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["gold"] == 100
        assert data["silver"] == 50

        # Verify persistence
        result = await test_db.execute(
            select(Inventory).where(Inventory.id == inventory.id)
        )
        db_inventory = result.scalar_one()
        assert db_inventory.gold == 100
        assert db_inventory.silver == 50

    @pytest.mark.asyncio
    async def test_spend_currency(
        self,
        client: AsyncClient,
        inventory_factory,
        test_db: AsyncSession,
    ) -> None:
        """Test spending currency decreases balance with make-change optimization."""
        inventory, passphrase = await inventory_factory(
            slug="spender-party",
            gold=100,
        )

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": -30},
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        # Make-change optimizes: 100 GP - 30 GP = 70 GP = 7 PP (optimal)
        assert data["platinum"] == 7
        assert data["gold"] == 0
        assert data["total_gp"] == 70.0

        # Verify persistence
        await test_db.refresh(inventory)
        assert inventory.platinum == 7
        assert inventory.gold == 0

    @pytest.mark.asyncio
    async def test_insufficient_funds(
        self,
        client: AsyncClient,
        test_inventory: tuple[Inventory, str],
    ) -> None:
        """Test insufficient funds returns 400."""
        inventory, passphrase = test_inventory

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": -100},  # Has 0 gold
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 400
        assert "Insufficient funds" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_update_currency_requires_auth(
        self,
        client: AsyncClient,
        test_inventory: tuple[Inventory, str],
    ) -> None:
        """Test update requires authentication."""
        inventory, _ = test_inventory

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": 100},
        )

        assert response.status_code == 401


class TestMakeChange:
    """Tests for make-change behavior when spending currency."""

    @pytest.mark.asyncio
    async def test_spend_makes_change_from_higher_denom(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test spending more than available in one denom uses higher denoms."""
        inventory, passphrase = await inventory_factory(
            slug="makechange-party",
            platinum=1,  # 10 GP worth
            gold=5,      # 5 GP
        )  # Total: 15 GP

        # Spend 12 GP - requires breaking the platinum
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": -12},
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        # 15 GP - 12 GP = 3 GP remaining (optimal: 0 PP, 3 GP)
        assert data["total_gp"] == 3.0

    @pytest.mark.asyncio
    async def test_spend_across_multiple_denoms(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test spending specified in multiple denominations."""
        inventory, passphrase = await inventory_factory(
            slug="multi-spend-party",
            gold=100,
            silver=50,
        )  # Total: 105 GP

        # Spend 10 GP and 30 SP (10 + 3 = 13 GP)
        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency",
            json={"gold": -10, "silver": -30},
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        # 105 GP - 13 GP = 92 GP remaining
        assert data["total_gp"] == 92.0


class TestCurrencyHistoryLogging:
    """Tests for history logging on currency operations."""

    @pytest.fixture
    async def inventory_for_currency_history(self, test_db: AsyncSession) -> tuple[Inventory, str]:
        """Create a sample inventory for currency history testing."""
        passphrase = "test-currency-history-pass"
        inventory = Inventory(
            slug="test-currency-history-party",
            name="Test Currency History Party",
            description="An inventory for testing currency history",
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

    @pytest.mark.asyncio
    async def test_update_currency_adds_history_entry(
        self,
        client: AsyncClient,
        inventory_for_currency_history: tuple[Inventory, str],
        test_db: AsyncSession,
    ) -> None:
        """Test that updating currency logs a history entry."""
        inventory, passphrase = inventory_for_currency_history

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
