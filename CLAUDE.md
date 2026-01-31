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

## Port Configuration

To avoid conflicts when running multiple worktrees simultaneously:

**Backend:** Set `PORT` env var
```bash
PORT=8001 uv run uvicorn app.main:app --port $PORT
```

**Frontend:** Set `VITE_PORT` in `.env.local` or pass --port
```bash
VITE_PORT=5174 bun run dev
# or
bun run dev --port 5174
```

**Assigned Ports:**
| Worktree | Backend Port | Frontend Port |
|----------|--------------|---------------|
| wt-1 | 8001 | 5174 |
| wt-2 | 8002 | 5175 |
| wt-3 | 8003 | 5176 |
| **Production** | **9000** | **9080** |

## Production Deployment (Docker)

### Quick Start
```bash
./scripts/prod-up.sh    # Build & start containers
./scripts/prod-down.sh  # Stop containers
./scripts/prod-logs.sh  # View logs
```

### Access URLs
- **Local:** http://localhost:9080
- **Tailscale:** http://<tailscale-ip>:9080 (from phone/other devices)

### Architecture
```
Phone/Device (Tailscale) → Frontend (nginx:9080) → Backend (uvicorn:9000)
                                    ↓
                           /api/* proxy to backend
```

### Key Files
- `docker-compose.yml` — Service definitions
- `backend/Dockerfile` — Python 3.12 + UV
- `frontend/Dockerfile` — Bun build → nginx:alpine
- `frontend/nginx.conf` — SPA routing + API proxy
- `.env.docker` — Production environment variables
- `docs/TAILNET_ACCESS.md` — Full Tailscale setup guide

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Command | `./scripts/dev.sh` | `./scripts/prod-up.sh` |
| Backend | uvicorn with --reload | Docker container |
| Frontend | Vite dev server | nginx serving built files |
| Ports | 8000-8099, 5173-5199 | 9000, 9080 |
| Hot reload | Yes | No (rebuild required) |

### Data Persistence
SQLite database is stored in `./data/` and mounted as a Docker volume. Data persists across container restarts.

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
