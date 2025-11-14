# Phase 1: Data Model

**Feature**: MEXC Sniper Bot Core System  
**Branch**: `001-sniper-bot-core`  
**Phase**: Design (Phase 1)  
**Date**: 2025-11-14

---

## Entity Definitions

### Listing

**Purpose**: Tracks new token listings detected from MEXC

**Attributes**:
- `id` (BIGSERIAL, PRIMARY KEY): Auto-incrementing identifier
- `symbol` (TEXT, NOT NULL): Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT")
- `listed_at` (TIMESTAMPTZ, NOT NULL): When MEXC announced/listed the token
- `source` (TEXT, NOT NULL): Detection source (enum: `mexc_websocket`, `mexc_rest_api`, `test_injection`)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now()): When this row was inserted

**Constraints**:
- UNIQUE (`symbol`, `listed_at`): Prevents duplicate detection, allows tracking relists
- CHECK (`source` IN ('mexc_websocket', 'mexc_rest_api', 'test_injection')): Enum validation

**Indexes**:
- PRIMARY KEY on `id` (automatic)
- INDEX on `created_at DESC`: Fast queries for recent listings (dashboard use case)
- UNIQUE INDEX on `(symbol, listed_at)`: Deduplication enforcement

**Relationships**: None (standalone entity in User Story 1)

**Lifecycle**:
1. **Created**: When market-monitor detects new listing via WebSocket or REST
2. **Read**: Dashboard queries for display, analytics queries for performance metrics
3. **Never Updated**: Immutable audit trail
4. **Never Deleted**: Retained for historical analysis (future: archive old listings)

---

### BotHealth (Future: User Story 3)

**Purpose**: Tracks operational status of bot services

**Attributes**:
- `id` (BIGSERIAL, PRIMARY KEY)
- `component_name` (TEXT, NOT NULL): Service identifier (e.g., "market-monitor", "trade-executor")
- `status` (TEXT, NOT NULL): Current status (enum: `running`, `stopped`, `degraded`, `error`)
- `last_event_at` (TIMESTAMPTZ): Timestamp of last significant event
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now()): Last status change

**Constraints**:
- UNIQUE (`component_name`): One row per service
- CHECK (`status` IN ('running', 'stopped', 'degraded', 'error'))

---

### TradeConfig (Future: User Story 2)

**Purpose**: Stores risk management configuration

**Attributes**:
- `id` (BIGSERIAL, PRIMARY KEY)
- `max_trade_usdt` (NUMERIC(12,2), NOT NULL): Maximum quote amount per trade
- `max_position_usdt` (NUMERIC(12,2), NOT NULL): Maximum total exposure
- `auto_trade` (BOOLEAN, NOT NULL, DEFAULT false): Enable live trading (default: off)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

**Constraints**:
- CHECK (`max_trade_usdt > 0`)
- CHECK (`max_position_usdt >= max_trade_usdt`)

**Lifecycle**:
1. **Created**: Seeded with default values on first deploy
2. **Updated**: Via `PUT /config` endpoint (dashboard or API)
3. **Read**: Before every trade execution to enforce limits

---

### Trade (Future: User Story 2)

**Purpose**: Records trade execution attempts and outcomes

**Attributes**:
- `id` (BIGSERIAL, PRIMARY KEY)
- `symbol` (TEXT, NOT NULL): Trading pair
- `side` (TEXT, NOT NULL): Order side (enum: `BUY`, `SELL`)
- `quote_qty` (NUMERIC(12,2), NOT NULL): USDT amount
- `base_qty` (NUMERIC(18,8)): Filled base token amount (NULL if rejected/dry-run)
- `latency_ms` (INTEGER, NOT NULL): Execution latency (decision → exchange ACK)
- `mode` (TEXT, NOT NULL): Execution mode (enum: `dry-run`, `live`)
- `status` (TEXT, NOT NULL): Outcome (enum: `filled`, `rejected`, `failed`, `pending`)
- `error_reason` (TEXT): If status = rejected/failed, why
- `exchange_order_id` (TEXT): MEXC order ID (NULL if dry-run/rejected)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

**Constraints**:
- CHECK (`side` IN ('BUY', 'SELL'))
- CHECK (`mode` IN ('dry-run', 'live'))
- CHECK (`status` IN ('filled', 'rejected', 'failed', 'pending'))
- CHECK (`latency_ms >= 0`)

**Indexes**:
- INDEX on `created_at DESC`: Recent trades queries
- INDEX on `symbol`: Per-symbol trade history
- INDEX on `status`: Filter by outcome

---

## Database Migrations

### Migration 001: Initial Schema

**File**: `backend/db/migrations/001_crypto_bot_schema.up.sql`

```sql
-- Listings table
CREATE TABLE listings (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  listed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('mexc_websocket', 'mexc_rest_api', 'test_injection')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_listing UNIQUE (symbol, listed_at)
);

-- Index for recent listings queries (dashboard)
CREATE INDEX idx_listings_created_at ON listings (created_at DESC);

COMMENT ON TABLE listings IS 'Tracks new token listings detected from MEXC';
COMMENT ON COLUMN listings.source IS 'Detection source: mexc_websocket | mexc_rest_api | test_injection';
```

**Rollback**: `backend/db/migrations/001_crypto_bot_schema.down.sql`

```sql
DROP TABLE IF EXISTS listings;
```

---

### Migration 002: Add Performance Indexes (Optional)

**File**: `backend/db/migrations/002_add_indexes.up.sql`

```sql
-- Composite index for source-specific queries (if analytics needs it)
CREATE INDEX idx_listings_source_created ON listings (source, created_at DESC);

-- Partial index for recent listings only (last 7 days)
CREATE INDEX idx_listings_recent ON listings (created_at DESC) 
  WHERE created_at > now() - INTERVAL '7 days';
```

**Rollback**: `backend/db/migrations/002_add_indexes.down.sql`

```sql
DROP INDEX IF EXISTS idx_listings_source_created;
DROP INDEX IF EXISTS idx_listings_recent;
```

---

### Future Migrations (User Stories 2-4)

**Migration 003**: Add `bot_health` table  
**Migration 004**: Add `trade_config` table with default seed data  
**Migration 005**: Add `trades` table  

---

## Data Validation Rules

### Listing Entity

| Field | Validation | Error Message |
|-------|-----------|---------------|
| `symbol` | Required, 3-20 chars, alphanumeric+underscore | "Invalid symbol format" |
| `listed_at` | Required, not future timestamp | "listed_at cannot be in the future" |
| `source` | Required, enum value | "source must be: mexc_websocket, mexc_rest_api, or test_injection" |
| `(symbol, listed_at)` | Unique | "Listing already recorded" (409 Conflict) |

---

## State Transitions

### Listing Lifecycle

```
[New Token on MEXC]
        ↓
[Detected via WS or REST] ← (exponential backoff on failure)
        ↓
[Deduplicate (in-memory Set + DB unique constraint)]
        ↓
[Insert into `listings` table] ← (DB constraint prevents duplicates)
        ↓
[Success: Listing record created]
        ↓
[Dashboard polls `/listings` → sees new row]
```

**No state changes**: Listings are immutable audit trail

---

## Query Patterns & Performance

### Dashboard: Recent Listings

**Query**:
```sql
SELECT id, symbol, listed_at, source, created_at
FROM listings
ORDER BY created_at DESC
LIMIT 50;
```

**Index Used**: `idx_listings_created_at`  
**Expected Performance**: <10ms for 50 rows, <50ms for 1000 rows

---

### Analytics: Listings by Source (Future)

**Query**:
```sql
SELECT source, COUNT(*) as count
FROM listings
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY source;
```

**Index Used**: `idx_listings_source_created` (if created)  
**Expected Performance**: <50ms for 1000 rows

---

### Deduplication Check (Application Logic)

**Logic**:
```typescript
// In-memory cache for fast dedup (recent symbols)
const recentSymbols = new Set<string>();

async function recordListing(symbol: string, listedAt: Date, source: string) {
  // Fast path: check in-memory cache
  const key = `${symbol}:${listedAt.toISOString()}`;
  if (recentSymbols.has(key)) {
    return { duplicate: true };
  }

  try {
    // Insert with unique constraint (DB-level dedup)
    await BotDB.exec`
      INSERT INTO listings (symbol, listed_at, source)
      VALUES (${symbol}, ${listedAt}, ${source})
    `;
    
    recentSymbols.add(key);
    return { duplicate: false };
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation
      return { duplicate: true };
    }
    throw err;
  }
}
```

---

## Data Retention & Archival (Future)

**Current**: No deletion, unlimited retention (MVP)

**Future Considerations**:
- Archive listings older than 90 days to cold storage (S3, BigQuery)
- Partition `listings` table by month for query performance
- Add `archived_at` column and `is_archived` boolean for soft deletes

---

## Summary

- **User Story 1**: Single `listings` table with unique constraint for deduplication
- **User Stories 2-4**: Add `bot_health`, `trade_config`, `trades` tables
- **Performance**: Indexes on `created_at DESC` for fast recent queries
- **Validation**: DB constraints + application-level enum checks
- **Immutability**: Listings never updated/deleted (audit trail)
