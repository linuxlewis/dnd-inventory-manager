# Phase: SRD Search System

## Overview

Implements a searchable database of D&D 5e System Reference Document (SRD) items. Ingests SRD data into a SQLite table and provides a simple search API for item lookup.

## Goals

1. **Single flat search table** in SQLite for all SRD items
2. **Fast text search** on item names and descriptions
3. **Simple API** for searching and retrieving items
4. **Data ingestion** script to load SRD JSON into the database

## Data Model

### SRDItem Table

Single flat table containing all searchable SRD content:

```sql
CREATE TABLE srd_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,           -- 'weapon', 'armor', 'gear', 'tool', 'magic_item', 'consumable'
    category TEXT,                -- e.g., 'martial melee', 'light armor', 'adventuring gear'
    rarity TEXT,                  -- 'common', 'uncommon', 'rare', 'very_rare', 'legendary'
    
    -- Common properties (nullable)
    cost_gp REAL,
    weight_lbs REAL,
    description TEXT,
    
    -- Weapon properties
    damage_dice TEXT,             -- '1d8', '2d6', etc.
    damage_type TEXT,             -- 'slashing', 'piercing', 'bludgeoning'
    weapon_properties TEXT,       -- JSON array: '["finesse", "versatile"]'
    weapon_range TEXT,            -- '20/60' for thrown/ranged
    
    -- Armor properties
    ac_base INTEGER,
    ac_bonus INTEGER,
    armor_type TEXT,              -- 'light', 'medium', 'heavy', 'shield'
    strength_required INTEGER,
    stealth_disadvantage BOOLEAN,
    
    -- Magic item properties
    attunement_required BOOLEAN,
    attunement_requirements TEXT,
    magical_bonus INTEGER,
    
    -- Consumable properties
    effect TEXT,
    
    -- Full-text search
    search_text TEXT,             -- Concatenated searchable content
    
    -- Metadata
    source TEXT DEFAULT 'SRD 5.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index
CREATE VIRTUAL TABLE srd_items_fts USING fts5(
    name, 
    description, 
    search_text,
    content='srd_items',
    content_rowid='id'
);
```

## API Endpoints

### Search SRD Items

```
GET /api/srd/search?q={query}&type={type}&limit={limit}
```

**Parameters:**
- `q` (required): Search query string
- `type` (optional): Filter by item type
- `limit` (optional): Max results (default: 20, max: 100)

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "Longsword",
      "slug": "longsword",
      "type": "weapon",
      "category": "martial melee",
      "cost_gp": 15,
      "weight_lbs": 3,
      "damage_dice": "1d8",
      "damage_type": "slashing",
      "weapon_properties": ["versatile"],
      "description": "..."
    }
  ],
  "total": 1
}
```

### Get SRD Item by Slug

```
GET /api/srd/items/{slug}
```

**Response:** Single SRDItem object or 404

## Data Ingestion

### Ingestion Script

`scripts/ingest_srd.py` - Loads SRD JSON data into the database:

```bash
# Run ingestion
cd backend
uv run python scripts/ingest_srd.py

# With custom source file
uv run python scripts/ingest_srd.py --source data/srd_items.json
```

**Ingestion behavior:**
- Clears existing SRD data before import (idempotent)
- Generates slugs from item names
- Builds search_text from name + description + category
- Updates FTS index

### SRD Data Source

Source JSON format (in `backend/data/srd_items.json`):

```json
[
  {
    "name": "Longsword",
    "type": "weapon",
    "category": "martial melee",
    "cost": "15 gp",
    "weight": "3 lb.",
    "damage": "1d8 slashing",
    "properties": ["Versatile (1d10)"],
    "description": "..."
  }
]
```

## Search Behavior

1. **FTS5 search** for fast full-text matching
2. **Prefix matching** - "long" matches "Longsword"
3. **Case-insensitive**
4. **Relevance ranking** by FTS5 bm25

## Quality Gates

- **Backend**: `ruff check` passes
- **Tests**: `pytest backend/tests/test_srd.py` passes

## Out of Scope

- Frontend UI (handled separately)
- Image/thumbnail storage
- User modifications to SRD items
