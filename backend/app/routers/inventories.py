import re
import secrets

import bcrypt
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.db.inventory import Inventory
from app.models.inventory import InventoryCreate, InventoryResponse

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


@router.post("/", response_model=InventoryResponse)
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

    # Create inventory
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
