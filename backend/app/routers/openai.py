"""OpenAI connection management endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_passphrase
from app.database import get_db
from app.db.inventory import Inventory
from app.db.openai_connection import OpenAIConnection
from app.models.openai import OpenAIConnect, OpenAIStatus, OpenAITestResponse
from app.services.thumbnails import test_api_key

router = APIRouter(prefix="/api/inventories", tags=["openai"])


async def get_authenticated_inventory(
    slug: str, x_passphrase: str | None, db: AsyncSession
) -> Inventory:
    """Get an inventory after validating the passphrase."""
    if x_passphrase is None:
        raise HTTPException(status_code=401, detail="Passphrase required")

    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if not verify_passphrase(x_passphrase, inventory.passphrase_hash):
        raise HTTPException(status_code=401, detail="Invalid passphrase")

    return inventory


@router.post("/{slug}/openai/connect", response_model=OpenAIStatus)
async def connect_openai(
    slug: str,
    data: OpenAIConnect,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> OpenAIStatus:
    """Connect an OpenAI API key to an inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Check if connection already exists
    result = await db.execute(
        select(OpenAIConnection).where(OpenAIConnection.inventory_id == inventory.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing connection
        existing.set_api_key(data.api_key)
        existing.is_valid = True
        existing.connected_at = datetime.now(timezone.utc)
        connection = existing
    else:
        # Create new connection
        connection = OpenAIConnection(inventory_id=inventory.id)
        connection.set_api_key(data.api_key)
        db.add(connection)

    await db.commit()
    await db.refresh(connection)

    return OpenAIStatus(
        connected=True,
        is_valid=connection.is_valid,
        connected_at=connection.connected_at,
        last_used_at=connection.last_used_at,
    )


@router.post("/{slug}/openai/test", response_model=OpenAITestResponse)
async def test_openai_connection(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> OpenAITestResponse:
    """Test the OpenAI API connection."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Get existing connection
    result = await db.execute(
        select(OpenAIConnection).where(OpenAIConnection.inventory_id == inventory.id)
    )
    connection = result.scalar_one_or_none()

    if connection is None:
        raise HTTPException(status_code=400, detail="No OpenAI API key configured")

    # Test the API key
    api_key = connection.get_api_key()
    is_valid, error = await test_api_key(api_key)

    # Update connection validity
    connection.is_valid = is_valid
    await db.commit()

    if is_valid:
        return OpenAITestResponse(success=True, message="API key is valid")
    else:
        return OpenAITestResponse(success=False, message=error)


@router.delete("/{slug}/openai")
async def disconnect_openai(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> dict:
    """Remove the OpenAI API connection."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Get existing connection
    result = await db.execute(
        select(OpenAIConnection).where(OpenAIConnection.inventory_id == inventory.id)
    )
    connection = result.scalar_one_or_none()

    if connection is None:
        raise HTTPException(status_code=404, detail="No OpenAI connection found")

    await db.delete(connection)
    await db.commit()

    return {"success": True, "message": "OpenAI connection removed"}


@router.get("/{slug}/openai/status", response_model=OpenAIStatus)
async def get_openai_status(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> OpenAIStatus:
    """Get the OpenAI connection status."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Get existing connection
    result = await db.execute(
        select(OpenAIConnection).where(OpenAIConnection.inventory_id == inventory.id)
    )
    connection = result.scalar_one_or_none()

    if connection is None:
        return OpenAIStatus(connected=False)

    return OpenAIStatus(
        connected=True,
        is_valid=connection.is_valid,
        connected_at=connection.connected_at,
        last_used_at=connection.last_used_at,
    )
