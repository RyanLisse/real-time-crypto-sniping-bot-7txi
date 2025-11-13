import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { mexcClient } from "./mexc-client";
import db from "../external_dbs/neondb/db";

let isMonitoring = false;

export interface StartMonitoringResponse {
  success: boolean;
  message: string;
}

export interface StopMonitoringResponse {
  success: boolean;
  message: string;
}

export interface MonitorStatusResponse {
  isMonitoring: boolean;
  knownListings: number;
}

export const startMonitoring = api<void, StartMonitoringResponse>(
  { method: "POST", path: "/monitor/start", expose: true },
  async () => {
    if (isMonitoring) {
      return { success: false, message: "Monitoring already started" };
    }

    try {
      await mexcClient.initialize();
      isMonitoring = true;
      log.info("Market monitoring started");
      return { success: true, message: "Monitoring started successfully" };
    } catch (error) {
      log.error("Failed to start monitoring:", error);
      return { success: false, message: `Failed to start monitoring: ${error}` };
    }
  }
);

export const stopMonitoring = api<void, StopMonitoringResponse>(
  { method: "POST", path: "/monitor/stop", expose: true },
  async () => {
    if (!isMonitoring) {
      return { success: false, message: "Monitoring not running" };
    }

    try {
      await mexcClient.shutdown();
      isMonitoring = false;
      log.info("Market monitoring stopped");
      return { success: true, message: "Monitoring stopped successfully" };
    } catch (error) {
      log.error("Failed to stop monitoring:", error);
      return { success: false, message: `Failed to stop monitoring: ${error}` };
    }
  }
);

export const getMonitorStatus = api<void, MonitorStatusResponse>(
  { method: "GET", path: "/monitor/status", expose: true },
  async () => {
    const result = await db.queryRow<{ count: number }>`
      SELECT COUNT(*)::int as count FROM listings
    `;

    return {
      isMonitoring,
      knownListings: result?.count || 0,
    };
  }
);
