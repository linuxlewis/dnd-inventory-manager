"""Item API endpoints using SQLModel."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from app.core.auth import verify_passphrase
from app.database import get_db
from app.models import (
    Inventory,
    Item,
    ItemCreate,
    ItemListResponse,
    ItemRarity,
    ItemRead,
    ItemType,
    ItemUpdate,
)

router = APIRouter(prefix="/api/inventories", tags=["items"])


async def get_authenticated_inventory(
    slug: str,
    db: AsyncSession,
    x_passphrase: str | None,
) -> Inventory:
    """Helper to authenticate and retrieve inventory by slug."""
    if x_passphrase is None:
        raise HTTPException(status_code=401, detail="Passphrase required")

    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if not verify_passphrase(x_passphrase, inventory.passphrase_hash):
        raise HTTPException(status_code=401, detail="Invalid passphrase")

    return inventory


@router.post("/{slug}/items", response_model=ItemRead)
async def create_item(
    slug: str,
    data: ItemCreate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Create a new item in the inventory."""
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Create item
    item = Item(
        inventory_id=inventory.id,
        name=data.name,
        type=data.type,
        category=data.category,
        rarity=data.rarity,
        description=data.description,
        notes=data.notes,
        quantity=data.quantity,
        weight=data.weight,
        estimated_value=data.estimated_value,
        properties=data.properties,
        is_standard_item=data.is_standard_item,
        standard_item_id=data.standard_item_id,
    )

    db.add(item)
    await db.commit()
    await db.refresh(item)

    return item


@router.get("/{slug}/items", response_model=ItemListResponse)
async def list_items(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
    type: ItemType | None = Query(default=None, description="Filter by item type"),
    category: str | None = Query(default=None, description="Filter by category"),
    rarity: ItemRarity | None = Query(default=None, description="Filter by rarity"),
    search: str | None = Query(default=None, description="Search in item name (case-insensitive)"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
) -> ItemListResponse:
    """List items in the inventory with optional filters."""
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    # Build query
    query = select(Item).where(Item.inventory_id == inventory.id)

    # Apply filters
    if type is not None:
        query = query.where(Item.type == type)
    if category is not None:
        query = query.where(Item.category == category)
    if rarity is not None:
        query = query.where(Item.rarity == rarity)
    if search is not None:
        query = query.where(Item.name.ilike(f"%{search}%"))

    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination and ordering
    query = query.order_by(Item.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return ItemListResponse(items=list(items), total=total)


@router.get("/{slug}/items/{item_id}", response_model=ItemRead)
async def get_item(
    slug: str,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Get a single item by ID."""
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    return item


@router.patch("/{slug}/items/{item_id}", response_model=ItemRead)
async def update_item(
    slug: str,
    item_id: UUID,
    data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Item:
    """Update an item (partial update)."""
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # Apply updates
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    # Update timestamp
    item.updated_at = datetime.now(UTC)

    db.add(item)
    await db.commit()
    await db.refresh(item)

    return item


@router.delete("/{slug}/items/{item_id}", status_code=204)
async def delete_item(
    slug: str,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> None:
    """Delete an item."""
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.inventory_id == inventory.id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()
