# D&D Party Inventory Manager — Product Specification

## Overview

A web application for managing shared party inventory in Dungeons & Dragons 5th Edition campaigns. Parties access their inventory via a unique slug/passphrase—no individual user accounts required. The app supports equipment, consumables, and a shared currency pool, with AI-powered item thumbnail generation and automatic stat population for standard D&D 5e items.

---

## Core Concepts

### Access Model
- **Slug-based access**: Each party inventory is identified by a unique slug (e.g., `dragon-slayers-2024`)
- **Passphrase protection**: A shared secret passphrase grants read/write access
- **No user accounts**: Anyone with the slug + passphrase can view and modify the inventory
- **Session persistence**: Browser session remembers authenticated inventories

### Currency System
Uses standard D&D 5e denominations:
| Currency | Abbreviation | Value in CP |
|----------|--------------|-------------|
| Copper   | CP           | 1           |
| Silver   | SP           | 10          |
| Gold     | GP           | 100         |
| Platinum | PP           | 1000        |

---

## Data Models

### Party Inventory
```
PartyInventory {
  id: UUID
  slug: string (unique, URL-safe)
  passphrase_hash: string
  name: string
  description?: string
  
  // Currency pool
  copper: integer (default: 0)
  silver: integer (default: 0)
  gold: integer (default: 0)
  platinum: integer (default: 0)
  
  created_at: timestamp
  updated_at: timestamp
}
```

### Item (Base)
```
Item {
  id: UUID
  inventory_id: UUID (foreign key)
  
  name: string
  type: enum ['equipment', 'potion', 'scroll', 'consumable', 'misc']
  category: string (e.g., 'weapon', 'armor', 'wondrous', 'ammunition', 'tool')
  rarity: enum ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact']
  
  description: text
  notes?: text (user-added notes)
  
  quantity: integer (default: 1)
  weight?: decimal (in lbs)
  estimated_value?: integer (in GP)
  
  thumbnail_url?: string (AI-generated)
  is_standard_item: boolean (true if from 5e SRD)
  standard_item_id?: string (reference to 5e item database)
  
  created_at: timestamp
  updated_at: timestamp
}
```

### Equipment (extends Item)
```
Equipment extends Item {
  type: 'equipment'
  
  // Armor properties
  ac_bonus?: integer
  ac_base?: integer
  armor_type?: enum ['light', 'medium', 'heavy', 'shield']
  stealth_disadvantage?: boolean
  strength_requirement?: integer
  
  // Weapon properties
  damage_dice?: string (e.g., '1d8', '2d6')
  damage_type?: enum ['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', ...]
  weapon_properties?: string[] (e.g., ['finesse', 'versatile', 'thrown'])
  versatile_damage?: string (e.g., '1d10')
  range?: string (e.g., '20/60')
  
  // Magic properties
  attunement_required: boolean (default: false)
  attunement_requirements?: string (e.g., 'by a spellcaster')
  magical_bonus?: integer (+1, +2, +3)
  
  // Spell grants
  granted_spells?: SpellGrant[]
  
  // Special modifiers
  special_modifiers?: SpecialModifier[]
}

SpellGrant {
  spell_name: string
  charges?: integer
  recharge?: string (e.g., 'dawn', 'long rest')
  spell_level?: integer
  notes?: string
}

SpecialModifier {
  name: string
  description: string
  modifier_type?: string (e.g., 'damage', 'saving_throw', 'skill')
  value?: string
}
```

### Potion (extends Item)
```
Potion extends Item {
  type: 'potion'
  
  potion_type: enum ['healing', 'buff', 'utility', 'other']
  
  // Healing potions
  healing_dice?: string (e.g., '2d4+2', '8d4+8')
  
  // Buff/utility potions
  effect_description: string
  duration?: string (e.g., '1 hour', '10 minutes')
  
  // Mechanical effects
  grants_condition?: string (e.g., 'invisible', 'hasted')
  stat_bonus?: StatBonus[]
}

StatBonus {
  stat: string (e.g., 'strength', 'AC', 'speed')
  bonus: string (e.g., '+2', '19', '×2')
  duration?: string
}
```

**Standard Potion Reference (auto-populated):**
| Potion | Type | Effect | Rarity | Value |
|--------|------|--------|--------|-------|
| Potion of Healing | healing | 2d4+2 HP | Common | 50 GP |
| Potion of Greater Healing | healing | 4d4+4 HP | Uncommon | 150 GP |
| Potion of Superior Healing | healing | 8d4+8 HP | Rare | 500 GP |
| Potion of Supreme Healing | healing | 10d4+20 HP | Very Rare | 1,350 GP |
| Potion of Fire Breath | utility | Exhale fire 30ft cone, 4d6 | Uncommon | 150 GP |
| Potion of Flying | buff | Flying speed 60ft, 1 hour | Very Rare | 500 GP |
| Potion of Invisibility | buff | Invisible for 1 hour | Very Rare | 180 GP |
| Potion of Speed | buff | Hasted for 1 minute | Very Rare | 400 GP |
| Potion of Giant Strength (Hill) | buff | STR 21 for 1 hour | Uncommon | 180 GP |

### Scroll (extends Item)
```
Scroll extends Item {
  type: 'scroll'
  
  spell_name: string
  spell_level: integer (0-9, 0 = cantrip)
  spell_school: enum ['abjuration', 'conjuration', 'divination', 'enchantment', 
                       'evocation', 'illusion', 'necromancy', 'transmutation']
  
  // Casting requirements (for scrolls above caster's ability)
  spell_save_dc?: integer
  spell_attack_bonus?: integer
  
  // Spell details (for reference)
  casting_time?: string
  range?: string
  components?: string
  duration?: string
  spell_description?: text
}
```

**Spell Scroll Reference (auto-populated by level):**
| Spell Level | Rarity | Save DC | Attack Bonus | Value |
|-------------|--------|---------|--------------|-------|
| Cantrip | Common | 13 | +5 | 15 GP |
| 1st | Common | 13 | +5 | 25 GP |
| 2nd | Uncommon | 13 | +5 | 150 GP |
| 3rd | Uncommon | 15 | +7 | 300 GP |
| 4th | Rare | 15 | +7 | 500 GP |
| 5th | Rare | 17 | +9 | 1,000 GP |
| 6th | Very Rare | 17 | +9 | 2,500 GP |
| 7th | Very Rare | 18 | +10 | 5,000 GP |
| 8th | Very Rare | 18 | +10 | 10,000 GP |
| 9th | Legendary | 19 | +11 | 25,000 GP |

### Consumable (extends Item)
```
Consumable extends Item {
  type: 'consumable'
  
  consumable_type: enum ['ammunition', 'food', 'oil', 'poison', 'kit', 'other']
  
  // For ammunition
  ammunition_type?: string (e.g., 'arrow', 'bolt', 'bullet', 'dart')
  magical_bonus?: integer (+1, +2, +3)
  special_damage?: string (e.g., '+1d6 fire')
  
  // For poisons/oils
  application?: string (e.g., 'injury', 'contact', 'ingested', 'inhaled')
  effect_description?: string
  save_dc?: integer
  save_type?: string (e.g., 'Constitution')
  
  // General
  uses?: integer (for multi-use items like healer's kit)
  uses_remaining?: integer
}

### History Log Entry
```
HistoryEntry {
  id: UUID
  inventory_id: UUID
  
  action: enum ['item_added', 'item_removed', 'item_updated', 'quantity_changed', 'currency_changed']
  
  item_id?: UUID
  item_name?: string (denormalized for deleted items)
  
  previous_value?: JSON
  new_value?: JSON
  
  note?: string
  timestamp: timestamp
}
```

---

## Features

### 1. Party Inventory Creation
**Flow:**
1. User visits homepage
2. Clicks "Create New Inventory"
3. Enters:
   - Party/inventory name
   - Passphrase (entered twice for confirmation)
   - Optional description
4. System generates a unique slug (can be customized if available)
5. User is redirected to the new inventory page

**Slug Generation:**
- Auto-generated from party name (e.g., "The Dragon Slayers" → `the-dragon-slayers`)
- Appends random suffix if collision (`the-dragon-slayers-7x3k`)
- User can customize before creation

---

### 2. Inventory Access
**Flow:**
1. User visits `/{slug}` or enters slug on homepage
2. Prompted for passphrase
3. On success, session is established
4. Inventory dashboard loads

**Session:**
- Stored in browser (cookie/localStorage)
- Persists until explicitly logged out or cleared
- Can remember multiple inventories

---

### 3. Currency Management
**Features:**
- Display all denominations with total GP equivalent
- Add/subtract any denomination
- Auto-conversion option (e.g., convert 100 CP to 1 GP)
- Transaction history in log

**UI:**
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

---

### 4. Adding Items

#### 4.1 Standard 5e Items
**Flow:**
1. User clicks "Add Item"
2. Searches for item by name
3. System searches 5e SRD database
4. If match found:
   - Auto-populates all stats (damage, AC, weight, description, etc.)
   - Shows preview
5. User can adjust quantity and add notes
6. On save, LLM generates thumbnail image
7. Item added to inventory, logged to history

**Standard Item Examples:**
| Item | Auto-populated Stats |
|------|---------------------|
| Longsword | 1d8 slashing, versatile (1d10), 3 lbs, 15 GP |
| Potion of Healing | Heals 2d4+2 HP, 0.5 lbs, 50 GP |
| Potion of Superior Healing | Heals 8d4+8 HP, 0.5 lbs, 500 GP |
| Chain Mail | AC 16, heavy, stealth disadvantage, Str 13 required, 55 lbs |
| Cloak of Elvenkind | Uncommon, attunement, advantage on Stealth |

#### 4.2 Custom Items
**Flow:**
1. User clicks "Add Item" → "Create Custom"
2. Selects item type (equipment/consumable/misc)
3. Fills in relevant fields based on type
4. Adds description and notes
5. On save, LLM generates thumbnail based on name + description
6. Item added to inventory, logged to history

#### 4.3 AI Thumbnail Generation

**Authentication Model:**
Users enter their own OpenAI API key to enable thumbnail generation. This allows:
- Users to use their existing OpenAI API credits
- No per-image costs for the app operator
- Users control their own usage and billing
- Simple setup with no OAuth complexity

**API Key Setup Flow:**
1. User navigates to inventory settings
2. Clicks "Connect OpenAI for Thumbnails"
3. Enters their OpenAI API key
4. App validates key with a test API call
5. Key stored encrypted, associated with inventory
6. Thumbnails now generate automatically on item creation

**Key Storage:**
```
OpenAIConnection {
  id: UUID
  inventory_id: UUID (foreign key)
  
  api_key: string (encrypted at rest)
  
  connected_at: timestamp
  last_used_at: timestamp
  is_valid: boolean
}
```

**Security Considerations:**
- API key encrypted with AES-256 before storage
- Key never exposed in API responses (only "connected: true/false")
- Key can be removed/replaced at any time
- Option to test key validity without storing

**Thumbnail Generation Trigger:** 
- Automatically on item creation (if API key configured)
- Manual "Generate Thumbnail" button
- "Regenerate" option on existing items

**Input to DALL-E:**
- Item name
- Item type and category
- Description snippet
- Key stats (rarity, magical properties)
- Style prompt: "Fantasy RPG item icon, centered, simple background, digital art style"

**Output:** Square thumbnail image (256×256)

**Fallback Behavior:**
- If API key not configured: Show placeholder icon based on item type
- If generation fails: Show placeholder, log error, allow retry
- Default category icons provided for all item types

**Rate Limiting:**
- Client-side cooldown (5 seconds between generations)
- Batch generation limit (10 items per batch request)

---

### 5. Inventory Management

#### 5.1 List View
**Features:**
- View all items grouped by category
- Sortable columns (name, type, quantity, value, date added)
- Filter by type/category/rarity
- Search by name or description
- Compact vs. detailed view toggle

**Item Type Tabs:**
- ⚔️ Equipment (weapons, armor, wondrous items)
- 🧪 Potions
- 📜 Scrolls
- 🎯 Consumables (ammunition, oils, poisons)
- 📦 Miscellaneous

**Equipment Sub-categories:**
- Weapons (melee, ranged)
- Armor & Shields
- Wondrous Items
- Tools & Instruments

#### 5.2 Quick Actions (from list view)
- **Adjust quantity**: +/- buttons or direct input
- **Remove item**: With confirmation
- **Duplicate item**: Create copy with quantity 1

#### 5.3 Item Detail View
**Displays:**
- Thumbnail (AI-generated)
- Full name and rarity badge
- All stats relevant to item type
- Description
- User notes (editable)
- History for this item

**Actions:**
- Edit all fields
- Regenerate thumbnail
- Delete item
- Split stack (for quantity > 1)

---

### 6. History Log

**Tracked Events:**
- Item added (who/what/when)
- Item removed
- Item quantity changed (old → new)
- Item details edited
- Currency added/spent/converted

**View:**
- Chronological list, newest first
- Filterable by action type
- Searchable
- Shows item thumbnails inline

**Entry Format:**
```
[2024-01-15 14:32] Item Added
  + Potion of Healing ×3
  [Undo]
  
[2024-01-15 14:28] Currency Changed  
  + 150 GP, + 30 SP (looted from dragon hoard)
  [Undo]
  
[2024-01-15 13:45] Quantity Changed
  Arrows: 45 → 38 (used in combat)
  [Undo]
```

---

### 6.1 Undo & Time Travel

The history system supports both individual action undo and full inventory rollback to a specific point in time.

**Individual Undo:**
- Each history entry has an "Undo" button
- Reverses that single action:
  - `item_added` → removes the item
  - `item_removed` → restores the item (from stored snapshot)
  - `item_updated` → restores previous values
  - `quantity_changed` → restores previous quantity
  - `currency_changed` → reverses the currency delta
- Creates a new history entry: "Undid: [original action]"
- Cannot undo an undo (but can redo by undoing the undo entry)

**Rollback to Point in Time:**
- "Revert to this point" button on any history entry
- Restores entire inventory state to that moment
- Confirmation dialog with warning: "This will undo X changes"
- All items, quantities, currency, and notes restored to snapshot
- Creates a single history entry: "Rolled back to [timestamp]"

**Implementation:**

Each history entry stores enough data to reverse the action:

```
HistoryEntry {
  id: UUID
  inventory_id: UUID
  
  action: enum ['item_added', 'item_removed', 'item_updated', 
                'quantity_changed', 'currency_changed', 'rollback', 'undo']
  
  // For reversal
  item_id?: UUID
  item_name?: string
  item_snapshot?: JSON      # Full item state (for removals, enables restore)
  previous_value?: JSON     # State before change
  new_value?: JSON          # State after change
  
  # For rollback tracking
  is_undone: boolean (default: false)
  undone_by?: UUID          # Reference to the undo entry
  
  note?: string
  timestamp: timestamp
}
```

**Inventory Snapshots (for rollback):**

For efficient point-in-time rollback, periodic snapshots are stored:

```
InventorySnapshot {
  id: UUID
  inventory_id: UUID
  
  # Full state capture
  items: JSON[]             # Array of all items with full properties
  currency: JSON            # { copper, silver, gold, platinum }
  
  # Metadata
  history_entry_id: UUID    # The history entry this snapshot follows
  created_at: timestamp
}
```

**Snapshot Strategy:**
- Snapshot created every 10 history entries
- Snapshot created before any rollback operation
- To rollback: load nearest prior snapshot, then replay/reverse history entries
- Old snapshots pruned after 30 days (configurable)

**Rollback Algorithm:**
```
1. Find nearest snapshot before target timestamp
2. Load snapshot state
3. Collect all history entries between snapshot and target
4. Apply entries in order to reach target state
5. Replace current inventory with computed state
6. Create "rollback" history entry with current state as previous_value
```

**UI for Rollback:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Revert Inventory                                     │
├─────────────────────────────────────────────────────────┤
│ You are about to revert the inventory to:               │
│                                                         │
│   January 15, 2024 at 2:28 PM                          │
│   "Currency Changed: +150 GP, +30 SP"                  │
│                                                         │
│ This will undo 3 changes:                              │
│   • Item Added: Potion of Healing ×3                   │
│   • Quantity Changed: Arrows 45 → 38                   │
│   • Item Updated: Flame Tongue (notes edited)          │
│                                                         │
│ This action can be undone from the history log.        │
│                                                         │
│              [Cancel]    [Revert to This Point]        │
└─────────────────────────────────────────────────────────┘
```

---

### 7. Real-Time Synchronization

**Architecture: Server-Sent Events (SSE)**

When multiple party members have the inventory open simultaneously, changes sync automatically without page refresh.

**How It Works:**
1. Client opens SSE connection to `/api/inventories/{slug}/events`
2. Server maintains connection pool per inventory
3. When any client makes a change (add/edit/remove item, currency change), server:
   - Persists change to database
   - Broadcasts event to all connected clients for that inventory
4. Receiving clients update their local state without full reload

**Event Types:**
```
EventStream {
  event_type: enum [
    'item_added',
    'item_updated', 
    'item_removed',
    'currency_updated',
    'inventory_updated',
    'connection_count'  // Notify how many people are viewing
  ]
  
  payload: JSON (relevant data for the event)
  timestamp: ISO 8601
  event_id: string (for reconnection/replay)
}
```

**Example Events:**
```
event: item_added
data: {"item": {...}, "timestamp": "2024-01-15T14:32:00Z"}

event: item_updated
data: {"item_id": "abc123", "changes": {"quantity": 5}, "timestamp": "..."}

event: currency_updated
data: {"gold": 453, "silver": 27, "copper": 84, "platinum": 12}

event: connection_count
data: {"viewers": 3}
```

**Client Handling:**
```javascript
const eventSource = new EventSource(`/api/inventories/${slug}/events`);

eventSource.addEventListener('item_added', (e) => {
  const data = JSON.parse(e.data);
  // Add item to local state
});

eventSource.addEventListener('item_updated', (e) => {
  const data = JSON.parse(e.data);
  // Update item in local state
});
```

**Connection Management:**
- Automatic reconnection with exponential backoff
- Last-Event-ID header for missed event replay
- Heartbeat every 30 seconds to keep connection alive
- Graceful degradation: if SSE unavailable, fall back to polling

**Visual Indicators:**
- Show number of active viewers: "👥 3 party members viewing"
- Toast notifications for changes: "Gandalf added Potion of Healing ×2"
- Highlight recently changed items briefly

**Conflict Resolution:**
- Last-write-wins for simple field updates
- For quantity changes: server applies delta, not absolute value
  - Client A: "reduce arrows by 3" → Server: arrows = arrows - 3
  - Prevents race conditions when two people adjust quantity simultaneously

---

## User Interface

### Responsive Design (Mobile-First)

The application is fully responsive and optimized for mobile use during game sessions.

**Breakpoints:**
| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| Mobile | < 640px | Phones |
| Tablet | 640px - 1024px | Tablets, small laptops |
| Desktop | > 1024px | Laptops, desktops |

**Mobile-Specific Adaptations:**

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Navigation | Sidebar | Bottom tab bar + hamburger menu |
| Item list | Table with columns | Card stack |
| Quick actions | Inline buttons | Swipe gestures + action sheet |
| Currency display | Horizontal row | 2×2 grid |
| Item detail | Side panel / modal | Full-screen view |
| Add item form | Multi-column | Single column, stepped wizard |
| Filters | Sidebar panel | Bottom sheet |

**Mobile Gestures:**
- **Swipe left on item:** Quick actions (edit quantity, remove)
- **Swipe right on item:** Mark as favorite / pin
- **Pull down:** Refresh inventory
- **Long press:** Multi-select mode

**Mobile-Optimized Features:**
- Large touch targets (minimum 44×44px)
- Bottom-anchored primary actions (thumb-friendly)
- Collapsible sections to reduce scrolling
- Offline indicator with sync status
- Reduced animations for performance

**Touch-Friendly Item Cards:**
```
┌─────────────────────────────────────┐
│ [IMG]  Flame Tongue Longsword       │
│        ⚔️ Rare · Attuned            │
│        1d8+2d6 fire | 3 lbs         │
│                                     │
│        [-] 1 [+]           [•••]    │
└─────────────────────────────────────┘
```

**PWA Support (Progressive Web App):**
- Installable on home screen (iOS/Android)
- App-like experience without app store
- Service worker for offline capability
- Push notifications (future: "Party treasury updated")

### Pages

#### 1. Homepage (`/`)
- Create new inventory button
- Access existing inventory (enter slug + passphrase)
- Recently accessed inventories (from session)

#### 2. Inventory Dashboard (`/{slug}`)
- Party name and description
- Treasury summary widget
- Quick stats (total items, total weight, total value)
- Recent activity preview
- Navigation to other sections

#### 3. Items List (`/{slug}/items`)
- Category tabs or sidebar
- Item cards/rows with thumbnails
- Quick action buttons
- Add item FAB/button

#### 4. Item Detail (`/{slug}/items/{item-id}`)
- Full item display
- Edit mode toggle
- Item-specific history

#### 5. Add/Edit Item (`/{slug}/items/new`, `/{slug}/items/{item-id}/edit`)
- Form with type-specific fields
- 5e item search/autocomplete
- Preview pane

#### 6. History (`/{slug}/history`)
- Full activity log
- Filters and search

#### 7. Settings (`/{slug}/settings`)
- Rename inventory
- Change passphrase
- **OpenAI API Key:** Add/remove/test key for thumbnail generation
- Export data (JSON/PDF)
- Delete inventory (with confirmation)

---

## Technical Architecture

### Tech Stack Overview
| Layer | Technology |
|-------|------------|
| Frontend | React 18+ with Vite |
| Frontend Package Manager | Bun |
| Backend | Python 3.11+ with FastAPI |
| Backend Package Manager | UV |
| Data Validation | Pydantic v2 |
| Database | SQLite with SQLAlchemy |
| Real-Time | Server-Sent Events (SSE) |
| Image Generation | OpenAI DALL-E 3 API |
| Containerization | Docker + Docker Compose |
| Public Access | Tailscale Funnel |

---

### Frontend (React + Vite + Bun)

**Package Manager:** Bun (fast all-in-one JavaScript runtime, bundler, and package manager)

**Core Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "axios": "^1.x",
    "tailwindcss": "^3.x",
    "lucide-react": "^0.x",
    "zustand": "^4.x"
  }
}
```

**Why Bun:**
- Significantly faster than npm/yarn for installs
- Built-in TypeScript support
- Compatible with existing npm packages
- Single tool for runtime, bundler, and package management

**Key Libraries:**
- **React Router** — Client-side routing
- **TanStack Query** — Server state management, caching, background refetching
- **Zustand** — Lightweight client state (auth session, UI state)
- **Axios** — HTTP client with interceptors for auth
- **Tailwind CSS** — Utility-first styling (mobile-first)
- **Lucide React** — Icons

**Project Structure:**
```
frontend/
├── public/
│   ├── icons/                 # Fallback item type icons
│   └── manifest.json          # PWA manifest
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios instance with auth
│   │   ├── inventories.ts     # Inventory API calls
│   │   ├── items.ts           # Item CRUD
│   │   ├── currency.ts        # Currency operations
│   │   └── srd.ts             # 5e SRD lookups
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives
│   │   ├── items/             # Item cards, forms, lists
│   │   ├── currency/          # Treasury display, forms
│   │   └── layout/            # Nav, sidebar, mobile shell
│   ├── hooks/
│   │   ├── useInventory.ts    # Inventory data hook
│   │   ├── useSSE.ts          # SSE connection hook
│   │   └── useAuth.ts         # Session management
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Inventory.tsx
│   │   ├── Items.tsx
│   │   ├── ItemDetail.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── stores/
│   │   └── sessionStore.ts    # Zustand store
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── bun.lockb                  # Bun lockfile
└── package.json
```

**Bun Commands:**
```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

**SSE Hook Example:**
```typescript
// hooks/useSSE.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE(slug: string, passphrase: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const eventSource = new EventSource(
      `/api/inventories/${slug}/events?auth=${encodeURIComponent(passphrase)}`
    );
    
    eventSource.addEventListener('item_added', (e) => {
      const item = JSON.parse(e.data);
      queryClient.setQueryData(['items', slug], (old: any[]) => [...(old || []), item]);
    });
    
    eventSource.addEventListener('item_updated', (e) => {
      const { item_id, changes } = JSON.parse(e.data);
      queryClient.setQueryData(['items', slug], (old: any[]) =>
        (old || []).map(item => item.id === item_id ? { ...item, ...changes } : item)
      );
    });
    
    eventSource.addEventListener('item_removed', (e) => {
      const { item_id } = JSON.parse(e.data);
      queryClient.setQueryData(['items', slug], (old: any[]) =>
        (old || []).filter(item => item.id !== item_id)
      );
    });

    eventSource.addEventListener('currency_updated', (e) => {
      const currency = JSON.parse(e.data);
      queryClient.setQueryData(['inventory', slug], (old: any) => ({
        ...old,
        ...currency
      }));
    });
    
    return () => eventSource.close();
  }, [slug, passphrase, queryClient]);
}
```

---

### Backend (Python + FastAPI + UV)

**Package Manager:** UV (extremely fast Python package installer and resolver)

**Project Setup with UV:**
```bash
# Install UV (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project
uv init dnd-inventory-backend
cd dnd-inventory-backend

# Add dependencies
uv add fastapi uvicorn[standard] sqlalchemy pydantic pydantic-settings
uv add python-multipart httpx openai cryptography bcrypt
uv add sse-starlette aiosqlite

# Dev dependencies
uv add --dev pytest pytest-asyncio httpx
```

**pyproject.toml:**
```toml
[project]
name = "dnd-inventory-backend"
version = "0.1.0"
description = "D&D Party Inventory Manager API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-multipart>=0.0.6",
    "httpx>=0.26.0",
    "openai>=1.10.0",
    "cryptography>=42.0.0",
    "bcrypt>=4.1.0",
    "sse-starlette>=2.0.0",
    "aiosqlite>=0.19.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
]
```

**Why UV:**
- 10-100x faster than pip
- Built-in virtual environment management
- Lockfile for reproducible builds (`uv.lock`)
- Compatible with existing Python ecosystem

**Project Structure:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app, CORS, lifespan
│   ├── config.py              # Settings via pydantic-settings
│   ├── database.py            # SQLAlchemy engine, session
│   │
│   ├── models/                # Pydantic models (domain + API)
│   │   ├── __init__.py
│   │   ├── inventory.py       # Inventory Pydantic models
│   │   ├── item.py            # Item Pydantic models
│   │   ├── currency.py        # Currency Pydantic models
│   │   ├── history.py         # History Pydantic models
│   │   └── openai.py          # OpenAI connection models
│   │
│   ├── db/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py            # Base class
│   │   ├── inventory.py
│   │   ├── item.py
│   │   ├── history.py
│   │   └── openai_connection.py
│   │
│   ├── routers/               # API route handlers
│   │   ├── __init__.py
│   │   ├── inventories.py
│   │   ├── items.py
│   │   ├── currency.py
│   │   ├── history.py
│   │   ├── srd.py
│   │   ├── openai_key.py
│   │   └── events.py          # SSE endpoint
│   │
│   ├── services/              # Business logic
│   │   ├── __init__.py
│   │   ├── inventory_service.py
│   │   ├── item_service.py
│   │   ├── history_service.py # Undo/rollback logic
│   │   ├── thumbnail_service.py
│   │   └── srd_service.py
│   │
│   ├── core/
│   │   ├── auth.py            # Passphrase verification
│   │   ├── encryption.py      # API key encryption
│   │   └── events.py          # SSE connection manager
│   │
│   └── data/
│       └── srd_items.json     # 5e SRD item database
│
├── tests/
├── pyproject.toml
├── uv.lock                    # UV lockfile
└── .python-version            # Python version (e.g., 3.12)
```

---

### Pydantic Models

All data validation, serialization, and API schemas use Pydantic v2 models.

**Base Item Models:**
```python
# app/models/item.py
from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
from datetime import datetime

class ItemType(str, Enum):
    equipment = "equipment"
    potion = "potion"
    scroll = "scroll"
    consumable = "consumable"
    misc = "misc"

class Rarity(str, Enum):
    common = "common"
    uncommon = "uncommon"
    rare = "rare"
    very_rare = "very_rare"
    legendary = "legendary"
    artifact = "artifact"

class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: ItemType
    category: Optional[str] = None
    rarity: Optional[Rarity] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    weight: Optional[float] = Field(default=None, ge=0)
    estimated_value: Optional[int] = Field(default=None, ge=0)

class ItemCreate(ItemBase):
    """Request model for creating items"""
    properties: Optional[dict] = None  # Type-specific properties

class ItemUpdate(BaseModel):
    """Request model for updating items (all fields optional)"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    type: Optional[ItemType] = None
    category: Optional[str] = None
    rarity: Optional[Rarity] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=1)
    weight: Optional[float] = Field(default=None, ge=0)
    estimated_value: Optional[int] = Field(default=None, ge=0)
    properties: Optional[dict] = None

class ItemResponse(ItemBase):
    """Response model for items"""
    id: str
    inventory_id: str
    thumbnail_url: Optional[str] = None
    is_standard_item: bool = False
    standard_item_id: Optional[str] = None
    properties: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

**Equipment Properties Model:**
```python
# app/models/equipment.py
from pydantic import BaseModel
from typing import Optional

class SpellGrant(BaseModel):
    spell_name: str
    charges: Optional[int] = None
    recharge: Optional[str] = None
    spell_level: Optional[int] = None
    notes: Optional[str] = None

class SpecialModifier(BaseModel):
    name: str
    description: str
    modifier_type: Optional[str] = None
    value: Optional[str] = None

class EquipmentProperties(BaseModel):
    """Type-specific properties for equipment items"""
    # Armor
    ac_bonus: Optional[int] = None
    ac_base: Optional[int] = None
    armor_type: Optional[str] = None
    stealth_disadvantage: bool = False
    strength_requirement: Optional[int] = None
    
    # Weapon
    damage_dice: Optional[str] = None
    damage_type: Optional[str] = None
    weapon_properties: list[str] = []
    versatile_damage: Optional[str] = None
    range: Optional[str] = None
    
    # Magic
    attunement_required: bool = False
    attunement_requirements: Optional[str] = None
    magical_bonus: Optional[int] = None
    
    # Spells & modifiers
    granted_spells: list[SpellGrant] = []
    special_modifiers: list[SpecialModifier] = []
```

**History Models with Undo Support:**
```python
# app/models/history.py
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from enum import Enum

class HistoryAction(str, Enum):
    item_added = "item_added"
    item_removed = "item_removed"
    item_updated = "item_updated"
    quantity_changed = "quantity_changed"
    currency_changed = "currency_changed"
    rollback = "rollback"
    undo = "undo"

class HistoryEntryBase(BaseModel):
    action: HistoryAction
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    note: Optional[str] = None

class HistoryEntryResponse(HistoryEntryBase):
    id: str
    inventory_id: str
    item_snapshot: Optional[dict] = None
    previous_value: Optional[dict] = None
    new_value: Optional[dict] = None
    is_undone: bool = False
    undone_by: Optional[str] = None
    timestamp: datetime
    
    # Computed field for UI
    can_undo: bool = True

    model_config = {"from_attributes": True}

class UndoRequest(BaseModel):
    """Request to undo a specific history entry"""
    history_entry_id: str

class RollbackRequest(BaseModel):
    """Request to rollback to a specific point in time"""
    target_history_entry_id: str
    confirm: bool = False  # Must be true to execute

class RollbackPreview(BaseModel):
    """Preview of what a rollback will change"""
    target_timestamp: datetime
    changes_to_undo: int
    affected_items: list[str]
    currency_changes: Optional[dict] = None
```

**Config with Pydantic Settings:**
```python
# app/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite+aiosqlite:///./data/dnd_inventory.db"
    
    # Security
    encryption_key: str = Field(..., min_length=32)
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]
    
    # App
    debug: bool = False
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

settings = Settings()
```

**Database Setup (SQLite + SQLAlchemy):**
```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite+aiosqlite:///./dnd_inventory.db"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

**Example Model:**
```python
# app/models/item.py
from sqlalchemy import Column, String, Integer, Float, Boolean, Enum, ForeignKey, Text
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base
import enum

class ItemType(str, enum.Enum):
    equipment = "equipment"
    potion = "potion"
    scroll = "scroll"
    consumable = "consumable"
    misc = "misc"

class Item(Base):
    __tablename__ = "items"
    
    id = Column(String, primary_key=True)
    inventory_id = Column(String, ForeignKey("inventories.id"), nullable=False)
    
    name = Column(String, nullable=False)
    type = Column(Enum(ItemType), nullable=False)
    category = Column(String)
    rarity = Column(String)
    
    description = Column(Text)
    notes = Column(Text)
    
    quantity = Column(Integer, default=1)
    weight = Column(Float)
    estimated_value = Column(Integer)
    
    thumbnail_url = Column(String)
    is_standard_item = Column(Boolean, default=False)
    standard_item_id = Column(String)
    
    # Type-specific fields stored as JSON
    properties = Column(JSON, default=dict)
    
    created_at = Column(String)  # ISO timestamp
    updated_at = Column(String)
```

**SSE Connection Manager:**
```python
# app/core/events.py
from asyncio import Queue
from typing import Dict, Set
from dataclasses import dataclass
import json

@dataclass
class Event:
    event_type: str
    data: dict

class ConnectionManager:
    def __init__(self):
        self._connections: Dict[str, Set[Queue]] = {}
    
    async def connect(self, inventory_slug: str) -> Queue:
        if inventory_slug not in self._connections:
            self._connections[inventory_slug] = set()
        queue = Queue()
        self._connections[inventory_slug].add(queue)
        return queue
    
    def disconnect(self, inventory_slug: str, queue: Queue):
        if inventory_slug in self._connections:
            self._connections[inventory_slug].discard(queue)
    
    async def broadcast(self, inventory_slug: str, event: Event):
        if inventory_slug in self._connections:
            for queue in self._connections[inventory_slug]:
                await queue.put(event)
    
    def get_viewer_count(self, inventory_slug: str) -> int:
        return len(self._connections.get(inventory_slug, set()))

manager = ConnectionManager()
```

**SSE Endpoint:**
```python
# app/routers/events.py
from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse
from app.core.events import manager

router = APIRouter()

@router.get("/inventories/{slug}/events")
async def inventory_events(slug: str):
    queue = await manager.connect(slug)
    
    async def event_generator():
        try:
            # Send initial viewer count
            yield {
                "event": "connection_count",
                "data": json.dumps({"viewers": manager.get_viewer_count(slug)})
            }
            
            while True:
                event = await queue.get()
                yield {
                    "event": event.event_type,
                    "data": json.dumps(event.data)
                }
        finally:
            manager.disconnect(slug, queue)
    
    return EventSourceResponse(event_generator())
```

---

### Database Schema (SQLite)

```sql
-- inventories
CREATE TABLE inventories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    passphrase_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    copper INTEGER DEFAULT 0,
    silver INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    platinum INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- items
CREATE TABLE items (
    id TEXT PRIMARY KEY,
    inventory_id TEXT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- equipment, potion, scroll, consumable, misc
    category TEXT,
    rarity TEXT,
    description TEXT,
    notes TEXT,
    quantity INTEGER DEFAULT 1,
    weight REAL,
    estimated_value INTEGER,
    thumbnail_url TEXT,
    is_standard_item INTEGER DEFAULT 0,
    standard_item_id TEXT,
    properties TEXT,  -- JSON blob for type-specific fields
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- history (with undo support)
CREATE TABLE history (
    id TEXT PRIMARY KEY,
    inventory_id TEXT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    action TEXT NOT NULL,  -- item_added, item_removed, item_updated, quantity_changed, currency_changed, rollback, undo
    item_id TEXT,
    item_name TEXT,
    item_snapshot TEXT,    -- JSON: full item state for restore
    previous_value TEXT,   -- JSON: state before change
    new_value TEXT,        -- JSON: state after change
    is_undone INTEGER DEFAULT 0,
    undone_by TEXT,        -- ID of the undo history entry
    note TEXT,
    timestamp TEXT NOT NULL
);

-- inventory_snapshots (for point-in-time rollback)
CREATE TABLE inventory_snapshots (
    id TEXT PRIMARY KEY,
    inventory_id TEXT NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    items TEXT NOT NULL,           -- JSON array of all items
    currency TEXT NOT NULL,        -- JSON: { copper, silver, gold, platinum }
    history_entry_id TEXT,         -- The history entry this snapshot follows
    created_at TEXT NOT NULL
);

-- openai_connections
CREATE TABLE openai_connections (
    id TEXT PRIMARY KEY,
    inventory_id TEXT UNIQUE NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    api_key_encrypted TEXT NOT NULL,
    connected_at TEXT NOT NULL,
    last_used_at TEXT,
    is_valid INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX idx_items_inventory ON items(inventory_id);
CREATE INDEX idx_items_type ON items(inventory_id, type);
CREATE INDEX idx_history_inventory ON history(inventory_id);
CREATE INDEX idx_history_timestamp ON history(inventory_id, timestamp DESC);
CREATE INDEX idx_history_undone ON history(inventory_id, is_undone);
CREATE INDEX idx_snapshots_inventory ON inventory_snapshots(inventory_id);
CREATE INDEX idx_snapshots_timestamp ON inventory_snapshots(inventory_id, created_at DESC);
```

**SQLite Considerations:**
- Single file database (`dnd_inventory.db`) — easy deployment
- Use `aiosqlite` for async support with FastAPI
- JSON stored as TEXT, parsed in Python
- Enable WAL mode for better concurrent read performance:
  ```python
  # In database.py after engine creation
  @event.listens_for(engine.sync_engine, "connect")
  def set_sqlite_pragma(dbapi_connection, connection_record):
      cursor = dbapi_connection.cursor()
      cursor.execute("PRAGMA journal_mode=WAL")
      cursor.execute("PRAGMA foreign_keys=ON")
      cursor.close()
  ```

---

### Real-Time Infrastructure (SSE)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client A   │────▶│             │◀────│  Client B   │
└─────────────┘     │   FastAPI   │     └─────────────┘
                    │             │
┌─────────────┐     │  ┌───────┐  │     ┌─────────────┐
│  Client C   │────▶│  │ SSE   │  │◀────│  Client D   │
└─────────────┘     │  │Manager│  │     └─────────────┘
                    │  └───────┘  │
                    │      │      │
                    │      ▼      │
                    │  ┌───────┐  │
                    │  │SQLite │  │
                    │  └───────┘  │
                    └─────────────┘
```

**SSE Connection Manager:**
- In-memory dict of `inventory_slug → Set[asyncio.Queue]`
- On mutation: iterate connections, push event to each queue
- Single-instance deployment (SQLite + in-memory SSE)
- For future scaling: add Redis Pub/Sub layer

---

### OpenAI Integration

```
┌─────────────────────────────────────────────────────┐
│                   Inventory Settings                │
│  ┌───────────────────────────────────────────────┐  │
│  │  OpenAI API Key: [sk-••••••••••••••••]  [Test]│  │
│  │  Status: ✓ Connected                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
               ┌─────────────────┐
               │  Encrypt & Store │
               │  (AES-256)       │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐    ┌─────────────┐
               │  Generate       │───▶│  DALL-E 3   │
               │  Request        │    │  API        │
               └─────────────────┘    └─────────────┘
```

**Thumbnail Service:**
```python
# app/services/thumbnail_service.py
from openai import AsyncOpenAI
from app.core.encryption import decrypt_api_key

async def generate_thumbnail(
    api_key_encrypted: str,
    item_name: str,
    item_type: str,
    description: str,
    rarity: str | None = None
) -> str:
    api_key = decrypt_api_key(api_key_encrypted)
    client = AsyncOpenAI(api_key=api_key)
    
    prompt = f"""Fantasy RPG item icon for a {rarity or ''} {item_type}: {item_name}.
{description[:200]}
Style: Digital art, centered item, simple gradient background, game inventory icon."""
    
    response = await client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1
    )
    
    return response.data[0].url
```

---

### Deployment

**Target Environment:**
- Personal Mac OSX server on home network
- Docker for containerization
- Tailscale Funnel for public access (no port forwarding needed)
- Single-user scale (D&D party of ~6 people)

---

**Development:**
```bash
# Backend (with UV)
cd backend
uv sync                    # Install dependencies
uv run uvicorn app.main:app --reload --port 8000

# Frontend (with Bun)
cd frontend
bun install
bun run dev               # Runs on http://localhost:5173
```

---

**Production (Docker + Tailscale Funnel):**

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data          # SQLite database + thumbnails
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - DATABASE_URL=sqlite+aiosqlite:///./data/dnd_inventory.db
      - CORS_ORIGINS=["https://your-funnel-hostname.ts.net"]
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  data:
```

**Backend Dockerfile:**
```dockerfile
FROM python:3.12-slim

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY app ./app

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production image with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Frontend nginx.conf:**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

---

**Tailscale Funnel Setup:**

Tailscale Funnel exposes your local service to the internet without port forwarding or dynamic DNS.

```bash
# 1. Install Tailscale on Mac (if not already)
brew install tailscale

# 2. Start Tailscale and authenticate
sudo tailscaled &
tailscale up

# 3. Enable Funnel for your machine (one-time, in Tailscale admin console)
#    Go to: https://login.tailscale.com/admin/dns
#    Enable HTTPS certificates
#    Enable Funnel in machine settings

# 4. Serve your app via Funnel
tailscale funnel 3000

# Your app is now accessible at:
# https://your-machine-name.tail-scale-name.ts.net
```

**Persistent Funnel (runs on boot):**

Create a shell script `start-inventory.sh`:
```bash
#!/bin/bash

# Start Docker containers
cd /path/to/dnd-inventory
docker-compose up -d

# Start Tailscale Funnel (runs in foreground)
tailscale funnel 3000
```

**Or use Tailscale's serve config (persists across restarts):**
```bash
# Configure persistent funnel
tailscale serve --bg 3000
tailscale funnel 443 on
```

---

**Directory Structure on Server:**
```
~/dnd-inventory/
├── docker-compose.yml
├── .env                    # ENCRYPTION_KEY and other secrets
├── data/
│   ├── dnd_inventory.db    # SQLite database
│   └── thumbnails/         # Generated images (optional local storage)
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── uv.lock
│   └── app/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── bun.lockb
    └── src/
```

---

**Useful Commands:**
```bash
# Start everything
docker-compose up -d && tailscale funnel 3000

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose build && docker-compose up -d

# Backup database
cp data/dnd_inventory.db backups/dnd_inventory_$(date +%Y%m%d).db

# Stop everything
docker-compose down
```

**Environment Variables (.env):**
```bash
# Generate a secure encryption key:
# python -c "import secrets; print(secrets.token_hex(32))"
ENCRYPTION_KEY=your-64-char-hex-key-here

# Optional: customize database location
DATABASE_URL=sqlite+aiosqlite:///./data/dnd_inventory.db

# CORS - your Tailscale Funnel URL
CORS_ORIGINS=["https://your-machine.your-tailnet.ts.net"]
```

---

## API Endpoints

### Inventory
```
POST   /api/inventories              Create new inventory
GET    /api/inventories/{slug}       Get inventory (requires auth)
PATCH  /api/inventories/{slug}       Update inventory details
DELETE /api/inventories/{slug}       Delete inventory
POST   /api/inventories/{slug}/auth  Authenticate with passphrase
```

### Real-Time Events (SSE)
```
GET    /api/inventories/{slug}/events   SSE stream for real-time updates
                                        Headers: Accept: text/event-stream
                                        Query: ?last_event_id={id} (for reconnection)
```

### Currency
```
GET    /api/inventories/{slug}/currency         Get currency totals
POST   /api/inventories/{slug}/currency/add     Add currency
POST   /api/inventories/{slug}/currency/spend   Spend currency
POST   /api/inventories/{slug}/currency/convert Convert between denominations
```

### Items
```
GET    /api/inventories/{slug}/items            List all items (with filters)
POST   /api/inventories/{slug}/items            Add new item
GET    /api/inventories/{slug}/items/{id}       Get item details
PATCH  /api/inventories/{slug}/items/{id}       Update item
DELETE /api/inventories/{slug}/items/{id}       Remove item
POST   /api/inventories/{slug}/items/{id}/thumbnail  Regenerate thumbnail
```

### Standard Items (5e SRD)
```
GET    /api/srd/items?search={query}   Search standard items
GET    /api/srd/items/{id}             Get standard item details
GET    /api/srd/potions                List all standard potions
GET    /api/srd/spells?search={query}  Search spells (for scrolls)
```

### OpenAI API Key
```
POST   /api/inventories/{slug}/openai/key     Save API key (encrypted)
DELETE /api/inventories/{slug}/openai/key     Remove API key  
GET    /api/inventories/{slug}/openai/status  Check if key configured & valid
POST   /api/inventories/{slug}/openai/test    Validate key without storing
```

### Thumbnail Generation
```
POST   /api/inventories/{slug}/items/{id}/thumbnail    Generate/regenerate thumbnail
POST   /api/inventories/{slug}/items/batch-thumbnails  Generate for multiple items
GET    /api/thumbnails/{id}                            Get thumbnail image
```

### History
```
GET    /api/inventories/{slug}/history             Get history log
GET    /api/inventories/{slug}/items/{id}/history  Get item-specific history
POST   /api/inventories/{slug}/history/{id}/undo   Undo a specific history entry
POST   /api/inventories/{slug}/history/rollback    Rollback to a point in time
GET    /api/inventories/{slug}/history/rollback-preview  Preview rollback changes
```

---

## 5e Standard Item Database

### Data Sources
- [Open5e API](https://open5e.com/) - Free, community-maintained
- [5e SRD](https://dnd.wizards.com/resources/systems-reference-document) - Official reference

### Item Categories to Include
- **Weapons:** Simple melee, simple ranged, martial melee, martial ranged
- **Armor:** Light, medium, heavy, shields
- **Adventuring Gear:** All PHB items
- **Tools:** Artisan's tools, gaming sets, instruments, etc.
- **Potions:** All standard potions with effects
- **Scrolls:** Spell scroll rules by level
- **Magic Items:** SRD magic items (limited set)

### Potion Quick Reference
See **Standard Potion Reference** table in the Potion data model section above.

---

## Future Enhancements (Maybe Someday)

Nice-to-have features if you want to expand the app later:

- **Character assignment** — Track who's carrying what item
- **Weight/encumbrance tracking** — Per-character carrying capacity
- **Wishlist/shopping list** — Items the party wants to buy
- **DM mode** — Hidden items only the DM can see
- **D&D Beyond import** — Pull items from existing characters
- **Item identification** — Workflow for unidentified → identified magic items
- **Loot generator** — Random treasure tables integrated
- **Session notes** — Attach notes to inventory changes ("Found in Goblin Cave, Session 12")

---

## Open Questions

1. ~~**Thumbnail generation cost:**~~ ✅ Resolved — Users provide their own OpenAI API key
2. **SRD licensing:** Ensure compliance with WotC's SRD 5.1 license (OGL or CC)
3. ~~**Concurrent editing:**~~ ✅ Resolved — SSE for real-time sync, delta-based quantity updates
4. ~~**Hosting:**~~ ✅ Resolved — Docker on Mac OSX server with Tailscale Funnel
5. **Snapshot retention:** How many snapshots to keep? Current plan: every 10 entries, prune after 30 days
6. **Thumbnail storage:** Store DALL-E URLs directly (expire after time), or download and store locally?
7. **Backup strategy:** Automated SQLite backups? How often? (Simple cron job should suffice)
8. **Mobile PWA:** Worth the effort for a small party, or just responsive web is enough?

---

## Appendix: Sample Item JSON

### Equipment Example (Magic Weapon)
```json
{
  "id": "a1b2c3d4-...",
  "name": "Flame Tongue Longsword",
  "type": "equipment",
  "category": "weapon",
  "rarity": "rare",
  "description": "You can use a bonus action to speak this magic sword's command word, causing flames to erupt from the blade. These flames shed bright light in a 40-foot radius and dim light for an additional 40 feet. While the sword is ablaze, it deals an extra 2d6 fire damage to any target it hits. The flames last until you use a bonus action to speak the command word again or until you drop or sheathe the sword.",
  "notes": "Found in the red dragon's hoard. Command word is 'Infernus'",
  "quantity": 1,
  "weight": 3,
  "estimated_value": 5000,
  "thumbnail_url": "https://storage.example.com/items/flame-tongue.png",
  "is_standard_item": true,
  "standard_item_id": "flame-tongue",
  "damage_dice": "1d8",
  "damage_type": "slashing",
  "weapon_properties": ["versatile"],
  "versatile_damage": "1d10",
  "attunement_required": true,
  "magical_bonus": 0,
  "special_modifiers": [
    {
      "name": "Flame Tongue",
      "description": "While ablaze, deals extra 2d6 fire damage on hit",
      "modifier_type": "damage",
      "value": "2d6 fire"
    }
  ]
}
```

### Potion Example
```json
{
  "id": "e5f6g7h8-...",
  "name": "Potion of Superior Healing",
  "type": "potion",
  "category": "potion",
  "rarity": "rare",
  "potion_type": "healing",
  "description": "You regain 8d4+8 hit points when you drink this potion. The potion's red liquid glimmers when agitated.",
  "notes": "Save for boss fight",
  "quantity": 2,
  "weight": 0.5,
  "estimated_value": 500,
  "thumbnail_url": "https://storage.example.com/items/superior-healing.png",
  "is_standard_item": true,
  "standard_item_id": "potion-of-superior-healing",
  "healing_dice": "8d4+8",
  "effect_description": "Regain 8d4+8 hit points"
}
```

### Scroll Example
```json
{
  "id": "i9j0k1l2-...",
  "name": "Scroll of Fireball",
  "type": "scroll",
  "category": "scroll",
  "rarity": "uncommon",
  "description": "A spell scroll bearing the Fireball spell. If the spell is on your class's spell list, you can read the scroll and cast its spell without providing any material components. Otherwise, the scroll is unintelligible.",
  "notes": "Grabbed from the wizard's study",
  "quantity": 1,
  "weight": 0,
  "estimated_value": 300,
  "thumbnail_url": "https://storage.example.com/items/scroll-fireball.png",
  "is_standard_item": true,
  "standard_item_id": "spell-scroll-3rd",
  "spell_name": "Fireball",
  "spell_level": 3,
  "spell_school": "evocation",
  "spell_save_dc": 15,
  "spell_attack_bonus": 7,
  "casting_time": "1 action",
  "range": "150 feet",
  "duration": "Instantaneous",
  "spell_description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one."
}
```

### Consumable Example (Ammunition)
```json
{
  "id": "m3n4o5p6-...",
  "name": "+1 Arrows",
  "type": "consumable",
  "category": "ammunition",
  "rarity": "uncommon",
  "consumable_type": "ammunition",
  "description": "You have a +1 bonus to attack and damage rolls made with this piece of magic ammunition. Once it hits a target, the ammunition is no longer magical.",
  "notes": "Found in elven ruins",
  "quantity": 18,
  "weight": 0.05,
  "estimated_value": 25,
  "thumbnail_url": "https://storage.example.com/items/magic-arrow.png",
  "is_standard_item": true,
  "standard_item_id": "ammunition-1",
  "ammunition_type": "arrow",
  "magical_bonus": 1
}
```
