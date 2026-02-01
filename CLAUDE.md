# D&D Party Inventory Manager - Agent Instructions

## Project Overview

Web app for D&D 5e party inventory management. Slug + passphrase access (no user accounts). Real-time sync via SSE.

## Key Documents

- **Full Spec:** `tasks/prd-inventory-manager.md` — Complete product specification
- **Implementation:** `IMPLEMENTATION.md` — Ordered user stories with acceptance criteria
- **Status:** `PROJECT_STATUS.md` — Current progress across all workstreams
- **PRDs:** `tasks/phase1/*.json` — Machine-readable story lists for Ralph

## Tech Stack

- **Frontend:** React 18 + Vite + Bun + Tailwind + TanStack Query + Zustand
- **Backend:** Python 3.11+ + FastAPI + UV + Pydantic v2 + SQLAlchemy
- **Database:** SQLite (async via aiosqlite)
- **Real-time:** Server-Sent Events (SSE)

## Project Structure

```
dnd-helper/                    # Main repo (on main branch)
├── backend/
│   └── app/
│       ├── main.py           # FastAPI app
│       ├── config.py         # Pydantic settings
│       ├── database.py       # SQLAlchemy setup
│       ├── models/           # Pydantic models (API schemas)
│       ├── db/               # SQLAlchemy ORM models
│       ├── routers/          # API endpoints
│       ├── services/         # Business logic
│       ├── core/             # Auth, encryption, SSE manager
│       └── data/             # SRD item database
├── frontend/
│   └── src/
│       ├── api/              # API client
│       ├── components/       # React components
│       ├── hooks/            # Custom hooks
│       ├── pages/            # Route pages
│       ├── stores/           # Zustand stores
│       └── types/            # TypeScript types
├── tasks/                    # PRDs and specs
│   ├── prd-inventory-manager.md
│   └── phase1/               # Phase 1 story lists
└── scripts/
    └── ralph.sh              # Agent loop script

# Worktrees (sibling directories) - generic workers
dnd-helper-wt-1/              # Can work on any branch/PRD
dnd-helper-wt-2/              # Can work on any branch/PRD
dnd-helper-wt-3/              # Can work on any branch/PRD
```

## Development

### Quick Start (Recommended)

Run the full stack with a single command:

```bash
./scripts/dev.sh
```

This will:
- Auto-detect available ports (no conflicts with other worktrees)
- Create `.env.local` files if missing
- Start backend and frontend together
- Clean up both processes on Ctrl+C

### First-Time Setup

To configure your environment without starting servers:

```bash
./scripts/dev-setup.sh
```

This creates:
- `backend/.env.local` with `PORT=XXXX`
- `frontend/.env.local` with `VITE_PORT=XXXX` and `VITE_API_URL=...`

### Manual Workflow

After running setup, you can start services individually:

```bash
# Terminal 1 - Backend
cd backend
source .env.local
uv run uvicorn app.main:app --reload --port $PORT

# Terminal 2 - Frontend
cd frontend
source .env.local
bun run dev --port $VITE_PORT
```

### Port Assignment

Ports are dynamically assigned to avoid conflicts:
- **Backend:** First available port in 8000-8099
- **Frontend:** First available port in 5173-5199

The `.env.local` files are **gitignored** and auto-generated. Each worktree gets its own ports.

### Troubleshooting

**Ports seem stuck or conflicting?**
```bash
rm backend/.env.local frontend/.env.local
./scripts/dev-setup.sh
```

**Check which ports are in use:**
```bash
./scripts/dev-ports.sh
```

## Code Conventions

### Backend (Python)
- Use Pydantic v2 for all models (request/response schemas)
- Async everywhere (async def, await)
- Type hints on all functions
- SQLAlchemy 2.0 style (select(), scalars())
- UV for package management

### Frontend (TypeScript/React)
- Functional components with hooks
- TanStack Query for server state
- Zustand for client state
- Tailwind for styling (mobile-first)
- Bun for package management

## Key Patterns

### API Authentication
Passphrase sent via `X-Passphrase` header. Verified against bcrypt hash.

### SSE Events
Broadcast via `ConnectionManager`. Events: `item_added`, `item_updated`, `item_removed`, `currency_updated`.

### Item Type Handling
Base `Item` model with `properties: dict` for type-specific fields. Use discriminated unions in Pydantic.

## Quality Checks

Before committing, run:

```bash
# Backend
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy app/

# Frontend
cd frontend
bun run typecheck
bun run lint
```

## Full Spec

See `tasks/prd-inventory-manager.md` for complete product specification.
