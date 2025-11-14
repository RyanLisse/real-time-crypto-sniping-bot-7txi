Je repo is al lekker uitgelegd in de README (market-monitor, trade-executor, risk-manager, api). Laten we dat vertalen naar echte verticale slices waarmee je van “niets draait” naar “dashboard dat echte orders kan plaatsen” gaat – en onderweg netjes Encore.ts, Effect-TS en Next 16 benut.

Ik gebruik jouw `<SLICING_TEMPLATE>` structuur en optimaliseer meteen voor:

* **Encore.ts-services** (`market-monitor`, `trade-executor`, `risk-manager`, `api`)
* **Neon/Postgres**
* **Next.js 16 dashboard**
* **MEXC WebSocket + REST**

---

# Slice 1: Repo foundation & healthcheck

## What You're Building

Een minimaal werkende backend + frontend: Encore.ts app met een `api/health` endpoint en een Next.js 16 pagina `/health` die dit endpoint aanroept.

## Tasks

### 1. Backend bootstrap & health endpoint

* Complexity: 2
* [ ] Controleer `backend/encore.app`, `encore.service.ts` structuur (één app, meerdere services).
* [ ] Maak in `backend/api/` een `health.ts` met een simpel Encore `GET /health` endpoint.
* [ ] Voeg een minimale test toe voor de health endpoint.
* [ ] Test passes locally (`bun test` of `npm test`, afhankelijk van repo).

### 2. Frontend hookup (Next 16)

* Complexity: 2
* [ ] In `frontend/`, maak een page `app/health/page.tsx` die de backend `/health` endpoint fetcht.
* [ ] Toon simpele status (“Backend OK”, versienummer, env).
* [ ] Voeg een lichte RTL test toe voor deze pagina (of ten minste een Jest/Playwright smoke test).
* [ ] Test passes locally.

## Code Example

```ts
// backend/api/health.ts
import { api } from "encore.dev/api";

interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export const health = api(
  { method: "GET", path: "/health", expose: true },
  async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  },
);
```

```tsx
// frontend/app/health/page.tsx
async function fetchHealth() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`, {
    cache: "no-store",
  });
  return res.json() as Promise<{ status: string; timestamp: string }>;
}

export default async function HealthPage() {
  const health = await fetchHealth();

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="rounded-xl border p-6 space-y-2">
        <h1 className="text-xl font-semibold">Sniper Bot Health</h1>
        <p>Status: {health.status}</p>
        <p className="text-xs text-muted-foreground">
          Timestamp: {health.timestamp}
        </p>
      </div>
    </main>
  );
}
```

## Ready to Merge Checklist

* [ ] All tests pass
* [ ] Linting passes
* [ ] Build succeeds (backend + frontend)
* [ ] Code reviewed
* [ ] `/health` werkt in browser

## Quick Research (5–10 minuten)

**Official Docs:**

* Encore basics: [https://encore.dev/docs](https://encore.dev/docs)
* Next.js 16 app router: [https://nextjs.org/docs](https://nextjs.org/docs)

**Examples:**

* Encore “hello world”: [https://encore.dev/docs/tutorials/hello-world](https://encore.dev/docs/tutorials/hello-world)

---

# Slice 2: Database & configuration model

## What You're Building

Een Neon/Postgres schema + Encore integratie voor `trade_config`, `listings`, `trades`, `bot_health`, zodat backend en dashboard op echte data draaien.

## Tasks

### 1. Encore DB resource + migrations

* Complexity: 3
* [ ] Definieer een `SQLDatabase` resource (b.v. `backend/db/db.ts`).
* [ ] Voeg migrations toe voor: `trade_config`, `listings`, `trades`, `bot_health`.
* [ ] Zorg dat Encore lokaal kan migreren en verbinden met Neon.
* [ ] Schrijf een kleine test die een `trade_config` rij aanmaakt/oplost.

**Subtask 1.1:** DB resource

* Complexity: 1
* `SQLDatabase("crypto-bot", { migrations: "./migrations" })` toevoegen.

**Subtask 1.2:** Eerste migration files

* Complexity: 2
* `001_*` basic schema, `002_*` uitbreiding voor performance (indexes op symbol/timestamp).

### 2. Config API endpoints

* Complexity: 3
* [ ] Maak in `risk-manager` een `GET /config` en `PUT /config` endpoint op Encore API-laag.
* [ ] Map deze naar de `trade_config` tabel via `db.exec`/`db.queryRow`.
* [ ] Tests: roundtrip get/update config.
* [ ] Test passes locally.

## Code Example

```ts
// backend/db/db.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";

export const BotDB = new SQLDatabase("crypto-bot", {
  migrations: "./migrations",
});
```

```sql
-- backend/db/migrations/001_crypto_bot_schema.up.sql
CREATE TABLE trade_config (
  id BIGSERIAL PRIMARY KEY,
  max_position_usdt NUMERIC NOT NULL,
  max_trade_usdt NUMERIC NOT NULL,
  auto_trade BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE listings (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  listed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trades (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  quote_qty NUMERIC NOT NULL,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Ready to Merge Checklist

* [ ] `encore db migrate` succesvol
* [ ] Config endpoints getest
* [ ] Frontend kan `GET /config` aanroepen (mag nog dummy UI zijn)

## Quick Research

**Docs:**

* Encore SQL DB: [https://encore.dev/docs/primitives/sql-database](https://encore.dev/docs/primitives/sql-database)

---

# Slice 3: MEXC client & secrets (trading skeleton)

## What You're Building

Een Encore `trade-executor` service met veilige secrets en een type-safe MEXC REST-client (nog zonder echte live orders).

## Tasks

### 1. Secrets & client wrapper

* Complexity: 3
* [ ] Definieer secrets in Encore (`MEXCApiKey`, `MEXCSecretKey`).
* [ ] Maak `backend/trade-executor/mexcClient.ts` met een kleine wrapper: `ping`, `serverTime`, `exchangeInfo`.
* [ ] Alle calls via `fetch` met HMAC-signing helper.
* [ ] Tests: mock fetch, verifieer signature en endpoint.

**Subtask 1.1:** Secrets

* Complexity: 1
* `secret("MEXCApiKey")`, `secret("MEXCSecretKey")` en CLI setup.

**Subtask 1.2:** Signing helper

* Complexity: 2
* Kleine pure functie `signQuery(params, secret)` die een `signature` param teruggeeft.

### 2. Healthcheck MEXC endpoint

* Complexity: 2
* [ ] Encore endpoint `GET /exchange/health` die `GET /api/v3/time` + `GET /api/v3/exchangeInfo` aanroept.
* [ ] Response: latencies, reachable boolean.
* [ ] Tests: happy path + failure/missing secret.

## Code Example

```ts
// backend/trade-executor/mexcSecrets.ts
import { secret } from "encore.dev/config";

export const mexcApiKey = secret("MEXCApiKey");
export const mexcSecretKey = secret("MEXCSecretKey");
```

```ts
// backend/trade-executor/mexcClient.ts
import crypto from "node:crypto";

const MEXC_BASE_URL = "https://api.mexc.com";

export interface SignedRequestParams {
  [key: string]: string | number;
}

function signParams(params: SignedRequestParams, secret: string): string {
  const query = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();

  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function getServerTime() {
  const res = await fetch(`${MEXC_BASE_URL}/api/v3/time`);
  if (!res.ok) throw new Error("MEXC time failed");
  return res.json() as Promise<{ serverTime: number }>;
}
```

## Ready to Merge Checklist

* [ ] Secrets staan in Encore env
* [ ] `/exchange/health` werkt (en faalt netjes zonder secrets)
* [ ] Tests mocken MEXC calls, geen echte netwerk calls in CI

## Quick Research

**Docs:**

* MEXC Spot API: [https://www.mexc.com/api-docs/spot-v3/introduction](https://www.mexc.com/api-docs/spot-v3/introduction)

---

# Slice 4: Market monitor service (WebSocket + listing detectie)

## What You're Building

De `market-monitor` service: WebSocket connectie naar MEXC, basis loop die nieuwe symbols detecteert en ze in `listings` schrijft.

## Tasks

### 1. Encore service skeleton + control endpoints

* Complexity: 3
* [ ] Maak `backend/market-monitor/encore.service.ts` + `monitor.ts`.
* [ ] API endpoints (zoals in README):

  * `POST /monitor/start`
  * `POST /monitor/stop`
  * `GET /monitor/status`
* [ ] Status opslaan in `bot_health` tabel.
* [ ] Tests voor start/stop/status (zonder echte WS).

### 2. WebSocket loop + listing detection

* Complexity: 4
* [ ] Implementeer WebSocket connectie naar MEXC (ticker/market stream; eventueel meerdere streams).
* [ ] Houd een in-memory `Set<string>` met bekende symbols.
* [ ] Als nieuw symbol gezien wordt → schrijf naar `listings` via `BotDB`.
* [ ] Voeg simpele Effect-TS style retry/backoff rond WS connectie.
* [ ] Tests: gebruik een in-memory/mock WebSocket server.

**Subtask 2.1:** WS client infrastructuur

* Complexity: 2
* Abstracteer WebSocket client in aparte module zodat je hem kunt mocken.

**Subtask 2.2:** Detection & persistence

* Complexity: 2
* Functie die “oude symbolen” ↔ “nieuwe symbolen” diff’t en schrijft.

## Code Example

```ts
// backend/market-monitor/encore.service.ts
import { Service } from "encore.dev/service";

export default new Service("market-monitor");
```

```ts
// backend/market-monitor/monitor.ts
import { api } from "encore.dev/api";
import { BotDB } from "../db/db";

interface MonitorStatus {
  running: boolean;
  lastEventAt: string | null;
}

export const start = api(
  { method: "POST", path: "/monitor/start", expose: true },
  async (): Promise<MonitorStatus> => {
    // TODO: trigger background WS loop (Effect-TS fiber, etc.)
    await BotDB.exec`
      INSERT INTO bot_health (name, status, updated_at)
      VALUES ('market-monitor', 'running', now())
      ON CONFLICT (name)
      DO UPDATE SET status = 'running', updated_at = now();
    `;
    return { running: true, lastEventAt: null };
  },
);
```

## Ready to Merge Checklist

* [ ] Start/stop/status endpoints werken
* [ ] In logs zie je connect/disconnect
* [ ] Nieuwe symbolen worden in `listings` geschreven (lokale test/fixture)

## Quick Research

**Docs:**

* Encore streaming APIs: [https://encore.dev/docs/primitives/streams](https://encore.dev/docs/primitives/streams)
* MEXC WS docs (market data): in hun spot v3 docs

---

# Slice 5: Trade executor (order pipeline, nog klein, functioneel)

## What You're Building

`trade-executor` service: een Encore endpoint dat een **enkele** snipetrade kan uitvoeren (MARKET BUY met `quoteOrderQty`) met latency logging en DB-persist.

## Tasks

### 1. Core execute endpoint

* Complexity: 4
* [ ] Encore endpoint `POST /trade/execute` met payload `{ symbol, quoteOrderQty }`.
* [ ] Gebruik `trade_config` om max trade/position te checken.
* [ ] Roep MEXC `POST /api/v3/order` aan via client wrapper.
* [ ] Log resultaat + latency in `trades` tabel.
* [ ] Tests met **mock MEXC**, geen echte orders.

**Subtask 1.1:** Risk pre-check

* Complexity: 2
* Zéér simpel: `quoteOrderQty <= max_trade_usdt`. Anders `APIError.failedPrecondition`.

**Subtask 1.2:** Latency meting + persist

* Complexity: 2
* Start `const started = performance.now()`, eindig, sla `latency_ms` op.

### 2. Dry-run mode

* Complexity: 2
* [ ] Config flag `auto_trade` → als `false`, alleen “dry-run” (geen REST `order` call, wel alles loggen).
* [ ] Duidelijke response `mode: "dry-run" | "live"`.

## Code Example

```ts
// backend/trade-executor/trade.ts
import { api, APIError, ErrCode } from "encore.dev/api";
import { BotDB } from "../db/db";
import { placeMarketOrder } from "./mexcOrders"; // jouw wrapper

interface TradeRequest {
  symbol: string;
  quoteOrderQty: number;
}

interface TradeResponse {
  status: "filled" | "rejected";
  mode: "dry-run" | "live";
  latencyMs: number;
}

export const execute = api(
  { method: "POST", path: "/trade/execute", expose: true },
  async (req: TradeRequest): Promise<TradeResponse> => {
    const config = await BotDB.queryRow<{
      max_trade_usdt: number;
      auto_trade: boolean;
    }>`SELECT max_trade_usdt, auto_trade FROM trade_config ORDER BY id DESC LIMIT 1`;

    if (!config) {
      throw new APIError(ErrCode.FailedPrecondition, "trade_config missing");
    }

    if (req.quoteOrderQty > Number(config.max_trade_usdt)) {
      throw new APIError(ErrCode.FailedPrecondition, "trade too large");
    }

    const started = performance.now();
    let mode: "dry-run" | "live" = "live";

    if (!config.auto_trade) {
      mode = "dry-run";
      // geen call naar MEXC, maar alsnog DB loggen
    } else {
      await placeMarketOrder(req.symbol, req.quoteOrderQty);
    }

    const latencyMs = Math.round(performance.now() - started);

    await BotDB.exec`
      INSERT INTO trades (symbol, side, qty, quote_qty, latency_ms, status)
      VALUES (${req.symbol}, 'BUY', 0, ${req.quoteOrderQty}, ${latencyMs}, ${mode});
    `;

    return {
      status: "filled",
      mode,
      latencyMs,
    };
  },
);
```

## Ready to Merge Checklist

* [ ] `/trade/execute` getest met mocked MEXC
* [ ] `auto_trade=false` voert nooit echte orders uit
* [ ] `trades` tabel bevat correcte latency data

## Quick Research

**Docs:**

* Encore API errors: [https://encore.dev/docs/primitives/api#error-handling](https://encore.dev/docs/primitives/api#error-handling)

---

# Slice 6: Risk manager service & metrics

## What You're Building

`risk-manager` service met:

* Config endpoints (al deels in Slice 2)
* `GET /risk/metrics` die op basis van `trades` + `trade_config` risk KPIs berekent.

## Tasks

### 1. Config endpoints afronden

* Complexity: 2
* [ ] Zorg dat `GET /config` en `PUT /config` netjes in `risk-manager` service hangen.
* [ ] Valideer input (min/max waarden) met types + runtime checks.
* [ ] Tests: invalid config wordt geweigerd.

### 2. Risk metrics endpoint

* Complexity: 3
* [ ] `GET /risk/metrics`:

  * Total exposure (som `quote_qty` van open posities — evt nu simplified als alle trades).
  * Max trade size, max position uit config.
  * Winrate placeholder (later echte PnL).
* [ ] Query Postgres via `BotDB.query`.
* [ ] Tests op kleine fixture dataset.

## Code Example

```ts
// backend/risk-manager/risk.ts
import { api } from "encore.dev/api";
import { BotDB } from "../db/db";

interface RiskMetrics {
  totalExposureUsdt: number;
  maxTradeUsdt: number;
  maxPositionUsdt: number;
  tradeCount: number;
}

export const metrics = api(
  { method: "GET", path: "/risk/metrics", expose: true },
  async (): Promise<RiskMetrics> => {
    const config = await BotDB.queryRow<{
      max_trade_usdt: number;
      max_position_usdt: number;
    }>`SELECT max_trade_usdt, max_position_usdt FROM trade_config ORDER BY id DESC LIMIT 1`;

    const rows = await BotDB.query<{ quote_qty: number }>`
      SELECT quote_qty FROM trades
    `;

    let total = 0;
    for await (const row of rows) {
      total += Number(row.quote_qty);
    }

    return {
      totalExposureUsdt: total,
      maxTradeUsdt: Number(config?.max_trade_usdt ?? 0),
      maxPositionUsdt: Number(config?.max_position_usdt ?? 0),
      tradeCount: 0, // later uitbreiden
    };
  },
);
```

## Ready to Merge Checklist

* [ ] Frontend kan risk metrics ophalen en tonen
* [ ] Config updates beïnvloeden risk metrics correct
* [ ] Validatie voorkomt idiote configs (bijv. negative amounts)

## Quick Research

**Docs:**

* Encore validation via TS types: [https://encore.dev/docs/primitives/api#request-validation](https://encore.dev/docs/primitives/api#request-validation)

---

# Slice 7: Dashboard API & streaming + Next.js UI

## What You're Building

De `api` service (Encore) die de dashboard data levert + een Next.js 16 dashboardpagina (`/dashboard`) die listings, trades, risk metrics en monitor status live toont (polling of streamOut).

## Tasks

### 1. Dashboard API endpoints

* Complexity: 4
* [ ] In `backend/api/`, maak endpoints:

  * `GET /listings` – laatste N listings uit DB.
  * `GET /trade/history` – laatste N trades met latency.
  * `GET /analytics/performance` – P50/P95/P99 latency & counts.
  * `GET /monitor/status` – hergebruik van Slice 4.
* [ ] Optioneel: `streamOut /dashboard/stream` die events pusht voor UI.
* [ ] Tests: basic contract tests (types, shapes).

**Subtask 1.1:** Plain HTTP polling

* Complexity: 2
* Begin met simpele GET endpoints, zonder streaming.

**Subtask 1.2:** streamOut (optioneel)

* Complexity: 2
* Voeg een stream endpoint toe dat regelmatig updates verstuurt via Encore streamOut.

### 2. Next.js dashboard pagina

* Complexity: 4
* [ ] Maak `frontend/app/dashboard/page.tsx` met:

  * Section “Status”: monitor status, risk metrics.
  * Section “Listings”: laatste listings tabel.
  * Section “Trades”: laatste trades met latency.
* [ ] Gebruik `fetch` of TanStack Query (client component) voor polling (bv. elke 3–5s).
* [ ] Styling met Tailwind + shadcn/ui voor kaarten.
* [ ] Tests: snapshot/layout + minimaal 1 integratie test.

**Subtask 2.1:** Data hooks

* Complexity: 2
* Kleine client hooks `useListings`, `useTrades`, `useRiskMetrics`.

**Subtask 2.2:** UI cards

* Complexity: 2
* Dashboard cards voor snelle glancing (latency, #trades, monitor running).

## Code Example

```ts
// backend/api/dashboard.ts
import { api } from "encore.dev/api";
import { BotDB } from "../db/db";

interface Trade {
  id: number;
  symbol: string;
  quoteQty: number;
  latencyMs: number;
  status: string;
  createdAt: string;
}

export const tradeHistory = api(
  { method: "GET", path: "/trade/history", expose: true },
  async (): Promise<{ trades: Trade[] }> => {
    const rows = await BotDB.query<{
      id: number;
      symbol: string;
      quote_qty: number;
      latency_ms: number;
      status: string;
      created_at: Date;
    }>`
      SELECT id, symbol, quote_qty, latency_ms, status, created_at
      FROM trades
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const trades: Trade[] = [];
    for await (const row of rows) {
      trades.push({
        id: row.id,
        symbol: row.symbol,
        quoteQty: Number(row.quote_qty),
        latencyMs: row.latency_ms,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      });
    }

    return { trades };
  },
);
```

```tsx
// frontend/app/dashboard/page.tsx
import { Suspense } from "react";

async function getTrades() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/trade/history`, {
    cache: "no-store",
  });
  return res.json() as Promise<{ trades: { id: number; symbol: string; quoteQty: number; latencyMs: number; status: string; createdAt: string; }[] }>;
}

export default async function DashboardPage() {
  const { trades } = await getTrades();

  return (
    <main className="min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">Crypto Sniper Dashboard</h1>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* cards voor risk, status, latency, etc. */}
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Laatste trades</h2>
        <div className="border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Tijd</th>
                <th className="p-2 text-left">Symbool</th>
                <th className="p-2 text-right">Quote (USDT)</th>
                <th className="p-2 text-right">Latency (ms)</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-2">{new Date(t.createdAt).toLocaleTimeString()}</td>
                  <td className="p-2">{t.symbol}</td>
                  <td className="p-2 text-right">{t.quoteQty}</td>
                  <td className="p-2 text-right">{t.latencyMs}</td>
                  <td className="p-2">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
```

## Ready to Merge Checklist

* [ ] `/dashboard` toont echte listings/trades uit DB
* [ ] Polling/streaming geeft zichtbare updates
* [ ] Geen blocking calls in UI, errors netjes afgehandeld

## Quick Research

**Docs:**

* Encore streaming: [https://encore.dev/docs/primitives/streams](https://encore.dev/docs/primitives/streams)
* Next.js data fetching patterns: [https://nextjs.org/docs/app/building-your-application/data-fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

## “Optimized implementation guide” – in het kort

**Aanbevolen volgorde (met jouw repo als basis):**

1. **Slice 1–2**

   * Zorg dat Encore app + DB + health + config **rocken** lokaal.
   * Je hebt dan: gezonde infra + type-safe config laag.

2. **Slice 3**

   * MEXC client + secrets, maar nog geen echte orders.
   * Focus hier op: **signing correctness** + degelijke error handling.

3. **Slice 4**

   * Market monitor service: WebSocket loop + listings naar DB.
   * Doel: “Ik zie nieuwe listings in de DB” binnen enkele seconden.

4. **Slice 5–6**

   * Trade executor + risk manager: eerst dry-run, dan optioneel live.
   * Hier is je **sniping-kern**: latency meten, opslaan, grenzen afdwingen.

5. **Slice 7**

   * Dashboard API + Next.js UI; poll eerst, stream later.
   * Nu heb je: observable systeem met realtime view op listing → trade pad.

Daarna kun je je Encore-/Effect-TS-power inzetten voor:

* retry-policies
* distributed tracing
* fancy Mastra-achtige workflows bovenop de executor/monitor.

Zo heb je echte verticale slices: na **elke** slice kun je iets runnen en demonstreren – van healthcheck tot snipende bot met live dashboard.
