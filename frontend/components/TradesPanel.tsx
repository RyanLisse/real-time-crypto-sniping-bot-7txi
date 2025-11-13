import { useEffect, useState } from "react";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "~backend/trade-executor/history";

export function TradesPanel() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const result = await backend.trade_executor.listTrades({ limit: 100 });
      setTrades(result.trades);
    } catch (error) {
      console.error("Failed to load trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "executed":
        return <Badge variant="default">Executed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History ({trades.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trades executed yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Symbol</th>
                    <th className="pb-2 font-medium">Side</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Quantity</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Latency</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-muted/50">
                      <td className="py-3 font-mono font-semibold">{trade.symbol}</td>
                      <td className="py-3">
                        <Badge variant={trade.side === "buy" ? "default" : "destructive"}>
                          {trade.side.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{trade.orderType}</td>
                      <td className="py-3 font-mono">{trade.quantity.toFixed(4)}</td>
                      <td className="py-3 font-mono">{trade.price.toFixed(8)}</td>
                      <td className="py-3 font-mono">${trade.totalValue.toFixed(2)}</td>
                      <td className="py-3">
                        <span
                          className={
                            trade.latencyMs && trade.latencyMs < 100
                              ? "text-green-500"
                              : "text-yellow-500"
                          }
                        >
                          {trade.latencyMs}ms
                        </span>
                      </td>
                      <td className="py-3">{getStatusBadge(trade.status)}</td>
                      <td className="py-3 text-muted-foreground">
                        {trade.executedAt
                          ? new Date(trade.executedAt).toLocaleTimeString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
