#!/usr/bin/env bash
#
# dev-ports.sh - Find available ports for dev environment
#
# Outputs shell-sourceable format:
#   BACKEND_PORT=XXXX
#   FRONTEND_PORT=XXXX
#
# Backend range: 8000-8099
# Frontend range: 5173-5199

set -euo pipefail

# Check if a port is in use
port_in_use() {
    local port=$1
    lsof -i :"$port" >/dev/null 2>&1
}

# Find first available port in range
find_available_port() {
    local start=$1
    local end=$2
    local name=$3
    
    for port in $(seq "$start" "$end"); do
        if ! port_in_use "$port"; then
            echo "$port"
            return 0
        fi
    done
    
    echo "ERROR: No available $name port in range $start-$end" >&2
    return 1
}

# Find backend port (8000-8099)
BACKEND_PORT=$(find_available_port 8000 8099 "backend")
if [[ $? -ne 0 ]]; then
    exit 1
fi

# Find frontend port (5173-5199)
FRONTEND_PORT=$(find_available_port 5173 5199 "frontend")
if [[ $? -ne 0 ]]; then
    exit 1
fi

# Output in sourceable format
echo "BACKEND_PORT=$BACKEND_PORT"
echo "FRONTEND_PORT=$FRONTEND_PORT"
