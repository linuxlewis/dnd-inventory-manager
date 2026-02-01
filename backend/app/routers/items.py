"""Items router with SSE broadcast integration."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_passphrase
from app.core.sse import SSEEvent, connection_manager
from app.database import get_db
from app.db.inventory import Inventory
from app.db.item import Item
from app.models.item import ItemCreate, ItemResponse, ItemUpdate

router = APIRouter(prefix="/api/inventories/{slug}/items", tags=["items"])


async def get_authenticated_inventory(
    slug: str,
    x_passphrase: str | None,
    db: AsyncSession,
) -> Inventory:
    """Get inventory and verify authentication."""
    if x_passphrase is None:
        raise HTTPException(status_code=401, detail="Passphrase required")

    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if not verify_passphrase(x_passphrase, inventory.passphrase_hash):
        raise HTTPException(status_code=401, detail="Invalid passphrase")

    return inventory


@router.get("/", response_model=list[ItemResponse])
async def list_items(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> list[Item]:
    """List all items in an inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(select(Item).where(Item.inventory_id == inventory.id))
    return list(result.scalars().all())


@router.post("/", response_model=ItemResponse, status_code=201)
async def create_item(
    slug: str,
    data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Create a new item in the inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    item = Item(
        inventory_id=inventory.id,
        name=data.name,
        description=data.description,
        quantity=data.quantity,
        weight=data.weight,
        value=data.value,
        category=data.category,
    )

    db.add(item)
    await db.commit()
    await db.refresh(item)

    # Broadcast item_added event
    event = SSEEvent(
        event="item_added",
        data={
            "id": str(item.id),
            "inventory_id": str(item.inventory_id),
            "name": item.name,
            "description": item.description,
            "quantity": item.quantity,
            "weight": item.weight,
            "value": item.value,
            "category": item.category,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        },
    )
    await connection_manager.broadcast(slug, event)

    return item


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    slug: str,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Get a specific item from the inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.id == str(item_id), Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return item


@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
    slug: str,
    item_id: UUID,
    data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Update an item in the inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.id == str(item_id), Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    # Broadcast item_updated event
    event = SSEEvent(
        event="item_updated",
        data={
            "id": str(item.id),
            "inventory_id": str(item.inventory_id),
            "name": item.name,
            "description": item.description,
            "quantity": item.quantity,
            "weight": item.weight,
            "value": item.value,
            "category": item.category,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        },
    )
    await connection_manager.broadcast(slug, event)

    return item


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    slug: str,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> None:
    """Delete an item from the inventory."""
    inventory = await get_authenticated_inventory(slug, x_passphrase, db)

    result = await db.execute(
        select(Item).where(Item.id == str(item_id), Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()

    # Broadcast item_removed event
    event = SSEEvent(
        event="item_removed",
        data={"item_id": str(item_id)},
    )
    await connection_manager.broadcast(slug, event)
