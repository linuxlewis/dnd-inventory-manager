# Phase 6: Recent Inventories

## Overview

Cache recently accessed inventories in localStorage so users can quickly return to them from the home page.

## User Stories

### US-1: See Recent Inventories
As a returning user, I want to see my recently accessed inventories on the home page, so I can quickly jump back into them.

### US-2: Quick Access
As a user, I want to click a recent inventory and go directly to it (with passphrase prompt if needed), so I don't have to remember or type the slug.

### US-3: Clear History
As a user, I want to remove inventories from my recent list, so I can keep it tidy.

## UI Design

### Home Page with Recent Inventories

```
┌─────────────────────────────────────────────────────┐
│  🎒 D&D Party Inventory                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Recent Inventories                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🎲 Dragon Slayers          Last: 2 hours ago │ ✕ │
│  ├─────────────────────────────────────────────┤   │
│  │ ⚔️ Tomb Raiders            Last: yesterday   │ ✕ │
│  ├─────────────────────────────────────────────┤   │
│  │ 🧙 Magic Academy           Last: 3 days ago  │ ✕ │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ─────────────── or ───────────────                │
│                                                     │
│  Access an inventory by slug:                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ dragon-slayers                               │   │
│  └─────────────────────────────────────────────┘   │
│  [Access Inventory]                                 │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  [+ Create New Inventory]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Data Model

### localStorage Key
`dnd-inventory-recent`

### Structure
```typescript
interface RecentInventory {
  slug: string
  name: string
  lastAccessed: number  // Unix timestamp ms
}

// Stored as JSON array, max 10 items, newest first
type RecentInventories = RecentInventory[]
```

## Implementation

### Hook: useRecentInventories

```typescript
// hooks/useRecentInventories.ts

interface UseRecentInventoriesReturn {
  recentInventories: RecentInventory[]
  addRecent: (slug: string, name: string) => void
  removeRecent: (slug: string) => void
  clearAll: () => void
}

export function useRecentInventories(): UseRecentInventoriesReturn
```

**Behavior:**
- `addRecent`: Adds/updates entry, moves to front, caps at 10 items
- Called when user successfully accesses an inventory
- `removeRecent`: Removes single entry (X button)
- `clearAll`: Clears entire list

### Component: RecentInventoriesList

```typescript
// components/RecentInventoriesList.tsx

interface Props {
  inventories: RecentInventory[]
  onSelect: (slug: string) => void
  onRemove: (slug: string) => void
}
```

**Features:**
- Shows list of recent inventories
- Each item shows name, relative time, remove button
- Clicking item navigates to `/i/{slug}`
- Empty state hidden (don't show section if no recents)

### Integration Points

1. **Home.tsx**: Show RecentInventoriesList above slug input
2. **Inventory.tsx**: Call `addRecent(slug, name)` after successful auth
3. **Inventory.tsx**: Call `addRecent` when inventory data loads (updates lastAccessed)

## File Structure

```
frontend/src/
├── hooks/
│   └── useRecentInventories.ts   # localStorage hook
├── components/
│   └── RecentInventoriesList.tsx # List component
└── pages/
    ├── Home.tsx                  # Add recent list
    └── Inventory.tsx             # Track access
```

## Tasks

### FE-010: useRecentInventories Hook
- Create hook with localStorage persistence
- addRecent, removeRecent, clearAll functions
- Max 10 items, sorted by lastAccessed desc
- Handle SSR safety (check window exists)

### FE-011: RecentInventoriesList Component
- Display list with name, relative time, remove button
- Click navigates to inventory
- Styled with Tailwind, matches existing UI
- Empty state: don't render anything

### FE-012: Integration
- Add RecentInventoriesList to Home page
- Call addRecent in Inventory page on successful load
- Test full flow: access inventory → appears in recents → click to return

## Acceptance Criteria

1. **Recent inventories shown** on home page after visiting one
2. **Clicking recent** navigates to that inventory
3. **Remove button** removes single item from list
4. **List limited** to 10 most recent
5. **Persists** across page refreshes (localStorage)
6. **Relative time** shown (e.g., "2 hours ago")
7. **No recents** = section not shown (clean home page for new users)
