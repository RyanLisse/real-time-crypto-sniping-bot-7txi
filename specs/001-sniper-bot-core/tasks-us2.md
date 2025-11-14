# User Story 2 Tasks: Safe Auto-Trade Sniping

**Status**: Phase 1 Complete (Core Infrastructure) | Phase 2 In Progress  
**Branch**: `001-sniper-bot-core`  
**Date**: 2025-11-14

---

## Phase 1: Core Infrastructure ✅ COMPLETE

**Purpose**: Database schema, risk checks, dry-run mode, audit trail

- [x] T071 Create database migration `003_trade_tables.up.sql` with `trade_config` and `trades` tables
- [x] T072 [P] Create rollback migration `003_trade_tables.down.sql`
- [x] T073 [P] Seed default configuration (max_trade=$100, max_position=$1000, auto_trade=false)
- [x] T074 [P] Update `backend/risk-manager/config.ts` with spec-aligned configuration interface
- [x] T075 Implement `GET /config` endpoint in `backend/risk-manager/config.ts`
- [x] T076 Implement `PUT /config` endpoint with constraint validation
- [x] T077 [P] Create `backend/trade-executor/risk-check.ts` with risk validation logic
- [x] T078 Implement auto-trade flag check in risk-check module
- [x] T079 Implement max_trade_usdt validation
- [x] T080 Implement max_position_usdt validation (24hr rolling window)
- [x] T081 [P] Rewrite `backend/trade-executor/executor.ts` with dry-run/live mode support
- [x] T082 Implement dry-run execution path (simulated trades)
- [x] T083 Add placeholder for live execution path (TODO: MEXC integration)
- [x] T084 [P] Update `backend/trade-executor/types.ts` with User Story 2 enums and fields
- [x] T085 [P] Rewrite `backend/trade-executor/history.ts` for audit trail endpoint
- [x] T086 Implement pagination and filtering in trade history endpoint
- [x] T087 [P] Write unit tests for risk check logic in `backend/tests/unit/risk-check.test.ts`
- [x] T088 [P] Write unit tests for trade config validation in `backend/tests/unit/trade-config.test.ts`
- [x] T089 Run backend unit tests and verify 100% pass rate (42/42 tests)
- [x] T090 Commit and push Phase 1 implementation

**Checkpoint**: ✅ Phase 1 complete - 42/42 tests passing, dry-run mode operational

---

## Phase 2: MEXC Integration & Dashboard UI

**Purpose**: Live trading capability, dashboard controls, E2E testing

### MEXC Trading Client (Live Execution)

**Service: trade-executor**

- [ ] T091 [P] [US2] Create `backend/trade-executor/mexc-client.ts` with HMAC signature utility
- [ ] T092 [US2] Implement HMAC-SHA256 signature generation for MEXC API authentication
- [ ] T093 [US2] Implement timestamp synchronization with MEXC server
- [ ] T094 [P] [US2] Create `placeMarketBuyOrder()` function with quoteOrderQty parameter
- [ ] T095 [US2] Implement order status polling with timeout (5s max)
- [ ] T096 [US2] Add retry logic with exponential backoff for transient errors
- [ ] T097 [US2] Integrate MEXC client into `executor.ts` live execution path
- [ ] T098 [US2] Add structured logging for all MEXC API calls (request/response/errors)
- [ ] T099 [US2] Handle MEXC error codes (rate limits, insufficient balance, invalid symbol)
- [ ] T100 [US2] Store exchange_order_id and base_qty in trades table on success
- [ ] T101 [US2] Add latency instrumentation: decision → exchange ACK

### Encore Secrets Configuration

- [ ] T102 [P] [US2] Document MEXC API key setup in `specs/001-sniper-bot-core/quickstart.md`
- [ ] T103 [US2] Add secret validation on app startup (fail-fast if missing)
- [ ] T104 [US2] Test live execution in dry-run mode with mock MEXC responses

### Dashboard UI for Trades & Configuration

**Frontend Pages & Components**

- [ ] T105 [P] [US2] Create `frontend/app/dashboard/trades/page.tsx` with trades table layout
- [ ] T106 [P] [US2] Create `frontend/app/dashboard/trades/components/TradesTable.tsx`
- [ ] T107 [P] [US2] Display columns: symbol, side, quoteQty, mode, status, latencyMs, createdAt, errorReason
- [ ] T108 [P] [US2] Add status badges (filled=green, rejected=yellow, failed=red, pending=blue)
- [ ] T109 [P] [US2] Add mode badges (dry-run=gray, live=purple)
- [ ] T110 [P] [US2] Implement pagination controls (limit, offset)
- [ ] T111 [P] [US2] Add filter dropdowns (mode, status)
- [ ] T112 [P] [US2] Create `frontend/app/dashboard/config/page.tsx` for configuration panel
- [ ] T113 [P] [US2] Create `frontend/app/dashboard/config/components/ConfigForm.tsx`
- [ ] T114 [US2] Add input fields: maxTradeUsdt, maxPositionUsdt, highValueThresholdUsdt
- [ ] T115 [US2] Add toggle switch for autoTrade with warning modal
- [ ] T116 [US2] Implement form validation (positive amounts, position >= trade)
- [ ] T117 [US2] Display current configuration with timestamps
- [ ] T118 [P] [US2] Add "Test Trade" button for dry-run execution

**Data Hooks & API Integration**

- [ ] T119 [P] [US2] Create `frontend/app/dashboard/trades/hooks/useTrades.ts` with TanStack Query
- [ ] T120 [P] [US2] Create `frontend/app/dashboard/config/hooks/useConfig.ts` with TanStack Query
- [ ] T121 [US2] Regenerate Encore client with `encore gen client` for new endpoints
- [ ] T122 [US2] Implement config update mutation with optimistic updates
- [ ] T123 [US2] Add polling interval (10s) for trades table refresh
- [ ] T124 [US2] Add real-time update toast notifications for new trades

**UI Styling & UX**

- [ ] T125 [P] [US2] Style TradesTable with shadcn/ui Table and responsive design
- [ ] T126 [P] [US2] Style ConfigForm with shadcn/ui Form components
- [ ] T127 [P] [US2] Add confirmation dialog for enabling auto_trade
- [ ] T128 [P] [US2] Add empty state for "No trades yet"
- [ ] T129 [P] [US2] Add loading skeleton for trades table

### Testing for User Story 2

**Unit Tests (Backend)**

- [ ] T130 [P] [US2] Write unit tests for HMAC signature generation in `backend/tests/unit/mexc-signature.test.ts`
- [ ] T131 [P] [US2] Write unit tests for order validation in `backend/tests/unit/order-validation.test.ts`

**Contract Tests (Backend)**

- [ ] T132 [P] [US2] Write contract test for `POST /trade/execute` with dry-run mode
- [ ] T133 [P] [US2] Write contract test for `POST /trade/execute` with risk rejection
- [ ] T134 [P] [US2] Write contract test for `GET /trade/history` with filters
- [ ] T135 [P] [US2] Write contract test for `GET /config`
- [ ] T136 [P] [US2] Write contract test for `PUT /config` with validation

**Integration Tests (Backend)**

- [ ] T137 [US2] Write integration test for trade execution flow (risk check → DB → response)
- [ ] T138 [US2] Write integration test for config update → trade execution respecting new limits
- [ ] T139 [US2] Write integration test for position limit enforcement (multi-trade scenario)

**UI Tests (Frontend)**

- [ ] T140 [P] [US2] Write component test for TradesTable with mock data
- [ ] T141 [P] [US2] Write component test for ConfigForm validation
- [ ] T142 [P] [US2] Write component test for auto_trade toggle warning

**E2E Tests**

- [ ] T143 [US2] Write E2E test: Load config page → update limits → verify saved
- [ ] T144 [US2] Write E2E test: Execute test trade → verify appears in trades table
- [ ] T145 [US2] Write E2E test: Enable auto_trade → verify confirmation modal → toggle switch

### Observability & Metrics for User Story 2

- [ ] T146 [P] [US2] Add metrics: `trades_executed_total` (by mode, status)
- [ ] T147 [P] [US2] Add metrics: `trade_execution_latency_seconds` histogram
- [ ] T148 [P] [US2] Add metrics: `risk_checks_rejected_total` (by reason)
- [ ] T149 [P] [US2] Add metrics: `config_updates_total`
- [ ] T150 [US2] Verify metrics exposed via structured logs

### Documentation & Validation for User Story 2

- [ ] T151 [P] [US2] Update `specs/001-sniper-bot-core/quickstart.md` with User Story 2 workflows
- [ ] T152 [P] [US2] Document trade execution flow (dry-run → live transition)
- [ ] T153 [P] [US2] Document risk check logic and rejection reasons
- [ ] T154 [P] [US2] Update README.md with User Story 2 features
- [ ] T155 [US2] Run all User Story 2 tests and verify 100% pass rate
- [ ] T156 [US2] Verify constitution compliance: vertical slice (config → trade → dashboard), risk guardrails, observability
- [ ] T157 [US2] Manual validation: Configure limits → execute dry-run trade → observe in dashboard
- [ ] T158 [US2] Manual validation: Enable auto_trade → execute test trade → verify live mode (if MEXC testnet available)

**Checkpoint**: User Story 2 should be fully functional with dry-run and live modes, dashboard controls, and comprehensive testing.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (T071-T090): ✅ COMPLETE
- **Phase 2** (T091-T158): Depends on Phase 1 completion

### Phase 2 Task Dependencies

**Group 1 - MEXC Client** (can start after Phase 1):
- T091-T104: MEXC trading client with HMAC auth

**Group 2 - Dashboard UI** (parallel to Group 1):
- T105-T129: Trades table and config panel

**Group 3 - Tests** (can start alongside implementation):
- T130-T145: Unit, contract, integration, UI, E2E tests

**Group 4 - Observability** (after services complete):
- T146-T150: Metrics instrumentation

**Group 5 - Documentation** (final phase):
- T151-T158: Docs and validation

### Parallel Opportunities

**After Phase 1, launch 4 work streams**:

1. **MEXC Integration**: T091-T104 (MEXC client and live execution)
2. **Dashboard UI**: T105-T129 (trades table, config panel)
3. **Testing**: T130-T145 (all test types)
4. **Observability & Docs**: T146-T158 (metrics and validation)

**Solo developer recommended order**:
1. T091-T104 (MEXC client)
2. T105-T129 (Dashboard UI)
3. T130-T145 (Tests)
4. T146-T158 (Metrics and docs)

---

## Task Count Summary

| Phase | Task Count | Parallelizable | Sequential |
|-------|-----------|----------------|------------|
| Phase 1 (Complete) | 20 | 12 (60%) | 8 |
| Phase 2 (MEXC) | 14 | 6 (43%) | 8 |
| Phase 2 (Dashboard) | 25 | 18 (72%) | 7 |
| Phase 2 (Testing) | 16 | 11 (69%) | 5 |
| Phase 2 (Metrics & Docs) | 13 | 7 (54%) | 6 |
| **Total User Story 2** | **88** | **54 (61%)** | **34** |

---

## Constitution Compliance Verification

✅ **Vertical Slice Demo**: Config → Execute Trade → Dashboard displays result with mode/status  
✅ **Risk & Guardrails**: auto_trade defaults to false, all limits enforced, dry-run by default  
✅ **Observability**: Logs for all decisions, metrics for trades/risks/config, latency tracking  
✅ **Encore Contracts**: Migration 003, config/trade/history endpoints, client generation  
✅ **Test-First**: 42 tests in Phase 1, comprehensive test suite in Phase 2 before live trading

**Ready for**: Phase 2 implementation (T091-T158)
