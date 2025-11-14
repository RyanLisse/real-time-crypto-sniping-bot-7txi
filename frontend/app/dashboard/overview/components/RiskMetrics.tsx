"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

/**
 * Risk Metrics component
 * User Story 3 AS-3: Display risk utilization and exposure metrics
 */

interface RiskMetricsResponse {
  currentExposure24h: number;
  maxTradeUsdt: number;
  maxPositionUsdt: number;
  tradeUtilization: number; // 0-100%
  positionUtilization: number; // 0-100%
  autoTradeEnabled: boolean;
}

async function fetchRiskMetrics(): Promise<RiskMetricsResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  
  // Fetch config and current exposure
  const [configRes, tradesRes] = await Promise.all([
    fetch(`${API_BASE_URL}/config`, { cache: "no-store" }),
    fetch(`${API_BASE_URL}/trade/history?limit=1000`, { cache: "no-store" }),
  ]);

  if (!configRes.ok || !tradesRes.ok) {
    throw new Error("Failed to fetch risk metrics");
  }

  const config = await configRes.json();
  const tradesData = await tradesRes.json();

  // Calculate 24hr exposure
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recentTrades = tradesData.trades?.filter((t: any) => 
    new Date(t.createdAt).getTime() > last24h
  ) || [];

  const currentExposure24h = recentTrades.reduce(
    (sum: number, t: any) => sum + (t.quoteQty || 0),
    0
  );

  return {
    currentExposure24h,
    maxTradeUsdt: config.maxTradeUsdt || 0,
    maxPositionUsdt: config.maxPositionUsdt || 0,
    tradeUtilization: 0, // Single trade doesn't have utilization
    positionUtilization: config.maxPositionUsdt > 0 
      ? Math.min((currentExposure24h / config.maxPositionUsdt) * 100, 100)
      : 0,
    autoTradeEnabled: config.autoTrade || false,
  };
}

export function RiskMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["riskMetrics"],
    queryFn: fetchRiskMetrics,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const isHighRisk = (metrics?.positionUtilization || 0) > 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Risk Metrics
          {isHighRisk && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
        </CardTitle>
        <CardDescription>
          24-hour exposure and limit utilization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics && (
          <>
            {/* Current Exposure */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current 24h Exposure</span>
                <span className="text-2xl font-bold">
                  ${metrics.currentExposure24h.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Max Position: ${metrics.maxPositionUsdt.toFixed(2)} USDT
              </p>
            </div>

            {/* Position Utilization */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Position Utilization</span>
                <span className={`text-sm font-semibold ${
                  metrics.positionUtilization > 80 ? "text-yellow-600" : 
                  metrics.positionUtilization > 50 ? "text-blue-600" : 
                  "text-green-600"
                }`}>
                  {metrics.positionUtilization.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={metrics.positionUtilization} 
                className="h-2"
              />
              {metrics.positionUtilization > 80 && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Approaching position limit
                </p>
              )}
            </div>

            {/* Trading Limits */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Trade</span>
                <span className="font-medium">${metrics.maxTradeUsdt.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Position</span>
                <span className="font-medium">${metrics.maxPositionUsdt.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto-Trade</span>
                <span className={`font-medium ${
                  metrics.autoTradeEnabled ? "text-primary" : "text-muted-foreground"
                }`}>
                  {metrics.autoTradeEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
