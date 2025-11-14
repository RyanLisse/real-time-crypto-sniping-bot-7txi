---
description: "Task list for MEXC Sniper Bot Core System implementation"
---

# Tasks: MEXC Sniper Bot Core System

**Input**: Design documents from `/specs/001-sniper-bot-core/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-contracts.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Constitution Alignment Checklist

Before detailing per-story work, ensure tasks cover:

1. **Vertical slice verification** – Capture the operator-facing proof (dashboard view, CLI output, alert) that demonstrates the story end-to-end.
2. **Risk & guardrails** – Include updates to `trade_config`, auto-trade toggles, safety limits, and regression tests for dry-run/live flows.
3. **Observability & latency** – Add instrumentation/logging/metrics tasks and verification of p95 latency targets.
4. **Encore contracts & migrations** – Enumerate schema/API/client generation work with rollback items.
5. **Test-first work** – Specify tests written/executed before implementation (unit, contract, UI). Manual validation steps must list owners and evidence.

## Path Conventions

- **Web app**: `backend/`, `frontend/`
- Backend uses Encore.ts microservices architecture
- Frontend uses Next.js 16 App Router

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify Bun 1.x and Encore CLI are installed and configured
- [x] T002 Install backend dependencies in `backend/` via `bun install`
- [x] T003 [P] Install frontend dependencies in `frontend/` via `bun install`
- [ ] T004 [P] Configure linting and formatting tools (follow `.specify/templates/agent-file-template.md` if exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create `backend/db/db.ts` with Encore `SQLDatabase` definition for "crypto-bot" database
- [x] T006 [P] Create database migration `backend/db/migrations/001_crypto_bot_schema.up.sql` with `listings` table schema
- [x] T007 [P] Create rollback migration `backend/db/migrations/001_crypto_bot_schema.down.sql`
- [x] T008 Run `encore db migrate` to apply initial schema locally (happens automatically with `encore run`)
- [x] T009 [P] Create `backend/db/migrations/002_add_indexes.up.sql` with performance indexes
- [x] T010 [P] Create rollback migration `backend/db/migrations/002_add_indexes.down.sql`
- [x] T011 Configure Encore secrets for local development (MEXCApiKey, MEXCSecretKey) - already configured in Encore vault
- [x] T012 [P] Set up environment variables for frontend in `frontend/.env.local` (NEXT_PUBLIC_API_BASE_URL)
- [x] T013 [P] Install and configure shadcn/ui components in `frontend/components/ui/`
- [ ] T014 Verify Encore app runs locally (`encore run`) and dashboard is accessible

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Monitor New Listings in Near Real-Time (Priority: P1) 🎯 MVP

**Goal**: Operator sees new MEXC spot listings appear in dashboard within seconds

**Independent Test**: Start bot in "monitor only" mode → inject test listing → verify it appears in dashboard "Listings" panel within 5s with correct symbol, timestamp, and source

### Backend Infrastructure for User Story 1

**Service: market-monitor**

- [ ] T015 [P] [US1] Create `backend/market-monitor/encore.service.ts` with Encore Service definition
- [ ] T016 [P] [US1] Create `backend/market-monitor/mexcWebSocket.ts` with WebSocket client wrapper using `ws` library
- [ ] T017 [US1] Implement exponential backoff utility function in `backend/market-monitor/backoff.ts` (1s, 2s, 4s, 8s, max 30s)
- [ ] T018 [US1] Implement WebSocket connection lifecycle with reconnection logic in `backend/market-monitor/mexcWebSocket.ts`
- [ ] T019 [P] [US1] Create `backend/market-monitor/listingDetector.ts` with symbol detection and deduplication logic
- [ ] T020 [US1] Implement in-memory cache (Set<string>) for fast deduplication in `backend/market-monitor/listingDetector.ts`
- [ ] T021 [US1] Implement DB persistence with unique constraint handling in `backend/market-monitor/listingDetector.ts`
- [ ] T022 [P] [US1] Create `backend/market-monitor/monitor.ts` with Encore API endpoints: `POST /monitor/start`, `POST /monitor/stop`, `GET /monitor/status`
- [ ] T023 [US1] Implement WebSocket subscription to MEXC market data stream in `backend/market-monitor/mexcWebSocket.ts`
- [ ] T024 [US1] Add structured logging for connection lifecycle events (connect/disconnect/retry) in `backend/market-monitor/mexcWebSocket.ts`
- [ ] T025 [US1] Add structured logging for listing detection events with source attribution in `backend/market-monitor/listingDetector.ts`

**Service: api**

- [ ] T026 [P] [US1] Create `backend/api/encore.service.ts` with Encore Service definition
- [ ] T027 [P] [US1] Create `backend/api/health.ts` with `GET /health` endpoint returning system status
- [ ] T028 [P] [US1] Create `backend/api/listings.ts` with `GET /listings` endpoint (pagination support: limit, offset, source filter)
- [ ] T029 [US1] Implement query logic for recent listings with `created_at DESC` ordering in `backend/api/listings.ts`
- [ ] T030 [US1] Add latency instrumentation using `performance.now()` for DB queries in `backend/api/listings.ts`

### Frontend for User Story 1

**Dashboard Pages**

- [ ] T031 [P] [US1] Create `frontend/app/health/page.tsx` with health check display
- [ ] T032 [P] [US1] Create `frontend/app/dashboard/page.tsx` with main dashboard layout
- [ ] T033 [P] [US1] Create `frontend/app/dashboard/components/ListingsTable.tsx` displaying listings with columns: symbol, listedAt, source, createdAt
- [ ] T034 [P] [US1] Create `frontend/app/dashboard/components/BotStatusCard.tsx` showing monitor running/stopped state
- [ ] T035 [P] [US1] Create `frontend/app/dashboard/components/MonitorControls.tsx` with Start/Stop buttons

**Data Hooks**

- [ ] T036 [P] [US1] Create `frontend/app/dashboard/hooks/useListings.ts` using TanStack Query with 3s polling interval
- [ ] T037 [P] [US1] Create `frontend/app/dashboard/hooks/useMonitorStatus.ts` using TanStack Query with 5s polling interval
- [ ] T038 [US1] Generate Encore client in `frontend/lib/encoreClient.ts` using `encore gen client` command
- [ ] T039 [US1] Implement start/stop monitor actions in `frontend/app/dashboard/components/MonitorControls.tsx` using Encore client

**UI Styling**

- [ ] T040 [P] [US1] Style ListingsTable component with Tailwind CSS and shadcn/ui Table primitives
- [ ] T041 [P] [US1] Style BotStatusCard with status indicators (running=green, stopped=gray, degraded=yellow)
- [ ] T042 [P] [US1] Add empty state handling for "No listings yet" in ListingsTable

### Testing for User Story 1

**Unit Tests (Backend)**

- [ ] T043 [P] [US1] Write unit test for exponential backoff calculation in `backend/tests/unit/backoff.test.ts`
- [ ] T044 [P] [US1] Write unit test for listing deduplication logic in `backend/tests/unit/deduplication.test.ts`
- [ ] T045 [P] [US1] Write unit test for source enum validation in `backend/tests/unit/source-validation.test.ts`

**Contract Tests (Backend)**

- [ ] T046 [P] [US1] Write contract test for `POST /monitor/start` endpoint in `backend/tests/contract/monitor.test.ts`
- [ ] T047 [P] [US1] Write contract test for `GET /monitor/status` endpoint in `backend/tests/contract/monitor.test.ts`
- [ ] T048 [P] [US1] Write contract test for `GET /listings` endpoint with pagination in `backend/tests/contract/listings.test.ts`
- [ ] T049 [P] [US1] Write contract test for `GET /health` endpoint in `backend/tests/contract/health.test.ts`

**Integration Tests (Backend)**

- [ ] T050 [US1] Write integration test for WebSocket connection lifecycle (connect → disconnect → reconnect with backoff) in `backend/tests/integration/websocket-lifecycle.test.ts`
- [ ] T051 [US1] Write integration test for listing detection flow (WS event → DB persist → query via API) in `backend/tests/integration/listing-flow.test.ts`
- [ ] T052 [US1] Write integration test for duplicate listing handling (DB unique constraint) in `backend/tests/integration/duplicate-handling.test.ts`

**UI Tests (Frontend)**

- [ ] T053 [P] [US1] Write component test for ListingsTable with mock data in `frontend/tests/unit/ListingsTable.test.tsx`
- [ ] T054 [P] [US1] Write component test for BotStatusCard state changes in `frontend/tests/unit/BotStatusCard.test.tsx`

**E2E Tests**

- [ ] T055 [US1] Write E2E test for full user journey: load dashboard → start monitor → verify listings appear in `frontend/tests/e2e/dashboard.spec.ts`

### Observability & Metrics for User Story 1

- [ ] T056 [P] [US1] Add metrics counters: `listings_detected_total` (by source), `websocket_reconnections_total` in `backend/market-monitor/monitor.ts`
- [ ] T057 [P] [US1] Add metrics histogram: `api_request_duration_seconds` in `backend/api/listings.ts`
- [ ] T058 [P] [US1] Add metrics gauge: `monitor_active_connections` in `backend/market-monitor/mexcWebSocket.ts`
- [ ] T059 [US1] Verify metrics are exposed at `/metrics` endpoint (Prometheus format) via Encore

### Documentation & Validation for User Story 1

- [ ] T060 [P] [US1] Document test listing injection procedure in `specs/001-sniper-bot-core/quickstart.md`
- [ ] T061 [US1] Run all User Story 1 tests and verify 100% pass rate
- [ ] T062 [US1] Verify constitution compliance: vertical slice demo (dashboard shows listings), observability (logs/metrics present), test coverage (≥80%)
- [ ] T063 [US1] Manual validation: Deploy to local Encore environment, connect to MEXC testnet or production (monitoring-only), verify real listings appear in dashboard within 5s

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Operator can start monitor, observe new listings, and stop monitor via dashboard.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories (after US1 is complete)

- [ ] T064 [P] Update README.md with quickstart instructions and architecture overview
- [ ] T065 [P] Add error boundary components in frontend for graceful error handling
- [ ] T066 [P] Implement loading states and skeletons in dashboard for better UX
- [ ] T067 Code cleanup and refactoring: extract shared utilities, remove dead code
- [ ] T068 [P] Add Playwright configuration and example E2E test setup
- [ ] T069 Run quickstart.md validation (follow all steps, ensure they work)
- [ ] T070 [P] Add CI/CD workflow stub (GitHub Actions or similar) for future automation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story 1 completion

### User Story 1 Task Dependencies

**Within User Story 1, tasks can be parallelized as follows**:

**Group 1 - Backend Foundation** (can start after Foundational phase):
- T015-T021: market-monitor service setup and core logic

**Group 2 - Backend APIs** (parallel to Group 1):
- T026-T030: api service setup and endpoints

**Group 3 - Frontend** (can start after T038 Encore client generation):
- T031-T042: Dashboard pages and components

**Group 4 - Tests** (can start alongside implementation):
- T043-T055: All test tasks can run in parallel

**Group 5 - Metrics** (can start after backend services are complete):
- T056-T059: Observability instrumentation

**Sequential Dependencies**:
1. T005-T014 (Foundational) MUST complete before any US1 tasks
2. T038 (Encore client generation) must complete before T039 (using client in frontend)
3. T061-T063 (validation) must be last

### Parallel Opportunities

**Maximum parallelization** (if team capacity allows):

**After Foundational phase completes, launch 4 work streams**:

1. **Backend Stream 1**: T015-T025 (market-monitor service)
2. **Backend Stream 2**: T026-T030 (api service)
3. **Frontend Stream**: T031-T042 (dashboard, after T038 client generation)
4. **Testing Stream**: T043-T055 (all tests, using mocks initially)
5. **Metrics Stream**: T056-T059 (after respective services exist)

**Minimal parallelization** (solo developer):
- Complete T015-T025 (backend services) first
- Then T026-T030 (API endpoints)
- Then T038-T042 (frontend)
- Then T043-T055 (tests)
- Then T056-T063 (metrics and validation)

---

## Parallel Execution Example: User Story 1

**Scenario**: 2 developers working concurrently

### Developer A - Backend Focus

```bash
# Day 1-2: Backend services
T005-T014 (Foundational)
T015-T025 (market-monitor)
T026-T030 (api)
T056-T059 (metrics)

# Day 3: Backend tests
T043-T052 (unit/contract/integration tests)
```

### Developer B - Frontend Focus

```bash
# Day 1: Wait for Foundational, then frontend setup
T031-T037 (dashboard pages and hooks, after T038 client)

# Day 2: Frontend polish
T040-T042 (styling and UX)

# Day 3: Frontend tests
T053-T055 (component and E2E tests)
```

### Integration Point

Both developers converge on **Day 3** for:
- T061-T063 (validation and manual testing)
- T064-T070 (polish and documentation)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T014) - **CRITICAL: Blocks all stories**
3. Complete Phase 3: User Story 1 (T015-T063)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Run all tests: `bun test` (backend), `bun test` (frontend)
   - Manual validation: Start monitor via dashboard, observe real listings
   - Constitution check: Verify vertical slice, observability, test coverage
5. Deploy/demo if ready

**Estimated Time**: 2-3 days (solo), 1.5-2 days (pair)

### Incremental Delivery (Future User Stories)

**After User Story 1 is validated and merged**:

1. **User Story 2** (Safe Auto-Trade Sniping): Add trade-executor service, risk checks, dry-run mode
2. **User Story 3** (Dashboard Configuration): Add risk-manager service, config UI
3. **User Story 4** (Analytics): Add performance analytics endpoints and charts
4. **Polish** (Phase 4): Cross-cutting improvements

Each story adds value without breaking previous stories.

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[US1] label** maps task to User Story 1 for traceability
- User Story 1 should be independently completable and testable
- Verify tests fail before implementing (TDD discipline per constitution)
- Commit after each logical group of tasks
- Stop at checkpoint to validate User Story 1 independently before moving to User Story 2

---

## Task Count Summary

| Phase | Task Count | Parallelizable | Sequential |
|-------|-----------|----------------|------------|
| Setup | 4 | 2 (50%) | 2 |
| Foundational | 10 | 6 (60%) | 4 |
| User Story 1 | 49 | 32 (65%) | 17 |
| Polish | 7 | 5 (71%) | 2 |
| **Total** | **70** | **45 (64%)** | **25** |

**MVP Scope** (User Story 1 only): 63 tasks (Setup + Foundational + US1)

---

## Constitution Compliance Verification

✅ **Vertical Slice Demo**: Task T063 validates dashboard shows listings within 5s  
✅ **Risk & Guardrails**: Monitor-only mode (no trading), secrets via Encore (T011)  
✅ **Observability**: Logs (T024-T025), metrics (T056-T059), latency tracking (T030)  
✅ **Encore Contracts**: Migrations (T006-T010), API endpoints (T022, T027-T028), client generation (T038)  
✅ **Test-First**: Unit/contract/integration/E2E tests (T043-T055) before validation (T061-T063)

**Ready for**: `/speckit.implement` to begin execution
