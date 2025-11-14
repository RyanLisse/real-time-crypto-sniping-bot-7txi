import { api } from "encore.dev/api";
import { buildHealthResponse } from "./health.impl";
import type { HealthResponse } from "./health.types";

const version = process.env.APP_VERSION ?? "0.1.0";
const env = process.env.NODE_ENV ?? "development";

export const getSystemHealth = api<void, HealthResponse>(
  { method: "GET", path: "/health", expose: true },
  async (): Promise<HealthResponse> => buildHealthResponse({ version, env })
);
