"""Tests for items router."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def item_test_inventory(client: AsyncClient):
    """Create a test inventory and return its slug and passphrase."""
    response = await client.post(
        "/api/inventories/",
        json={
            "name": "Item Test Party",
            "passphrase": "testpass123",
        },
    )
    data = response.json()
    return {"slug": data["slug"], "passphrase": "testpass123"}


class TestListItems:
    """Tests for listing items."""

    async def test_list_items_empty(self, client: AsyncClient, item_test_inventory):
        """Test listing items when inventory is empty."""
        response = await client.get(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_items_requires_auth(self, client: AsyncClient, item_test_inventory):
        """Test that listing items requires authentication."""
        response = await client.get(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
        )
        assert response.status_code == 401


class TestCreateItem:
    """Tests for creating items."""

    async def test_create_item_success(self, client: AsyncClient, item_test_inventory):
        """Test creating an item successfully."""
        response = await client.post(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
            json={"name": "Sword of Testing"},
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Sword of Testing"
        assert data["quantity"] == 1
        assert "id" in data

    async def test_create_item_with_all_fields(self, client: AsyncClient, item_test_inventory):
        """Test creating an item with all fields."""
        response = await client.post(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
            json={
                "name": "Magic Ring",
                "description": "A shiny ring",
                "quantity": 2,
                "weight": 16,
                "value": 1000,
                "category": "Jewelry",
            },
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Magic Ring"
        assert data["description"] == "A shiny ring"
        assert data["quantity"] == 2
        assert data["weight"] == 16
        assert data["value"] == 1000
        assert data["category"] == "Jewelry"

    async def test_create_item_requires_auth(self, client: AsyncClient, item_test_inventory):
        """Test that creating items requires authentication."""
        response = await client.post(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
            json={"name": "Sword"},
        )
        assert response.status_code == 401


class TestUpdateItem:
    """Tests for updating items."""

    async def test_update_item_success(self, client: AsyncClient, item_test_inventory):
        """Test updating an item."""
        # Create item first
        create_response = await client.post(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
            json={"name": "Old Name"},
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        item_id = create_response.json()["id"]

        # Update it
        response = await client.patch(
            f"/api/inventories/{item_test_inventory['slug']}/items/{item_id}",
            json={"name": "New Name", "quantity": 5},
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["quantity"] == 5

    async def test_update_nonexistent_item(self, client: AsyncClient, item_test_inventory):
        """Test updating a non-existent item returns 404."""
        response = await client.patch(
            f"/api/inventories/{item_test_inventory['slug']}/items/00000000-0000-0000-0000-000000000000",
            json={"name": "New Name"},
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 404


class TestDeleteItem:
    """Tests for deleting items."""

    async def test_delete_item_success(self, client: AsyncClient, item_test_inventory):
        """Test deleting an item."""
        # Create item first
        create_response = await client.post(
            f"/api/inventories/{item_test_inventory['slug']}/items/",
            json={"name": "To Delete"},
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        item_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(
            f"/api/inventories/{item_test_inventory['slug']}/items/{item_id}",
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 204

        # Verify it's gone
        get_response = await client.get(
            f"/api/inventories/{item_test_inventory['slug']}/items/{item_id}",
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert get_response.status_code == 404

    async def test_delete_nonexistent_item(self, client: AsyncClient, item_test_inventory):
        """Test deleting a non-existent item returns 404."""
        response = await client.delete(
            f"/api/inventories/{item_test_inventory['slug']}/items/00000000-0000-0000-0000-000000000000",
            headers={"X-Passphrase": item_test_inventory["passphrase"]},
        )
        assert response.status_code == 404
