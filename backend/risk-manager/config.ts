import { api } from "encore.dev/api";
import db from "../external_dbs/neondb/db";

export interface TradingConfig {
  maxPositionSize: number;
  maxTradeAmount: number;
  riskPerTrade: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxSlippagePct: number;
  enabled: boolean;
}

export const getConfig = api<void, TradingConfig>(
  { method: "GET", path: "/config", expose: true },
  async () => {
    const config = await db.queryRow<{
      max_position_size: number;
      max_trade_amount: number;
      risk_per_trade: number;
      stop_loss_pct: number;
      take_profit_pct: number;
      max_slippage_pct: number;
      enabled: boolean;
    }>`
      SELECT * FROM trade_config WHERE id = 1
    `;

    if (!config) {
      throw new Error("Config not found");
    }

    return {
      maxPositionSize: config.max_position_size,
      maxTradeAmount: config.max_trade_amount,
      riskPerTrade: config.risk_per_trade,
      stopLossPct: config.stop_loss_pct,
      takeProfitPct: config.take_profit_pct,
      maxSlippagePct: config.max_slippage_pct,
      enabled: config.enabled,
    };
  }
);

export interface UpdateConfigRequest {
  maxPositionSize?: number;
  maxTradeAmount?: number;
  riskPerTrade?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
  maxSlippagePct?: number;
  enabled?: boolean;
}

export const updateConfig = api<UpdateConfigRequest, TradingConfig>(
  { method: "PUT", path: "/config", expose: true },
  async (req) => {
    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (req.maxPositionSize !== undefined) {
      values.push(req.maxPositionSize);
      updates.push(`max_position_size = $${values.length}`);
    }
    if (req.maxTradeAmount !== undefined) {
      values.push(req.maxTradeAmount);
      updates.push(`max_trade_amount = $${values.length}`);
    }
    if (req.riskPerTrade !== undefined) {
      values.push(req.riskPerTrade);
      updates.push(`risk_per_trade = $${values.length}`);
    }
    if (req.stopLossPct !== undefined) {
      values.push(req.stopLossPct);
      updates.push(`stop_loss_pct = $${values.length}`);
    }
    if (req.takeProfitPct !== undefined) {
      values.push(req.takeProfitPct);
      updates.push(`take_profit_pct = $${values.length}`);
    }
    if (req.maxSlippagePct !== undefined) {
      values.push(req.maxSlippagePct);
      updates.push(`max_slippage_pct = $${values.length}`);
    }
    if (req.enabled !== undefined) {
      values.push(req.enabled);
      updates.push(`enabled = $${values.length}`);
    }

    if (updates.length > 0) {
      await db.rawExec(
        `UPDATE trade_config SET ${updates.join(", ")}, updated_at = NOW() WHERE id = 1`,
        ...values
      );
    }

    const config = await db.queryRow<{
      max_position_size: number;
      max_trade_amount: number;
      risk_per_trade: number;
      stop_loss_pct: number;
      take_profit_pct: number;
      max_slippage_pct: number;
      enabled: boolean;
    }>`
      SELECT * FROM trade_config WHERE id = 1
    `;

    if (!config) {
      throw new Error("Config not found");
    }

    return {
      maxPositionSize: config.max_position_size,
      maxTradeAmount: config.max_trade_amount,
      riskPerTrade: config.risk_per_trade,
      stopLossPct: config.stop_loss_pct,
      takeProfitPct: config.take_profit_pct,
      maxSlippagePct: config.max_slippage_pct,
      enabled: config.enabled,
    };
  }
);
