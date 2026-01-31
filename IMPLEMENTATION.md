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

*Stories to be detailed after Phase 1 completion. High-level:*

### 2.1 Backend
- BE-007: Item ORM model with polymorphic properties
- BE-008: Item Pydantic schemas (base + type-specific)
- BE-009: Create item endpoint
- BE-010: List items endpoint (with filters)
- BE-011: Get/Update/Delete item endpoints
- BE-012: SRD search endpoint

### 2.2 Frontend
- FE-007: Inventory dashboard page
- FE-008: Items list with category tabs
- FE-009: Item card component
- FE-010: Add item modal with SRD search
- FE-011: Item detail view
- FE-012: Edit/Delete item

---

## Phase 3: Currency & History

**Goal:** Manage treasury and track all changes with undo capability.

*Stories to be detailed after Phase 2 completion.*

---

## Phase 4: Real-time Sync

**Goal:** SSE-based live updates for multi-user sessions.

*Stories to be detailed after Phase 3 completion.*

---

## Phase 5: AI Thumbnails

**Goal:** DALL-E integration for item icons.

*Stories to be detailed after Phase 4 completion.*

---

## Phase 6: Deployment

**Goal:** Docker + Tailscale Funnel for production.

*Stories to be detailed after Phase 5 completion.*

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
