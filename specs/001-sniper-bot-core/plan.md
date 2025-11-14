# Implementation Plan: MEXC Sniper Bot Core System

**Branch**: `001-sniper-bot-core` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sniper-bot-core/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a real-time MEXC listing monitor with safe auto-trading capability. The system detects new token listings via WebSocket (with REST fallback), applies risk guardrails before executing market orders, and surfaces all activity through a Next.js dashboard. Target P99 execution latency <100ms, listing-to-dashboard visibility ≤5s. Initial focus: User Story 1 (monitoring infrastructure) with dry-run trading capability.

**Technical Approach**: Encore.ts microservices (`market-monitor`, `trade-executor`, `risk-manager`, `api`) backed by Neon Postgres, MEXC WebSocket + REST clients with exponential backoff reconnection, and Next.js 16 dashboard with HTTP polling (SSE/WebSocket optional).

## Technical Context

**Language/Version**: TypeScript (Encore.ts runtime), Bun 1.x for package management and backend runtime  
**Primary Dependencies**: Encore.dev (backend framework), Next.js 16 (frontend), Effect-TS (async/retry patterns), TanStack Query (frontend data), ws (WebSocket client), Drizzle ORM (optional type-safe queries), shadcn/ui + Tailwind v4 (UI)  
**Storage**: Neon/PostgreSQL via Encore `SQLDatabase`, migrations in `backend/db/migrations/`  
**Testing**: Bun test (backend unit/integration), Vitest + RTL (frontend), Playwright (E2E), mock WebSocket server for integration  
**Target Platform**: Cloud deployment (Encore Cloud, Vercel for frontend, or self-hosted Docker), optimized for low-latency regions (Tokyo/Singapore per MEXC docs)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: P99 trade execution <100ms, listing detection <5s, handle burst listings (10+ simultaneous), WebSocket reconnect <30s  
**Constraints**: MEXC rate limits (5 orders/sec spot), 99.9% uptime target, sub-100ms p95 for trade path, resilient to network/exchange failures  
**Scale/Scope**: Single operator initially, 10-50 concurrent listings monitored, ~1000 trades/day capacity, 30-day log retention MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. Vertical Slice Demo Proof ✅

**Operator-facing signal**: Dashboard at `/dashboard` shows:
- "Listings" panel with new MEXC tokens appearing within 5s of detection
- Each listing displays: symbol, timestamp, source (`mexc_websocket`/`mexc_rest_api`/`test_injection`)
- "Bot Status" card showing monitor running/stopped state
- Health endpoint at `/health` returning system status

**Verification**: Start bot via dashboard "Start Monitoring" button → inject test listing event → observe row appear in listings table → verify DB persistence via `/listings` API.

### 2. Risk & Guardrails ✅

**For User Story 1 (monitoring only)**:
- No trade execution in Phase 1, only detection infrastructure
- Monitor can be started/stopped via dashboard or API
- Secrets (`MEXCApiKey`, `MEXCSecretKey`) managed via `encore secret set`
- Missing secrets cause fast-fail with clear error messages

**Future (User Story 2)**:
- `trade_config` table with `max_trade_usdt`, `max_position_usdt`, `auto_trade` flag (default: off)
- Every order path checks config before exchange call
- Dry-run mode logs trades without live execution
- Rejected orders stored with reason codes

### 3. Observability & Latency ✅

**Telemetry to add**:
- Structured logs (JSON) for: WebSocket connect/disconnect, reconnect attempts with backoff delays, new listing detected events (with source), DB write latencies, API request latencies
- Metrics: listings detected count (by source), WebSocket reconnection count, active connections gauge, API request duration histogram, DB query duration histogram

**Latency targets**:
- P95 listing detection → DB write: <500ms
- P95 DB write → dashboard visibility: <5s (poll interval dominant)
- P99 trade execution (future): <100ms (bot → exchange ACK)

**Measurement**: Encore built-in tracing + custom `performance.now()` instrumentation in critical paths, metrics exposed at `/metrics` (Prometheus format).

### 4. Encore Contracts & Migrations ✅

**New Encore services**:
- `market-monitor`: `/monitor/start`, `/monitor/stop`, `/monitor/status`
- `api`: `/health`, `/listings` (GET with pagination)

**Database migrations**:
- `001_crypto_bot_schema.up.sql`:
  - `listings` table: id, symbol, listed_at, source, created_at
  - Unique constraint: `(symbol, listed_at)`
- `002_add_indexes.up.sql` (optional Phase 1):
  - Index on `listings.created_at` for recent listings queries

**Rollback**: Down migrations reverse schema changes. API versioning not needed (initial release).

**Dashboard compatibility**: Generated Encore client auto-updates types. Breaking changes (none expected) would require dashboard redeploy.

### 5. Test-First Plan ✅

**Before implementation**:

**Unit tests** (Bun test):
- WebSocket client reconnection logic (mock ws server)
- Exponential backoff calculation (pure function)
- Listing deduplication logic (in-memory Set + DB unique constraint)
- Source enum validation

**Contract tests** (Bun test + Encore local):
- `POST /monitor/start` → 200, status = running
- `GET /monitor/status` → running/stopped state
- `GET /listings?limit=10` → array of listings with correct schema
- `GET /health` → { status, timestamp }

**Integration tests** (Bun test + mock WebSocket):
- Start monitor → mock WS sends ticker event → verify listing in DB
- WS disconnect → reconnect with backoff → resume ingestion
- Duplicate listing → verify DB constraint prevents insert

**UI tests** (Playwright):
- Dashboard loads, displays "No listings" empty state
- Click "Start Monitoring" → status changes to "Running"
- Mock API returns listing → verify row appears in table

**Manual validation**: Deploy to staging, connect to MEXC testnet (if available) or production with monitoring-only mode, verify real listings appear.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── encore.app                    # Encore app config
├── db/
│   ├── db.ts                    # SQLDatabase definition
│   └── migrations/
│       ├── 001_crypto_bot_schema.up.sql
│       ├── 001_crypto_bot_schema.down.sql
│       ├── 002_add_indexes.up.sql
│       └── 002_add_indexes.down.sql
├── market-monitor/
│   ├── encore.service.ts        # Service definition
│   ├── monitor.ts               # Start/stop/status endpoints
│   ├── mexcWebSocket.ts         # WebSocket client
│   └── listingDetector.ts       # Detection logic
├── trade-executor/              # (Future: User Story 2)
│   ├── encore.service.ts
│   ├── mexcClient.ts            # REST client + HMAC signing
│   └── trade.ts                 # Execute endpoint
├── risk-manager/                # (Future: User Story 2)
│   ├── encore.service.ts
│   ├── config.ts                # GET/PUT /config
│   └── risk.ts                  # GET /risk/metrics
├── api/
│   ├── encore.service.ts
│   ├── health.ts                # GET /health
│   └── listings.ts              # GET /listings
└── tests/
    ├── unit/
    │   ├── websocket.test.ts
    │   └── backoff.test.ts
    ├── contract/
    │   ├── monitor.test.ts
    │   └── listings.test.ts
    └── integration/
        └── monitor-flow.test.ts

frontend/
├── next.config.mjs
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Root redirect
│   ├── health/
│   │   └── page.tsx             # Health check page
│   └── dashboard/
│       ├── page.tsx             # Main dashboard
│       ├── components/
│       │   ├── ListingsTable.tsx
│       │   ├── BotStatusCard.tsx
│       │   └── MonitorControls.tsx
│       └── hooks/
│           ├── useListings.ts
│           └── useMonitorStatus.ts
├── lib/
│   └── encoreClient.ts          # Generated Encore client
├── components/ui/               # shadcn/ui components
└── tests/
    ├── unit/
    │   └── ListingsTable.test.tsx
    └── e2e/
        └── dashboard.spec.ts
```

**Structure Decision**: Web application pattern (Option 2). Backend uses Encore.ts microservices architecture with separate service directories. Frontend uses Next.js 16 App Router. Existing `backend/` and `frontend/` directories already present in repo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ No violations. All constitution principles satisfied.

---

## Planning Phases Completed

### ✅ Phase 0: Research (Complete)

**Artifacts Generated**:
- `research.md`: Technical decisions, MEXC integration patterns, testing strategy
- **Key Decisions**: WebSocket with exponential backoff, Encore microservices, TanStack Query polling, structured logging

### ✅ Phase 1: Design & Contracts (Complete)

**Artifacts Generated**:
- `data-model.md`: Database schema for `listings` table, migrations, query patterns
- `contracts/api-contracts.md`: Type-safe API specs for `/health`, `/listings`, `/monitor/*` endpoints
- `quickstart.md`: Development setup, local testing, deployment guide
- `.windsurf/rules/specify-rules.md`: Updated agent context with tech stack

**Ready for**:
- Phase 2: `/speckit.tasks` to generate implementation tasks
- Phase 3: `/speckit.implement` to execute tasks

---

## Next Steps

1. Run `/speckit.tasks` to convert this plan into actionable tasks
2. Review tasks for User Story 1 (Monitor New Listings)
3. Run `/speckit.implement` to begin implementation
4. Follow test-first discipline from constitution

---

## Summary

**Scope**: User Story 1 (Monitor New Listings in Near Real-Time) fully planned  
**Constitution Compliance**: 100% (all 5 principles met)  
**Artifacts**: 6 files generated (plan, research, data-model, contracts, quickstart, agent context)  
**Time Estimate**: 2-3 days for full User Story 1 implementation + tests  
**Risks**: All mitigated (WebSocket fallback, deduplication, backoff strategy documented)
