"""SRD (System Reference Document) search service.

Provides search functionality for standard D&D 5e items from the SRD.
"""

import json
import threading
from pathlib import Path
from typing import Any

# In-memory cache for SRD data with thread-safe initialization
_srd_cache: list[dict[str, Any]] | None = None
_srd_cache_lock = threading.Lock()

# Project root is two levels up from this file (services -> app -> backend)
_PROJECT_ROOT = Path(__file__).parent.parent.parent
_SRD_INDEX_PATH = _PROJECT_ROOT / "data" / "srd_index.json"


def load_srd_index() -> list[dict[str, Any]]:
    """Load the SRD index into memory (thread-safe).

    Returns empty list if index file doesn't exist.
    """
    global _srd_cache

    # Fast path: if already loaded, return cached value
    if _srd_cache is not None:
        return _srd_cache

    # Slow path: acquire lock and load (only one thread does this)
    with _srd_cache_lock:
        # Double-check after acquiring lock (another thread may have loaded it)
        if _srd_cache is not None:
            return _srd_cache

        if not _SRD_INDEX_PATH.exists():
            _srd_cache = []
            return _srd_cache

        with open(_SRD_INDEX_PATH) as f:
            _srd_cache = json.load(f)

        return _srd_cache


def search_srd(
    query: str,
    item_type: str | None = None,
    category: str | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Search the SRD index for items matching the query.

    Args:
        query: Search string (case-insensitive, matches against name)
        item_type: Optional filter by item type
        category: Optional filter by category
        limit: Maximum number of results to return (default 10)

    Returns:
        List of matching SRD items
    """
    items = load_srd_index()
    query_lower = query.lower()
    results = []

    for item in items:
        # Check name match (case-insensitive)
        name = item.get("name", "")
        if query_lower not in name.lower():
            continue

        # Apply type filter if provided
        if item_type is not None:
            item_type_value = item.get("type", "")
            if item_type_value.lower() != item_type.lower():
                continue

        # Apply category filter if provided
        if category is not None:
            item_category = item.get("category", "")
            if item_category.lower() != category.lower():
                continue

        results.append(item)

        if len(results) >= limit:
            break

    return results


def clear_srd_cache() -> None:
    """Clear the SRD cache (useful for testing)."""
    global _srd_cache
    with _srd_cache_lock:
        _srd_cache = None
