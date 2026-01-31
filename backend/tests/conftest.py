"""Pytest configuration and fixtures for API tests."""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.db.base import Base
from app.main import app
from app.routers.inventories import hash_passphrase


@pytest.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create an in-memory SQLite database for testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP client with test database dependency override."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_inventory(test_db: AsyncSession) -> tuple[object, str]:
    """Create a sample inventory and return (inventory, passphrase)."""
    from app.db.inventory import Inventory

    passphrase = "test-passphrase-123"
    inventory = Inventory(
        slug="test-party",
        name="Test Party",
        description="A test inventory for testing",
        passphrase_hash=hash_passphrase(passphrase),
    )

    test_db.add(inventory)
    await test_db.commit()
    await test_db.refresh(inventory)

    return inventory, passphrase
