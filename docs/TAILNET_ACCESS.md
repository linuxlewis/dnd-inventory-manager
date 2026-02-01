# Accessing D&D Inventory Manager via Tailscale

This guide explains how to access your D&D Inventory Manager from your phone or other devices on your Tailscale network (tailnet).

## Prerequisites

1. **Host machine** running Docker with the D&D Inventory Manager
2. **Tailscale** installed on the host machine and connected to your tailnet
3. **Tailscale** installed on your phone/device and connected to the same tailnet

## Quick Start

### 1. Start the production stack

```bash
./scripts/prod-up.sh
```

This will:
- Build and start the Docker containers
- Display your Tailscale IP and access URLs
- Run services on ports 9000 (backend) and 9080 (frontend)

### 2. Get your Tailscale IP

If you need to find it manually:

```bash
tailscale ip -4
```

Example output: `100.64.123.45`

### 3. Access from your phone

1. Open Tailscale on your phone and ensure it's connected
2. Open your browser and navigate to:

```
http://<tailscale-ip>:9080
```

For example: `http://100.64.123.45:9080`

## Using MagicDNS (Optional)

If you have MagicDNS enabled in your Tailscale admin console, you can use your machine's name instead of the IP:

```
http://<machine-name>:9080
```

For example: `http://sams-macbook:9080`

To check your MagicDNS name:
```bash
tailscale status
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `sqlite+aiosqlite:///./data/dnd_inventory.db` |
| `CORS_ORIGINS` | Allowed origins for CORS | `["http://localhost:9080"]` |
| `PORT` | Backend internal port | `8000` |

### Adding your Tailscale IP to CORS

If you experience CORS issues, add your Tailscale IP to `.env.docker`:

```bash
CORS_ORIGINS=["http://localhost:9080","http://100.64.123.45:9080"]
```

Then restart the services:
```bash
./scripts/prod-down.sh
./scripts/prod-up.sh
```

## Port Reference

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| Backend | 8000 | 9000 | FastAPI REST API |
| Frontend | 80 | 9080 | React SPA via nginx |

Production ports (9000/9080) are chosen to avoid conflicts with development ports (8000/5173).

## Troubleshooting

### "Connection refused" or timeout

1. **Is Tailscale running?**
   ```bash
   tailscale status
   ```
   Should show "Connected" or similar.

2. **Are the Docker containers running?**
   ```bash
   docker ps
   ```
   Should show `dnd-backend` and `dnd-frontend` containers.

3. **Can you access locally?**
   Try `http://localhost:9080` on the host machine first.

### "CORS error" in browser console

Add your Tailscale IP to the CORS origins in `.env.docker` (see above).

### Phone can't connect to tailnet

1. Open Tailscale app on phone
2. Check that it shows "Connected"
3. Try pinging the host from your phone (if your phone supports it)
4. Check that both devices are on the same Tailscale account/tailnet

### MagicDNS not working

1. Check if MagicDNS is enabled in [Tailscale Admin Console](https://login.tailscale.com/admin/dns)
2. Try using the IP address directly instead
3. Some networks block custom DNS - try switching to mobile data

## Why Direct Tailscale IP (Not Tailscale Serve)?

This setup uses direct Tailscale IP access instead of `tailscale serve` because:

1. **Simplicity** - No additional Tailscale configuration needed
2. **No conflicts** - Tailscale Serve can conflict with other services (like OpenClaw)
3. **Full control** - You manage ports directly via Docker Compose

If you need HTTPS or public internet access, consider:
- Tailscale Funnel (for public HTTPS)
- A reverse proxy with Let's Encrypt
- Cloudflare Tunnel

## Scripts Reference

| Script | Description |
|--------|-------------|
| `./scripts/prod-up.sh` | Start production stack |
| `./scripts/prod-down.sh` | Stop production stack |
| `./scripts/prod-logs.sh` | View container logs |
| `./scripts/dev.sh` | Start development servers |
