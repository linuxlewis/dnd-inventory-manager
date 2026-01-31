# Implementation Plan

This document outlines the phased development of the D&D Party Inventory Manager. Work is organized into milestones with parallel workstreams (backend/frontend) that can run simultaneously.

## Workstreams

| Stream | Directory | Can Run In Parallel |
|--------|-----------|---------------------|
| Backend | `scripts/ralph-backend/` | ✅ Independent |
| Frontend | `scripts/ralph-frontend/` | ✅ After API contracts defined |
| SRD Data | `scripts/ralph-srd/` | ✅ Independent |

## Running Parallel Loops

```bash
# Terminal 1: Backend
./scripts/ralph-backend/ralph.sh --tool claude 20

# Terminal 2: Frontend  
./scripts/ralph-frontend/ralph.sh --tool claude 20

# Terminal 3: SRD Data (optional, can be done early)
./scripts/ralph-srd/ralph.sh --tool claude 5
```

---

## Milestone 1: Foundation (MVP Walking Skeleton)

**Goal:** Create/access an inventory, see it's empty, basic structure works end-to-end.

### Backend Phase 1 (6 stories)
- [x] Project scaffolding (FastAPI + UV)
- [ ] Database setup (SQLite + SQLAlchemy async)
- [ ] Inventory ORM model
- [ ] Inventory Pydantic schemas
- [ ] Create inventory endpoint
- [ ] Auth + Get inventory endpoints

### Frontend Phase 1 (6 stories)
- [ ] Project scaffolding (Vite + React + Bun)
- [ ] Routing + Layout shell
- [ ] API client setup
- [ ] Auth store (Zustand)
- [ ] Home page (create inventory form)
- [ ] Inventory access (slug + passphrase)

### SRD Data Phase 1 (3 stories)
- [ ] Gather 5e SRD weapon data (JSON)
- [ ] Gather 5e SRD armor data (JSON)
- [ ] Gather 5e SRD potion data (JSON)

**Integration Point:** Frontend can mock API until backend is ready. Merge when both complete.

---

## Milestone 2: Items Management

**Goal:** Add, view, edit, delete items. Basic inventory is functional.

### Backend Phase 2 (6 stories)
- [ ] Item ORM model with type-specific properties
- [ ] Item Pydantic schemas (base + equipment/potion/scroll/consumable)
- [ ] Create item endpoint
- [ ] List items endpoint (with filters)
- [ ] Get/Update/Delete item endpoints
- [ ] SRD search endpoint

### Frontend Phase 2 (7 stories)
- [ ] Items list page with category tabs
- [ ] Item card component
- [ ] Add item modal/page
- [ ] SRD search autocomplete
- [ ] Item detail page
- [ ] Edit item form
- [ ] Delete item confirmation

**Dependencies:** Backend Items API must be ready before frontend integration testing.

---

## Milestone 3: Currency & History

**Goal:** Manage party treasury, track all changes, undo mistakes.

### Backend Phase 3 (5 stories)
- [ ] Currency endpoints (get/add/spend/convert)
- [ ] History ORM model + logging service
- [ ] History list endpoint
- [ ] Undo endpoint (single action)
- [ ] Rollback endpoint (point-in-time)

### Frontend Phase 3 (5 stories)
- [ ] Currency display widget
- [ ] Add/Spend currency modals
- [ ] History page with filters
- [ ] Undo button on history entries
- [ ] Rollback confirmation modal

---

## Milestone 4: Real-time Sync

**Goal:** Multiple party members see changes instantly.

### Backend Phase 4 (3 stories)
- [ ] SSE connection manager
- [ ] SSE endpoint with event types
- [ ] Broadcast events on mutations

### Frontend Phase 4 (3 stories)
- [ ] SSE hook with reconnection
- [ ] Live updates via TanStack Query invalidation
- [ ] Viewer count + toast notifications

---

## Milestone 5: AI Thumbnails

**Goal:** Auto-generate item icons with DALL-E.

### Backend Phase 5 (4 stories)
- [ ] OpenAI key storage (encrypted)
- [ ] Key management endpoints
- [ ] Thumbnail generation service
- [ ] Thumbnail endpoint + regenerate

### Frontend Phase 5 (3 stories)
- [ ] Settings page with API key input
- [ ] Thumbnail display on item cards
- [ ] Regenerate thumbnail button

---

## Milestone 6: Polish & Deploy

**Goal:** Production-ready, mobile-friendly, deployed.

### DevOps Phase (4 stories)
- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile + nginx config
- [ ] docker-compose.yml
- [ ] Tailscale Funnel setup docs

### Mobile Polish (3 stories)
- [ ] Mobile navigation (bottom tabs)
- [ ] Touch gestures (swipe actions)
- [ ] PWA manifest + service worker

---

## Story Sizing Guidelines

Each story should be completable in **one context window** (~15-30 min of agent work).

**Right-sized:**
- Add a database model with 5-10 fields
- Create one API endpoint with request/response schemas
- Build one React component with props
- Add one page with basic layout

**Too big (split these):**
- "Build the items system" → Split into model, schemas, each endpoint
- "Create the dashboard" → Split into layout, each widget
- "Add authentication" → Split into hash/verify, middleware, endpoints

---

## Branch Strategy

Each Ralph loop works on its own feature branch:

```
main
├── ralph/backend-phase-1
├── ralph/frontend-phase-1
├── ralph/srd-data
├── ralph/backend-phase-2
└── ...
```

**Merge order:**
1. SRD data can merge anytime (no dependencies)
2. Backend phases merge to main when complete
3. Frontend phases merge after corresponding backend phase

---

## Quality Gates

Before merging any phase:

- [ ] All stories pass (`passes: true` in prd.json)
- [ ] Quality checks pass (ruff/typecheck/lint)
- [ ] Manual smoke test of new features
- [ ] No regressions in existing features
