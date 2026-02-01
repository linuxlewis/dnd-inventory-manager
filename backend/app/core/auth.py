from typing import TYPE_CHECKING

import bcrypt
from fastapi import Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

if TYPE_CHECKING:
    from app.models import Inventory


def verify_passphrase(plain: str, hashed: str) -> bool:
    """Verify a plain passphrase against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


async def get_authenticated_inventory(
    slug: str,
    db: AsyncSession,
    x_passphrase: str | None = Header(default=None),
) -> "Inventory":
    """Dependency to authenticate and retrieve inventory by slug.

    Use in route handlers via Depends() for consistent auth logic.

    Raises:
        HTTPException(401): If passphrase missing or invalid
        HTTPException(404): If inventory not found
    """
    from app.models import Inventory

    if x_passphrase is None:
        raise HTTPException(status_code=401, detail="Passphrase required")

    result = await db.execute(select(Inventory).where(Inventory.slug == slug))
    inventory = result.scalar_one_or_none()

    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory not found")

    if not verify_passphrase(x_passphrase, inventory.passphrase_hash):
        raise HTTPException(status_code=401, detail="Invalid passphrase")

    return inventory
