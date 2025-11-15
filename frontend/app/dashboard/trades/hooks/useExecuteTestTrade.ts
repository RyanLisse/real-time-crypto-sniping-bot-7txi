"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ExecuteTestTradeInput {
  symbol: string;
  side: "buy" | "sell";
  quoteQty: number;
}

interface TradeResponse {
  tradeId: number;
  orderId?: string;
  status: "filled" | "rejected" | "failed" | "pending";
  mode: "dry-run" | "live";
  baseQty?: number;
  latencyMs: number;
  errorReason?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function executeTestTrade(input: ExecuteTestTradeInput): Promise<TradeResponse> {
  const response = await fetch(`${API_BASE_URL}/trade/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      symbol: input.symbol,
      side: input.side,
      quoteQty: input.quoteQty,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to execute test trade: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook for executing a small test trade.
 * On success, it invalidates the trades query so the history updates quickly.
 */
export function useExecuteTestTrade() {
  const queryClient = useQueryClient();

  return useMutation<TradeResponse, Error, ExecuteTestTradeInput>({
    mutationFn: executeTestTrade,
    onSuccess: () => {
      // Refresh trade history to include the new trade.
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}
