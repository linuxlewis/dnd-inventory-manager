"""Inventory API endpoints using SQLModel."""

import re
import secrets

import bcrypt
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.auth import verify_passphrase
from app.database import get_db
from app.models import (
    AuthResponse,
    Inventory,
    InventoryAuth,
    InventoryCreate,
    InventoryRead,
)

router = APIRouter(prefix="/api/inventories", tags=["inventories"])


def generate_slug(name: str) -> str:
    """Generate a URL-safe slug from a name."""
    # Lowercase and replace spaces/special chars with hyphens
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    # Strip leading/trailing hyphens
    slug = slug.strip("-")
    return slug


def hash_passphrase(passphrase: str) -> str:
    """Hash a passphrase using bcrypt."""
    return bcrypt.hashpw(passphrase.encode(), bcrypt.gensalt()).decode()


@router.post("/", response_model=InventoryRead)
async def create_inventory(
    data: InventoryCreate,
    db: AsyncSession = Depends(get_db),
) -> Inventory:
    """Create a new party inventory."""
    # Generate slug from name or use custom slug
    base_slug = generate_slug(data.slug or data.name)
    slug = base_slug

    # Check if slug exists, append random suffix if needed
    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    if result.scalar_one_or_none() is not None:
        slug = f"{base_slug}-{secrets.token_hex(2)}"

    # Create inventory using SQLModel
    inventory = Inventory(
        slug=slug,
        name=data.name,
        description=data.description,
        passphrase_hash=hash_passphrase(data.passphrase),
    )

    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)

    return inventory


@router.post("/{slug}/auth", response_model=AuthResponse)
async def authenticate_inventory(
    slug: str,
    data: InventoryAuth,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Authenticate with a party inventory."""
    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if verify_passphrase(data.passphrase, inventory.passphrase_hash):
        return AuthResponse(success=True)

    return AuthResponse(success=False, message="Invalid passphrase")


@router.get("/{slug}", response_model=InventoryRead)
async def get_inventory(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
) -> Inventory:
    """Get a party inventory (requires authentication via X-Passphrase header)."""
    if x_passphrase is None:
        raise HTTPException(status_code=401, detail="Passphrase required")

    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if not verify_passphrase(x_passphrase, inventory.passphrase_hash):
        raise HTTPException(status_code=401, detail="Invalid passphrase")

    return inventory
