"""SSE (Server-Sent Events) Connection Manager for real-time inventory updates.

This module provides thread-safe management of SSE connections per inventory,
enabling real-time synchronization across all connected clients.
"""

import asyncio
import json
import time
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

HEARTBEAT_INTERVAL = 30  # seconds


@dataclass
class SSEEvent:
    """Represents an SSE event to be sent to clients."""

    event: str
    data: dict[str, Any]
    id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        """Convert event to dictionary for JSON serialization."""
        return {
            "event_id": self.id,
            "event": self.event,
            "data": self.data,
            "timestamp": self.timestamp,
        }

    def format(self) -> str:
        """Format event for SSE protocol."""
        payload = self.to_dict()
        return f"id: {self.id}\nevent: {self.event}\ndata: {json.dumps(payload)}\n\n"


class ConnectionManager:
    """Manages SSE connections per inventory slug.

    Thread-safe implementation using asyncio locks to manage
    concurrent connections and broadcasts.
    """

    def __init__(self):
        # Maps inventory slug to set of asyncio.Queue objects for each connection
        self._connections: dict[str, set[asyncio.Queue]] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()
        # Track event history for reconnection support (last 100 events per slug)
        self._event_history: dict[str, list[SSEEvent]] = {}
        self._history_limit = 100

    async def _get_lock(self, slug: str) -> asyncio.Lock:
        """Get or create a lock for a specific inventory slug."""
        async with self._global_lock:
            if slug not in self._locks:
                self._locks[slug] = asyncio.Lock()
            return self._locks[slug]

    async def connect(self, slug: str) -> asyncio.Queue:
        """Register a new connection for an inventory.

        Args:
            slug: The inventory slug to connect to.

        Returns:
            An asyncio.Queue that will receive SSE events.
        """
        lock = await self._get_lock(slug)
        async with lock:
            if slug not in self._connections:
                self._connections[slug] = set()
                self._event_history[slug] = []

            queue: asyncio.Queue = asyncio.Queue()
            self._connections[slug].add(queue)

        # Broadcast updated connection count
        await self._broadcast_connection_count(slug)

        return queue

    async def disconnect(self, slug: str, queue: asyncio.Queue) -> None:
        """Remove a connection from an inventory.

        Args:
            slug: The inventory slug to disconnect from.
            queue: The queue to remove.
        """
        lock = await self._get_lock(slug)
        async with lock:
            if slug in self._connections:
                self._connections[slug].discard(queue)
                if not self._connections[slug]:
                    # Clean up empty connection sets
                    del self._connections[slug]
                    # Keep event history for potential reconnections

        # Broadcast updated connection count (if still has connections)
        await self._broadcast_connection_count(slug)

    async def get_connection_count(self, slug: str) -> int:
        """Get the number of active connections for an inventory.

        Args:
            slug: The inventory slug.

        Returns:
            Number of active connections.
        """
        lock = await self._get_lock(slug)
        async with lock:
            return len(self._connections.get(slug, set()))

    async def broadcast(self, slug: str, event: SSEEvent) -> None:
        """Broadcast an event to all connected clients for an inventory.

        Args:
            slug: The inventory slug to broadcast to.
            event: The SSE event to broadcast.
        """
        lock = await self._get_lock(slug)
        async with lock:
            # Store in history for reconnection support
            if slug not in self._event_history:
                self._event_history[slug] = []
            self._event_history[slug].append(event)
            # Trim history if needed
            if len(self._event_history[slug]) > self._history_limit:
                self._event_history[slug] = self._event_history[slug][-self._history_limit :]

            # Broadcast to all connections
            connections = self._connections.get(slug, set()).copy()

        for queue in connections:
            try:
                await queue.put(event)
            except Exception:
                # Connection may have been closed
                pass

    async def _broadcast_connection_count(self, slug: str) -> None:
        """Broadcast the current connection count to all clients.

        Args:
            slug: The inventory slug.
        """
        count = await self.get_connection_count(slug)
        event = SSEEvent(
            event="connection_count",
            data={"viewers": count},
        )
        # We need to broadcast without using the regular broadcast
        # to avoid infinite recursion and not store in history
        lock = await self._get_lock(slug)
        async with lock:
            connections = self._connections.get(slug, set()).copy()

        for queue in connections:
            try:
                await queue.put(event)
            except Exception:
                pass

    async def get_missed_events(self, slug: str, last_event_id: str | None) -> list[SSEEvent]:
        """Get events that occurred after the given event ID.

        Used for reconnection support with Last-Event-ID header.

        Args:
            slug: The inventory slug.
            last_event_id: The ID of the last event the client received.

        Returns:
            List of events that occurred after the given ID.
        """
        if not last_event_id:
            return []

        lock = await self._get_lock(slug)
        async with lock:
            history = self._event_history.get(slug, [])

        # Find the index of the last received event
        found_index = -1
        for i, event in enumerate(history):
            if event.id == last_event_id:
                found_index = i
                break

        if found_index == -1:
            # Event not found in history, return empty (too old)
            return []

        # Return all events after the found index
        return history[found_index + 1 :]

    async def event_generator(
        self,
        slug: str,
        queue: asyncio.Queue,
        last_event_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Generate SSE events for a connection.

        This generator yields formatted SSE events, including:
        - Missed events (if last_event_id is provided)
        - Heartbeat events every 30 seconds
        - Real-time events from the queue

        Args:
            slug: The inventory slug.
            queue: The connection's event queue.
            last_event_id: Optional last event ID for reconnection.

        Yields:
            Formatted SSE event strings.
        """
        # Send missed events first (for reconnection)
        missed_events = await self.get_missed_events(slug, last_event_id)
        for event in missed_events:
            yield event.format()

        # Send initial connection count
        count = await self.get_connection_count(slug)
        initial_count = SSEEvent(
            event="connection_count",
            data={"viewers": count},
        )
        yield initial_count.format()

        last_heartbeat = time.time()

        while True:
            try:
                # Wait for events with timeout for heartbeat
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=HEARTBEAT_INTERVAL)
                    yield event.format()
                    last_heartbeat = time.time()
                except asyncio.TimeoutError:
                    # Send heartbeat
                    if time.time() - last_heartbeat >= HEARTBEAT_INTERVAL:
                        heartbeat = SSEEvent(
                            event="heartbeat",
                            data={"timestamp": datetime.now(timezone.utc).isoformat()},
                        )
                        yield heartbeat.format()
                        last_heartbeat = time.time()
            except asyncio.CancelledError:
                break
            except Exception:
                break


# Global connection manager instance
connection_manager = ConnectionManager()
