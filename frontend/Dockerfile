# D&D Inventory Manager - Frontend Dockerfile
# Multi-stage build: Bun for building, nginx:alpine for serving

# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files for layer caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
# API calls go through nginx proxy, so use relative /api path
ENV VITE_API_URL=/api
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# nginx runs in foreground by default
CMD ["nginx", "-g", "daemon off;"]
