# Multi-Architecture Dockerfile for EdgeDocker Sim
# Supports both ARM64 (Jetson Orin Nano, Raspberry Pi 5, Thor Nano) and AMD64

# ==========================================
# Stage 1: Build & Package
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build config
COPY tsconfig.json vite.config.ts index.html metadata.json ./
COPY src/ ./src/
COPY server.ts ./
COPY test/ ./test/

# Run automated tests to verify code integrity
RUN npm test

# Compile client SPA and bundled Node.js server to dist/
RUN npm run build

# Remove development dependencies for a lean production footprint
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for container healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=3000

# Copy production dependencies and compiled build artifacts
COPY --chown=node:node package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# Security: Run as unprivileged node user
USER node

# Expose web service port
EXPOSE 3000

# Health check monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "dist/server.cjs"]
