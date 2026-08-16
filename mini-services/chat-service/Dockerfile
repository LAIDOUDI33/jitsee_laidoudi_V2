# ALVISION Chat Service — Minimal Bun WebSocket server
FROM oven/bun:1-alpine

WORKDIR /app

# Run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 chatuser

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY index.ts ./

USER chatuser

EXPOSE 3010

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3010/health || exit 1

CMD ["bun", "index.ts"]
