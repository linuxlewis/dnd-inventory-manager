# Phase 4: History Frontend

## Overview

Add an activity history widget to the inventory page showing recent changes, with the ability to view a full activity log in a slide-out panel.

## User Stories

### US-1: View Last Activity Summary
As an inventory user, I want to see when the last change was made at a glance, so I know if there's been recent activity.

### US-2: View Full Activity Log
As an inventory user, I want to click into the activity summary to see a complete history of all changes, so I can track what happened and when.

### US-3: Understand Change Context
As an inventory user, I want each history entry to clearly show what changed (item added, currency spent, etc.), so I can quickly scan the log.

## UI Components

### 1. ActivityWidget (on main inventory page)

**Location:** Below Treasury widget, above Items section

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 📜 Recent Activity                    View All → │
│                                                  │
│ Last updated: 2 hours ago                        │
│ "Added Longsword +1"                             │
└─────────────────────────────────────────────────┘
```

**States:**
- **Loading:** Skeleton pulse animation
- **Empty:** "No activity yet"
- **With data:** Shows last entry timestamp + summary
- **Error:** Retry button

**Behavior:**
- Clicking anywhere on the widget opens the HistoryPanel
- Shows relative time (e.g., "2 hours ago", "yesterday")
- Shows brief description of most recent action

### 2. HistoryPanel (slide-out panel)

**Layout:**
```
┌──────────────────────────────────────┐
│ ← Activity Log                    ✕  │
├──────────────────────────────────────┤
│                                      │
│ Today                                │
│ ┌──────────────────────────────────┐ │
│ │ 🗡️ Added "Longsword +1"          │ │
│ │    2:34 PM · equipment, rare     │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 💰 Currency updated              │ │
│ │    1:15 PM · +50 GP              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Yesterday                            │
│ ┌──────────────────────────────────┐ │
│ │ ✏️ Updated "Health Potion"       │ │
│ │    4:20 PM · quantity: 3 → 5     │ │
│ └──────────────────────────────────┘ │
│                                      │
│         [Load More]                  │
│                                      │
└──────────────────────────────────────┘
```

**Entry Types & Icons:**
- `item_added` → 🗡️ or item type icon
- `item_updated` → ✏️
- `item_removed` → 🗑️
- `currency_updated` → 💰

**Features:**
- Grouped by day (Today, Yesterday, date)
- Infinite scroll or "Load More" button
- Each entry shows:
  - Icon based on action type
  - Entity name (item name or "Currency")
  - Relative/absolute time
  - Brief details (type, rarity for items; amount for currency)
- For updates: show key changes (e.g., "quantity: 3 → 5")

### 3. Filter Options (optional, stretch goal)
- Filter by action type (added/updated/removed/currency)
- Filter by entity type (items/currency)

## API Integration

### Endpoint
```
GET /api/v1/inventories/{slug}/history
```

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)
- `action` (optional): item_added | item_updated | item_removed | currency_updated
- `entity_type` (optional): item | currency

**Response:**
```typescript
interface HistoryEntry {
  id: string
  action: 'item_added' | 'item_updated' | 'item_removed' | 'currency_updated'
  entity_type: 'item' | 'currency'
  entity_id: string | null
  entity_name: string | null
  details: Record<string, unknown>
  created_at: string
}

interface HistoryResponse {
  entries: HistoryEntry[]
  total: number
  limit: number
  offset: number
}
```

### React Query Hook
```typescript
// api/history.ts
export function useHistory(slug: string | undefined, options?: {
  limit?: number
  offset?: number
  action?: HistoryAction
  entityType?: HistoryEntityType
}) {
  return useQuery({
    queryKey: ['history', slug, options],
    queryFn: () => fetchHistory(slug!, options),
    enabled: !!slug,
  })
}
```

## File Structure

```
frontend/src/
├── api/
│   └── history.ts              # API client + React Query hooks
├── components/
│   └── history/
│       ├── index.ts            # Barrel export
│       ├── ActivityWidget.tsx  # Summary widget for inventory page
│       ├── HistoryPanel.tsx    # Slide-out panel with full log
│       ├── HistoryEntry.tsx    # Single entry component
│       └── utils.ts            # Formatting helpers (relative time, change summaries)
└── pages/
    └── Inventory.tsx           # Add ActivityWidget + HistoryPanel
```

## Implementation Tasks

### FE-001: API Types & Client
- Add history types to `api/types.ts`
- Create `api/history.ts` with fetch function and `useHistory` hook

### FE-002: ActivityWidget Component
- Create widget component with loading/empty/data states
- Show last update time (relative) and brief summary
- Click handler to open panel
- Add to Inventory page below TreasuryWidget

### FE-003: HistoryEntry Component
- Icon selection based on action type
- Relative time formatting
- Details formatting (changes for updates, amounts for currency)

### FE-004: HistoryPanel Component
- Slide-out panel (right side, similar pattern to ItemDetail)
- Group entries by day
- Pagination with "Load More" button
- Uses HistoryEntry for each item

### FE-005: Integration & Polish
- Wire up panel open/close state in Inventory page
- Ensure proper loading states
- Handle empty history gracefully
- Mobile responsive adjustments

## Acceptance Criteria

1. **Widget visible on inventory page** showing last activity time
2. **Click widget** opens slide-out history panel
3. **Panel shows entries** grouped by day with icons and details
4. **Pagination works** with Load More button
5. **Empty state** handled gracefully ("No activity yet")
6. **Loading states** show skeleton/spinner appropriately
7. **Mobile friendly** - panel takes full width on small screens

## Design Notes

- Use existing Tailwind patterns from other components
- Icons from Lucide React (already installed)
- Panel similar to ItemDetail slide-out pattern
- Colors consistent with existing UI (indigo accents)
