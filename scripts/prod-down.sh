#!/usr/bin/env bash
# D&D Inventory Manager - Stop Production Stack
# Stops and removes Docker containers (data is preserved in ./data)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐉 D&D Party Inventory Manager - Stopping${NC}"
echo "==========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Stop containers
docker-compose down

echo ""
echo -e "${GREEN}✓ Services stopped${NC}"
echo ""
echo "Note: Your data is preserved in ./data/"
echo "To start again: ./scripts/prod-up.sh"
echo ""
