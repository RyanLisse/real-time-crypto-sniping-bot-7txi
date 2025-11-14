"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Client from "@/lib/encoreClient";

export interface MonitorStatusResponse {
  status: "running" | "stopped" | "degraded";
  lastEventAt: string | null;
  uptime: number | null;
  listingsDetected: number;
  websocketConnected: boolean;
  lastError: string | null;
}

export interface StartMonitorResponse {
  status: "running";
  startedAt: string;
  message: string;
}

export interface StopMonitorResponse {
  status: "stopped";
  stoppedAt: string;
  message: string;
}

/**
 * Fetch monitor status from API
 */
async function fetchMonitorStatus(): Promise<MonitorStatusResponse> {
  const client = new Client(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000");
  
  try {
    const response = await client.market_monitor.status();
    return response;
  } catch (error) {
    console.error("Failed to fetch monitor status:", error);
    throw error;
  }
}

/**
 * Start monitoring
 */
async function startMonitor(): Promise<StartMonitorResponse> {
  const client = new Client(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000");
  
  try {
    const response = await client.market_monitor.start();
    return response;
  } catch (error) {
    console.error("Failed to start monitor:", error);
    throw error;
  }
}

/**
 * Stop monitoring
 */
async function stopMonitor(): Promise<StopMonitorResponse> {
  const client = new Client(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000");
  
  try {
    const response = await client.market_monitor.stop();
    return response;
  } catch (error) {
    console.error("Failed to stop monitor:", error);
    throw error;
  }
}

/**
 * Hook to fetch monitor status with 5s polling interval
 */
export function useMonitorStatus() {
  return useQuery({
    queryKey: ["monitorStatus"],
    queryFn: fetchMonitorStatus,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 4000, // Consider data stale after 4 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to start monitor with optimistic updates
 */
export function useStartMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startMonitor,
    onSuccess: () => {
      // Invalidate and refetch status
      queryClient.invalidateQueries({ queryKey: ["monitorStatus"] });
    },
  });
}

/**
 * Hook to stop monitor with optimistic updates
 */
export function useStopMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopMonitor,
    onSuccess: () => {
      // Invalidate and refetch status
      queryClient.invalidateQueries({ queryKey: ["monitorStatus"] });
    },
  });
}
