# ALVISION Chat Service — Minimal Bun WebSocket server
FROM oven/bun:1-alpine

WORKDIR /app

# Run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 chatuser

COPY package.json ./
COPY index.ts ./

USER chatuser

EXPOSE 3010

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3010/health || exit 1

CMD ["bun", "--hot", "index.ts"]
