import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { BotDB } from "../db/db";
import { checkTradeRisk } from "./risk-check";
import type { TradeRequest, TradeResponse } from "./types";

/**
 * Execute a trade with risk checks and dry-run/live mode support
 * User Story 2: Safe Auto-Trade Sniping
 */
export const executeTrade = api<TradeRequest, TradeResponse>(
  { method: "POST", path: "/trade/execute", expose: true, auth: false },
  async (req) => {
    const startTime = performance.now();

    try {
      // Step 1: Risk check
      const riskCheck = await checkTradeRisk({
        symbol: req.symbol,
        quoteQty: req.quoteQty,
      });

      if (!riskCheck.approved) {
        const latencyMs = Math.round(performance.now() - startTime);
        
        // Record rejected trade
        const result = await BotDB.queryRow<{ id: number }>`
          INSERT INTO trades (
            symbol, side, quote_qty, latency_ms, mode, status, error_reason
          )
          VALUES (
            ${req.symbol}, ${req.side.toUpperCase()}, ${req.quoteQty}, 
            ${latencyMs}, 'dry-run', 'rejected', ${riskCheck.reason || 'risk_check_failed'}
          )
          RETURNING id
        `;

        log.info("Trade rejected by risk check", {
          metric: "trade_rejected_total",
          tradeId: result?.id,
          symbol: req.symbol,
          reason: riskCheck.reason,
          latencyMs,
        });

        return {
          tradeId: result?.id || 0,
          status: "rejected",
          mode: "dry-run",
          latencyMs,
          errorReason: riskCheck.reason,
        };
      }

      // Step 2: Determine mode (dry-run or live)
      const config = await BotDB.queryRow<{ auto_trade: boolean }>`
        SELECT auto_trade FROM trade_config WHERE id = 1
      `;

      const mode = config?.auto_trade ? "live" : "dry-run";

      if (mode === "dry-run") {
        // Dry-run: simulate trade without exchange call
        const latencyMs = Math.round(performance.now() - startTime);
        
        const result = await BotDB.queryRow<{ id: number }>`
          INSERT INTO trades (
            symbol, side, quote_qty, latency_ms, mode, status
          )
          VALUES (
            ${req.symbol}, ${req.side.toUpperCase()}, ${req.quoteQty},
            ${latencyMs}, 'dry-run', 'filled'
          )
          RETURNING id
        `;

        log.info("Trade executed (dry-run)", {
          metric: "trade_dry_run_total",
          tradeId: result?.id,
          symbol: req.symbol,
          quoteQty: req.quoteQty,
          latencyMs,
        });

        return {
          tradeId: result?.id || 0,
          status: "filled",
          mode: "dry-run",
          latencyMs,
        };
      }

      // Step 3: Live execution (placeholder - MEXC client integration needed)
      // TODO: Integrate with mexcTradingClient.placeOrder()
      const latencyMs = Math.round(performance.now() - startTime);
      
      log.warn("Live trading not yet implemented - executing as dry-run", { symbol: req.symbol });
      
      const result = await BotDB.queryRow<{ id: number }>`
        INSERT INTO trades (
          symbol, side, quote_qty, latency_ms, mode, status, error_reason
        )
        VALUES (
          ${req.symbol}, ${req.side.toUpperCase()}, ${req.quoteQty},
          ${latencyMs}, 'dry-run', 'filled', 'live_trading_not_implemented'
        )
        RETURNING id
      `;

      return {
        tradeId: result?.id || 0,
        status: "filled",
        mode: "dry-run",
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorReason = error instanceof Error ? error.message : String(error);

      // Record failed trade
      const result = await BotDB.queryRow<{ id: number }>`
        INSERT INTO trades (
          symbol, side, quote_qty, latency_ms, mode, status, error_reason
        )
        VALUES (
          ${req.symbol}, ${req.side.toUpperCase()}, ${req.quoteQty},
          ${latencyMs}, 'dry-run', 'failed', ${errorReason}
        )
        RETURNING id
      `;

      log.error("Trade execution failed", {
        metric: "trade_failed_total",
        tradeId: result?.id,
        symbol: req.symbol,
        error,
        latencyMs,
      });

      return {
        tradeId: result?.id || 0,
        status: "failed",
        mode: "dry-run",
        latencyMs,
        errorReason,
      };
    }
  }
);

// TODO: Implement PubSub subscription for auto-trading new listings
// This will be added after MEXC client is fully implemented
// See User Story 2 acceptance scenarios for auto-trade flow
