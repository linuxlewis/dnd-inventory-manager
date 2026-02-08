# D&D Party Inventory Manager — Single Container
# Builds frontend with Bun, serves via nginx + proxies API to uvicorn
#
# Usage:
#   docker build -t dnd-inventory-manager .
#   docker run -p 8080:80 -v ./data:/app/data dnd-inventory-manager
#
# Access at http://localhost:8080

# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM oven/bun:1 AS frontend-builder

WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ .
ENV VITE_API_URL=/api
RUN bun run build

# ── Stage 2: Install Python deps ─────────────────────────────────────
FROM python:3.12-slim AS backend-builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# ── Stage 3: Production image ────────────────────────────────────────
FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor curl && \
    rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd --system app && useradd --system --gid app app

WORKDIR /app

# Copy Python venv
COPY --from=backend-builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Copy backend application
COPY backend/app/ /app/app/

# Copy built frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# nginx config — proxy /api to uvicorn on localhost
COPY <<'NGINX' /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# supervisord config — runs nginx + uvicorn
COPY <<'SUPERVISOR' /etc/supervisor/conf.d/app.conf
[supervisord]
nodaemon=true
user=root
logfile=/dev/stdout
logfile_maxbytes=0

[program:uvicorn]
command=/app/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
directory=/app
user=app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
SUPERVISOR

# Create data directory
RUN mkdir -p /app/data && chown app:app /app/data

# Single port
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
