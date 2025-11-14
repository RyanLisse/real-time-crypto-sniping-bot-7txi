# Feature Specification: MEXC Sniper Bot Core System

**Feature Branch**: `001-sniper-bot-core`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description and design docs from `slice1.md`, `encore_plan.md`, and `plan.MD` describing a real-time MEXC sniping bot with Encore/TS backend, Postgres ledger, and Next.js 16 dashboard.

---

## Clarifications

### Session 2025-11-14

- Q: Which MEXC data source(s) should the bot use to detect new listings? → A: Primary WebSocket + fallback REST polling (calendar/listing announcements endpoint)
- Q: How should the system determine if a listing is new vs. already recorded? → A: Unique constraint on (symbol, listed_at) to allow tracking of relists
- Q: How should the dashboard receive listing updates? → A: Hybrid: polling by default (TanStack Query with 3-5 second interval), SSE/WebSocket optional feature flag
- Q: What backoff strategy should be used for WebSocket reconnection attempts? → A: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Q: What values should the `source` field capture? → A: `mexc_websocket`, `mexc_rest_api`, `test_injection`

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Monitor New Listings in Near Real-Time (Priority: P1)

An operator wants to see new MEXC spot listings appear in a dashboard within seconds so they can decide whether to trade or let the bot auto-trade.

**Why this priority**  
Without reliable, low-latency detection and visibility, there is nothing to snipe and no way to validate the bot.

**Independent Test**  
With the bot running in "monitor only" mode, when MEXC lists a new token (or a mocked listing is injected), the operator sees it appear in the dashboard's "Listings" panel within a few seconds, with correct symbol, timestamp, and source.

**Acceptance Scenarios**

1. **Given** the market monitor is started and connected to MEXC,  
   **When** a new listing appears on MEXC,  
   **Then** a corresponding row is persisted in the listings table and rendered in the dashboard within N seconds (configurable, default ≤5s).

2. **Given** the monitor is running and a temporary MEXC connection failure occurs,  
   **When** the connection is restored,  
   **Then** the monitor reconnects using exponential backoff (1s, 2s, 4s, 8s, max 30s) and continues ingesting listings without duplicating entries (enforced by unique constraint on symbol + listed_at).

3. **Given** the operator has the dashboard open,  
   **When** new listings arrive,  
   **Then** the listings table updates (via HTTP polling with 3-5s interval by default, or optionally via SSE/WebSocket if feature flag enabled) without requiring a full page reload.

---

### User Story 2 – Safe Auto-Trade Sniping for New Listings (Priority: P1)

An operator wants the bot to automatically place constrained market buy orders on new listings under strict risk limits and latency goals.

**Why this priority**  
The product's value is in automating fast, controlled entry into new listings while staying within defined risk.

**Independent Test**  
In a controlled environment with test API keys or dry-run mode, when a mock listing arrives, the bot sends a market buy request within the latency budget, applies risk checks, and records the trade, visible in the dashboard.

**Acceptance Scenarios**

1. **Given** valid API credentials and a configured `trade_config` (max trade, max position, auto-trade flag),  
   **When** a new eligible listing is detected and auto-trade is enabled,  
   **Then** the bot submits a MARKET BUY order using `quoteOrderQty`, logs latency, and persists the trade with status and mode (`dry-run` or `live`).

2. **Given** a listing arrives with a desired `quoteOrderQty` above configured limits,  
   **When** the bot evaluates the order,  
   **Then** the trade is rejected before hitting the exchange, and the rejection reason is logged and recorded.

3. **Given** auto-trade is disabled,  
   **When** listings arrive,  
   **Then** no live orders are sent; instead, trades are simulated as dry-run with metrics and stored for analysis.

4. **Given** network or exchange errors occur during trade execution,  
   **When** the bot attempts to place an order,  
   **Then** it applies retry and/or circuit-breaking rules without creating duplicate or stale orders and records a clear error status.

---

### User Story 3 – Operate and Inspect the Bot via Dashboard (Priority: P2)

An operator wants a single dashboard to view health, risk metrics, and trade history, and to adjust configuration without touching code.

**Why this priority**  
Without a clear control panel, the system is opaque and unsafe to operate.

**Independent Test**  
Using only the dashboard, an operator can start/stop monitoring, adjust risk config, observe health and metrics, and confirm that changes affect system behavior.

**Acceptance Scenarios**

1. **Given** the bot is deployed and reachable,  
   **When** the operator visits `/health` and `/dashboard`,  
   **Then** they see system health, version, and environment, with a clear indication if any critical component is degraded.

2. **Given** the operator updates configuration (max trade size, auto-trade flag, etc.) via the UI,  
   **When** they save changes,  
   **Then** the backend validates and persists them, and subsequent trades respect the new settings.

3. **Given** trades have been executed or simulated,  
   **When** the operator opens the dashboard's trade history and risk metrics sections,  
   **Then** they see recent trades with latency metrics and aggregated exposure/risk data.

---

### User Story 4 – Post-Trade Analysis & Audit (Priority: P3)

Risk/quant staff want to review historical performance, latency distributions, and risk compliance.

**Why this priority**  
Analytics and auditability are critical to improving strategies and proving safety.

**Independent Test**  
Given historical data, stakeholders can answer "how fast did we trade", "how often did we violate targets", and "were risk limits respected".

**Acceptance Scenarios**

1. **Given** sufficient trade history,  
   **When** the operator queries performance analytics,  
   **Then** they see P50/P95/P99 latencies, counts, and error rates over a chosen window.

2. **Given** trades and configs have changed over time,  
   **When** an auditor inspects the system,  
   **Then** they can reconstruct which config and limits applied to each trade and whether any guardrail was breached.

---

### Edge Cases

- MEXC WebSocket or REST endpoints are unavailable or rate-limited.  
- Exchange returns partial or malformed data for listings or orders.  
- Bot restarts while in-flight orders or connections are active.  
- Multiple listings arrive in rapid succession (burst traffic).  
- Missing or misconfigured secrets/API keys.  
- Operator configures invalid risk parameters (negative amounts, contradictory limits).  
- Extremely illiquid or mispriced listings (e.g., sudden trading halts).  
- [NEEDS CLARIFICATION: Whether voice/chat-driven trading interface is in scope for the first release or reserved for a later phase.]

---

## Vertical Slice Demo Signal *(mandatory)*

Primary proof of value for this feature is:

- Start the bot from the dashboard (or CLI).  
- See a new listing appear on the "Listings" panel shortly after MEXC lists it (or after injecting a test event).  
- For an enabled auto-trade scenario, see a corresponding (dry-run or live) trade appear in "Trades" with latency metadata and status.  
- Observe risk metrics and health indicators update accordingly.

This can be demonstrated in a non-production environment using test keys or a simulated MEXC feed.

---

## Risk & Guardrail Requirements *(mandatory)*

- All order execution must respect configured risk limits (`max_trade_usdt`, `max_position_usdt`, global toggles for trading vs dry-run).  
- No order may be sent without valid configuration and secrets; missing inputs must fail fast with explicit errors.  
- Auto-trade must default to **off** unless explicitly enabled by the operator.  
- Large trades above a configurable threshold may require additional confirmation or be forced into dry-run.  
- Rate limits and circuit breakers must prevent hitting exchange-imposed limits or causing bans.  
- Every trade and rejected attempt must be recorded with reason codes for later audit.  
- [NEEDS CLARIFICATION: Exact thresholds for "high-value trade" confirmations and whether MFA/secondary confirmation is required.]

---

## Observability & Latency Targets *(mandatory)*

- Track per-operation latency for:
  - Listing detection path (MEXC → bot → DB → dashboard).  
  - Trade execution path (bot → MEXC → DB → dashboard).  
- Targets:
  - P99 order latency < 100 ms from decision to exchange ACK (excluding exchange-side delays beyond control).  
  - Listing-to-dashboard visibility generally within ≤ 5 seconds under normal conditions.  
- Emit structured logs for:
  - Connection lifecycle (connect/disconnect, retries with backoff delays).  
  - Listing detection events (source: websocket vs REST, deduplication hits).  
  - Risk-check decisions and trade outcomes.  
  - Configuration changes and operator actions.  
- Provide metrics suitable for dashboards (e.g., counts, failure rates, latency histograms).  
- [NEEDS CLARIFICATION: Exact telemetry backend(s) and retention periods required by the business.]

---

## Encore Contracts & Data Changes *(mandatory)*

The system must expose type-safe APIs and persist data for:

- **Listings**
  - Fields: `symbol`, `listed_at`, `source`, created timestamps.  
  - Endpoints: e.g., `GET /listings` with pagination/limit.  

- **Trades**
  - Fields: `symbol`, `side`, `quote_qty`, `latency_ms`, mode (`dry-run`/`live`), status, timestamps.  
  - Endpoints: e.g., `GET /trade/history`, `POST /trade/execute`.  

- **Trade Configuration**
  - Fields: `max_trade_usdt`, `max_position_usdt`, `auto_trade`, timestamps.  
  - Endpoints: `GET /config`, `PUT /config`.  

- **Bot Health / Monitor Status**
  - Fields: component name, status, last event time, updated timestamps.  
  - Endpoints: `GET /monitor/status`, `POST /monitor/start`, `POST /monitor/stop`, plus `/health`.

APIs must be backward compatible when possible; breaking changes require documented migration and dashboard compatibility plan.

---

## Test-First Strategy *(mandatory)*

Before implementing major flows, define tests for:

- Listing detection:
  - Unit tests for parsing and symbol detection.  
  - Integration tests using mocked WebSocket streams.  

- Trade execution:
  - Unit tests for risk-check logic and order payload construction.  
  - Integration tests with mocked exchange API, including failure and timeout paths.  

- Configuration & risk:
  - Tests verifying invalid configs are rejected and defaults applied correctly.  

- Dashboard:
  - UI tests (RTL/Playwright) to verify health, listings, trades, and metrics render as expected and refresh via polling/streaming.

Manual validation steps (for non-automatable aspects) must be documented with responsible owners and environments.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST monitor MEXC for new spot listings via primary WebSocket connection with fallback to REST API polling (calendar/announcements endpoint) and persist them as listing records with unique constraint on (symbol, listed_at).  
- **FR-002**: System MUST expose an API and UI for viewing recent listings, including symbol, timestamps, and source.  
- **FR-003**: System MUST allow operators to configure trading parameters (max trade size, max position, auto-trade flag, etc.) via API and UI.  
- **FR-004**: System MUST apply risk checks to every proposed trade and reject trades that violate configured limits.  
- **FR-005**: System MUST support both "dry-run" and "live" trading modes and clearly label trades with their mode.  
- **FR-006**: System MUST execute MARKET BUY orders for eligible listings using a quote amount (e.g., USDT) and record latency and status.  
- **FR-007**: System MUST provide a dashboard summarizing health, monitoring status, risk metrics, and trade history, with listing/trade updates delivered via HTTP polling by default (3-5s interval) and optionally via SSE/WebSocket when feature flag is enabled.  
- **FR-008**: System MUST handle MEXC API errors and rate limits gracefully, with exponential backoff for reconnections (1s, 2s, 4s, 8s, capped at 30s) and clear error reporting including connection lifecycle events.  
- **FR-009**: System MUST maintain an audit trail of configuration changes and executed/rejected trades.  
- **FR-010**: System MUST provide health endpoints for basic liveness/ready checks consumable by operators and infra.  

Examples of clarifications:

- **FR-011**: System MUST expose APIs or endpoints for external automation to start/stop monitoring and toggle auto-trading.  
- **FR-012**: System MUST support safe rollout and rollback of configuration changes, ensuring consistency across processes.

---

### Key Entities *(include if feature involves data)*

- **Listing**
  - Represents a new tradable token detected on MEXC.  
  - Attributes: symbol (string), listed_at (timestamp), source (enum: `mexc_websocket`, `mexc_rest_api`, `test_injection`), created_at (timestamp), possibly market metadata.
  - Constraints: Unique on (symbol, listed_at) to prevent duplicates while allowing relist tracking.

- **Trade**
  - Represents a single trade attempt (dry-run or live) associated with a listing.  
  - Attributes: symbol, side, quote amount, mode, latency, status, created_at, error reason (if any).

- **TradeConfig**
  - Represents current risk/trading configuration.  
  - Attributes: max trade size, max position, auto-trade flag, high-value thresholds, created_at/updated_at.

- **BotHealth**
  - Represents health and status of monitoring and trading services.  
  - Attributes: component name, status, last event time, updated_at.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: P99 order latency from decision to exchange ACK is < 100 ms under expected load in the target region.  
- **SC-002**: New listings appear in the dashboard within ≤ 5 seconds of detection in ≥ 99% of cases.  
- **SC-003**: 100% of trade attempts either respect configured risk limits or are rejected, with no "silent" limit violations.  
- **SC-004**: At least 80% test coverage on core monitoring, trading, and risk modules.  
- **SC-005**: System recovers from process restarts without losing configuration or corrupting state, with no more than one missed listing/trade per restart event in test scenarios.  
- **SC-006**: Operators can complete the full "start bot → observe listing → observe (dry-run) trade → inspect metrics" flow through the dashboard alone, without direct code or CLI access.

---
