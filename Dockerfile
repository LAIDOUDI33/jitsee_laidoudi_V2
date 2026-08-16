# ============================================================================
# ALVISION — Multi-stage Dockerfile for Next.js 16 with Node.js 22
# ============================================================================

# ---- Stage 1: Install production dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package.json ./

# Install production dependencies only (skips devDependencies)
RUN npm install --omit=dev

# Generate Prisma Client
COPY prisma/ ./prisma/
RUN npx prisma generate

# ---- Stage 2: Build the application ----
FROM node:22-alpine AS build
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy dependency manifests and install ALL deps (including dev for build)
COPY package.json ./
COPY prisma/ ./prisma/

RUN npm install

# Generate Prisma Client for build time
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx next build

# Copy static assets and public folder into standalone output
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/

# ---- Stage 3: Production runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from build stage
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (CSS, JS bundles)
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory (favicon, robots.txt, etc.)
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema for potential runtime operations
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# Ensure data directory exists for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/custom.db"

# Health check — hits the /api/health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
