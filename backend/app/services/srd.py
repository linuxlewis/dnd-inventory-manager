"""SRD (System Reference Document) search service.

Provides search functionality for standard D&D 5e items from the SRD.
"""

import json
from pathlib import Path
from typing import Any

# In-memory cache for SRD data
_srd_cache: list[dict[str, Any]] | None = None


def _get_srd_index_path() -> Path:
    """Get the path to the SRD index file."""
    # Look for srd_index.json in various locations
    possible_paths = [
        Path(__file__).parent.parent.parent / "data" / "srd_index.json",
        Path(__file__).parent.parent.parent.parent / "data" / "srd_index.json",
        Path("data/srd_index.json"),
    ]
    for path in possible_paths:
        if path.exists():
            return path
    return possible_paths[0]  # Return first path even if not exists


def load_srd_index() -> list[dict[str, Any]]:
    """Load the SRD index into memory.

    Returns empty list if index file doesn't exist.
    """
    global _srd_cache

    if _srd_cache is not None:
        return _srd_cache

    index_path = _get_srd_index_path()

    if not index_path.exists():
        _srd_cache = []
        return _srd_cache

    with open(index_path) as f:
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
    _srd_cache = None
