"""Tests for currency API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import Inventory


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
        """Test spending currency decreases balance."""
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
        assert data["gold"] == 70

        # Verify persistence
        await test_db.refresh(inventory)
        assert inventory.gold == 70

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


class TestConvertCurrency:
    """Tests for POST /api/inventories/{slug}/currency/convert."""

    @pytest.mark.asyncio
    async def test_convert_gold_to_silver(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test converting gold to silver (down-conversion)."""
        inventory, passphrase = await inventory_factory(
            slug="convert-party",
            gold=10,
        )

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "gold",
                "to_denomination": "silver",
                "amount": 5,
            },
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["gold"] == 5  # 10 - 5
        assert data["silver"] == 50  # 5 * 10

    @pytest.mark.asyncio
    async def test_convert_copper_to_gold(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test converting copper to gold (up-conversion).

        250 CP -> 2 GP + 50 CP remainder. Only 200 CP is consumed.
        """
        inventory, passphrase = await inventory_factory(
            slug="copper-party",
            copper=250,
        )

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "copper",
                "to_denomination": "gold",
                "amount": 250,
            },
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        # 250 CP requested, but only 200 CP needed for 2 GP
        # 50 CP remains (250 - 200 = 50)
        assert data["copper"] == 50  # Remainder preserved
        assert data["gold"] == 2  # 200 CP / 100 = 2 GP

    @pytest.mark.asyncio
    async def test_convert_silver_to_platinum(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test converting silver to platinum (skipping gold).

        150 SP requested, but only 100 SP needed for 1 PP.
        50 SP remains (preserved in source denomination).
        """
        inventory, passphrase = await inventory_factory(
            slug="silver-party",
            silver=150,
        )

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "silver",
                "to_denomination": "platinum",
                "amount": 150,
            },
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 200
        data = response.json()
        # 150 SP = 1500 CP, 1 PP = 1000 CP
        # Only 100 SP (1000 CP) used for 1 PP
        # 50 SP remains in source denomination
        assert data["silver"] == 50  # 150 - 100 = 50
        assert data["platinum"] == 1
        assert data["copper"] == 0  # No copper remainder when source preserved

    @pytest.mark.asyncio
    async def test_convert_insufficient_funds(
        self,
        client: AsyncClient,
        test_inventory: tuple[Inventory, str],
    ) -> None:
        """Test conversion with insufficient funds returns 400."""
        inventory, passphrase = test_inventory

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "gold",
                "to_denomination": "silver",
                "amount": 100,  # Has 0 gold
            },
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 400
        assert "Insufficient" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_convert_same_denomination(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test converting to same denomination returns 400."""
        inventory, passphrase = await inventory_factory(
            slug="same-party",
            gold=10,
        )

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "gold",
                "to_denomination": "gold",
                "amount": 5,
            },
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 400
        assert "same denomination" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_convert_amount_too_small(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test converting too small amount returns 400."""
        inventory, passphrase = await inventory_factory(
            slug="small-party",
            copper=5,
        )

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "copper",
                "to_denomination": "gold",
                "amount": 5,  # 5 CP < 100 CP (1 GP)
            },
            headers={"X-Passphrase": passphrase},
        )

        assert response.status_code == 400
        assert "too small" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_convert_requires_auth(
        self,
        client: AsyncClient,
        test_inventory: tuple[Inventory, str],
    ) -> None:
        """Test conversion requires authentication."""
        inventory, _ = test_inventory

        response = await client.post(
            f"/api/inventories/{inventory.slug}/currency/convert",
            json={
                "from_denomination": "gold",
                "to_denomination": "silver",
                "amount": 5,
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_convert_all_denomination_pairs(
        self,
        client: AsyncClient,
        inventory_factory,
    ) -> None:
        """Test conversion works for various denomination pairs."""
        test_cases = [
            # (from, to, initial, amount, expected_from, expected_to, expected_copper)
            ("copper", "silver", {"copper": 100}, 100, 0, 10, 0),
            ("silver", "gold", {"silver": 100}, 100, 0, 10, 0),
            ("gold", "platinum", {"gold": 100}, 100, 0, 10, 0),
            ("platinum", "gold", {"platinum": 10}, 10, 0, 100, 0),
            ("gold", "silver", {"gold": 10}, 10, 0, 100, 0),
            ("silver", "copper", {"silver": 10}, 10, 0, 100, 100),
        ]

        for i, (from_d, to_d, initial, amount, exp_from, exp_to, exp_cp) in enumerate(
            test_cases
        ):
            inventory, passphrase = await inventory_factory(
                slug=f"pair-test-{i}",
                **initial,
            )

            response = await client.post(
                f"/api/inventories/{inventory.slug}/currency/convert",
                json={
                    "from_denomination": from_d,
                    "to_denomination": to_d,
                    "amount": amount,
                },
                headers={"X-Passphrase": passphrase},
            )

            assert response.status_code == 200, f"Failed for {from_d} -> {to_d}"
            data = response.json()
            assert data[from_d] == exp_from, f"Wrong {from_d} for {from_d} -> {to_d}"
            assert data[to_d] == exp_to, f"Wrong {to_d} for {from_d} -> {to_d}"
            assert data["copper"] == exp_cp, f"Wrong copper for {from_d} -> {to_d}"
