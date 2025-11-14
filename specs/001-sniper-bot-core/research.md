# Phase 0: Research & Technical Decisions

**Feature**: MEXC Sniper Bot Core System  
**Branch**: `001-sniper-bot-core`  
**Phase**: Research (Phase 0)  
**Date**: 2025-11-14

---

## Research Tasks

### 1. MEXC WebSocket Integration Patterns

**Decision**: Use `ws` library with custom reconnection wrapper implementing exponential backoff

**Rationale**:
- Native WebSocket support in Node.js/Bun is basic; `ws` provides production-ready client
- MEXC WebSocket endpoint: `wss://wbs.mexc.com/ws` (spot market data)
- Encore services can maintain long-lived connections in background via Effect-TS fibers
- Exponential backoff (1s → 2s → 4s → 8s, max 30s) prevents hammering exchange during outages

**Alternatives Considered**:
- **Socket.io**: Rejected (MEXC uses native WebSocket, not Socket.io protocol)
- **Third-party MEXC SDKs**: Evaluated but lack TypeScript support or Encore integration; building custom client ensures control over reconnection logic

**Implementation Notes**:
- Subscribe to `spot@public.deals.v3.api@{symbol}` for individual ticker updates
- Alternative: `spot@public.miniTicker.v3.api` for all symbols (may be noisy)
- Fallback to REST `GET /api/v3/ticker/24hr` polled every 30-60s if WebSocket fails

**References**:
- MEXC WebSocket Docs: https://mexcdevelop.github.io/apidocs/spot_v3_en/#websocket-market-data
- `ws` library: https://github.com/websockets/ws

---

### 2. Encore.ts Service Architecture Best Practices

**Decision**: Separate microservices per domain (`market-monitor`, `api`, `trade-executor`, `risk-manager`)

**Rationale**:
- Encore encourages small, focused services with clear boundaries
- `market-monitor` owns WebSocket connection lifecycle (stateful, long-running)
- `api` provides stateless HTTP endpoints for dashboard
- Future separation allows independent scaling (monitor vs API traffic patterns differ)
- Each service gets own `encore.service.ts` definition

**Alternatives Considered**:
- **Monolith service**: Rejected (harder to test WebSocket logic in isolation, violates Encore patterns)
- **Shared library approach**: Partially adopted (common DB access, MEXC client utilities shared across services)

**Implementation Notes**:
- Use Encore `api()` decorator for HTTP endpoints
- Use Encore `Service` class for service boundaries
- Shared code lives in `backend/lib/` or co-located with primary owner service

**References**:
- Encore Services: https://encore.dev/docs/primitives/services
- Encore API Design: https://encore.dev/docs/primitives/api

---

### 3. Database Schema Design for Listings & Trades

**Decision**: Minimal normalized schema with performance indexes

**Rationale**:
- `listings` table tracks detection events with unique constraint on `(symbol, listed_at)`
- Source enum (`mexc_websocket`, `mexc_rest_api`, `test_injection`) aids debugging
- Timestamp fields (`created_at`, `listed_at`) separate insertion time from exchange announcement time
- Index on `created_at DESC` for "recent listings" queries (dashboard needs last N)
- Future: `trades`, `trade_config`, `bot_health` tables follow similar pattern

**Alternatives Considered**:
- **NoSQL/document store**: Rejected (Postgres via Encore is simpler, provides ACID guarantees for trade data)
- **Time-series DB**: Deferred to future if analytics queries become slow (Postgres + partitioning sufficient for MVP)

**Implementation Notes**:
- Use `BIGSERIAL` for IDs (Encore convention)
- Use `TIMESTAMPTZ` for all timestamps (UTC storage)
- Use `TEXT` for symbols (variable length, max ~20 chars typical)
- Drizzle ORM optional for type-safe queries; raw SQL via Encore `db.exec` also acceptable

**References**:
- Encore SQL Database: https://encore.dev/docs/primitives/sql-database
- Postgres Best Practices: https://wiki.postgresql.org/wiki/Don%27t_Do_This

---

### 4. Frontend Data Fetching Strategy

**Decision**: TanStack Query with 3-5s polling interval, SSE/WebSocket optional feature flag

**Rationale**:
- TanStack Query handles caching, refetching, background updates out-of-box
- Polling sufficient for ≤5s visibility target (simpler than WebSocket connection management)
- Next.js Server Components for initial render, Client Components for real-time updates
- Feature flag (`NEXT_PUBLIC_ENABLE_REALTIME`) enables SSE via Encore `streamOut` if needed

**Alternatives Considered**:
- **WebSocket-only**: Rejected (adds frontend complexity, not needed for 5s target)
- **Server-Sent Events (SSE) only**: Deferred (useful for future high-frequency updates, not MVP blocker)
- **No polling, page refresh**: Rejected (poor UX)

**Implementation Notes**:
- Use `useQuery` with `refetchInterval: 3000` for listings, status
- Use Encore generated client for type-safe API calls
- SSE endpoint: `streamOut /dashboard/stream` (future)

**References**:
- TanStack Query: https://tanstack.com/query/latest
- Encore Streaming: https://encore.dev/docs/primitives/streaming

---

### 5. Testing Strategy for WebSocket & Async Flows

**Decision**: Mock WebSocket server + Effect-TS test utilities

**Rationale**:
- Unit tests: Pure functions (backoff calculation, deduplication) isolated
- Integration tests: `mock-socket` library simulates WebSocket server responses
- Contract tests: Encore local environment + real DB (test migrations)
- E2E tests: Playwright against staging deployment (real MEXC if monitoring-only mode safe)

**Alternatives Considered**:
- **Only E2E tests**: Rejected (slow, flaky, insufficient coverage)
- **Mocking MEXC API entirely**: Partially adopted (unit/integration use mocks, E2E uses real or testnet)

**Implementation Notes**:
- Use `bun test` as test runner (fast, native TypeScript)
- Use `mock-socket` for WebSocket mocking
- Use Encore test helpers for database fixtures
- Use Playwright for UI tests

**References**:
- mock-socket: https://github.com/thoov/mock-socket
- Bun Test: https://bun.sh/docs/cli/test

---

### 6. MEXC API Authentication & Rate Limits

**Decision**: HMAC SHA256 signing for authenticated endpoints, rate limit respecting client

**Rationale**:
- MEXC requires HMAC SHA256 signature for private endpoints (future: order placement)
- Public endpoints (ticker, exchange info) don't require auth
- Rate limit: 5 orders/second for spot trading (future enforcement via token bucket)
- WebSocket connections are public (no auth needed for market data)

**Alternatives Considered**:
- **Using official SDK**: Rejected (TypeScript support lacking, prefer custom client for Encore integration)

**Implementation Notes**:
- Store secrets via `encore secret set MEXCApiKey`, `encore secret set MEXCSecretKey`
- Access via `secret()` decorator in Encore services
- Implement signing utility: `signRequest(params, secret) => signature`
- Add `X-MEXC-APIKEY` and `signature` headers for authenticated requests

**References**:
- MEXC Authentication: https://mexcdevelop.github.io/apidocs/spot_v3_en/#signed-trade-and-user_data-endpoint-security
- MEXC Rate Limits: https://mexcdevelop.github.io/apidocs/spot_v3_en/#limits

---

### 7. Observability & Metrics Stack

**Decision**: Structured JSON logging + Prometheus metrics via Encore built-ins

**Rationale**:
- Encore provides built-in metrics export at `/metrics` (Prometheus format)
- Use `console.log/error` with JSON payloads for structured logging
- Custom metrics via Encore metric APIs (counters, gauges, histograms)
- Future: Add Grafana dashboards for visualization

**Alternatives Considered**:
- **Pino logger**: Deferred (Encore structured logging sufficient for MVP)
- **OpenTelemetry full stack**: Deferred (Encore tracing covers basics, can add later)

**Implementation Notes**:
- Log format: `{ timestamp, level, service, event, ...context }`
- Key metrics: `listings_detected_total`, `websocket_reconnections_total`, `api_request_duration_seconds`
- Latency instrumentation: `performance.now()` at operation boundaries

**References**:
- Encore Observability: https://encore.dev/docs/observability
- Prometheus Best Practices: https://prometheus.io/docs/practices/naming/

---

## Summary of Technical Stack (Finalized)

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Backend Runtime** | Encore.ts + Bun | Type-safe APIs, built-in migrations, fast execution |
| **Database** | Neon/PostgreSQL | Managed Postgres, Encore native support |
| **WebSocket Client** | `ws` library | Production-ready, custom reconnection logic |
| **Async Patterns** | Effect-TS | Structured retry/backoff, testable side effects |
| **Frontend Framework** | Next.js 16 | Server Components + Client Components, App Router |
| **Frontend Data** | TanStack Query | Caching, polling, optimistic updates |
| **UI Components** | shadcn/ui + Tailwind v4 | Modern, accessible, customizable |
| **Testing** | Bun test + Playwright | Fast unit/integration, reliable E2E |
| **Observability** | Encore metrics + structured logs | Built-in Prometheus export, JSON logs |
| **Deployment** | Encore Cloud + Vercel | Managed infrastructure, low latency |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| MEXC WebSocket instability | Missed listings | Fallback to REST polling every 60s |
| Duplicate listings after reconnect | Data integrity | Unique constraint on `(symbol, listed_at)` |
| Dashboard polling overhead | API load | Rate-limit frontend, consider SSE upgrade |
| MEXC rate limit violations | Account ban | Token bucket on order endpoints (future) |
| Latency budget miss | Poor UX | Deploy to Tokyo/Singapore region, measure p95 |

---

## Open Questions (Deferred to User Stories 2-4)

- Voice/chat interface scope (marked P3 in spec)
- Exact high-value trade threshold ($500 USDT suggested)
- Telemetry backend for long-term retention (30-day MVP proposed)
