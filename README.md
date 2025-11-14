# MEXC Sniper Bot

**Status**: 🟢 User Story 1 Complete - Real-time listing monitoring  
**Version**: 0.1.0 (MVP)

Monitor new MEXC spot listings in near real-time via WebSocket with a live dashboard.

---

## ✨ Features (User Story 1)

### ✅ Real-Time Monitoring
- **WebSocket integration** with MEXC for live market data
- **Automatic listing detection** with sub-5s visibility in dashboard
- **Exponential backoff reconnection** (1s → 2s → 4s → 8s, max 30s)
- **Two-tier deduplication** (in-memory cache + database unique constraint)

### ✅ Live Dashboard
- **Bot status monitoring** with visual indicators (running/stopped/degraded)
- **Listings table** with source attribution and timestamps
- **Monitor controls** for start/stop operations
- **Real-time updates** via polling (3s interval)
- **Empty states** and loading skeletons

### ✅ Observability
- **Structured logging** with metric-style events
- **Latency tracking** for DB queries and API requests
- **WebSocket lifecycle events** (connect/disconnect/retry)
- **Source tracking** (websocket/REST API/test injection)

---

## 🏗️ Architecture

### Backend (Encore.ts)

**Services:**
- `market-monitor` - WebSocket client, listing detection, monitor control
- `api` - Health checks, listings queries with pagination

**Database:**
- PostgreSQL (Neon) with migrations
- `listings` table with unique constraints
- Performance indexes on `created_at`

**Tech Stack:**
- Encore.ts (backend framework)
- Bun (runtime & package manager)
- WebSocket (`ws` library)
- TypeScript (strict mode)

### Frontend (Next.js 16)

**Pages:**
- `/dashboard` - Main monitoring interface
- `/health` - System health check

**Components:**
- `ListingsTable` - Real-time listing display
- `BotStatusCard` - Monitor status with metrics
- `MonitorControls` - Start/stop actions

**Tech Stack:**
- Next.js 16 (App Router)
- TanStack Query (data fetching with polling)
- shadcn/ui + Tailwind CSS (UI components)
- date-fns (time formatting)

---

## 🚀 Quick Start

### Prerequisites

- **Bun** 1.x or later ([install](https://bun.sh))
- **Encore CLI** ([install](https://encore.dev/docs/install))
- **Node.js** 18+ (for tooling)
- **Git** (version control)

### 1. Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd real-time-crypto-sniping-bot-7txi

# Install backend dependencies
cd backend
bun install

# Install frontend dependencies
cd ../frontend
bun install
```

### 2. Run Database Migrations

```bash
cd backend
encore db migrate
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
encore run
# Backend runs on http://localhost:4000
# Encore dashboard: http://localhost:9400
```

**Terminal 2 - Frontend:**
```bash
cd frontend
bun dev
# Frontend runs on http://localhost:3000
```

### 4. Open Dashboard

Navigate to: **http://localhost:3000/dashboard**

### 5. Test the System

**Inject a test listing:**
```bash
cd backend
encore db shell
```

```sql
INSERT INTO listings (symbol, listed_at, source)
VALUES ('TESTUSDT', now(), 'test_injection');
```

**Expected**: Listing appears in dashboard within 3 seconds.

---

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_ENABLE_REALTIME=false
```

**Backend**: Managed via Encore (no `.env` needed)

### Optional: MEXC API Keys

For connecting to real MEXC WebSocket (public market data doesn't require auth):

```bash
encore secret set --type local MEXCApiKey "your-api-key"
encore secret set --type local MEXCSecretKey "your-secret-key"
```

*Note: User Story 1 (monitoring) works without API keys since market data is public.*

## 📡 API Endpoints

### Market Monitor Service

- `POST /monitor/start` - Start monitoring (idempotent)
  - **Response**: `{ status: "running", startedAt: string, message: string }`

- `POST /monitor/stop` - Stop monitoring (idempotent)
  - **Response**: `{ status: "stopped", stoppedAt: string, message: string }`

- `GET /monitor/status` - Get current status
  - **Response**: `{ status, lastEventAt, uptime, listingsDetected, websocketConnected, lastError }`

### API Service

- `GET /listings?limit=50&offset=0&source=mexc_websocket` - List detected listings
  - **Query Params**: `limit` (1-100), `offset`, `source` (optional filter)
  - **Response**: `{ listings[], total, limit, offset }`

- `GET /health` - System health check
  - **Response**: `{ status: "ok"|"degraded"|"error", timestamp, version, environment }`

---

## 📊 Database Schema

### Listings Table

```sql
CREATE TABLE listings (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  listed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('mexc_websocket', 'mexc_rest_api', 'test_injection')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_listing UNIQUE (symbol, listed_at)
);

CREATE INDEX idx_listings_created_at ON listings (created_at DESC);
```

**Migrations:**
- `001_crypto_bot_schema.up.sql` - Initial schema
- `002_add_indexes.up.sql` - Performance indexes

---

## 🛠️ Development

### Project Structure

```
backend/
├── market-monitor/       # WebSocket client & listing detection
│   ├── encore.service.ts
│   ├── monitor.ts        # Control endpoints
│   ├── mexcWebSocket.ts  # WebSocket client
│   ├── listingDetector.ts
│   └── backoff.ts        # Reconnection logic
├── api/                  # Dashboard API
│   ├── encore.service.ts
│   ├── health.ts
│   └── listings.ts
├── db/
│   ├── db.ts            # Database definition
│   └── migrations/
└── tests/               # Unit & integration tests

frontend/
├── app/
│   ├── dashboard/       # Main dashboard
│   │   ├── page.tsx
│   │   ├── components/  # UI components
│   │   └── hooks/       # TanStack Query hooks
│   └── health/          # Health check page
└── lib/
    └── encoreClient.ts  # Generated Encore client
```

### Useful Commands

```bash
# Backend
encore run                    # Start backend
encore db migrate             # Apply migrations
encore db shell               # Open Postgres shell
encore gen client <app-id> --output=../frontend/lib/encoreClient.ts

# Frontend
bun dev                       # Start Next.js dev server
bun build                     # Build for production

# Database
encore db reset               # Reset local database
encore db conn-uri            # Get connection string
```

---

## 🔮 Roadmap

### ✅ User Story 1: Monitor New Listings (Complete)
- Real-time WebSocket monitoring
- Dashboard with listings table
- Monitor controls (start/stop)

### 🚧 User Story 2: Safe Auto-Trade Sniping (Planned)
- Trade execution engine with <100ms latency
- Risk checks and position sizing
- Dry-run mode for testing

### 📋 User Story 3: Dashboard Configuration (Planned)
- Risk manager service
- Configuration UI for trading parameters
- Real-time risk metrics

### 📈 User Story 4: Analytics (Planned)
- Performance metrics and charts
- Trade history analysis
- Win rate and P&L tracking

---

## 📚 Documentation

- **Quickstart Guide**: `specs/001-sniper-bot-core/quickstart.md`
- **API Contracts**: `specs/001-sniper-bot-core/contracts/api-contracts.md`
- **Implementation Plan**: `specs/001-sniper-bot-core/plan.md`
- **Task Breakdown**: `specs/001-sniper-bot-core/tasks.md`
- **Encore Docs**: https://encore.dev/docs
- **MEXC API Docs**: https://mexcdevelop.github.io/apidocs/spot_v3_en/

---

## 📄 License

MIT

---

**Built with ❤️ using Encore.ts**
