# D&D Party Inventory Manager - Agent Instructions

## Project Overview

Web app for D&D 5e party inventory management. Slug + passphrase access (no user accounts). Real-time sync via SSE.

## Tech Stack

- **Frontend:** React 18 + Vite + Bun + Tailwind + TanStack Query + Zustand
- **Backend:** Python 3.11+ + FastAPI + UV + Pydantic v2 + SQLAlchemy
- **Database:** SQLite (async via aiosqlite)
- **Real-time:** Server-Sent Events (SSE)

## Project Structure

```
dnd-helper/
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
├── tasks/                    # PRD and specs
└── scripts/ralph/            # Ralph agent loop
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
