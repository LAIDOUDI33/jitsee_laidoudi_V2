# Task: WebSocket Mini-Service for Real-Time Chat

## Agent: WebSocket Chat Builder

### Work Log

1. **Checked available packages**: `package.json` has no `socket.io` or `ws`. Used **Bun's native WebSocket** support via `Bun.serve()` with the `websocket` option — no external dependencies needed.

2. **Created mini-service** (`mini-services/chat-service/`):
   - `package.json` — standalone bun project, zero deps
   - `index.ts` — Bun.serve WebSocket server on port 3010
     - JSON protocol: `{ type, channel, payload }`
     - Message types: join, leave, message, typing, presence
     - In-memory message store (max 500) with demo seed data
     - Channel membership tracking
     - Typing indicator with 3s auto-clear
     - Presence broadcast (active < 2min, else idle)
     - Health check endpoint at `/health`
     - Proper cleanup on disconnect (leaves all channels, broadcasts)

3. **Created `useChat` hook** (`src/hooks/useChat.ts`):
   - WebSocket connection to `ws://localhost:3010`
   - Exponential backoff reconnection (1s base, 30s max)
   - Channel join/leave with auto-rejoin on reconnect
   - Message deduplication by ID
   - Typing indicator emission with 3s debounce
   - Live presence tracking
   - Config stored in refs to avoid stale closures
   - Connect function ref updated via `useEffect` (React 19 compliant)
   - All ESLint rules pass (react-hooks/immutability, react-hooks/refs, react-hooks/set-state-in-effect, react-hooks/static-components)

4. **Created HTTP fallback API** (`src/app/api/v1/chat/route.ts`):
   - `GET /api/v1/chat?channel=c1&limit=50` — returns channel messages
   - `POST /api/v1/chat` — stores a new message, returns 201
   - In-memory store with same demo seed data
   - 5000-char content safety limit, 500 max messages

5. **Updated ChatPage.tsx**:
   - Integrated `useChat` hook with real user identity from store
   - Connection status indicator in chat header (green Wifi=Live, amber Loader2=Connecting/Reconnecting, grey WifiOff=Offline)
   - Graceful fallback: if WS unavailable, uses static demo data + HTTP POST for sent messages
   - Real-time message flow via WebSocket when connected
   - Typing indicators forwarded to WebSocket service
   - Online users panel populated from WS presence when connected, static fallback otherwise
   - All existing styling, reactions, and UI preserved
   - Removed unused imports (Card, ThumbsUp, Heart, Laugh, Rocket)
   - Extracted `ConnectionIndicator` and `StatusIcon` as top-level components (React 19 static-components rule)
   - Zero lint errors

### Architecture

```
Frontend (ChatPage.tsx)
  └─ useChat() hook ───── WebSocket ────► mini-services/chat-service (port 3010)
  └─ fetch() fallback ──── HTTP ───────► /api/v1/chat (Next.js API route)
```

### Files Created
| File | Purpose |
|------|---------|
| `mini-services/chat-service/package.json` | Standalone bun project config |
| `mini-services/chat-service/index.ts` | Bun WebSocket server (port 3010) |
| `src/hooks/useChat.ts` | React hook for WS connection management |
| `src/app/api/v1/chat/route.ts` | HTTP fallback REST API |

### Files Modified
| File | Changes |
|------|---------|
| `src/components/chat/ChatPage.tsx` | Added useChat integration, connection indicator, fallback logic |
