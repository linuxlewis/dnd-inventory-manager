# Phase 7: SRD Database Ingestion

## Overview

Move SRD (System Reference Document) data from JSON files into the database. This enables proper querying, future expansion, and consistent data access patterns.

## Current State

- Raw data in `backend/app/data/` (armor.json, weapons.json, gear.json, potions.json)
- `srd_index.json` has 129 items but minimal fields
- Search service loads JSON into memory
- No database table for SRD items

## Target State

- `srd_items` database table with full item details
- Ingestion CLI command to load JSON → database
- Search queries the database instead of JSON
- Single item lookup endpoint
- Frontend types aligned with backend response

## Database Model

### SrdItem Table

```python
class SrdItem(SQLModel, table=True):
    """Standard Reference Document item - read-only reference catalog."""
    __tablename__ = "srd_items"

    id: str = Field(primary_key=True)  # slug: "longsword", "potion-of-healing"
    name: str = Field(index=True)
    type: str = Field(index=True)      # equipment, potion, gear
    category: str = Field(index=True)  # weapon, armor, potion, tool, supply
    subcategory: str | None = None     # "simple melee", "martial ranged", "heavy armor"
    
    # Common fields
    description: str | None = None
    weight: float | None = None
    value_gp: float | None = None      # Normalized to gold pieces
    rarity: str | None = None          # common, uncommon, rare, very_rare, legendary
    
    # Source tracking
    source_file: str | None = None     # "weapons.json", "potions.json"
    
    # Type-specific properties (JSON column)
    # Weapons: damage_dice, damage_type, properties[], range
    # Armor: ac_base, ac_dex_bonus, stealth_disadvantage
    # Potions: effect, duration
    properties: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
```

### Indexes
- `name` - for search
- `type` - for filtering
- `category` - for filtering

## Ingestion Pipeline

### CLI Command

```bash
# Load all SRD data
python -m app.cli.ingest_srd

# Or via uv
uv run python -m app.cli.ingest_srd
```

### Ingestion Logic

```python
# backend/app/cli/ingest_srd.py

async def ingest_srd():
    """Load all SRD JSON files into the database."""
    
    data_dir = Path(__file__).parent.parent / "data"
    
    # Load each source file
    sources = ["armor.json", "weapons.json", "gear.json", "potions.json"]
    
    items = []
    for source in sources:
        path = data_dir / source
        if path.exists():
            with open(path) as f:
                file_items = json.load(f)
                for item in file_items:
                    item["source_file"] = source
                    items.append(item)
    
    # Normalize and insert
    async with get_session() as session:
        # Clear existing SRD items
        await session.execute(delete(SrdItem))
        
        for item in items:
            srd_item = normalize_item(item)
            session.add(srd_item)
        
        await session.commit()
    
    print(f"Ingested {len(items)} SRD items")
```

### Normalization

```python
def normalize_item(raw: dict) -> SrdItem:
    """Normalize raw JSON item to SrdItem model."""
    
    # Extract common fields
    id = raw.get("id") or slugify(raw["name"])
    name = raw["name"]
    type = raw.get("type", "misc")
    category = raw.get("category", "misc")
    
    # Normalize cost to GP
    value_gp = None
    if "value_gp" in raw:
        value_gp = raw["value_gp"]
    elif "cost" in raw:
        # Handle {quantity: 10, unit: "gp"} format
        cost = raw["cost"]
        if isinstance(cost, dict):
            value_gp = convert_to_gp(cost["quantity"], cost["unit"])
    
    # Collect type-specific properties
    properties = {}
    
    # Weapons
    if "damage_dice" in raw:
        properties["damage_dice"] = raw["damage_dice"]
        properties["damage_type"] = raw.get("damage_type")
    if "range" in raw:
        properties["range"] = raw["range"]
    if "properties" in raw and isinstance(raw["properties"], list):
        properties["weapon_properties"] = raw["properties"]
    
    # Armor
    if "ac_base" in raw or "armor_class" in raw:
        properties["ac_base"] = raw.get("ac_base") or raw.get("armor_class", {}).get("base")
        properties["ac_dex_bonus"] = raw.get("ac_dex_bonus", True)
        properties["stealth_disadvantage"] = raw.get("stealth_disadvantage", False)
    
    # Potions
    if "effect" in raw:
        properties["effect"] = raw["effect"]
    if "duration" in raw:
        properties["duration"] = raw["duration"]
    
    return SrdItem(
        id=id,
        name=name,
        type=type,
        category=category,
        subcategory=raw.get("subcategory"),
        description=raw.get("description"),
        weight=raw.get("weight"),
        value_gp=value_gp,
        rarity=raw.get("rarity"),
        source_file=raw.get("source_file"),
        properties=properties if properties else None,
    )
```

## Updated API

### Search Endpoint (updated)

```python
# GET /api/srd/search?q=sword&type=equipment&category=weapon&limit=10

async def srd_search(
    q: str,
    type: str | None = None,
    category: str | None = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
) -> list[SrdItemRead]:
    """Search SRD items in database."""
    
    query = select(SrdItem).where(SrdItem.name.ilike(f"%{q}%"))
    
    if type:
        query = query.where(SrdItem.type == type)
    if category:
        query = query.where(SrdItem.category == category)
    
    query = query.limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()
```

### New: Get Item by ID

```python
# GET /api/srd/items/{item_id}

async def get_srd_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
) -> SrdItemRead:
    """Get a single SRD item by ID."""
    
    result = await db.execute(
        select(SrdItem).where(SrdItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(404, "SRD item not found")
    
    return item
```

## Frontend Updates

### Updated SrdItem Type

```typescript
// api/types.ts

export interface SrdItem {
  id: string
  name: string
  type: string
  category: string
  subcategory?: string
  description?: string
  weight?: number
  value_gp?: number
  rarity?: string
  source_file?: string
  properties?: {
    // Weapons
    damage_dice?: string
    damage_type?: string
    range?: string
    weapon_properties?: string[]
    // Armor
    ac_base?: number
    ac_dex_bonus?: boolean
    stealth_disadvantage?: boolean
    // Potions
    effect?: string
    duration?: string
  }
}
```

### Update AddItemModal

- Update `handleSrdSelect` to use new field names
- `value_gp` instead of `cost.quantity * rate`
- `properties.damage_dice` instead of `damage?.damage_dice`

## File Structure

```
backend/
├── app/
│   ├── cli/
│   │   ├── __init__.py
│   │   └── ingest_srd.py      # Ingestion script
│   ├── models/
│   │   └── srd.py             # Add SrdItem table model
│   ├── services/
│   │   └── srd.py             # Update to query DB
│   └── routers/
│       └── srd.py             # Add GET /items/{id}
└── tests/
    └── test_srd.py            # Update tests

frontend/src/
├── api/
│   └── types.ts               # Update SrdItem type
└── components/items/
    └── AddItemModal.tsx       # Update field mapping
```

## Implementation Tasks

### BE-034: SrdItem Database Model
- Create SrdItem SQLModel with table=True
- Add to models/__init__.py exports
- Run migration (table auto-created on startup)

### BE-035: Ingestion CLI Script
- Create app/cli/ingest_srd.py
- Load all JSON source files
- Normalize items to SrdItem model
- Insert into database (clear existing first)
- Add to pyproject.toml scripts

### BE-036: Update Search Service
- Query database instead of JSON
- Use SQLModel select with ilike for search
- Apply type/category filters

### BE-037: Add GET /api/srd/items/{id}
- Single item lookup endpoint
- Return 404 if not found

### BE-038: SRD Tests
- Test ingestion loads correct count
- Test search returns results
- Test filters work
- Test single item lookup

### FE-014: Update SrdItem Type
- Update types.ts with new SrdItem interface
- Update AddItemModal field mapping

## Acceptance Criteria

1. **Ingestion runs** - `uv run python -m app.cli.ingest_srd` loads ~129 items
2. **Search works** - `/api/srd/search?q=sword` returns items from DB
3. **Filters work** - `type` and `category` filters apply correctly
4. **Single item** - `/api/srd/items/longsword` returns full item details
5. **Frontend works** - AddItemModal autofill still works with new schema
6. **Properties preserved** - damage_dice, ac_base, etc. available in response

## Future Enhancements (Out of Scope)

- Add magic items data
- Add scrolls data
- Admin UI for adding custom SRD items
- Version tracking for SRD updates
