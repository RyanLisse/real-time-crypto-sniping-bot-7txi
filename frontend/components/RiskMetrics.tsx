import { useEffect, useState } from "react";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import type { RiskMetrics as RiskMetricsType } from "~backend/risk-manager/risk-analysis";

export function RiskMetrics() {
  const [metrics, setMetrics] = useState<RiskMetricsType | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await backend.risk_manager.getRiskMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  if (!metrics) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Exposure</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalExposure.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.activePositions} active positions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalTrades} total trades
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              metrics.avgLatency < 100 ? "text-green-500" : "text-yellow-500"
            }`}
          >
            {metrics.avgLatency}ms
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.failedTrades} failed trades
          </p>
        </CardContent>
      </Card>
    </>
  );
}
