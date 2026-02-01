# D&D Party Inventory Manager — Implementation Specification

## Overview

This document defines the implementation order for the D&D Party Inventory Manager. Features are organized into phases that build on each other, with specific user stories sized for single-context completion.

The full product specification lives in `tasks/prd-inventory-manager.md`. This document focuses on **how** and **when** to build each piece.

---

## Implementation Principles

### Story Sizing
Each story should be completable in one Claude Code context (~15-30 minutes). If a story feels too big, split it.

### Dependencies
Stories are ordered to minimize blocking. Backend and frontend can often proceed in parallel once API contracts are defined.

### Quality Gates
Every story must pass quality checks before marking complete:
- **Backend:** `ruff check`, `ruff format --check`
- **Frontend:** `bun run typecheck`, `bun run lint`

### Branch Strategy
Each workstream operates on its own branch, merged via PR:
- `feat/backend-phase-1`
- `feat/frontend-phase-1`
- `feat/srd-data`

---

## Phase 1: Foundation

**Goal:** A working skeleton where you can create an inventory, authenticate, and see an empty dashboard.

### 1.1 Backend Core

These stories establish the Python/FastAPI backend with database connectivity.

#### BE-001: Project Scaffolding
**Priority:** 1 | **Estimate:** 15 min | **Dependencies:** None

Set up the Python backend with FastAPI and UV package management.

**Deliverables:**
- `backend/pyproject.toml` with dependencies:
  - fastapi, uvicorn[standard], sqlalchemy, pydantic, pydantic-settings
  - bcrypt, aiosqlite, python-multipart
  - Dev: ruff, pytest, pytest-asyncio
- `backend/app/__init__.py`
- `backend/app/main.py` with FastAPI app, CORS middleware, `/health` endpoint
- `backend/app/config.py` with Pydantic Settings:
  - `database_url` (default: sqlite+aiosqlite:///./data/dnd_inventory.db)
  - `port` (default: 8000, for dynamic allocation)
  - `cors_origins` (list)

**Acceptance Criteria:**
- [ ] `cd backend && uv sync` succeeds
- [ ] `uv run uvicorn app.main:app --port $PORT` starts server
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `ruff check .` passes

---

#### BE-002: Database Setup
**Priority:** 2 | **Estimate:** 15 min | **Dependencies:** BE-001

Configure async SQLite with SQLAlchemy 2.0.

**Deliverables:**
- `backend/app/database.py`:
  - Async engine factory with configurable URL
  - AsyncSession factory
  - `get_db` dependency for FastAPI
  - Event listener to enable WAL mode and foreign keys
- `backend/app/db/__init__.py`
- `backend/app/db/base.py` with declarative base
- `backend/data/.gitkeep` (database directory)

**Acceptance Criteria:**
- [ ] Database file created on first request
- [ ] WAL mode enabled (check with `PRAGMA journal_mode`)
- [ ] Foreign keys enabled
- [ ] `ruff check .` passes

---

#### BE-003: Inventory Model
**Priority:** 3 | **Estimate:** 15 min | **Dependencies:** BE-002

Create the SQLAlchemy ORM model for party inventories.

**Deliverables:**
- `backend/app/db/inventory.py` with `Inventory` model:
  - `id`: UUID primary key
  - `slug`: String, unique, indexed
  - `passphrase_hash`: String
  - `name`: String
  - `description`: String, nullable
  - `copper`, `silver`, `gold`, `platinum`: Integer, default 0
  - `created_at`, `updated_at`: DateTime

**Acceptance Criteria:**
- [ ] Model imports without error
- [ ] Table created on startup (add to lifespan)
- [ ] `ruff check .` passes

---

#### BE-004: Inventory Schemas
**Priority:** 4 | **Estimate:** 10 min | **Dependencies:** BE-003

Create Pydantic v2 models for API request/response.

**Deliverables:**
- `backend/app/models/__init__.py`
- `backend/app/models/inventory.py`:
  - `InventoryCreate`: name, passphrase, description?, slug?
  - `InventoryResponse`: id, slug, name, description, copper, silver, gold, platinum, created_at, updated_at
  - `InventoryAuth`: passphrase
  - `AuthResponse`: success, message?

**Acceptance Criteria:**
- [ ] All models use Pydantic v2 `model_config`
- [ ] Field validation (name min 1 char, passphrase min 6 chars)
- [ ] `ruff check .` passes

---

#### BE-005: Create Inventory Endpoint
**Priority:** 5 | **Estimate:** 20 min | **Dependencies:** BE-004

Implement the endpoint to create new party inventories.

**Deliverables:**
- `backend/app/routers/__init__.py`
- `backend/app/routers/inventories.py`:
  - `POST /api/inventories` - create inventory
  - Slug generation: lowercase name, replace spaces with hyphens, strip non-alphanumeric
  - If slug exists, append random 4-char suffix
  - Hash passphrase with bcrypt before storing
- Register router in `main.py`

**Acceptance Criteria:**
- [ ] Creates inventory and returns InventoryResponse
- [ ] Slug is URL-safe
- [ ] Duplicate names get unique slugs
- [ ] Passphrase is hashed (not stored plain)
- [ ] `ruff check .` passes

---

#### BE-006: Auth & Get Inventory
**Priority:** 6 | **Estimate:** 20 min | **Dependencies:** BE-005

Implement authentication and inventory retrieval.

**Deliverables:**
- `backend/app/core/__init__.py`
- `backend/app/core/auth.py`:
  - `verify_passphrase(plain, hashed)` function
  - `get_current_inventory` dependency (reads X-Passphrase header)
- Updates to `routers/inventories.py`:
  - `POST /api/inventories/{slug}/auth` - validate passphrase
  - `GET /api/inventories/{slug}` - get inventory (requires auth)

**Acceptance Criteria:**
- [ ] Auth endpoint returns `{"success": true}` or `{"success": false}`
- [ ] Get endpoint returns 401 without valid passphrase
- [ ] Get endpoint returns 404 for unknown slug
- [ ] Get endpoint returns inventory on success
- [ ] `ruff check .` passes

---

### 1.2 Frontend Core

These stories establish the React/Vite frontend with routing and auth flow.

#### FE-001: Project Scaffolding
**Priority:** 1 | **Estimate:** 15 min | **Dependencies:** None

Set up the React frontend with Vite and Bun.

**Deliverables:**
- `frontend/` created with Vite React TypeScript template
- Dependencies installed:
  - react-router-dom, @tanstack/react-query, zustand, axios
  - tailwindcss, postcss, autoprefixer, lucide-react
- `frontend/tailwind.config.js` configured
- `frontend/src/index.css` with Tailwind directives
- `frontend/.env.example`:
  - `VITE_API_URL=http://localhost:8000`
  - `VITE_PORT=5173`
- `frontend/vite.config.ts` reads port from env
- Scripts in package.json: `dev`, `build`, `preview`, `typecheck`, `lint`

**Acceptance Criteria:**
- [ ] `bun install` succeeds
- [ ] `bun run dev` starts on configured port
- [ ] Tailwind styles apply
- [ ] `bun run typecheck` passes

---

#### FE-002: Layout & Routing
**Priority:** 2 | **Estimate:** 15 min | **Dependencies:** FE-001

Create the app shell and route structure.

**Deliverables:**
- `frontend/src/components/layout/AppLayout.tsx`:
  - Header with app title and optional nav
  - Main content area
  - Mobile-responsive
- `frontend/src/pages/Home.tsx` (placeholder)
- `frontend/src/pages/Inventory.tsx` (placeholder)
- `frontend/src/pages/NotFound.tsx`
- Routes in `App.tsx`:
  - `/` → Home
  - `/:slug` → Inventory
  - `*` → NotFound

**Acceptance Criteria:**
- [ ] All routes render correct page
- [ ] Layout wraps all pages
- [ ] Mobile-responsive header
- [ ] `bun run typecheck` passes

---

#### FE-003: API Client
**Priority:** 3 | **Estimate:** 15 min | **Dependencies:** FE-002

Configure Axios and TanStack Query.

**Deliverables:**
- `frontend/src/api/client.ts`:
  - Axios instance with baseURL from env
  - Request interceptor adds X-Passphrase from auth store
  - Response interceptor handles 401 (clear session, redirect)
- `frontend/src/api/types.ts` - shared API types
- `frontend/src/main.tsx` wraps App in QueryClientProvider

**Acceptance Criteria:**
- [ ] API client configured
- [ ] Query provider wraps app
- [ ] Types match backend schemas
- [ ] `bun run typecheck` passes

---

#### FE-004: Auth Store
**Priority:** 4 | **Estimate:** 15 min | **Dependencies:** FE-003

Create client-side session management.

**Deliverables:**
- `frontend/src/stores/authStore.ts`:
  - State: `sessions: Record<slug, passphrase>`
  - Actions: `setSession`, `clearSession`, `getPassphrase`, `hasSession`
  - Persist to localStorage
- `frontend/src/hooks/useAuth.ts`:
  - Convenient hook wrapping store
  - `isAuthenticated(slug)` helper

**Acceptance Criteria:**
- [ ] Sessions persist across page reload
- [ ] Multiple inventories can be remembered
- [ ] `bun run typecheck` passes

---

#### FE-005: Home Page - Create Inventory
**Priority:** 5 | **Estimate:** 25 min | **Dependencies:** FE-004

Build the landing page with inventory creation.

**Deliverables:**
- `frontend/src/pages/Home.tsx`:
  - Hero section with title and description
  - "Create New Inventory" form:
    - Party name (required)
    - Passphrase (required, min 6 chars)
    - Confirm passphrase
    - Description (optional)
  - Form validation with error messages
  - Submit calls API
  - On success: save session, navigate to `/:slug`
- `frontend/src/api/inventories.ts`:
  - `createInventory` mutation

**Acceptance Criteria:**
- [ ] Form validates inputs
- [ ] Passwords must match
- [ ] Error states display
- [ ] Success redirects to inventory
- [ ] Mobile-friendly layout
- [ ] `bun run typecheck` passes

---

#### FE-006: Home Page - Access Inventory
**Priority:** 6 | **Estimate:** 20 min | **Dependencies:** FE-005

Add existing inventory access to home page.

**Deliverables:**
- Updates to `frontend/src/pages/Home.tsx`:
  - "Access Existing Inventory" section
  - Slug input
  - Passphrase input (with show/hide toggle)
  - Submit validates via API
  - On success: save session, navigate to `/:slug`
  - On failure: show error
- `frontend/src/api/inventories.ts`:
  - `authenticateInventory` mutation
- If user navigates to `/:slug` with existing session, skip to inventory

**Acceptance Criteria:**
- [ ] Can access inventory by slug + passphrase
- [ ] Shows error on invalid passphrase
- [ ] Saved sessions allow direct access
- [ ] Mobile-friendly
- [ ] `bun run typecheck` passes

---

### 1.3 SRD Data

Parallel workstream to gather 5e item data.

#### SRD-001: Weapons Database
**Priority:** 1 | **Estimate:** 20 min | **Dependencies:** None

Compile all SRD weapons into structured JSON.

**Deliverables:**
- `backend/app/data/weapons.json`:
  - All simple melee weapons
  - All simple ranged weapons
  - All martial melee weapons
  - All martial ranged weapons
- Each weapon includes: id, name, category, damage_dice, damage_type, weight, value_gp, properties[]

**Acceptance Criteria:**
- [ ] JSON is valid
- [ ] All SRD weapons included
- [ ] Consistent property naming

---

#### SRD-002: Armor Database
**Priority:** 2 | **Estimate:** 15 min | **Dependencies:** None

Compile all SRD armor into structured JSON.

**Deliverables:**
- `backend/app/data/armor.json`:
  - Light armor (padded, leather, studded leather)
  - Medium armor (hide, chain shirt, scale mail, breastplate, half plate)
  - Heavy armor (ring mail, chain mail, splint, plate)
  - Shields
- Each armor includes: id, name, armor_type, ac_base, ac_bonus, stealth_disadvantage, strength_req, weight, value_gp

**Acceptance Criteria:**
- [ ] JSON is valid
- [ ] All SRD armor included

---

#### SRD-003: Potions Database
**Priority:** 3 | **Estimate:** 15 min | **Dependencies:** None

Compile standard potions.

**Deliverables:**
- `backend/app/data/potions.json`:
  - All healing potions with dice
  - Buff potions (flying, speed, giant strength, etc.)
  - Utility potions (invisibility, water breathing, etc.)
- Each potion includes: id, name, rarity, effect, healing_dice?, duration?, value_gp

**Acceptance Criteria:**
- [ ] JSON is valid
- [ ] Values match DMG

---

#### SRD-004: Adventuring Gear
**Priority:** 4 | **Estimate:** 20 min | **Dependencies:** None

Common adventuring equipment.

**Deliverables:**
- `backend/app/data/gear.json`:
  - Packs (explorer's, dungeoneer's, etc.)
  - Individual items (rope, torch, rations, etc.)
  - Tools and kits
- Each item includes: id, name, category, description, weight, value_gp

**Acceptance Criteria:**
- [ ] JSON is valid
- [ ] Common items included

---

#### SRD-005: Combined Index
**Priority:** 5 | **Estimate:** 10 min | **Dependencies:** SRD-001, SRD-002, SRD-003, SRD-004

Create searchable index.

**Deliverables:**
- `backend/app/data/srd_index.json`:
  - Merged list of all items
  - Each entry: id, name, type, category, source_file
  - Sorted alphabetically
  - Total count

**Acceptance Criteria:**
- [ ] References all items from other files
- [ ] Can be used for autocomplete

---

## Phase 2: Items Management

**Goal:** Full CRUD for inventory items with SRD integration.

### 2.1 Backend

#### BE-007: Item ORM Model
**Priority:** 1 | **Estimate:** 25 min | **Dependencies:** BE-003

Create the SQLAlchemy ORM model for inventory items with flexible properties storage.

**Deliverables:**
- `backend/app/db/item.py` with `Item` model:
  - `id`: UUID primary key
  - `inventory_id`: UUID foreign key to Inventory
  - `name`: String, required
  - `type`: Enum ('equipment', 'potion', 'scroll', 'consumable', 'misc')
  - `category`: String (e.g., 'weapon', 'armor', 'wondrous')
  - `rarity`: Enum ('common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact')
  - `description`: Text
  - `notes`: Text, nullable (user notes)
  - `quantity`: Integer, default 1
  - `weight`: Decimal, nullable
  - `estimated_value`: Integer, nullable (in GP)
  - `thumbnail_url`: String, nullable
  - `is_standard_item`: Boolean, default false
  - `standard_item_id`: String, nullable (SRD reference)
  - `properties`: JSON field for type-specific data (damage_dice, ac_bonus, healing_dice, etc.)
  - `created_at`, `updated_at`: DateTime
- Add relationship to Inventory model
- Update table creation in lifespan

**Acceptance Criteria:**
- [ ] Model imports without error
- [ ] Foreign key relationship works
- [ ] JSON properties field accepts arbitrary dict
- [ ] `ruff check .` passes

---

#### BE-008: Item Pydantic Schemas
**Priority:** 2 | **Estimate:** 20 min | **Dependencies:** BE-007

Create Pydantic v2 models for item API request/response.

**Deliverables:**
- `backend/app/models/item.py`:
  - `ItemType` enum
  - `ItemRarity` enum
  - `ItemBase`: shared fields (name, type, category, rarity, description, quantity, weight, estimated_value)
  - `ItemCreate`: ItemBase + notes, properties dict
  - `ItemUpdate`: all fields optional
  - `ItemResponse`: full item with id, timestamps, thumbnail_url, etc.
  - `ItemListResponse`: list of items with count
- Type-specific property schemas (optional, for validation):
  - `WeaponProperties`: damage_dice, damage_type, weapon_properties[], range
  - `ArmorProperties`: ac_base, ac_bonus, armor_type, stealth_disadvantage
  - `PotionProperties`: healing_dice, effect_description, duration

**Acceptance Criteria:**
- [ ] All models use Pydantic v2 `model_config`
- [ ] Enums serialize to strings
- [ ] Properties dict accepts flexible structure
- [ ] `ruff check .` passes

---

#### BE-009: Create Item Endpoint
**Priority:** 3 | **Estimate:** 20 min | **Dependencies:** BE-008

Implement endpoint to add items to an inventory.

**Deliverables:**
- `backend/app/routers/items.py`:
  - `POST /api/inventories/{slug}/items` - create item
  - Requires auth (X-Passphrase header)
  - Validates item data
  - Returns ItemResponse
- Register router in `main.py`

**Acceptance Criteria:**
- [ ] Creates item linked to inventory
- [ ] Returns 401 without valid passphrase
- [ ] Returns 404 for unknown inventory
- [ ] Returns 422 for invalid data
- [ ] Returns created item with ID
- [ ] `ruff check .` passes

---

#### BE-010: List Items Endpoint
**Priority:** 4 | **Estimate:** 20 min | **Dependencies:** BE-009

Implement endpoint to list and filter inventory items.

**Deliverables:**
- Updates to `backend/app/routers/items.py`:
  - `GET /api/inventories/{slug}/items` - list items
  - Query params: `type`, `category`, `rarity`, `search` (name contains)
  - Requires auth
  - Returns ItemListResponse with count
- Pagination support: `limit`, `offset` params

**Acceptance Criteria:**
- [ ] Returns all items for inventory
- [ ] Filters work correctly (type, category, rarity)
- [ ] Search matches partial name (case-insensitive)
- [ ] Pagination works
- [ ] Returns 401 without auth
- [ ] `ruff check .` passes

---

#### BE-011: Get/Update/Delete Item Endpoints
**Priority:** 5 | **Estimate:** 25 min | **Dependencies:** BE-010

Implement remaining CRUD operations for items.

**Deliverables:**
- Updates to `backend/app/routers/items.py`:
  - `GET /api/inventories/{slug}/items/{item_id}` - get single item
  - `PATCH /api/inventories/{slug}/items/{item_id}` - update item
  - `DELETE /api/inventories/{slug}/items/{item_id}` - delete item
- All require auth
- Update returns modified item
- Delete returns 204

**Acceptance Criteria:**
- [ ] Get returns single item by ID
- [ ] Update modifies only provided fields
- [ ] Delete removes item
- [ ] All return 404 for unknown item
- [ ] All return 401 without auth
- [ ] `ruff check .` passes

---

#### BE-012: SRD Search Endpoint
**Priority:** 6 | **Estimate:** 20 min | **Dependencies:** SRD-005

Implement endpoint to search SRD item database for autocomplete.

**Deliverables:**
- `backend/app/services/srd.py`:
  - Load SRD index on startup (cache in memory)
  - `search_srd(query, type?, category?, limit=10)` function
  - Returns matching items with full data from source files
- `backend/app/routers/srd.py`:
  - `GET /api/srd/search?q=<query>&type=<type>&limit=<n>`
  - No auth required (SRD is public data)
  - Returns list of SRD items

**Acceptance Criteria:**
- [ ] Search returns matching items
- [ ] Can filter by type
- [ ] Results include full item data
- [ ] Case-insensitive matching
- [ ] Returns empty list for no matches
- [ ] `ruff check .` passes

---

### 2.2 Frontend

#### FE-007: Inventory Dashboard Page
**Priority:** 1 | **Estimate:** 25 min | **Dependencies:** FE-006

Build the main inventory view that users see after authenticating.

**Deliverables:**
- `frontend/src/pages/Inventory.tsx`:
  - Fetch inventory data on mount
  - Display party name and description
  - Show currency summary (CP, SP, GP, PP)
  - Placeholder for items list
  - Loading and error states
- `frontend/src/api/inventories.ts`:
  - `useInventory(slug)` query hook
- Handle 401 (redirect to home with error)

**Acceptance Criteria:**
- [ ] Displays inventory info
- [ ] Shows currency totals
- [ ] Loading spinner while fetching
- [ ] Error state for failed fetch
- [ ] Redirects on auth failure
- [ ] Mobile-friendly layout
- [ ] `bun run typecheck` passes

---

#### FE-008: Items List with Category Tabs
**Priority:** 2 | **Estimate:** 30 min | **Dependencies:** FE-007

Display inventory items organized by category.

**Deliverables:**
- `frontend/src/components/items/ItemsList.tsx`:
  - Tab bar for categories: All, Equipment, Potions, Scrolls, Consumables, Misc
  - Fetches items with category filter
  - Search input for filtering by name
  - Empty state when no items
  - Grid/list layout toggle (optional)
- `frontend/src/api/items.ts`:
  - `useItems(slug, filters)` query hook
- Integration in Inventory page

**Acceptance Criteria:**
- [ ] Tabs filter by item type
- [ ] Search filters by name
- [ ] Shows item count per category
- [ ] Empty state for new inventories
- [ ] Mobile: tabs scroll horizontally
- [ ] `bun run typecheck` passes

---

#### FE-009: Item Card Component
**Priority:** 3 | **Estimate:** 25 min | **Dependencies:** FE-008

Create reusable card component for displaying items.

**Deliverables:**
- `frontend/src/components/items/ItemCard.tsx`:
  - Thumbnail placeholder (or AI image if available)
  - Item name and type icon
  - Rarity indicator (color-coded border/badge)
  - Quantity badge
  - Key stats preview (damage for weapons, AC for armor, healing for potions)
  - Click to expand/view details
- Rarity color scheme:
  - Common: gray
  - Uncommon: green
  - Rare: blue
  - Very Rare: purple
  - Legendary: orange
  - Artifact: red

**Acceptance Criteria:**
- [ ] Displays all item types correctly
- [ ] Rarity colors match D&D convention
- [ ] Quantity shows when > 1
- [ ] Clickable (triggers callback)
- [ ] Responsive sizing
- [ ] `bun run typecheck` passes

---

#### FE-010: Add Item Modal with SRD Search
**Priority:** 4 | **Estimate:** 35 min | **Dependencies:** FE-009

Modal for adding new items with SRD autocomplete.

**Deliverables:**
- `frontend/src/components/items/AddItemModal.tsx`:
  - Modal overlay with form
  - Name input with SRD autocomplete dropdown
  - When SRD item selected: auto-populate all fields
  - Manual entry mode for custom items
  - Type/category/rarity selects
  - Quantity input
  - Description textarea
  - Properties section (dynamic based on type)
  - Submit creates item
- `frontend/src/api/srd.ts`:
  - `useSrdSearch(query)` query hook with debounce
- `frontend/src/api/items.ts`:
  - `useCreateItem(slug)` mutation

**Acceptance Criteria:**
- [ ] SRD search shows suggestions as you type
- [ ] Selecting SRD item fills form
- [ ] Can override SRD values
- [ ] Can create fully custom item
- [ ] Form validates required fields
- [ ] Success closes modal and refreshes list
- [ ] `bun run typecheck` passes

---

#### FE-011: Item Detail View
**Priority:** 5 | **Estimate:** 25 min | **Dependencies:** FE-010

Expanded view showing full item details.

**Deliverables:**
- `frontend/src/components/items/ItemDetail.tsx`:
  - Slide-over panel or full modal
  - Large thumbnail
  - Full item name with rarity badge
  - All properties displayed in organized sections
  - User notes section
  - "Edit" button
  - "Delete" button with confirmation
- Equipment-specific: damage, AC, properties, attunement
- Potion-specific: healing dice, duration, effects
- Scroll-specific: spell name, level, school, description

**Acceptance Criteria:**
- [ ] Shows all item data
- [ ] Type-specific sections render correctly
- [ ] Edit button opens edit mode
- [ ] Delete shows confirmation
- [ ] Can close/dismiss
- [ ] `bun run typecheck` passes

---

#### FE-012: Edit/Delete Item
**Priority:** 6 | **Estimate:** 25 min | **Dependencies:** FE-011

Enable editing and deleting items.

**Deliverables:**
- `frontend/src/components/items/EditItemModal.tsx`:
  - Pre-populated form from existing item
  - Same fields as AddItemModal
  - Save updates item
  - Cancel discards changes
- Delete confirmation dialog:
  - "Are you sure?" with item name
  - Confirm deletes and closes detail view
- `frontend/src/api/items.ts`:
  - `useUpdateItem(slug, itemId)` mutation
  - `useDeleteItem(slug, itemId)` mutation
- Optimistic updates for smooth UX

**Acceptance Criteria:**
- [ ] Edit form pre-fills current values
- [ ] Save persists changes
- [ ] Delete removes item after confirmation
- [ ] List updates immediately (optimistic)
- [ ] Errors show toast/message
- [ ] `bun run typecheck` passes

---

## Phase 3: Currency & History

**Goal:** Manage treasury and track all changes with undo capability.

### 3.1 Backend

#### BE-013: Currency Update Endpoint
**Priority:** 1 | **Estimate:** 20 min | **Dependencies:** BE-006

Endpoint to add or subtract currency from the treasury.

**Deliverables:**
- `backend/app/routers/currency.py`
- POST `/api/inventories/{slug}/currency`
- Request: `{ copper?: int, silver?: int, gold?: int, platinum?: int, note?: string }`
- Positive values add, negative values subtract
- Validates sufficient funds for subtractions

**Acceptance Criteria:**
- [ ] Can add currency (positive values)
- [ ] Can subtract currency (negative values)
- [ ] Returns 400 if insufficient funds
- [ ] Returns updated totals
- [ ] Requires X-Passphrase auth
- [ ] `ruff check .` passes

---

#### BE-014: Currency Conversion Endpoint
**Priority:** 2 | **Estimate:** 15 min | **Dependencies:** BE-013

Endpoint to convert currency between denominations.

**Deliverables:**
- POST `/api/inventories/{slug}/currency/convert`
- Request: `{ from: denomination, to: denomination, amount: int }`
- Rates: 10 CP = 1 SP, 10 SP = 1 GP, 10 GP = 1 PP

**Acceptance Criteria:**
- [ ] Converts between any denominations
- [ ] Validates sufficient funds
- [ ] Returns updated totals
- [ ] `ruff check .` passes

---

#### BE-015: HistoryEntry SQLModel
**Priority:** 3 | **Estimate:** 20 min | **Dependencies:** None

Model to track all inventory changes for undo/rollback.

**Deliverables:**
- `backend/app/models/history.py` with HistoryEntry SQLModel
- Fields: id, inventory_id, action (enum), item_id, item_name, item_snapshot (JSON)
- Fields: previous_value (JSON), new_value (JSON), note, timestamp
- Fields: is_undone, undone_by
- HistoryEntryRead schema for API

**Acceptance Criteria:**
- [ ] Model with all fields defined
- [ ] Action enum covers all change types
- [ ] JSON fields for flexible storage
- [ ] `ruff check .` passes

---

#### BE-016: History Logging Service
**Priority:** 4 | **Estimate:** 25 min | **Dependencies:** BE-015

Service to log all inventory changes automatically.

**Deliverables:**
- `backend/app/services/history.py`
- Functions: log_item_added, log_item_removed, log_item_updated
- Functions: log_quantity_changed, log_currency_changed
- Integrate with item and currency endpoints

**Acceptance Criteria:**
- [ ] All item changes logged
- [ ] Currency changes logged
- [ ] Stores enough data to reverse actions
- [ ] `ruff check .` passes

---

#### BE-017: History List Endpoint
**Priority:** 5 | **Estimate:** 15 min | **Dependencies:** BE-016

Endpoint to retrieve inventory history.

**Deliverables:**
- `backend/app/routers/history.py`
- GET `/api/inventories/{slug}/history`
- Query params: action, limit, offset, item_id
- Returns newest first

**Acceptance Criteria:**
- [ ] Returns paginated history
- [ ] Filters work correctly
- [ ] Requires auth
- [ ] `ruff check .` passes

---

#### BE-018: Undo Action Endpoint
**Priority:** 6 | **Estimate:** 25 min | **Dependencies:** BE-017

Endpoint to undo a specific history entry.

**Deliverables:**
- POST `/api/inventories/{slug}/history/{entry_id}/undo`
- Reverses action based on stored data
- Creates new "undo" history entry
- Marks original as is_undone=true

**Acceptance Criteria:**
- [ ] Can undo item_added (removes item)
- [ ] Can undo item_removed (restores item)
- [ ] Can undo currency changes
- [ ] Creates audit trail
- [ ] `ruff check .` passes

---

### 3.2 Frontend

#### FE-013: Treasury Widget
**Priority:** 1 | **Estimate:** 20 min | **Dependencies:** FE-007

Component to display party currency.

**Deliverables:**
- `frontend/src/components/currency/TreasuryWidget.tsx`
- Shows all 4 denominations with icons
- Total GP equivalent
- Compact/expanded modes

**Acceptance Criteria:**
- [ ] Displays all denominations
- [ ] Shows total value
- [ ] Mobile-responsive (2×2 grid)
- [ ] `bun run typecheck` passes

---

#### FE-014: Add/Spend Currency Modal
**Priority:** 2 | **Estimate:** 25 min | **Dependencies:** FE-013

Modal for adding or spending currency.

**Deliverables:**
- `frontend/src/components/currency/CurrencyModal.tsx`
- Mode toggle: Add/Spend
- Input for each denomination
- Optional note field
- Preview of new totals

**Acceptance Criteria:**
- [ ] Can add funds
- [ ] Can spend funds
- [ ] Validates sufficient funds
- [ ] Shows preview before confirming
- [ ] `bun run typecheck` passes

---

#### FE-015: Currency Conversion Modal
**Priority:** 3 | **Estimate:** 20 min | **Dependencies:** FE-014

Modal for converting between denominations.

**Deliverables:**
- `frontend/src/components/currency/ConvertModal.tsx`
- From/To dropdowns
- Amount input
- Conversion preview

**Acceptance Criteria:**
- [ ] Shows conversion preview
- [ ] Validates sufficient funds
- [ ] `bun run typecheck` passes

---

#### FE-016: History Page
**Priority:** 4 | **Estimate:** 30 min | **Dependencies:** None

Page showing full inventory history.

**Deliverables:**
- `frontend/src/pages/History.tsx`
- Route: `/{slug}/history`
- List of history entries
- Filter by action type
- Search by item name

**Acceptance Criteria:**
- [ ] Shows all history entries
- [ ] Filters work
- [ ] Pagination or infinite scroll
- [ ] Added to navigation
- [ ] `bun run typecheck` passes

---

#### FE-017: History Entry Component
**Priority:** 5 | **Estimate:** 20 min | **Dependencies:** FE-016

Component for individual history entries.

**Deliverables:**
- `frontend/src/components/history/HistoryEntry.tsx`
- Action icon
- Formatted timestamp
- Change description
- Undo button

**Acceptance Criteria:**
- [ ] Clear visual per action type
- [ ] Relative timestamps
- [ ] Shows item thumbnail if available
- [ ] `bun run typecheck` passes

---

#### FE-018: Undo Functionality
**Priority:** 6 | **Estimate:** 20 min | **Dependencies:** FE-017

Enable undoing changes from history.

**Deliverables:**
- useUndoAction mutation hook
- Confirmation dialog
- Success/error feedback

**Acceptance Criteria:**
- [ ] Undo button works
- [ ] Confirmation before undo
- [ ] Undone entries show badge
- [ ] Data refreshes after undo
- [ ] `bun run typecheck` passes

---

## Phase 4: Real-time Sync

**Goal:** SSE-based live updates for multi-user sessions.

### 4.1 Backend

#### BE-019: SSE Connection Manager
**Priority:** 1 | **Estimate:** 25 min | **Dependencies:** None

Infrastructure for managing SSE connections per inventory.

**Deliverables:**
- `backend/app/core/sse.py`
- ConnectionManager class
- Methods: connect, disconnect, broadcast
- Heartbeat mechanism (30s)

**Acceptance Criteria:**
- [ ] Manages connections per inventory
- [ ] Thread-safe
- [ ] Sends heartbeats
- [ ] `ruff check .` passes

---

#### BE-020: SSE Events Endpoint
**Priority:** 2 | **Estimate:** 20 min | **Dependencies:** BE-019

Endpoint for clients to connect to event stream.

**Deliverables:**
- Add sse-starlette dependency
- GET `/api/inventories/{slug}/events`
- X-Passphrase auth
- Last-Event-ID support

**Acceptance Criteria:**
- [ ] Returns EventSourceResponse
- [ ] Authenticates with passphrase
- [ ] Reconnection support
- [ ] `ruff check .` passes

---

#### BE-021: Broadcast Item Changes
**Priority:** 3 | **Estimate:** 20 min | **Dependencies:** BE-020

Broadcast events when items change.

**Deliverables:**
- Update item router to broadcast
- Events: item_added, item_updated, item_removed
- Include event_id and timestamp

**Acceptance Criteria:**
- [ ] Broadcasts on create
- [ ] Broadcasts on update
- [ ] Broadcasts on delete
- [ ] `ruff check .` passes

---

#### BE-022: Broadcast Currency Changes
**Priority:** 4 | **Estimate:** 10 min | **Dependencies:** BE-021

Broadcast events when currency changes.

**Deliverables:**
- Update currency router to broadcast
- Event: currency_updated

**Acceptance Criteria:**
- [ ] Broadcasts on currency change
- [ ] `ruff check .` passes

---

#### BE-023: Connection Count Broadcast
**Priority:** 5 | **Estimate:** 10 min | **Dependencies:** BE-022

Show how many users are viewing the inventory.

**Deliverables:**
- Broadcast connection_count on connect/disconnect
- Payload: { viewers: number }

**Acceptance Criteria:**
- [ ] Count updates on connect
- [ ] Count updates on disconnect
- [ ] `ruff check .` passes

---

### 4.2 Frontend

#### FE-019: useSSE Hook
**Priority:** 1 | **Estimate:** 25 min | **Dependencies:** None

Hook to manage SSE connections.

**Deliverables:**
- `frontend/src/hooks/useSSE.ts`
- Opens EventSource connection
- Reconnection with exponential backoff
- Cleanup on unmount

**Acceptance Criteria:**
- [ ] Connects to SSE endpoint
- [ ] Reconnects on disconnect
- [ ] Returns connection status
- [ ] `bun run typecheck` passes

---

#### FE-020: Real-time Item Updates
**Priority:** 2 | **Estimate:** 20 min | **Dependencies:** FE-019

Update item list in real-time.

**Deliverables:**
- Listen for item events in useSSE
- Update TanStack Query cache

**Acceptance Criteria:**
- [ ] Adds new items to list
- [ ] Updates changed items
- [ ] Removes deleted items
- [ ] `bun run typecheck` passes

---

#### FE-021: Real-time Currency Updates
**Priority:** 3 | **Estimate:** 15 min | **Dependencies:** FE-020

Update currency display in real-time.

**Deliverables:**
- Listen for currency_updated events
- Update inventory cache

**Acceptance Criteria:**
- [ ] Treasury widget updates
- [ ] No page refresh needed
- [ ] `bun run typecheck` passes

---

#### FE-022: Viewer Count Display
**Priority:** 4 | **Estimate:** 15 min | **Dependencies:** FE-021

Show how many party members are viewing.

**Deliverables:**
- `frontend/src/components/ViewerCount.tsx`
- Shows viewer count
- Updates on connection_count events

**Acceptance Criteria:**
- [ ] Shows count when > 1
- [ ] Updates in real-time
- [ ] `bun run typecheck` passes

---

#### FE-023: Change Notifications
**Priority:** 5 | **Estimate:** 20 min | **Dependencies:** FE-022

Toast notifications for changes by others.

**Deliverables:**
- Toast on item changes
- Brief highlight on changed items
- Option to mute

**Acceptance Criteria:**
- [ ] Shows toast for changes
- [ ] Highlights changed items
- [ ] Can mute notifications
- [ ] `bun run typecheck` passes

---

#### FE-024: Connection Status Indicator
**Priority:** 6 | **Estimate:** 15 min | **Dependencies:** FE-023

Show SSE connection status.

**Deliverables:**
- Connection status indicator (dot)
- Colors: green=connected, yellow=connecting, red=disconnected
- Tooltip with details

**Acceptance Criteria:**
- [ ] Shows current status
- [ ] Auto-reconnect indicator
- [ ] `bun run typecheck` passes

---

## Phase 5: AI Thumbnails

**Goal:** DALL-E integration for item icons.

### 5.1 Backend

#### BE-024: OpenAI Connection Model
**Priority:** 1 | **Estimate:** 20 min | **Dependencies:** None

Store encrypted OpenAI API keys per inventory.

**Deliverables:**
- `backend/app/models/openai.py`
- OpenAIConnection SQLModel
- AES-256 encryption for API key
- Never expose decrypted key in API

**Acceptance Criteria:**
- [ ] Model stores encrypted key
- [ ] Can decrypt for use
- [ ] Never exposed in responses
- [ ] `ruff check .` passes

---

#### BE-025: OpenAI Connection Endpoints
**Priority:** 2 | **Estimate:** 25 min | **Dependencies:** BE-024

Endpoints to manage OpenAI connection.

**Deliverables:**
- `backend/app/routers/openai.py`
- POST `/connect` - store key
- POST `/test` - validate key
- DELETE - remove connection
- GET `/status` - check if connected

**Acceptance Criteria:**
- [ ] Can connect API key
- [ ] Can test before saving
- [ ] Can disconnect
- [ ] Status endpoint works
- [ ] `ruff check .` passes

---

#### BE-026: Thumbnail Generation Service
**Priority:** 3 | **Estimate:** 25 min | **Dependencies:** BE-025

Service to generate thumbnails via DALL-E.

**Deliverables:**
- `backend/app/services/thumbnails.py`
- generate_thumbnail(item, api_key) function
- Build prompt from item details
- Call DALL-E 3 API

**Acceptance Criteria:**
- [ ] Generates prompt from item
- [ ] Calls DALL-E API
- [ ] Returns image URL
- [ ] Handles errors gracefully
- [ ] `ruff check .` passes

---

#### BE-027: Thumbnail Generation Endpoint
**Priority:** 4 | **Estimate:** 20 min | **Dependencies:** BE-026

Endpoint to generate/regenerate thumbnails.

**Deliverables:**
- POST `/api/inventories/{slug}/items/{item_id}/thumbnail`
- Uses inventory's OpenAI connection
- Stores thumbnail_url on item

**Acceptance Criteria:**
- [ ] Generates thumbnail
- [ ] Updates item
- [ ] Returns 400 if no API key
- [ ] `ruff check .` passes

---

#### BE-028: Auto-generate on Item Creation
**Priority:** 5 | **Estimate:** 20 min | **Dependencies:** BE-027

Automatically generate thumbnails for new items.

**Deliverables:**
- Update item create endpoint
- Trigger generation if OpenAI connected
- Don't block creation on generation

**Acceptance Criteria:**
- [ ] Generates in background
- [ ] Updates item when ready
- [ ] Works without blocking
- [ ] `ruff check .` passes

---

### 5.2 Frontend

#### FE-025: Settings Page
**Priority:** 1 | **Estimate:** 20 min | **Dependencies:** None

Settings page for inventory configuration.

**Deliverables:**
- `frontend/src/pages/Settings.tsx`
- Route: `/{slug}/settings`
- Sections: General, OpenAI, Danger Zone
- Add to navigation

**Acceptance Criteria:**
- [ ] Settings page renders
- [ ] Added to nav
- [ ] Mobile-friendly
- [ ] `bun run typecheck` passes

---

#### FE-026: OpenAI Connection UI
**Priority:** 2 | **Estimate:** 25 min | **Dependencies:** FE-025

UI to connect OpenAI API key.

**Deliverables:**
- `frontend/src/components/settings/OpenAIConnection.tsx`
- Connection status display
- Form to enter API key
- Test and save buttons
- Disconnect option

**Acceptance Criteria:**
- [ ] Can connect API key
- [ ] Can test before saving
- [ ] Can disconnect
- [ ] Never displays key after saving
- [ ] `bun run typecheck` passes

---

#### FE-027: Thumbnail Display in Item Cards
**Priority:** 3 | **Estimate:** 15 min | **Dependencies:** FE-009

Show AI thumbnails on item cards.

**Deliverables:**
- Update ItemCard to show thumbnail_url
- Fallback to placeholder icon
- Loading state while generating

**Acceptance Criteria:**
- [ ] Shows thumbnail if available
- [ ] Shows placeholder if not
- [ ] Loading state works
- [ ] `bun run typecheck` passes

---

#### FE-028: Generate/Regenerate Button
**Priority:** 4 | **Estimate:** 20 min | **Dependencies:** FE-027

Button to generate or regenerate thumbnails.

**Deliverables:**
- Add button to item detail view
- Shows "Generate" or "Regenerate"
- Disabled if no OpenAI connection
- Loading spinner while generating

**Acceptance Criteria:**
- [ ] Button generates thumbnail
- [ ] Shows appropriate label
- [ ] Disabled state with tooltip
- [ ] `bun run typecheck` passes

---

#### FE-029: Thumbnail Placeholder Icons
**Priority:** 5 | **Estimate:** 15 min | **Dependencies:** FE-027

Default icons when no thumbnail available.

**Deliverables:**
- Create/add icons in `frontend/public/icons/`
- Icons for each item type
- Update ItemCard to use placeholders

**Acceptance Criteria:**
- [ ] Icons for all types
- [ ] Consistent styling
- [ ] Used as fallback
- [ ] `bun run typecheck` passes

---

## Phase 6: Production Hardening

**Goal:** Production-ready deployment with monitoring and security.

*Phase 6 is largely covered by the Docker deployment PRD (`tasks/infra/docker-local.json`). Additional stories for production hardening can be added here as needed:*

- Rate limiting
- Request validation/sanitization  
- Error monitoring (Sentry)
- Health check dashboard
- Backup strategy
- SSL/HTTPS configuration

---

## Appendix: Story Template

```markdown
#### XX-NNN: Story Title
**Priority:** N | **Estimate:** NN min | **Dependencies:** XX-NNN

Brief description of what this story accomplishes.

**Deliverables:**
- File or feature 1
- File or feature 2

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Quality checks pass
```
