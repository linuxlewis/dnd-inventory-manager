"""SRD (System Reference Document) API endpoints.

Provides public access to search SRD items without authentication.
"""

from fastapi import APIRouter, Query

from app.models import SrdItemRead
from app.services.srd import search_srd

router = APIRouter(prefix="/api/srd", tags=["srd"])


@router.get("/search", response_model=list[SrdItemRead])
async def srd_search(
    q: str = Query(description="Search query string"),
    item_type: str | None = Query(default=None, alias="type", description="Filter by item type"),
    category: str | None = Query(default=None, description="Filter by category"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum results to return"),
) -> list[SrdItemRead]:
    """Search the SRD for items matching the query.

    This endpoint is public (no authentication required) since SRD data is open.

    Returns a list of matching items, or empty list if no matches.
    """
    results = search_srd(query=q, item_type=item_type, category=category, limit=limit)
    return [SrdItemRead.model_validate(item) for item in results]
