import { api, APIError } from "encore.dev/api";
import { Subscription } from "encore.dev/pubsub";
import log from "encore.dev/log";
import { newListingTopic, marketDataTopic } from "../market-monitor/pubsub";
import { mexcTradingClient } from "./mexc-trading";
import db from "../external_dbs/neondb/db";
import type { TradeRequest, TradeResponse } from "./types";
import type { NewListing, MarketSnapshot } from "../market-monitor/types";
import { Effect, pipe } from "effect";

export const executeTrade = api<TradeRequest, TradeResponse>(
  { method: "POST", path: "/trade/execute", expose: true, auth: false },
  async (req) => {
    const startTime = Date.now();

    try {
      const config = await db.queryRow<{
        max_trade_amount: number;
        max_slippage_pct: number;
        stop_loss_pct: number;
        take_profit_pct: number;
        enabled: boolean;
      }>`
        SELECT max_trade_amount, max_slippage_pct, stop_loss_pct, take_profit_pct, enabled FROM trade_config WHERE id = 1
      `;

      if (!config?.enabled) {
        throw APIError.failedPrecondition("Trading is disabled");
      }

      if (req.quantity * (req.price || 0) > config.max_trade_amount) {
        throw APIError.invalidArgument("Trade amount exceeds maximum");
      }

      // Get reference price for slippage validation
      let referencePrice = req.price;
      if (!referencePrice || req.orderType === "market") {
        const marketData = await db.queryRow<{
          price: number;
          bid_price: number | null;
          ask_price: number | null;
        }>`
          SELECT price, bid_price, ask_price
          FROM market_data
          WHERE symbol = ${req.symbol}
          ORDER BY timestamp DESC
          LIMIT 1
        `;

        if (marketData) {
          // Use bid/ask for more accurate reference
          if (req.side === "buy" && marketData.ask_price) {
            referencePrice = marketData.ask_price;
          } else if (req.side === "sell" && marketData.bid_price) {
            referencePrice = marketData.bid_price;
          } else {
            referencePrice = marketData.price;
          }
        }
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

      const executedPrice = parseFloat(order.price);

      // Validate slippage
      if (referencePrice) {
        const slippage = req.side === "buy"
          ? (executedPrice - referencePrice) / referencePrice
          : (referencePrice - executedPrice) / referencePrice;

        const slippagePct = slippage * 100;

        if (slippagePct > config.max_slippage_pct) {
          log.warn(
            `High slippage detected: ${slippagePct.toFixed(2)}% (max: ${config.max_slippage_pct}%) ` +
            `for ${req.symbol} ${req.side} - Reference: ${referencePrice}, Executed: ${executedPrice}`
          );

          // Attempt to cancel the order if slippage is excessive
          try {
            await mexcTradingClient.cancelOrder(req.symbol, order.orderId);
            throw APIError.failedPrecondition(
              `Trade rejected: slippage ${slippagePct.toFixed(2)}% exceeds maximum ${config.max_slippage_pct}%`
            );
          } catch (cancelError) {
            // If cancel fails, order may already be filled - log and continue
            log.error(`Failed to cancel high-slippage order ${order.orderId}:`, cancelError);
          }
        }
      }

      const latencyMs = Date.now() - startTime;

      // Calculate stop-loss and take-profit prices for buy orders
      let metadata: any = {};
      if (req.side === "buy") {
        const stopLossPrice = executedPrice * (1 - config.stop_loss_pct / 100);
        const takeProfitPrice = executedPrice * (1 + config.take_profit_pct / 100);
        metadata = {
          position_status: "open",
          stop_loss_price: stopLossPrice,
          take_profit_price: takeProfitPrice,
        };
      } else if (req.side === "sell") {
        // For sell orders, try to find matching buy order to calculate P&L
        const matchingBuy = await db.queryRow<{
          id: number;
          price: number;
          quantity: number;
        }>`
          SELECT id, price, quantity
          FROM trades
          WHERE symbol = ${req.symbol}
            AND side = 'buy'
            AND status = 'executed'
            AND metadata->>'position_status' = 'open'
          ORDER BY executed_at ASC
          LIMIT 1
        `;

        if (matchingBuy) {
          const realizedPnL = (executedPrice - matchingBuy.price) * req.quantity;
          const pnlPct = ((executedPrice - matchingBuy.price) / matchingBuy.price) * 100;
          metadata = {
            position_status: "closed",
            realized_pnl: realizedPnL,
            pnl_pct: pnlPct,
            entry_price: matchingBuy.price,
            exit_price: executedPrice,
          };
        } else {
          metadata = {
            position_status: "closed",
          };
        }
      }

      const result = await db.queryRow<{ id: number }>`
        INSERT INTO trades (
          listing_id, symbol, side, order_type, quantity, price,
          total_value, status, order_id, executed_at, latency_ms, metadata
        )
        VALUES (
          ${req.listingId}, ${req.symbol}, ${req.side}, ${req.orderType},
          ${req.quantity}, ${executedPrice},
          ${req.quantity * executedPrice}, 'executed',
          ${order.orderId}, NOW(), ${latencyMs}, ${JSON.stringify(metadata)}
        )
        RETURNING id
      `;

      if (latencyMs > 100) {
        log.warn(`High execution latency: ${latencyMs}ms for ${req.symbol}`);
      }

      if (req.side === "buy") {
        log.info(
          `Position opened: ${req.symbol} ${req.quantity} @ ${executedPrice} ` +
          `(SL: ${metadata.stop_loss_price.toFixed(8)}, TP: ${metadata.take_profit_price.toFixed(8)}, ${latencyMs}ms)`
        );
      } else {
        log.info(`Trade executed: ${req.symbol} ${req.side} ${req.quantity} @ ${order.price} (${latencyMs}ms)`);
      }

      return {
        tradeId: result!.id,
        orderId: order.orderId,
        status: "executed",
        executedPrice,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const failedResult = await db.queryRow<{ id: number }>`
        INSERT INTO trades (
          listing_id, symbol, side, order_type, quantity, price,
          total_value, status, latency_ms, error_message
        )
        VALUES (
          ${req.listingId}, ${req.symbol}, ${req.side}, ${req.orderType},
          ${req.quantity}, ${req.price || 0}, 0, 'failed', ${latencyMs}, ${errorMessage}
        )
        RETURNING id
      `;

      log.error(`Trade execution failed: ${req.symbol}`, error);

      return {
        tradeId: failedResult?.id || 0,
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

// Monitor open positions and execute stop-loss/take-profit orders
new Subscription(marketDataTopic, "monitor-stop-loss-take-profit", {
  handler: async (snapshot: MarketSnapshot) => {
    try {
      // Get all open positions for this symbol
      const openPositions = await db.query<{
        id: number;
        symbol: string;
        quantity: number;
        price: number;
        listing_id: number | null;
        metadata: any;
      }>`
        SELECT id, symbol, quantity, price, listing_id, metadata
        FROM trades
        WHERE symbol = ${snapshot.symbol}
          AND side = 'buy'
          AND status = 'executed'
          AND metadata->>'position_status' = 'open'
      `;

      if (!openPositions || openPositions.length === 0) {
        return;
      }

      for (const position of openPositions) {
        const metadata = position.metadata;
        const stopLossPrice = metadata.stop_loss_price;
        const takeProfitPrice = metadata.take_profit_price;
        const currentPrice = snapshot.price;

        let shouldClose = false;
        let closeReason = "";

        // Check stop-loss
        if (currentPrice <= stopLossPrice) {
          shouldClose = true;
          closeReason = "stop-loss";
          log.warn(
            `Stop-loss triggered for ${position.symbol}: ` +
            `current=${currentPrice.toFixed(8)} <= SL=${stopLossPrice.toFixed(8)}`
          );
        }
        // Check take-profit
        else if (currentPrice >= takeProfitPrice) {
          shouldClose = true;
          closeReason = "take-profit";
          log.info(
            `Take-profit triggered for ${position.symbol}: ` +
            `current=${currentPrice.toFixed(8)} >= TP=${takeProfitPrice.toFixed(8)}`
          );
        }

        if (shouldClose) {
          // Close the position
          const closeReq: TradeRequest = {
            symbol: position.symbol,
            side: "sell",
            orderType: "market",
            quantity: position.quantity,
            listingId: position.listing_id || undefined,
          };

          try {
            const closeResult = await executeTrade(closeReq);

            // Update the original position to mark it as closed
            await db.exec`
              UPDATE trades
              SET metadata = jsonb_set(
                metadata,
                '{position_status}',
                '"closed"'
              )
              WHERE id = ${position.id}
            `;

            const pnl = (currentPrice - position.price) * position.quantity;
            const pnlPct = ((currentPrice - position.price) / position.price) * 100;

            log.info(
              `Position closed (${closeReason}): ${position.symbol} ` +
              `entry=${position.price.toFixed(8)}, exit=${currentPrice.toFixed(8)}, ` +
              `PnL=${pnl.toFixed(4)} (${pnlPct.toFixed(2)}%)`
            );
          } catch (error) {
            log.error(`Failed to close position for ${position.symbol}:`, error);
          }
        }
      }
    } catch (error) {
      log.error(`Error monitoring SL/TP for ${snapshot.symbol}:`, error);
    }
  },
});
