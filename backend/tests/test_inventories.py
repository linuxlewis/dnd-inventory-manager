"""Tests for inventory API endpoints."""

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.models import Inventory


class TestCreateInventory:
    """Tests for POST /api/inventories endpoint."""

    async def test_create_inventory_success(
        self, client: AsyncClient, test_db: AsyncSession
    ) -> None:
        """Test creating an inventory with valid data returns 200."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "Dragon Slayers", "passphrase": "secret123"},
        )
        assert response.status_code == 200

        # Verify inventory was persisted in database
        result = await test_db.execute(select(func.count()).select_from(Inventory))
        count = result.scalar()
        assert count == 1

    async def test_create_inventory_response_fields(self, client: AsyncClient) -> None:
        """Test response includes required fields."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "Hero Party", "passphrase": "password123"},
        )
        data = response.json()

        # Check required fields exist
        assert "id" in data
        assert "slug" in data
        assert "name" in data
        assert "created_at" in data
        assert "updated_at" in data

        # Check currency fields are 0
        assert data["copper"] == 0
        assert data["silver"] == 0
        assert data["gold"] == 0
        assert data["platinum"] == 0

    async def test_create_inventory_no_passphrase_hash(self, client: AsyncClient) -> None:
        """Test response does NOT include passphrase_hash."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "Secret Party", "passphrase": "mysecret123"},
        )
        data = response.json()
        assert "passphrase_hash" not in data

    async def test_slug_generated_from_name(self, client: AsyncClient) -> None:
        """Test slug is generated from name (lowercase, hyphens)."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "The Brave Adventurers", "passphrase": "password123"},
        )
        data = response.json()
        assert data["slug"] == "the-brave-adventurers"

    async def test_duplicate_names_produce_different_slugs(self, client: AsyncClient) -> None:
        """Test creating inventory with same name twice produces different slugs."""
        # Create first inventory
        response1 = await client.post(
            "/api/inventories/",
            json={"name": "Same Name", "passphrase": "password123"},
        )
        slug1 = response1.json()["slug"]

        # Create second inventory with same name
        response2 = await client.post(
            "/api/inventories/",
            json={"name": "Same Name", "passphrase": "password456"},
        )
        slug2 = response2.json()["slug"]

        assert slug1 != slug2
        assert slug2.startswith("same-name-")

    async def test_missing_name_returns_422(self, client: AsyncClient) -> None:
        """Test validation: missing name returns 422."""
        response = await client.post(
            "/api/inventories/",
            json={"passphrase": "password123"},
        )
        assert response.status_code == 422

    async def test_short_passphrase_returns_422(self, client: AsyncClient) -> None:
        """Test validation: passphrase less than 6 chars returns 422."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "Test Party", "passphrase": "short"},
        )
        assert response.status_code == 422


class TestAuthInventory:
    """Tests for POST /api/inventories/{slug}/auth endpoint."""

    async def test_auth_correct_passphrase(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test correct passphrase returns {"success": true}."""
        inventory, passphrase = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/auth",
            json={"passphrase": passphrase},
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    async def test_auth_wrong_passphrase(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test wrong passphrase returns {"success": false}."""
        inventory, _ = test_inventory
        response = await client.post(
            f"/api/inventories/{inventory.slug}/auth",
            json={"passphrase": "wrong-passphrase"},
        )
        assert response.status_code == 200
        assert response.json()["success"] is False

    async def test_auth_unknown_slug_returns_404(self, client: AsyncClient) -> None:
        """Test unknown slug returns 404."""
        response = await client.post(
            "/api/inventories/nonexistent-slug/auth",
            json={"passphrase": "anypassphrase"},
        )
        assert response.status_code == 404


class TestGetInventory:
    """Tests for GET /api/inventories/{slug} endpoint."""

    async def test_get_with_valid_passphrase(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test GET with valid X-Passphrase header returns inventory."""
        inventory, passphrase = test_inventory
        response = await client.get(
            f"/api/inventories/{inventory.slug}",
            headers={"X-Passphrase": passphrase},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == inventory.slug
        assert data["name"] == inventory.name

    async def test_get_without_header_returns_401(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test GET without X-Passphrase header returns 401."""
        inventory, _ = test_inventory
        response = await client.get(f"/api/inventories/{inventory.slug}")
        assert response.status_code == 401

    async def test_get_with_wrong_passphrase_returns_401(
        self, client: AsyncClient, test_inventory: tuple[Inventory, str]
    ) -> None:
        """Test GET with wrong passphrase returns 401."""
        inventory, _ = test_inventory
        response = await client.get(
            f"/api/inventories/{inventory.slug}",
            headers={"X-Passphrase": "wrong-passphrase"},
        )
        assert response.status_code == 401

    async def test_get_unknown_slug_returns_404(self, client: AsyncClient) -> None:
        """Test GET with unknown slug returns 404."""
        response = await client.get(
            "/api/inventories/nonexistent-slug",
            headers={"X-Passphrase": "any-passphrase"},
        )
        assert response.status_code == 404


class TestSQLModelValidation:
    """Tests verifying SQLModel schema validation works correctly."""

    async def test_sqlmodel_validates_name_min_length(self, client: AsyncClient) -> None:
        """Test SQLModel validates name has minimum length of 1."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "", "passphrase": "password123"},
        )
        assert response.status_code == 422

    async def test_sqlmodel_validates_passphrase_min_length(self, client: AsyncClient) -> None:
        """Test SQLModel validates passphrase has minimum length of 6."""
        response = await client.post(
            "/api/inventories/",
            json={"name": "Valid Name", "passphrase": "12345"},
        )
        assert response.status_code == 422

    async def test_sqlmodel_schema_excludes_sensitive_fields(self, client: AsyncClient) -> None:
        """Test InventoryRead schema excludes passphrase_hash from response."""
        # Create inventory
        response = await client.post(
            "/api/inventories/",
            json={"name": "Schema Test", "passphrase": "password123"},
        )
        data = response.json()

        # Verify passphrase_hash is not in response
        assert "passphrase_hash" not in data
        # Verify expected fields are present
        assert "id" in data
        assert "slug" in data
        assert "name" in data
        assert data["name"] == "Schema Test"
