# Phase 3: Currency Management

## Overview

Implements the party treasury system for managing D&D 5e currency denominations. Supports adding, subtracting, and converting currency with validation and real-time sync.

## Currency System

### Denominations

| Currency | Abbreviation | Value in CP |
|----------|--------------|-------------|
| Copper   | CP           | 1           |
| Silver   | SP           | 10          |
| Gold     | GP           | 100         |
| Platinum | PP           | 1000        |

### Conversion Rates

- 10 CP = 1 SP
- 10 SP = 1 GP
- 10 GP = 1 PP

## Data Model

Currency is stored directly on the PartyInventory model:

```
PartyInventory {
  ...
  copper: integer (default: 0)
  silver: integer (default: 0)
  gold: integer (default: 0)
  platinum: integer (default: 0)
  ...
}
```

## Features

### 1. View Currency

- Display all four denominations
- Show total value in GP equivalent
- Formula: `total_gp = (copper/100) + (silver/10) + gold + (platinum*10)`

### 2. Add/Subtract Currency

- Add funds to treasury (positive deltas)
- Spend from treasury (negative deltas)
- Validate sufficient funds for spending
- Optional note for transaction context
- Real-time sync via SSE `currency_updated` event

### 3. Currency Conversion

- Convert between any two denominations
- Apply standard D&D 5e conversion rates
- Validate sufficient source currency
- Handle partial conversions (e.g., convert only 50 of 100 CP)

## API Endpoints

### Get Currency
```
GET /api/inventories/{slug}/currency
Response: { copper: int, silver: int, gold: int, platinum: int, total_gp: float }
```

### Update Currency (Add/Spend)
```
POST /api/inventories/{slug}/currency
Body: { copper?: int, silver?: int, gold?: int, platinum?: int, note?: string }
Response: { copper: int, silver: int, gold: int, platinum: int, total_gp: float }
```
- Positive values add, negative values subtract
- Validates no denomination goes below 0

### Convert Currency
```
POST /api/inventories/{slug}/currency/convert
Body: { from: "copper"|"silver"|"gold"|"platinum", to: same, amount: int }
Response: { copper: int, silver: int, gold: int, platinum: int, total_gp: float }
```

## UI Components

### Treasury Widget

Compact display for dashboard:

```
┌─────────────────────────────────────────┐
│ Party Treasury                          │
├─────────────────────────────────────────┤
│ PP: 12    GP: 453    SP: 27    CP: 84   │
│ ─────────────────────────────────────── │
│ Total Value: 593.94 GP                  │
│                                         │
│ [+ Add Funds]  [- Spend]  [⇄ Convert]   │
└─────────────────────────────────────────┘
```

### Mobile Layout

On mobile, currency displays in 2x2 grid:

```
┌─────────────────────┐
│ PP: 12    GP: 453   │
│ SP: 27    CP: 84    │
│ ─────────────────── │
│ Total: 593.94 GP    │
│ [+] [-] [⇄]         │
└─────────────────────┘
```

### Add/Spend Modal

- Mode toggle: "Add Funds" / "Spend"
- Input fields for each denomination
- Optional note field
- Preview of new totals before confirming
- Validation: cannot spend more than available (per denomination)

### Convert Modal

- From denomination dropdown
- To denomination dropdown
- Amount input
- Conversion preview (e.g., "100 CP → 10 SP")
- Submit button

## Real-Time Sync

Currency changes broadcast via SSE:

```
event: currency_updated
data: {"copper": 84, "silver": 27, "gold": 453, "platinum": 12, "total_gp": 593.94}
```

All connected clients update their treasury display when receiving this event.

## Validation Rules

1. **Sufficient Funds**: Cannot spend more than available in any denomination
2. **Non-Negative**: No denomination can go below 0
3. **Valid Conversion**: Must have enough source currency to convert
4. **Conversion Direction**: Can only convert between denominations following standard rates

## Quality Gates

- **Backend**: `ruff check` passes
- **Frontend**: `bun run typecheck && bun run lint` passes
