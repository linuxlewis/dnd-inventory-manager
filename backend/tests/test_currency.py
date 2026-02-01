"""Tests for currency router."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def currency_test_inventory(client: AsyncClient):
    """Create a test inventory and return its slug and passphrase."""
    response = await client.post(
        "/api/inventories/",
        json={
            "name": "Currency Test Party",
            "passphrase": "testpass123",
        },
    )
    data = response.json()
    return {"slug": data["slug"], "passphrase": "testpass123"}


class TestGetCurrency:
    """Tests for getting currency."""

    async def test_get_currency_initial_values(self, client: AsyncClient, currency_test_inventory):
        """Test getting initial currency values (all zero)."""
        response = await client.get(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
            headers={"X-Passphrase": currency_test_inventory["passphrase"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["copper"] == 0
        assert data["silver"] == 0
        assert data["gold"] == 0
        assert data["platinum"] == 0

    async def test_get_currency_requires_auth(self, client: AsyncClient, currency_test_inventory):
        """Test that getting currency requires authentication."""
        response = await client.get(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
        )
        assert response.status_code == 401


class TestUpdateCurrency:
    """Tests for updating currency."""

    async def test_update_currency_success(self, client: AsyncClient, currency_test_inventory):
        """Test updating currency values."""
        response = await client.patch(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
            json={"gold": 100, "silver": 50},
            headers={"X-Passphrase": currency_test_inventory["passphrase"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gold"] == 100
        assert data["silver"] == 50
        assert data["copper"] == 0  # Unchanged
        assert data["platinum"] == 0  # Unchanged

    async def test_update_currency_partial(self, client: AsyncClient, currency_test_inventory):
        """Test that partial updates only affect specified fields."""
        # First set some values
        await client.patch(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
            json={"gold": 100, "silver": 50, "copper": 25},
            headers={"X-Passphrase": currency_test_inventory["passphrase"]},
        )

        # Then update only gold
        response = await client.patch(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
            json={"gold": 200},
            headers={"X-Passphrase": currency_test_inventory["passphrase"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gold"] == 200  # Updated
        assert data["silver"] == 50  # Unchanged
        assert data["copper"] == 25  # Unchanged

    async def test_update_currency_requires_auth(
        self, client: AsyncClient, currency_test_inventory
    ):
        """Test that updating currency requires authentication."""
        response = await client.patch(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
            json={"gold": 100},
        )
        assert response.status_code == 401

    async def test_update_currency_invalid_passphrase(
        self, client: AsyncClient, currency_test_inventory
    ):
        """Test that wrong passphrase returns 401."""
        response = await client.patch(
            f"/api/inventories/{currency_test_inventory['slug']}/currency/",
            json={"gold": 100},
            headers={"X-Passphrase": "wrongpass"},
        )
        assert response.status_code == 401
