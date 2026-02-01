"""Tests for SRD API endpoints."""

from httpx import AsyncClient


class TestSrdSearch:
    """Tests for GET /api/srd/search endpoint."""

    async def test_srd_search_returns_list(self, client: AsyncClient) -> None:
        """Test search returns a list (empty if no SRD data)."""
        response = await client.get("/api/srd/search?q=sword")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_srd_search_no_auth_required(self, client: AsyncClient) -> None:
        """Test SRD search doesn't require authentication."""
        response = await client.get("/api/srd/search?q=potion")
        # Should not return 401 - no auth required
        assert response.status_code == 200

    async def test_srd_search_with_type_filter(self, client: AsyncClient) -> None:
        """Test search with type filter."""
        response = await client.get("/api/srd/search?q=test&type=equipment")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_srd_search_with_limit(self, client: AsyncClient) -> None:
        """Test search with limit parameter."""
        response = await client.get("/api/srd/search?q=test&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5

    async def test_srd_search_requires_query(self, client: AsyncClient) -> None:
        """Test search requires q parameter."""
        response = await client.get("/api/srd/search")
        assert response.status_code == 422  # Validation error for missing required param
