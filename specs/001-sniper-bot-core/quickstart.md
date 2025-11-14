# Quickstart: MEXC Sniper Bot Development Setup

**Feature**: User Story 1 - Monitor New Listings  
**Branch**: `001-sniper-bot-core`  
**Date**: 2025-11-14

---

## Prerequisites

- **Bun** 1.x or later ([install](https://bun.sh))
- **Encore CLI** ([install](https://encore.dev/docs/install))
- **Node.js** 18+ (for frontend tooling)
- **Git** (version control)
- **PostgreSQL** (optional for local dev, Encore manages via Neon)
- **MEXC Account** (for API keys, optional for monitoring-only mode)

---

## Initial Setup

###1. Clone Repository

```bash
git clone <repo-url>
cd real-time-crypto-sniping-bot-7txi
git checkout 001-sniper-bot-core
```

### 2. Install Backend Dependencies

```bash
cd backend
bun install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
bun install  # or npm install
```

### 4. Configure Secrets (Optional for MVP)

If connecting to real MEXC API:

```bash
encore secret set --type local MEXCApiKey "your_api_key_here"
encore secret set --type local MEXCSecretKey "your_secret_key_here"
```

For monitoring-only mode (User Story 1), secrets are not strictly required (WebSocket market data is public).

### 5. Run Database Migrations

```bash
cd backend
encore db migrate
```

This creates the `listings` table with unique constraints and indexes.

---

## Running Locally

### Option A: Full Stack (Recommended)

**Terminal 1 - Backend (Encore)**:
```bash
cd backend
encore run
```

- Backend runs on `http://localhost:4000` (Encore default)
- API endpoints: `http://localhost:4000/health`, `/listings`, `/monitor/*`
- Encore dashboard: `http://localhost:9400`

**Terminal 2 - Frontend (Next.js)**:
```bash
cd frontend
bun dev  # or npm run dev
```

- Frontend runs on `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Health check: `http://localhost:3000/health`

### Option B: Backend Only (API Testing)

```bash
cd backend
encore run
```

Test endpoints with curl:
```bash
# Health check
curl http://localhost:4000/health

# Start monitor
curl -X POST http://localhost:4000/monitor/start

# Check status
curl http://localhost:4000/monitor/status

# Get listings
curl "http://localhost:4000/listings?limit=10"
```

---

## Environment Variables

### Backend (Encore)

Encore manages environment via `encore.app` and secrets. No `.env` file needed.

### Frontend (Next.js)

Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_ENABLE_REALTIME=false  # Set to true for SSE/WebSocket (future)
```

**Production** (Vercel):
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-encore-app.encore.app
```

---

## Testing

### Backend Tests (Bun)

```bash
cd backend
bun test
```

**Run specific test file**:
```bash
bun test tests/unit/websocket.test.ts
```

**Run with coverage**:
```bash
bun test --coverage
```

### Frontend Tests (Vitest)

```bash
cd frontend
bun test  # or npm test
```

**Run E2E tests** (Playwright):
```bash
cd frontend
bun test:e2e  # or npm run test:e2e
```

---

## Development Workflow

### 1. Start Development Servers

```bash
# Terminal 1
cd backend && encore run

# Terminal 2
cd frontend && bun dev
```

### 2. Make Changes

**Backend**: Edit files in `backend/market-monitor/`, `backend/api/`, etc.  
**Frontend**: Edit files in `frontend/app/dashboard/`, `frontend/components/`, etc.

**Hot Reload**: Both Encore and Next.js watch for changes automatically.

### 3. Test Changes

**Manual**: Open `http://localhost:3000/dashboard`, click "Start Monitoring", inject test listing.

**Automated**:
```bash
cd backend && bun test
cd frontend && bun test
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat(monitor): implement WebSocket listing detection"
git push origin 001-sniper-bot-core
```

---

## Database Management

### View Current Schema

```bash
cd backend
encore db shell
```

```sql
\d listings  -- Describe listings table
SELECT * FROM listings LIMIT 10;
```

### Create New Migration

```bash
cd backend/db/migrations
touch 003_add_bot_health.up.sql
touch 003_add_bot_health.down.sql
```

Edit files, then apply:
```bash
encore db migrate
```

### Reset Database (Development Only)

```bash
encore db reset
encore db migrate
```

---

## Debugging

### Backend Logs

Encore prints structured logs to stdout:
```bash
cd backend
encore run | bunyan  # Optional: format with bunyan
```

Look for:
- `[market-monitor]` WebSocket connection events
- `[api]` HTTP request logs
- Database query times

### Frontend Logs

Next.js logs to browser console and terminal:
- Browser: Open DevTools → Console
- Terminal: Watch Next.js server logs

### Encore Dashboard

Open `http://localhost:9400` to see:
- Service map
- Request traces
- Metrics
- Database queries

---

## Troubleshooting

### "Cannot connect to database"

**Solution**: Run `encore db migrate` to ensure database exists.

### "Missing secrets: MEXCApiKey"

**Solution**: For User Story 1 (monitoring only), secrets are optional. WebSocket market data is public. To suppress warning:
```bash
encore secret set --type local MEXCApiKey "dummy"
encore secret set --type local MEXCSecretKey "dummy"
```

### "WebSocket connection failed"

**Check**:
1. MEXC endpoint: `wss://wbs.mexc.com/ws` is reachable
2. Network allows WebSocket connections
3. Monitor logs show reconnection attempts with backoff

**Test manually**:
```bash
websocat "wss://wbs.mexc.com/ws"
```

### "Frontend cannot reach backend"

**Check**:
1. Backend is running: `curl http://localhost:4000/health`
2. `NEXT_PUBLIC_API_BASE_URL` in `.env.local` is correct
3. CORS headers (if frontend on different port)

---

## Generating Encore Client

After API changes, regenerate the frontend client:

```bash
# From backend directory
encore gen client <APP_ID> --output=../frontend/lib/encoreClient.ts --env=local
```

**Note**: `<APP_ID>` is found in `encore.app` or Encore dashboard.

---

## Deployment

### Backend (Encore Cloud)

```bash
cd backend
encore deploy
```

Encore handles:
- Database provisioning (Neon)
- Service deployment
- Secrets management
- Metrics/logging

### Frontend (Vercel)

```bash
cd frontend
vercel deploy --prod
```

**Environment Variables** (Vercel Dashboard):
```
NEXT_PUBLIC_API_BASE_URL=https://your-encore-app.encore.app
```

---

## Monitoring in Production

### Metrics

- Encore dashboard: `https://app.encore.dev`
- Prometheus endpoint: `https://your-app.encore.app/metrics`
- Grafana (future): Import Encore metrics

### Logs

- Encore logs: Via Encore dashboard
- Frontend logs: Vercel logs dashboard

### Alerts (Future)

- Configure Prometheus alerts for:
  - WebSocket reconnections > threshold
  - Listing detection latency > 10s
  - API error rate > 5%

---

## Testing & Validation

### Inject Test Listing

To test the system without waiting for real MEXC listings, you can inject a test listing directly into the database:

```bash
# Open Postgres shell
cd backend
encore db shell
```

```sql
-- Inject a test listing
INSERT INTO listings (symbol, listed_at, source)
VALUES ('TESTUSDT', now(), 'test_injection');

-- Verify insertion
SELECT * FROM listings ORDER BY created_at DESC LIMIT 5;
```

**Expected Result**: The test listing should appear in the dashboard within 3 seconds (polling interval).

### Verify End-to-End Flow

**Step 1: Start Backend**
```bash
cd backend
encore run
```

**Step 2: Start Frontend** (in new terminal)
```bash
cd frontend
bun dev
```

**Step 3: Open Dashboard**
```
http://localhost:3000/dashboard
```

**Step 4: Test Workflow**
1. Click "Start" button in Monitor Controls
2. Verify Bot Status shows "Running" with green indicator
3. Inject test listing (see above)
4. Verify listing appears in Recent Listings table within 5s
5. Click "Stop" button
6. Verify Bot Status shows "Stopped" with gray indicator

**Step 5: Check Logs**

Backend logs should show:
- WebSocket connection events
- Listing detection events with `metric` fields
- API request latencies
- Monitor start/stop events

```bash
# Filter for metrics
cd backend
encore run 2>&1 | grep "metric"
```

Expected log patterns:
```
metric: "listings_detected_total"
metric: "websocket_reconnections_total"
metric: "api_request_duration_seconds"
metric: "monitor_active_connections"
```

---

## Next Steps

1. **Implement User Story 1**: Follow `tasks.md` (generated by `/speckit.tasks`)
2. **Test thoroughly**: Run all unit/integration/E2E tests
3. **Deploy to staging**: Use Encore preview environments
4. **Demo**: Show listing detection via dashboard
5. **Move to User Story 2**: Trade execution with dry-run mode

---

## Useful Commands Reference

```bash
# Backend
encore run                    # Start backend
encore db migrate             # Apply migrations
encore db shell               # Open Postgres shell
encore test                   # Run backend tests
encore deploy                 # Deploy to Encore Cloud

# Frontend
bun dev                       # Start Next.js dev server
bun test                      # Run Vitest tests
bun test:e2e                  # Run Playwright E2E tests
bun build                     # Build for production

# Database
encore db reset               # Reset local database
encore db conn-uri            # Get connection string

# Secrets
encore secret set MEXCApiKey "..." --type local
encore secret list            # List configured secrets
```

---

## Support & Documentation

- **Encore Docs**: https://encore.dev/docs
- **Next.js Docs**: https://nextjs.org/docs
- **MEXC API Docs**: https://mexcdevelop.github.io/apidocs/spot_v3_en/
- **Project README**: See repo root `/README.md`
- **Slice Documentation**: See `ai_docs/slices/slice1.md`

---

**Ready to start?** Run `encore run` in backend and `bun dev` in frontend, then open `http://localhost:3000/dashboard`!
