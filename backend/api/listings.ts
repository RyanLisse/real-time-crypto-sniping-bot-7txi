import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import log from "encore.dev/log";
import { BotDB } from "../db/db";

/**
 * Listing source enum matching database constraint
 */
export type ListingSource = "mexc_websocket" | "mexc_rest_api" | "test_injection";

/**
 * Listing entity matching database schema
 */
export interface Listing {
  id: number;
  symbol: string;
  listedAt: string; // ISO 8601
  source: ListingSource;
  createdAt: string; // ISO 8601
}

/**
 * Query parameters for GET /listings
 */
export interface ListingsParams {
  limit?: Query<number>;
  offset?: Query<number>;
  source?: Query<ListingSource>;
}

/**
 * Response for GET /listings
 */
export interface ListingsResponse {
  listings: Listing[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * GET /listings
 * Retrieve recent listings with pagination and optional source filtering
 */
export const listings = api<ListingsParams, ListingsResponse>(
  { method: "GET", path: "/listings", expose: true },
  async (params) => {
    const startTime = performance.now();

    // Validate and set defaults
    const limit = Math.min(Math.max(params.limit || 50, 1), 100);
    const offset = Math.max(params.offset || 0, 0);
    const source = params.source;

    try {
      // Build query with optional source filter
      let query;
      let countQuery;

      if (source) {
        query = BotDB.queryAll<{
          id: number;
          symbol: string;
          listed_at: Date;
          source: string;
          created_at: Date;
        }>`
          SELECT id, symbol, listed_at, source, created_at
          FROM listings
          WHERE source = ${source}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        countQuery = BotDB.queryRow<{ count: number }>`
          SELECT COUNT(*)::int as count
          FROM listings
          WHERE source = ${source}
        `;
      } else {
        query = BotDB.queryAll<{
          id: number;
          symbol: string;
          listed_at: Date;
          source: string;
          created_at: Date;
        }>`
          SELECT id, symbol, listed_at, source, created_at
          FROM listings
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        countQuery = BotDB.queryRow<{ count: number }>`
          SELECT COUNT(*)::int as count FROM listings
        `;
      }

      const [rows, countResult] = await Promise.all([query, countQuery]);

      const latency = performance.now() - startTime;

      // Observability: Log query latency as histogram metric
      log.info("Listings query executed", {
        metric: "api_request_duration_seconds",
        latencyMs: Math.round(latency),
        latencySeconds: (latency / 1000).toFixed(3),
        endpoint: "/listings",
        limit,
        offset,
        source,
        resultCount: rows.length,
      });

      // Convert to API response format
      const listings: Listing[] = rows.map((row) => ({
        id: row.id,
        symbol: row.symbol,
        listedAt: row.listed_at.toISOString(),
        source: row.source as ListingSource,
        createdAt: row.created_at.toISOString(),
      }));

      return {
        listings,
        total: countResult?.count || 0,
        limit,
        offset,
      };
    } catch (error: any) {
      log.error("Error fetching listings", { error: error.message });
      throw error;
    }
  }
);
