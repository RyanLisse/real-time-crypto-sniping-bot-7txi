"use client";

import { useQuery } from "@tanstack/react-query";
import Client from "@/lib/encoreClient";

export interface Listing {
  id: number;
  symbol: string;
  listedAt: string;
  source: "mexc_websocket" | "mexc_rest_api" | "test_injection";
  createdAt: string;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch listings from API
 */
async function fetchListings(limit: number = 50): Promise<ListingsResponse> {
  const client = new Client(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000");
  
  try {
    const response = await client.api.listings({ limit });
    return response;
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    throw error;
  }
}

/**
 * Hook to fetch listings with 3s polling interval
 */
export function useListings(limit: number = 50) {
  return useQuery({
    queryKey: ["listings", limit],
    queryFn: () => fetchListings(limit),
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 2000, // Consider data stale after 2 seconds
    refetchOnWindowFocus: true,
  });
}
