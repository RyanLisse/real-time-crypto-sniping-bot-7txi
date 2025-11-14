import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { BotDB } from "../db/db";

const db = BotDB;

export interface Trade {
  id: number;
  listingId?: number;
  symbol: string;
  side: string;
  orderType: string;
  quantity: number;
  price: number;
  totalValue: number;
  status: string;
  orderId?: string;
  executedAt?: Date;
  latencyMs?: number;
  errorMessage?: string;
  createdAt: Date;
}

export interface ListTradesParams {
  limit?: Query<number>;
  symbol?: Query<string>;
  status?: Query<string>;
}

export interface ListTradesResponse {
  trades: Trade[];
}

export const listTrades = api<ListTradesParams, ListTradesResponse>(
  { method: "GET", path: "/trade/history", expose: true },
  async (params) => {
    const limit = params.limit || 50;
    const symbol = params.symbol;
    const status = params.status;

    let query = `SELECT * FROM trades WHERE 1=1`;
    const queryParams: (string | number)[] = [];

    if (symbol) {
      queryParams.push(symbol);
      query += ` AND symbol = $${queryParams.length}`;
    }

    if (status) {
      queryParams.push(status);
      query += ` AND status = $${queryParams.length}`;
    }

    queryParams.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;

    const trades = await db.rawQueryAll<Trade>(query, ...queryParams);

    return { trades };
  }
);
