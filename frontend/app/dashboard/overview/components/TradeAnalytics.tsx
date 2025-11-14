"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Activity, Timer, CheckCircle2 } from "lucide-react";

/**
 * Trade Analytics component
 * User Story 3 AS-3: Aggregated trade statistics and latency metrics
 */

interface TradeAnalyticsResponse {
  totalTrades: number;
  dryRunTrades: number;
  liveTrades: number;
  successRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

async function fetchTradeAnalytics(): Promise<TradeAnalyticsResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${API_BASE_URL}/trade/history?limit=1000`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch trade analytics");
  }

  const data = await response.json();
  const trades = data.trades || [];

  if (trades.length === 0) {
    return {
      totalTrades: 0,
      dryRunTrades: 0,
      liveTrades: 0,
      successRate: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
    };
  }

  const dryRunTrades = trades.filter((t: any) => t.mode === "dry-run").length;
  const liveTrades = trades.filter((t: any) => t.mode === "live").length;
  const successfulTrades = trades.filter((t: any) => t.status === "filled").length;

  // Calculate latency percentiles
  const latencies = trades.map((t: any) => t.latencyMs).sort((a: number, b: number) => a - b);
  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  const avgLatency = latencies.reduce((sum: number, l: number) => sum + l, 0) / latencies.length;

  return {
    totalTrades: trades.length,
    dryRunTrades,
    liveTrades,
    successRate: trades.length > 0 ? (successfulTrades / trades.length) * 100 : 0,
    avgLatencyMs: Math.round(avgLatency),
    p50LatencyMs: latencies[p50Index] || 0,
    p95LatencyMs: latencies[p95Index] || 0,
    p99LatencyMs: latencies[p99Index] || 0,
  };
}

export function TradeAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["tradeAnalytics"],
    queryFn: fetchTradeAnalytics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Analytics</CardTitle>
        <CardDescription>
          Performance metrics and latency distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        {analytics && analytics.totalTrades > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Trades */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Total Trades</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalTrades}</p>
              <p className="text-xs text-muted-foreground">
                {analytics.dryRunTrades} dry-run / {analytics.liveTrades} live
              </p>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {analytics.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Filled trades
              </p>
            </div>

            {/* Average Latency */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span className="text-sm">Avg Latency</span>
              </div>
              <p className="text-2xl font-bold">{analytics.avgLatencyMs}ms</p>
              <p className="text-xs text-muted-foreground">
                Mean execution time
              </p>
            </div>

            {/* P99 Latency */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">P99 Latency</span>
              </div>
              <p className={`text-2xl font-bold ${
                analytics.p99LatencyMs > 100 ? "text-yellow-600" : "text-green-600"
              }`}>
                {analytics.p99LatencyMs}ms
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.p99LatencyMs > 100 ? "Above target" : "Within target"}
              </p>
            </div>

            {/* Latency Distribution */}
            <div className="col-span-2 md:col-span-4 pt-4 border-t space-y-2">
              <p className="text-sm font-medium">Latency Distribution</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">P50:</span>
                  <span className="ml-2 font-medium">{analytics.p50LatencyMs}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">P95:</span>
                  <span className="ml-2 font-medium">{analytics.p95LatencyMs}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">P99:</span>
                  <span className="ml-2 font-medium">{analytics.p99LatencyMs}ms</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trades yet</p>
            <p className="text-sm mt-2">Execute trades to see analytics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
