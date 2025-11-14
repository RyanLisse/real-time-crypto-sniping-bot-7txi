"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Trade data structure matching backend API
 */
interface Trade {
  id: number;
  symbol: string;
  side: string;
  quoteQty: number;
  baseQty: number | null;
  latencyMs: number;
  mode: "dry-run" | "live";
  status: "filled" | "rejected" | "failed" | "pending";
  errorReason: string | null;
  exchangeOrderId: string | null;
  createdAt: string;
}

/**
 * Trade history response
 */
interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Trade query parameters
 */
interface UseTradesParams {
  limit?: number;
  offset?: number;
  mode?: "dry-run" | "live";
  status?: "filled" | "rejected" | "failed" | "pending";
}

/**
 * Fetch trades from backend
 * User Story 2 T119: TanStack Query hook for trades
 */
async function fetchTrades(params: UseTradesParams): Promise<TradeHistoryResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());
  if (params.mode) searchParams.set("mode", params.mode);
  if (params.status) searchParams.set("status", params.status);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${API_BASE_URL}/trade/history?${searchParams}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook to fetch and manage trades data
 * T123: Polling interval for real-time updates
 */
export function useTrades(params: UseTradesParams = {}) {
  return useQuery({
    queryKey: ["trades", params],
    queryFn: () => fetchTrades(params),
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
}
