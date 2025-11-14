"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Configuration data structure
 */
interface TradingConfig {
  maxTradeUsdt: number;
  maxPositionUsdt: number;
  autoTrade: boolean;
  highValueThresholdUsdt: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuration update request
 */
interface UpdateConfigRequest {
  maxTradeUsdt?: number;
  maxPositionUsdt?: number;
  autoTrade?: boolean;
  highValueThresholdUsdt?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

/**
 * Fetch current configuration
 * User Story 2 T120: TanStack Query hook for config
 */
async function fetchConfig(): Promise<TradingConfig> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update configuration
 * T122: Config update mutation
 */
async function updateConfig(update: UpdateConfigRequest): Promise<TradingConfig> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update config: ${error}`);
  }

  return response.json();
}

/**
 * Hook to fetch configuration
 */
export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: fetchConfig,
    staleTime: 30000, // Consider stale after 30s
  });
}

/**
 * Hook to update configuration
 * T122: Optimistic updates
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateConfig,
    // T122: Optimistic update - update cache immediately
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ["config"] });
      const previousConfig = queryClient.getQueryData<TradingConfig>(["config"]);
      
      if (previousConfig) {
        queryClient.setQueryData<TradingConfig>(["config"], {
          ...previousConfig,
          ...newConfig,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousConfig };
    },
    // Revert on error
    onError: (err, newConfig, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(["config"], context.previousConfig);
      }
    },
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}
