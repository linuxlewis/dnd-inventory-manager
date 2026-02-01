"""SRD (System Reference Document) API endpoints.

Provides public access to search SRD items without authentication.
"""

from typing import Any

from fastapi import APIRouter, Query

from app.services.srd import search_srd

router = APIRouter(prefix="/api/srd", tags=["srd"])


@router.get("/search")
async def srd_search(
    q: str = Query(description="Search query string"),
    type: str | None = Query(default=None, description="Filter by item type"),
    category: str | None = Query(default=None, description="Filter by category"),
    limit: int = Query(default=10, ge=1, le=50, description="Maximum results to return"),
) -> list[dict[str, Any]]:
    """Search the SRD for items matching the query.

    This endpoint is public (no authentication required) since SRD data is open.

    Returns a list of matching items, or empty list if no matches.
    """
    return search_srd(query=q, item_type=type, category=category, limit=limit)
