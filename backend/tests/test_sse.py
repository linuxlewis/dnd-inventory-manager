"""Tests for SSE connection manager and events endpoint."""

import asyncio

import pytest

from app.core.sse import ConnectionManager, SSEEvent


class TestSSEEvent:
    """Tests for SSEEvent dataclass."""

    def test_event_creation(self):
        """Test creating an SSE event."""
        event = SSEEvent(event="test", data={"key": "value"})
        assert event.event == "test"
        assert event.data == {"key": "value"}
        assert event.id is not None
        assert event.timestamp is not None

    def test_event_to_dict(self):
        """Test converting event to dict."""
        event = SSEEvent(event="test", data={"key": "value"})
        d = event.to_dict()
        assert d["event"] == "test"
        assert d["data"] == {"key": "value"}
        assert "event_id" in d
        assert "timestamp" in d

    def test_event_format(self):
        """Test formatting event for SSE protocol."""
        event = SSEEvent(event="test", data={"key": "value"})
        formatted = event.format()
        assert formatted.startswith("id: ")
        assert "event: test" in formatted
        assert "data: " in formatted
        assert formatted.endswith("\n\n")


class TestConnectionManager:
    """Tests for ConnectionManager."""

    @pytest.fixture
    def manager(self):
        """Create a fresh connection manager."""
        return ConnectionManager()

    async def test_connect_returns_queue(self, manager):
        """Test that connect returns a queue."""
        queue = await manager.connect("test-slug")
        assert isinstance(queue, asyncio.Queue)

    async def test_connection_count(self, manager):
        """Test tracking connection count."""
        assert await manager.get_connection_count("test-slug") == 0

        await manager.connect("test-slug")
        # Count is 1, but we need to drain the queue first (connection_count event)
        count = await manager.get_connection_count("test-slug")
        assert count == 1

        await manager.connect("test-slug")
        count = await manager.get_connection_count("test-slug")
        assert count == 2

    async def test_disconnect(self, manager):
        """Test disconnecting reduces count."""
        queue = await manager.connect("test-slug")
        count = await manager.get_connection_count("test-slug")
        assert count == 1

        await manager.disconnect("test-slug", queue)
        count = await manager.get_connection_count("test-slug")
        assert count == 0

    async def test_broadcast(self, manager):
        """Test broadcasting events to connections."""
        queue1 = await manager.connect("test-slug")
        queue2 = await manager.connect("test-slug")

        # Drain initial connection_count events
        while not queue1.empty():
            await queue1.get()
        while not queue2.empty():
            await queue2.get()

        event = SSEEvent(event="test", data={"message": "hello"})
        await manager.broadcast("test-slug", event)

        # Both queues should receive the event
        received1 = await asyncio.wait_for(queue1.get(), timeout=1)
        received2 = await asyncio.wait_for(queue2.get(), timeout=1)

        assert received1.event == "test"
        assert received2.event == "test"
        assert received1.data["message"] == "hello"

    async def test_broadcast_to_different_slugs(self, manager):
        """Test that broadcast only goes to correct slug."""
        queue1 = await manager.connect("slug-1")
        queue2 = await manager.connect("slug-2")

        # Drain initial events
        while not queue1.empty():
            await queue1.get()
        while not queue2.empty():
            await queue2.get()

        event = SSEEvent(event="test", data={})
        await manager.broadcast("slug-1", event)

        # queue1 should have the event
        received = await asyncio.wait_for(queue1.get(), timeout=1)
        assert received.event == "test"

        # queue2 should be empty (plus any connection count updates)
        await asyncio.sleep(0.1)  # Let any events propagate
        # Check that we only have connection_count events (not 'test')
        has_test_event = False
        while not queue2.empty():
            e = queue2.get_nowait()
            if e.event == "test":
                has_test_event = True
        assert not has_test_event

    async def test_missed_events_recovery(self, manager):
        """Test that missed events can be retrieved for reconnection."""
        await manager.connect("test-slug")

        # Send some events
        event1 = SSEEvent(event="test1", data={"n": 1})
        event2 = SSEEvent(event="test2", data={"n": 2})
        event3 = SSEEvent(event="test3", data={"n": 3})

        await manager.broadcast("test-slug", event1)
        await manager.broadcast("test-slug", event2)
        await manager.broadcast("test-slug", event3)

        # Get missed events after event1
        missed = await manager.get_missed_events("test-slug", event1.id)
        assert len(missed) == 2
        assert missed[0].event == "test2"
        assert missed[1].event == "test3"

    async def test_missed_events_unknown_id(self, manager):
        """Test that unknown last_event_id returns empty list."""
        await manager.connect("test-slug")

        missed = await manager.get_missed_events("test-slug", "unknown-id")
        assert missed == []

    async def test_missed_events_none_id(self, manager):
        """Test that None last_event_id returns empty list."""
        await manager.connect("test-slug")

        missed = await manager.get_missed_events("test-slug", None)
        assert missed == []


@pytest.fixture
async def sse_test_inventory(client):
    """Create a test inventory for SSE tests."""
    response = await client.post(
        "/api/inventories/",
        json={
            "name": "SSE Test Party",
            "passphrase": "testpass123",
        },
    )
    data = response.json()
    return {"slug": data["slug"], "passphrase": "testpass123"}


class TestSSEEndpoint:
    """Tests for SSE events endpoint."""

    async def test_sse_endpoint_requires_auth(self, client, sse_test_inventory):
        """Test that SSE endpoint requires authentication."""
        # Note: httpx doesn't support SSE streaming well, but we can test auth
        async with client.stream(
            "GET",
            f"/api/inventories/{sse_test_inventory['slug']}/events",
        ) as response:
            assert response.status_code == 401

    async def test_sse_endpoint_wrong_passphrase(self, client, sse_test_inventory):
        """Test that wrong passphrase returns 401."""
        async with client.stream(
            "GET",
            f"/api/inventories/{sse_test_inventory['slug']}/events",
            headers={"X-Passphrase": "wrongpass"},
        ) as response:
            assert response.status_code == 401

    async def test_sse_endpoint_not_found_inventory(self, client):
        """Test that accessing events for non-existent inventory returns 404."""
        async with client.stream(
            "GET",
            "/api/inventories/nonexistent-slug/events",
            headers={"X-Passphrase": "somepass"},
        ) as response:
            assert response.status_code == 404
