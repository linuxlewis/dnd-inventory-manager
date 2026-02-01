#!/usr/bin/env bash
#
# dev.sh - Unified dev runner for the full stack
#
# Starts backend (background) and frontend (foreground)
# Ctrl+C kills both processes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

BACKEND_PID=""

# Cleanup function - kill backend on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
        echo "   Backend stopped"
    fi
    echo "👋 Done"
}

trap cleanup EXIT INT TERM

# Run setup if .env.local files are missing
if [[ ! -f "$PROJECT_ROOT/backend/.env.local" ]] || [[ ! -f "$PROJECT_ROOT/frontend/.env.local" ]]; then
    echo "📦 Environment files missing, running setup..."
    "$SCRIPT_DIR/dev-setup.sh"
    echo ""
fi

# Source port configuration
source "$PROJECT_ROOT/backend/.env.local"
BACKEND_PORT=$PORT

# Source frontend config for VITE_PORT
source "$PROJECT_ROOT/frontend/.env.local"

echo "🚀 Starting development servers..."
echo ""
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo "   Frontend: http://localhost:$VITE_PORT"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start backend in background
cd "$PROJECT_ROOT/backend"
uv run uvicorn app.main:app --reload --port "$BACKEND_PORT" &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Give backend a moment to start
sleep 1

# Check if backend started successfully
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend in foreground
cd "$PROJECT_ROOT/frontend"
VITE_API_URL="http://localhost:$BACKEND_PORT" bun run dev --port "$VITE_PORT"
