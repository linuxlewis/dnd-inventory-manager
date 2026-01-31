# D&D Party Inventory Manager

A web application for managing shared party inventory in Dungeons & Dragons 5th Edition campaigns. Parties access their inventory via a unique slug/passphrase—no individual user accounts required.

## Features

- **Slug-based access** — Share a link + passphrase with your party
- **Real-time sync** — Changes appear instantly for all viewers (SSE)
- **AI thumbnails** — DALL-E generates item icons (bring your own API key)
- **5e SRD integration** — Auto-populate stats for standard items
- **Full history** — Undo any change, rollback to any point
- **Mobile-friendly** — PWA with swipe gestures

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Bun |
| Backend | Python 3.11+ + FastAPI + UV |
| Database | SQLite + SQLAlchemy |
| Real-Time | Server-Sent Events (SSE) |
| Images | OpenAI DALL-E 3 |
| Deployment | Docker + Tailscale Funnel |

## Quick Start (Docker + Tailscale)

Run the app in production mode, accessible from your phone via Tailscale:

```bash
# Start production stack
./scripts/prod-up.sh

# Access from phone: http://<tailscale-ip>:9080
# Get your Tailscale IP: tailscale ip -4

# Stop when done
./scripts/prod-down.sh
```

See [docs/TAILNET_ACCESS.md](docs/TAILNET_ACCESS.md) for detailed setup.

## Development

### Prerequisites

- [Bun](https://bun.sh/) (frontend)
- [UV](https://github.com/astral-sh/uv) (backend)
- Python 3.11+

### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

## Ralph Agent Loop

This project uses the [Ralph pattern](https://github.com/snarktank/ralph) for autonomous development.

```bash
# Run Ralph with Claude Code
./scripts/ralph/ralph.sh --tool claude 10
```

See `tasks/prd-inventory-manager.md` for the full specification and `scripts/ralph/prd.json` for the current task list.

## License

MIT
