# ALVISION Deployment Guide

---

## Quick Start (Docker)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+

### Steps

```bash
# 1. Clone the repository
git clone <repo-url> alvision
cd alvision

# 2. Create environment file
cp .env.example .env.local

# 3. Generate a secure JWT secret
# On Linux/macOS:
JWT_SECRET=$(openssl rand -hex 32) && sed -i "s/your-strong-jwt-secret-here/$JWT_SECRET/" .env.local

# 4. Build and start all services
docker compose up -d --build

# 5. Initialize the database
docker compose exec web bunx prisma db push

# 6. Verify health
curl http://localhost:3000/api/health
```

### Stopping

```bash
docker compose down        # Stop containers (preserves DB volume)
docker compose down -v     # Stop + delete volumes (wipes DB)
```

### Viewing Logs

```bash
docker compose logs -f              # All services
docker compose logs -f web          # Next.js only
docker compose logs -f chat-service # Chat service only
```

---

## On-Premises Deployment (Manual)

### Prerequisites
- [Bun](https://bun.sh/) 1.0+
- Node.js 20+ (alternative to Bun)

### Steps

```bash
# 1. Clone and enter the repo
git clone <repo-url> alvision
cd alvision

# 2. Install dependencies
bun install

# 3. Generate Prisma client
bunx prisma generate

# 4. Push schema to database
bunx prisma db push

# 5. Create environment file
cp .env.example .env.local
# Edit .env.local — set JWT_SECRET, DATABASE_URL, etc.

# 6. Build the application
NODE_ENV=production bun run build

# 7. Start the production server
NODE_ENV=production bun run start

# 8. Start the chat service (separate terminal)
cd mini-services/chat-service
bun --hot index.ts
```

### Systemd Service (Linux)

Create `/etc/systemd/system/alvision-web.service`:

```ini
[Unit]
Description=ALVISION Web Application
After=network.target

[Service]
Type=simple
User=alvision
WorkingDirectory=/opt/alvision
EnvironmentFile=/opt/alvision/.env.local
ExecStart=/home/alvision/.bun/bin/bun run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/alvision-chat.service`:

```ini
[Unit]
Description=ALVISION Chat Service
After=network.target

[Service]
Type=simple
User=alvision
WorkingDirectory=/opt/alvision/mini-services/chat-service
ExecStart=/home/alvision/.bun/bin/bun --hot index.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable alvision-web alvision-chat
sudo systemctl start alvision-web alvision-chat
```

---

## Cloud Deployment

### General Architecture

```
[Load Balancer / CDN]
       |
       v
[Reverse Proxy (Caddy / Nginx)]
       |
       +---> Next.js App (port 3000)
       +---> Chat Service (port 3010, WebSocket upgrade)
```

### AWS (ECS Fargate + ALB)

1. **Container Registry**: Push image to Amazon ECR
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker tag alvision-web:latest <account>.dkr.ecr.us-east-1.amazonaws.com/alvision:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/alvision:latest
   ```

2. **ECS Task**: Define a Fargate task with two containers (web + chat-service)
3. **ALB**: Configure Application Load Balancer with:
   - Port 80/443 → web container :3000
   - WebSocket upgrade on `/?XTransformPort=3010` path
4. **Secrets**: Store `JWT_SECRET` in AWS Secrets Manager or Parameter Store
5. **Persistent Storage**: Use EFS volume for `/app/db` (SQLite)

### Google Cloud (Cloud Run)

1. **Build & Push**:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/alvision
   ```

2. **Deploy Web**:
   ```bash
   gcloud run deploy alvision-web \
     --image gcr.io/PROJECT_ID/alvision \
     --port 3000 \
     --set-env-vars "NODE_ENV=production" \
     --set-secrets "JWT_SECRET=alvision-jwt-secret:latest" \
     --memory 1Gi \
     --cpu 1
   ```

3. **Deploy Chat**: Deploy `mini-services/chat-service` as a separate Cloud Run service on port 3010
4. **Volumes**: Cloud Run is stateless — migrate to Cloud SQL (PostgreSQL) for production data

### Azure (Container Apps)

1. **Push to ACR**:
   ```bash
   az acr login --name alvisionregistry
   docker tag alvision-web:latest alvisionregistry.azurecr.io/alvision:latest
   docker push alvisionregistry.azurecr.io/alvision:latest
   ```

2. **Create Container App**:
   ```bash
   az containerapp create \
     --name alvision-web \
     --resource-group alvision-rg \
     --image alvisionregistry.azurecr.io/alvision:latest \
     --target-port 3000 \
     --env-vars NODE_ENV=production \
     --secrets jwt-secret=<value> \
     --secret-env-vars jwt-secret=JWT_SECRET
   ```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Set to `production` for deployments |
| `JWT_SECRET` | **Yes** | — | Strong random string for signing JWTs. Generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration (e.g. `24h`, `7d`) |
| `DATABASE_URL` | Yes | `file:./db/alvision.db` | SQLite connection string |
| `NEXT_PUBLIC_WS_URL` | No | (empty) | WebSocket URL. Leave empty for same-origin via gateway |
| `ALLOWED_ORIGINS` | No | — | Comma-separated CORS origins |

---

## Health Check Endpoint

```
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "0.2.1",
  "uptime": 12345.67,
  "responseTime": "12ms",
  "checks": {
    "database": "ok",
    "api": "ok"
  }
}
```

**Chat Service Health:**
```
GET http://localhost:3010/health
```

---

## Production Checklist

- [ ] `JWT_SECRET` set to a cryptographically random value (not the default)
- [ ] `NODE_ENV` set to `production`
- [ ] `.env.local` is NOT committed to version control
- [ ] Database initialized with `prisma db push` or migrations applied
- [ ] TLS/SSL termination configured (Caddy, Nginx, or cloud LB)
- [ ] Security headers verified:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- [ ] Health check endpoint accessible and returning `healthy`
- [ ] WebSocket chat service reachable
- [ ] SQLite database directory is on a persistent volume (not ephemeral container storage)
- [ ] Container running as non-root user (UID 1001)
- [ ] Restart policy configured (`unless-stopped` or equivalent)
- [ ] Log aggregation configured (CloudWatch, Stackdriver, or similar)
- [ ] Monitoring/alerting set up on health check failures
- [ ] Backups configured for the SQLite database file
- [ ] `output: 'standalone'` confirmed in `next.config.ts` for Docker deployments
