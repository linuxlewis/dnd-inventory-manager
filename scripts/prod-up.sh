#!/usr/bin/env bash
# D&D Inventory Manager - Start Production Stack
# Builds and runs Docker containers, displays access URLs

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐉 D&D Party Inventory Manager - Production${NC}"
echo "==========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Create data directory if it doesn't exist
mkdir -p data

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check container status
if docker ps | grep -q "dnd-backend" && docker ps | grep -q "dnd-frontend"; then
    echo -e "${GREEN}✓ Services are running!${NC}"
else
    echo "Warning: Some containers may not be running. Check: docker ps"
fi

# Display access URLs
echo ""
echo "==========================================="
echo -e "${GREEN}Access URLs:${NC}"
echo ""
echo -e "  Local:     ${BLUE}http://localhost:9080${NC}"
echo -e "  API:       ${BLUE}http://localhost:9000/health${NC}"

# Get Tailscale IP if available
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
    if [ -n "$TAILSCALE_IP" ]; then
        echo ""
        echo -e "  Tailscale: ${BLUE}http://${TAILSCALE_IP}:9080${NC}"
        echo -e "  (Access from any device on your tailnet)"
    fi
fi

echo ""
echo "==========================================="
echo ""
echo "Commands:"
echo "  View logs:  ./scripts/prod-logs.sh"
echo "  Stop:       ./scripts/prod-down.sh"
echo ""
