import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../external_dbs/neondb/db";

export interface Listing {
  id: number;
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  detectedAt: Date;
  firstPrice?: number;
  listingSource: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ListListingsParams {
  limit?: Query<number>;
}

export interface ListListingsResponse {
  listings: Listing[];
}

export const listListings = api<ListListingsParams, ListListingsResponse>(
  { method: "GET", path: "/listings", expose: true },
  async (params) => {
    const limit = params.limit || 50;

    const listings = await db.queryAll<Listing>`
      SELECT * FROM listings ORDER BY detected_at DESC LIMIT ${limit}
    `;

    return { listings };
  }
);
