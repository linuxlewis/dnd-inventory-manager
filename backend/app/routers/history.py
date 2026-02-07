"""History API endpoints."""

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_authenticated_inventory
from app.database import get_db
from app.models import HistoryAction, HistoryEntityType, HistoryListResponse
from app.services import get_history

router = APIRouter(prefix="/api/inventories", tags=["history"])


@router.get("/{slug}/history", response_model=HistoryListResponse)
async def get_inventory_history(
    slug: str,
    db: AsyncSession = Depends(get_db),
    x_passphrase: str | None = Header(default=None),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum entries to return"),
    offset: int = Query(default=0, ge=0, description="Number of entries to skip"),
    action: HistoryAction | None = Query(default=None, description="Filter by action type"),
    entity_type: HistoryEntityType | None = Query(
        default=None, description="Filter by entity type"
    ),
) -> HistoryListResponse:
    """Get activity history for an inventory.

    Returns paginated history entries in reverse chronological order (newest first).
    """
    inventory = await get_authenticated_inventory(slug, db, x_passphrase)

    return await get_history(
        session=db,
        inventory_id=inventory.id,
        limit=limit,
        offset=offset,
        action_filter=action,
        entity_filter=entity_type,
    )
