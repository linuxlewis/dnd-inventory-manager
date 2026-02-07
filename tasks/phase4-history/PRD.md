# Phase 4: History/Activity Log

## Overview

Add an activity log to track all changes made to an inventory. Users can see what changed, when, and what the change was — useful for auditing party loot decisions and tracking who took what.

## Scope

This phase covers **backend only**:
- HistoryEntry database model
- Auto-logging on item and currency changes
- Paginated GET endpoint with filtering

Frontend will be a separate phase.

## Data Model

### HistoryEntry

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| inventory_id | UUID | FK to inventories |
| action | enum | item_added, item_updated, item_removed, currency_updated |
| entity_type | enum | item, currency |
| entity_id | UUID? | ID of the item (null for currency) |
| entity_name | str? | Name snapshot (e.g., "Potion of Healing") |
| details | JSON | Action-specific data (see below) |
| created_at | datetime | When the action occurred |

### Details JSON by Action

**item_added:**
```json
{
  "name": "Potion of Healing",
  "quantity": 2,
  "type": "potion",
  "rarity": "common"
}
```

**item_updated:**
```json
{
  "changes": {
    "quantity": { "old": 2, "new": 5 },
    "notes": { "old": null, "new": "Found in dungeon" }
  }
}
```

**item_removed:**
```json
{
  "name": "Potion of Healing",
  "quantity": 2,
  "reason": "deleted"
}
```

**currency_updated:**
```json
{
  "changes": {
    "gold": { "old": 100, "new": 150 }
  },
  "note": "Sold gems"
}
```

## API Endpoints

### GET /api/v1/inventories/{slug}/history

Returns paginated history entries.

**Query Parameters:**
- `limit` (int, default 20, max 100) - entries per page
- `offset` (int, default 0) - pagination offset
- `action` (str, optional) - filter by action type
- `entity_type` (str, optional) - filter by entity type

**Response:**
```json
{
  "entries": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

## Implementation Notes

- History entries are **immutable** — no update/delete endpoints
- Logging happens **after** successful operations (don't log failures)
- Use service layer functions that item/currency routers call
- Keep details minimal but useful — snapshot key fields, not entire objects
- Entity name is denormalized for display without joins

## Out of Scope

- User/actor tracking (no auth identity yet)
- History for inventory settings changes
- Bulk operations logging
- History retention/cleanup policies
- Frontend display (Phase 4-FE)
