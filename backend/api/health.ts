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
  { method: "GET", path: "/health", expose: true },
  async (): Promise<HealthResponse> => {
    // TODO: Add actual health checks (DB connection, etc.)
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version,
      environment,
    };
  }
);
