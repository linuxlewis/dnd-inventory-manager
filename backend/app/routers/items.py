"""Item management endpoints."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_passphrase
from app.database import async_session, get_db
from app.db.inventory import Inventory
from app.db.item import Item
from app.db.openai_connection import OpenAIConnection
from app.models.item import ItemCreate, ItemResponse, ItemUpdate
from app.models.openai import ThumbnailResponse
from app.services.thumbnails import ThumbnailGenerationError, generate_thumbnail

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventories", tags=["items"])


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


async def generate_thumbnail_background(item_id: str, api_key: str) -> None:
    """Background task to generate a thumbnail for an item.

    Uses its own database session since background tasks run after response.
    """
    async with async_session() as db:
        try:
            # Get the item
            result = await db.execute(select(Item).where(Item.id == item_id))
            item = result.scalar_one_or_none()

            if item is None:
                logger.error(f"Item {item_id} not found for thumbnail generation")
                return

            # Generate thumbnail
            thumbnail_url = await generate_thumbnail(item, api_key)

            # Update item with thumbnail URL
            item.thumbnail_url = thumbnail_url
            item.updated_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"Successfully generated and saved thumbnail for item {item_id}")

        except ThumbnailGenerationError as e:
            logger.error(f"Failed to generate thumbnail for item {item_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in background thumbnail generation: {e}")


@router.post("/{slug}/items", response_model=ItemResponse)
async def create_item(
    slug: str,
    data: ItemCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Create a new item in an inventory.

    If the inventory has an OpenAI connection, thumbnail generation is triggered
    in the background.
    """
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Create item
    item = Item(
        inventory_id=inventory.id,
        name=data.name,
        description=data.description,
        item_type=data.item_type,
        category=data.category,
        rarity=data.rarity,
        quantity=data.quantity,
    )

    db.add(item)
    await db.commit()
    await db.refresh(item)

    # Check if inventory has OpenAI connection for auto-thumbnail
    result = await db.execute(
        select(OpenAIConnection).where(OpenAIConnection.inventory_id == inventory.id)
    )
    connection = result.scalar_one_or_none()

    if connection and connection.is_valid:
        # Trigger background thumbnail generation
        api_key = connection.get_api_key()
        background_tasks.add_task(generate_thumbnail_background, item.id, api_key)
        logger.info(f"Scheduled background thumbnail generation for item {item.id}")

    return item


@router.get("/{slug}/items", response_model=list[ItemResponse])
async def list_items(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> list[Item]:
    """List all items in an inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.inventory_id == inventory.id).order_by(Item.created_at.desc())
    )
    items = result.scalars().all()

    return list(items)


@router.get("/{slug}/items/{item_id}", response_model=ItemResponse)
async def get_item(
    slug: str,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Get a specific item."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return item


@router.patch("/{slug}/items/{item_id}", response_model=ItemResponse)
async def update_item(
    slug: str,
    item_id: str,
    data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Update an item."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    return item


@router.delete("/{slug}/items/{item_id}")
async def delete_item(
    slug: str,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> dict:
    """Delete an item."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()

    return {"success": True, "message": "Item deleted"}


@router.post("/{slug}/items/{item_id}/thumbnail", response_model=ThumbnailResponse)
async def generate_item_thumbnail(
    slug: str,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> ThumbnailResponse:
    """Generate or regenerate a thumbnail for an item."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    # Get the item
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # Get OpenAI connection
    result = await db.execute(
        select(OpenAIConnection).where(OpenAIConnection.inventory_id == inventory.id)
    )
    connection = result.scalar_one_or_none()

    if connection is None:
        raise HTTPException(status_code=400, detail="No OpenAI API key configured")

    if not connection.is_valid:
        raise HTTPException(status_code=400, detail="OpenAI API key is invalid")

    try:
        # Generate thumbnail
        api_key = connection.get_api_key()
        thumbnail_url = await generate_thumbnail(item, api_key)

        # Update item
        item.thumbnail_url = thumbnail_url
        item.updated_at = datetime.now(timezone.utc)

        # Update connection last_used_at
        connection.last_used_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(item)

        return ThumbnailResponse(success=True, thumbnail_url=thumbnail_url)

    except ThumbnailGenerationError as e:
        return ThumbnailResponse(success=False, message=str(e))
