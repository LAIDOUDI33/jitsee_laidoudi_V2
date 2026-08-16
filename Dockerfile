# ============================================================================
# ALVISION — Multi-stage Dockerfile for Next.js 16 with Bun
# ============================================================================

# ---- Stage 1: Install production dependencies ----
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install production dependencies only (skips devDependencies)
RUN bun install --frozen-lockfile --production || bun install --production

# Generate Prisma Client
COPY prisma/ ./prisma/
RUN bunx prisma generate

# ---- Stage 2: Build the application ----
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Copy dependency manifests and install ALL deps (including dev for build)
COPY package.json bun.lock* ./
COPY prisma/ ./prisma/

RUN bun install --frozen-lockfile || bun install

# Generate Prisma Client for build time
RUN bunx prisma generate

# Copy source code
COPY . .

# Build Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# ---- Stage 3: Production runner ----
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from build stage
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (CSS, JS bundles)
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory (favicon, robots.txt, etc.)
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema for potential runtime migrations
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# Ensure db directory exists for SQLite
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check — hits the /api/health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["bun", "server.js"]
