"""Tests for item API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Inventory, Item, ItemRarity, ItemType
from app.routers.inventories import hash_passphrase


@pytest.fixture
async def inventory_with_items(test_db: AsyncSession) -> tuple[Inventory, str, list[Item]]:
    """Create a sample inventory with items and return (inventory, passphrase, items)."""
    passphrase = "test-passphrase-123"
    inventory = Inventory(
        slug="test-items-party",
        name="Test Items Party",
        description="An inventory for testing items",
        passphrase_hash=hash_passphrase(passphrase),
    )
    test_db.add(inventory)
    await test_db.commit()
    await test_db.refresh(inventory)

    # Create some test items
    items = [
        Item(
            inventory_id=inventory.id,
            name="Longsword",
            type=ItemType.equipment,
            category="Weapon",
            rarity=ItemRarity.common,
            description="A standard longsword",
            quantity=1,
            weight=3.0,
            estimated_value=15.0,
        ),
        Item(
            inventory_id=inventory.id,
            name="Healing Potion",
            type=ItemType.potion,
            category="Potion",
            rarity=ItemRarity.common,
            description="Restores 2d4+2 HP",
            quantity=3,
            weight=0.5,
            estimated_value=50.0,
        ),
        Item(
            inventory_id=inventory.id,
            name="Cloak of Protection",
            type=ItemType.equipment,
            category="Wondrous Item",
            rarity=ItemRarity.uncommon,
            description="+1 to AC and saving throws",
            quantity=1,
            weight=1.0,
            estimated_value=500.0,
        ),
    ]

    for item in items:
        test_db.add(item)
    await test_db.commit()

    # Refresh to get IDs
    for item in items:
        await test_db.refresh(item)

    return inventory, passphrase, items


class TestCreateItem:
    """Tests for POST /api/inventories/{slug}/items endpoint."""

    async def test_create_item_success(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str], test_db: AsyncSession
    ) -> None:
        """Test creating an item with valid data returns 200 and persists to database."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": "Magic Sword", "type": "equipment", "rarity": "rare"},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200

        # Verify item was persisted to the database
        data = response.json()
        from uuid import UUID

        from sqlmodel import select

        item_id = UUID(data["id"])
        result = await test_db.execute(select(Item).where(Item.id == item_id))
        db_item = result.scalar_one_or_none()
        assert db_item is not None
        assert db_item.name == "Magic Sword"
        assert db_item.type == ItemType.equipment
        assert db_item.rarity == ItemRarity.rare

    async def test_create_item_response_fields(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test response includes required fields."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={
                "name": "Dragon Shield",
                "type": "equipment",
                "category": "Armor",
                "rarity": "rare",
                "description": "A shield made from dragon scales",
                "quantity": 1,
                "weight": 6.0,
                "estimated_value": 1000.0,
            },
            headers={"X-Passphrase": passphrase},
        )
        data = response.json()

        assert "id" in data
        assert "inventory_id" in data
        assert data["name"] == "Dragon Shield"
        assert data["type"] == "equipment"
        assert data["category"] == "Armor"
        assert data["rarity"] == "rare"
        assert data["quantity"] == 1
        assert data["weight"] == 6.0
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_item_without_auth_returns_401(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test creating item without passphrase returns 401."""
        inventory, _ = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": "Test Item"},
        )
        assert response.status_code == 401

    async def test_create_item_wrong_passphrase_returns_401(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test creating item with wrong passphrase returns 401."""
        inventory, _ = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": "Test Item"},
            headers={"X-Passphrase": "wrong-passphrase"},
        )
        assert response.status_code == 401

    async def test_create_item_unknown_inventory_returns_404(self, client: AsyncClient) -> None:
        """Test creating item for unknown inventory returns 404."""
        response = await client.post(
            "/api/inventories/nonexistent-slug/items",
            json={"name": "Test Item"},
            headers={"X-Passphrase": "any-passphrase"},
        )
        assert response.status_code == 404

    async def test_create_item_invalid_data_returns_422(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test creating item with invalid data returns 422."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/items",
            json={"name": ""},  # Empty name should fail validation
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 422


class TestListItems:
    """Tests for GET /api/inventories/{slug}/items endpoint."""

    async def test_list_items_success(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test listing items returns items and total count."""
        inventory, passphrase, items = inventory_with_items
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 3
        assert len(data["items"]) == 3

    async def test_list_items_filter_by_type(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test filtering items by type."""
        inventory, passphrase, _ = inventory_with_items
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items?type=potion",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Healing Potion"

    async def test_list_items_filter_by_rarity(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test filtering items by rarity."""
        inventory, passphrase, _ = inventory_with_items
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items?rarity=uncommon",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Cloak of Protection"

    async def test_list_items_search_by_name(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test searching items by name (case-insensitive)."""
        inventory, passphrase, _ = inventory_with_items
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items?search=sword",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Longsword"

    async def test_list_items_pagination(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test pagination with limit and offset."""
        inventory, passphrase, _ = inventory_with_items
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items?limit=2&offset=0",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3  # Total count ignores pagination
        assert len(data["items"]) == 2  # But only 2 items returned

    async def test_list_items_without_auth_returns_401(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test listing items without auth returns 401."""
        inventory, _, _ = inventory_with_items
        response = await client.get(f"/api/inventories/{inventory.slug}/items")
        assert response.status_code == 401


class TestGetItem:
    """Tests for GET /api/inventories/{slug}/items/{item_id} endpoint."""

    async def test_get_item_success(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test getting a single item by ID."""
        inventory, passphrase, items = inventory_with_items
        item = items[0]
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(item.id)
        assert data["name"] == item.name

    async def test_get_item_not_found(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test getting non-existent item returns 404."""
        inventory, passphrase, _ = inventory_with_items
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items/{fake_id}",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 404

    async def test_get_item_without_auth_returns_401(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test getting item without auth returns 401."""
        inventory, _, items = inventory_with_items
        item = items[0]
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
        )
        assert response.status_code == 401


class TestUpdateItem:
    """Tests for PATCH /api/inventories/{slug}/items/{item_id} endpoint."""

    async def test_update_item_success(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test updating an item."""
        inventory, passphrase, items = inventory_with_items
        item = items[0]
        response = await client.patch(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
            json={"name": "Enhanced Longsword", "rarity": "rare"},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Enhanced Longsword"
        assert data["rarity"] == "rare"

    async def test_update_item_partial(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test partial update only changes specified fields."""
        inventory, passphrase, items = inventory_with_items
        item = items[0]
        original_name = item.name
        response = await client.patch(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
            json={"quantity": 5},  # Only update quantity
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == original_name  # Name unchanged
        assert data["quantity"] == 5  # Quantity updated

    async def test_update_item_not_found(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test updating non-existent item returns 404."""
        inventory, passphrase, _ = inventory_with_items
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.patch(
            f"/api/inventories/{inventory.slug}/items/{fake_id}",
            json={"name": "New Name"},
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 404

    async def test_update_item_without_auth_returns_401(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test updating item without auth returns 401."""
        inventory, _, items = inventory_with_items
        item = items[0]
        response = await client.patch(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
            json={"name": "New Name"},
        )
        assert response.status_code == 401


class TestDeleteItem:
    """Tests for DELETE /api/inventories/{slug}/items/{item_id} endpoint."""

    async def test_delete_item_success(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test deleting an item returns 204."""
        inventory, passphrase, items = inventory_with_items
        item = items[0]
        response = await client.delete(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 204

        # Verify item is gone
        response = await client.get(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 404

    async def test_delete_item_not_found(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test deleting non-existent item returns 404."""
        inventory, passphrase, _ = inventory_with_items
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.delete(
            f"/api/inventories/{inventory.slug}/items/{fake_id}",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 404

    async def test_delete_item_without_auth_returns_401(
        self, client: AsyncClient, inventory_with_items: tuple[Inventory, str, list[Item]]
    ) -> None:
        """Test deleting item without auth returns 401."""
        inventory, _, items = inventory_with_items
        item = items[0]
        response = await client.delete(
            f"/api/inventories/{inventory.slug}/items/{item.id}",
        )
        assert response.status_code == 401
