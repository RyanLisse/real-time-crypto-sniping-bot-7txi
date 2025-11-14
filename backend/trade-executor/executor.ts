import { api, APIError } from "encore.dev/api";
import { Subscription } from "encore.dev/pubsub";
import log from "encore.dev/log";
import { newListingTopic } from "../market-monitor/pubsub";
import { mexcTradingClient } from "./mexc-trading";
import { BotDB } from "../db/db";

const db = BotDB;
import type { TradeRequest, TradeResponse } from "./types";
import type { NewListing } from "../market-monitor/types";
import { Effect, pipe } from "effect";

export const executeTrade = api<TradeRequest, TradeResponse>(
  { method: "POST", path: "/trade/execute", expose: true, auth: false },
  async (req) => {
    const startTime = Date.now();

    try {
      const config = await db.queryRow<{
        max_trade_amount: number;
        max_slippage_pct: number;
        enabled: boolean;
      }>`
        SELECT max_trade_amount, max_slippage_pct, enabled FROM trade_config WHERE id = 1
      `;

      if (!config?.enabled) {
        throw APIError.failedPrecondition("Trading is disabled");
      }

      if (req.quantity * (req.price || 0) > config.max_trade_amount) {
        throw APIError.invalidArgument("Trade amount exceeds maximum");
      }

      const mexcSide = req.side === "buy" ? "BUY" : "SELL";
      const mexcType = req.orderType === "market" ? "MARKET" : "LIMIT";

      const order = await mexcTradingClient.placeOrder(
        req.symbol,
        mexcSide,
        mexcType,
        req.quantity,
        req.price
      );

      const latencyMs = Date.now() - startTime;

      const result = await db.queryRow<{ id: number }>`
        INSERT INTO trades (
          listing_id, symbol, side, order_type, quantity, price, 
          total_value, status, order_id, executed_at, latency_ms
        )
        VALUES (
          ${req.listingId}, ${req.symbol}, ${req.side}, ${req.orderType},
          ${req.quantity}, ${parseFloat(order.price)}, 
          ${req.quantity * parseFloat(order.price)}, 'executed', 
          ${order.orderId}, NOW(), ${latencyMs}
        )
        RETURNING id
      `;

      if (latencyMs > 100) {
        log.warn(`High execution latency: ${latencyMs}ms for ${req.symbol}`);
      }

      log.info(`Trade executed: ${req.symbol} ${req.side} ${req.quantity} @ ${order.price} (${latencyMs}ms)`);

      return {
        tradeId: result!.id,
        orderId: order.orderId,
        status: "executed",
        executedPrice: parseFloat(order.price),
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await db.exec`
        INSERT INTO trades (
          listing_id, symbol, side, order_type, quantity, price, 
          total_value, status, latency_ms, error_message
        )
        VALUES (
          ${req.listingId}, ${req.symbol}, ${req.side}, ${req.orderType},
          ${req.quantity}, ${req.price || 0}, 0, 'failed', ${latencyMs}, ${errorMessage}
        )
      `;

      log.error(`Trade execution failed: ${req.symbol}`, error);

      return {
        tradeId: 0,
        status: "failed",
        latencyMs,
        errorMessage,
      };
    }
  }
);

new Subscription(newListingTopic, "auto-trade-new-listings", {
  handler: async (listing: NewListing) => {
    try {
      const config = await db.queryRow<{
        max_trade_amount: number;
        enabled: boolean;
      }>`
        SELECT max_trade_amount, enabled FROM trade_config WHERE id = 1
      `;

      if (!config?.enabled) {
        log.info("Auto-trading disabled, skipping listing:", listing.symbol);
        return;
      }

      const listingRecord = await db.queryRow<{ id: number }>`
        SELECT id FROM listings WHERE symbol = ${listing.symbol}
      `;

      if (!listingRecord) {
        log.error("Listing not found in database:", listing.symbol);
        return;
      }

      const tradeQuantity = config.max_trade_amount / (listing.firstPrice || 1);

      log.info(`Auto-trading new listing: ${listing.symbol} qty=${tradeQuantity}`);

      const tradeReq: TradeRequest = {
        symbol: listing.symbol,
        side: "buy",
        orderType: "market",
        quantity: tradeQuantity,
        listingId: listingRecord.id,
      };
      
      await executeTrade(tradeReq);
    } catch (error) {
      log.error(`Failed to auto-trade listing ${listing.symbol}:`, error);
    }
  },
});
