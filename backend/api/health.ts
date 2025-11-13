import { api } from "encore.dev/api";
import db from "../external_dbs/neondb/db";

export interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  details?: Record<string, unknown>;
}

export interface SystemHealthResponse {
  overall: "healthy" | "degraded" | "unhealthy";
  services: HealthStatus[];
  timestamp: Date;
}

export const getSystemHealth = api<void, SystemHealthResponse>(
  { method: "GET", path: "/health", expose: true },
  async () => {
    const services: HealthStatus[] = [];
    const timestamp = new Date();

    const dbStart = Date.now();
    try {
      await db.queryRow`SELECT 1`;
      services.push({
        service: "database",
        status: "healthy",
        latency: Date.now() - dbStart,
      });
    } catch (error) {
      services.push({
        service: "database",
        status: "unhealthy",
        details: { error: String(error) },
      });
    }

    const monitorStart = Date.now();
    try {
      const status = await db.queryRow<{ count: number }>`
        SELECT COUNT(*)::int as count FROM listings WHERE detected_at > NOW() - INTERVAL '1 hour'
      `;
      services.push({
        service: "market-monitor",
        status: "healthy",
        latency: Date.now() - monitorStart,
        details: { recentListings: status?.count || 0 },
      });
    } catch (error) {
      services.push({
        service: "market-monitor",
        status: "unhealthy",
        details: { error: String(error) },
      });
    }

    const tradeStart = Date.now();
    try {
      const trades = await db.queryRow<{ count: number; failed: number }>`
        SELECT 
          COUNT(*)::int as count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END)::int as failed
        FROM trades 
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `;
      const failureRate = trades && trades.count > 0 ? trades.failed / trades.count : 0;
      services.push({
        service: "trade-executor",
        status: failureRate > 0.5 ? "degraded" : "healthy",
        latency: Date.now() - tradeStart,
        details: { recentTrades: trades?.count || 0, failedTrades: trades?.failed || 0 },
      });
    } catch (error) {
      services.push({
        service: "trade-executor",
        status: "unhealthy",
        details: { error: String(error) },
      });
    }

    const unhealthyCount = services.filter((s) => s.status === "unhealthy").length;
    const degradedCount = services.filter((s) => s.status === "degraded").length;

    const overall =
      unhealthyCount > 0 ? "unhealthy" : degradedCount > 0 ? "degraded" : "healthy";

    await db.exec`
      INSERT INTO bot_health (service_name, status, latency_ms, checked_at)
      VALUES ('overall', ${overall}, 0, ${timestamp})
    `;

    return {
      overall,
      services,
      timestamp,
    };
  }
);
