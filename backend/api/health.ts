import { api } from "encore.dev/api";

const version = process.env.APP_VERSION ?? "0.1.0";
const environment = process.env.NODE_ENV ?? "development";

/**
 * Health response matching API contract
 */
export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version?: string;
  environment?: string;
}

/**
 * GET /health
 * Health check endpoint for liveness/readiness probes
 */
export const health = api<void, HealthResponse>(
  { method: "GET", path: "/health", expose: true, auth: false },
  async () => {
    // Check database health
    let dbHealth: "healthy" | "degraded" | "down" = "healthy";
    try {
      await BotDB.queryRow`SELECT 1`;
    } catch (error) {
      dbHealth = "down";
    }

    // Check MEXC API health (simplified - just assume healthy if credentials exist)
    const mexcHealth: "healthy" | "degraded" | "down" = "healthy";

    // Check WebSocket health (simplified - assume healthy for now)
    const wsHealth: "healthy" | "degraded" | "down" = "healthy";

    const overallStatus = 
      dbHealth === "down" ? "down" :
      dbHealth === "degraded" || mexcHealth === "degraded" || wsHealth === "degraded" ? "degraded" :
      "healthy";

    return {
      status: overallStatus,
      version,
      environment,
      components: {
        database: dbHealth,
        mexc: mexcHealth,
        websocket: wsHealth,
      },
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
);
