# API Contracts: MEXC Sniper Bot Core System

**Feature**: User Story 1 - Monitor New Listings  
**Branch**: `001-sniper-bot-core`  
**Date**: 2025-11-14

---

## Encore Service: `api`

Base path: `/`  
Service type: HTTP REST API

### GET /health

**Purpose**: Health check endpoint for liveness/readiness probes

**Request**: None

**Response**: 200 OK
```typescript
{
  status: "ok" | "degraded" | "error";
  timestamp: string; // ISO 8601
  version?: string;
  environment?: string;
}
```

**Errors**: None (always returns 200 with status field)

**Example**:
```bash
curl https://api.example.com/health
```

```json
{
  "status": "ok",
  "timestamp": "2025-11-14T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

---

### GET /listings

**Purpose**: Retrieve recent listings with pagination

**Request Query Parameters**:
- `limit` (optional, number, default: 50, max: 100): Number of listings to return
- `offset` (optional, number, default: 0): Pagination offset
- `source` (optional, string): Filter by source (`mexc_websocket`, `mexc_rest_api`, `test_injection`)

**Response**: 200 OK
```typescript
{
  listings: Array<{
    id: number;
    symbol: string;
    listedAt: string; // ISO 8601
    source: "mexc_websocket" | "mexc_rest_api" | "test_injection";
    createdAt: string; // ISO 8601
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

**Errors**:
- 400 Bad Request: Invalid query parameters
```json
{
  "code": "invalid_argument",
  "message": "limit must be between 1 and 100"
}
```

**Example**:
```bash
curl "https://api.example.com/listings?limit=10&source=mexc_websocket"
```

```json
{
  "listings": [
    {
      "id": 123,
      "symbol": "BTCUSDT",
      "listedAt": "2025-11-14T12:00:00.000Z",
      "source": "mexc_websocket",
      "createdAt": "2025-11-14T12:00:01.234Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## Encore Service: `market-monitor`

Base path: `/monitor`  
Service type: HTTP REST API

### POST /monitor/start

**Purpose**: Start market monitoring (WebSocket connection + listing detection)

**Request**: None (idempotent - safe to call multiple times)

**Response**: 200 OK
```typescript
{
  status: "running";
  startedAt: string; // ISO 8601
  message: string;
}
```

**Errors**:
- 500 Internal Server Error: Failed to start (e.g., missing secrets)
```json
{
  "code": "internal",
  "message": "Missing required secrets: MEXCApiKey, MEXCSecretKey"
}
```

**Example**:
```bash
curl -X POST https://api.example.com/monitor/start
```

```json
{
  "status": "running",
  "startedAt": "2025-11-14T12:00:00.000Z",
  "message": "Market monitor started successfully"
}
```

---

### POST /monitor/stop

**Purpose**: Stop market monitoring (closes WebSocket connection gracefully)

**Request**: None (idempotent)

**Response**: 200 OK
```typescript
{
  status: "stopped";
  stoppedAt: string; // ISO 8601
  message: string;
}
```

**Errors**: None (always succeeds, even if already stopped)

**Example**:
```bash
curl -X POST https://api.example.com/monitor/stop
```

```json
{
  "status": "stopped",
  "stoppedAt": "2025-11-14T12:05:00.000Z",
  "message": "Market monitor stopped successfully"
}
```

---

### GET /monitor/status

**Purpose**: Get current monitoring status

**Request**: None

**Response**: 200 OK
```typescript
{
  status: "running" | "stopped" | "degraded";
  lastEventAt: string | null; // ISO 8601, last listing detected
  uptime: number | null; // seconds since start (null if stopped)
  listingsDetected: number; // total count since start
  websocketConnected: boolean;
  lastError: string | null;
}
```

**Errors**: None

**Example**:
```bash
curl https://api.example.com/monitor/status
```

```json
{
  "status": "running",
  "lastEventAt": "2025-11-14T12:04:30.000Z",
  "uptime": 300,
  "listingsDetected": 5,
  "websocketConnected": true,
  "lastError": null
}
```

---

## Type Definitions (Shared)

### ListingSource (Enum)

```typescript
type ListingSource = "mexc_websocket" | "mexc_rest_api" | "test_injection";
```

### MonitorStatus (Enum)

```typescript
type MonitorStatus = "running" | "stopped" | "degraded";
```

### HealthStatus (Enum)

```typescript
type HealthStatus = "ok" | "degraded" | "error";
```

---

## Error Response Format (Standard)

All API errors follow Encore's standard error format:

```typescript
{
  code: string; // Error code (e.g., "invalid_argument", "internal", "not_found")
  message: string; // Human-readable error message
  details?: Record<string, any>; // Optional additional context
}
```

**Common Error Codes**:
- `invalid_argument`: Bad request parameters (400)
- `failed_precondition`: Operation cannot proceed (e.g., missing config) (400)
- `not_found`: Resource not found (404)
- `internal`: Internal server error (500)
- `unavailable`: Service temporarily unavailable (503)

---

## Rate Limiting

**User Story 1**: No rate limiting (monitoring-only, low traffic)

**Future (User Story 2)**: 
- `/trade/execute`: 5 requests/second (MEXC limit)
- Other endpoints: 100 requests/second per IP

---

## Versioning

**Current**: No API versioning (initial release)

**Future**: Breaking changes will use `/v2/` prefix or new service namespace

---

## Authentication

**User Story 1**: No authentication (public dashboard, internal deployment)

**Future**: Consider adding API keys or OAuth for external access

---

## CORS Configuration

**Frontend**: `NEXT_PUBLIC_API_BASE_URL` environment variable points to Encore backend

**CORS Headers** (if frontend deployed separately):
```
Access-Control-Allow-Origin: https://dashboard.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Encore Client Generation

The Encore CLI generates a type-safe TypeScript client:

```bash
encore gen client <APP_ID> --output=./frontend/lib/encoreClient.ts --env=production
```

**Usage in Frontend**:
```typescript
import { encoreClient } from '@/lib/encoreClient';

// Type-safe API calls
const { listings } = await encoreClient.api.listings({ limit: 10 });
const status = await encoreClient.marketMonitor.status();
await encoreClient.marketMonitor.start();
```

---

## Testing Contracts

### Contract Test Example (Bun test)

```typescript
import { test, expect } from "bun:test";
import { encoreClient } from "./encoreClient";

test("GET /health returns ok status", async () => {
  const health = await encoreClient.api.health();
  expect(health.status).toBe("ok");
  expect(health.timestamp).toBeDefined();
});

test("GET /listings returns array", async () => {
  const { listings } = await encoreClient.api.listings({ limit: 5 });
  expect(Array.isArray(listings)).toBe(true);
  expect(listings.length).toBeLessThanOrEqual(5);
});

test("POST /monitor/start succeeds", async () => {
  const result = await encoreClient.marketMonitor.start();
  expect(result.status).toBe("running");
});
```

---

## Summary

- **3 endpoints** for User Story 1: `/health`, `/listings`, `/monitor/*`
- **Type-safe** via Encore generated client
- **Standard error handling** with Encore error codes
- **No authentication** for MVP (internal deployment)
- **Future**: Add trade execution, config, risk metrics endpoints (User Stories 2-4)
