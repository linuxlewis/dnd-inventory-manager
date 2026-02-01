#!/usr/bin/env bash
# D&D Inventory Manager - View Production Logs
# Shows combined logs from all containers (Ctrl+C to exit)

set -e

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🐉 D&D Party Inventory Manager - Logs"
echo "======================================"
echo "Press Ctrl+C to exit"
echo ""

# Follow logs from all services
docker-compose logs -f
