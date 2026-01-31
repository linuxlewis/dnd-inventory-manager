"""Tests for the health check endpoint."""

from httpx import AsyncClient


async def test_health_returns_200(client: AsyncClient) -> None:
    """Test that GET /health returns 200 status."""
    response = await client.get("/health")
    assert response.status_code == 200


async def test_health_returns_status_ok(client: AsyncClient) -> None:
    """Test that response body is {"status": "ok"}."""
    response = await client.get("/health")
    assert response.json() == {"status": "ok"}
