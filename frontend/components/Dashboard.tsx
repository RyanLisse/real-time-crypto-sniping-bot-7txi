import { useState, useEffect } from "react";
import backend from "~backend/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, DollarSign, AlertTriangle, Play, Pause } from "lucide-react";
import { ListingsPanel } from "./ListingsPanel";
import { TradesPanel } from "./TradesPanel";
import { RiskMetrics } from "./RiskMetrics";
import { ConfigPanel } from "./ConfigPanel";
import { LiveFeed } from "./LiveFeed";
import type { DashboardEvent } from "~backend/api/dashboard-stream";

export function Dashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    connectToStream();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await backend.market_monitor.getMonitorStatus();
      setIsMonitoring(status.isMonitoring);
    } catch (error) {
      console.error("Failed to load status:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectToStream = async () => {
    try {
      const stream = await backend.api.dashboardStream();
      
      (async () => {
        for await (const event of stream) {
          setEvents((prev) => [event, ...prev.slice(0, 99)]);
        }
      })();
    } catch (error) {
      console.error("Stream connection failed:", error);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        await backend.market_monitor.stopMonitoring();
        setIsMonitoring(false);
      } else {
        await backend.market_monitor.startMonitoring();
        setIsMonitoring(true);
      }
    } catch (error) {
      console.error("Failed to toggle monitoring:", error);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Crypto Sniper Bot</h1>
          <p className="text-muted-foreground mt-1">Real-time MEXC listing monitor & trader</p>
        </div>
        <Button
          onClick={toggleMonitoring}
          disabled={loading}
          variant={isMonitoring ? "destructive" : "default"}
          size="lg"
        >
          {isMonitoring ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Stop Monitoring
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Monitoring
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isMonitoring ? "default" : "secondary"} className="text-sm">
          {isMonitoring ? "● LIVE" : "○ STOPPED"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {events.length} events
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isMonitoring ? "Active" : "Inactive"}</div>
            <p className="text-xs text-muted-foreground mt-1">WebSocket status</p>
          </CardContent>
        </Card>

        <RiskMetrics />
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <LiveFeed events={events} />
        </TabsContent>

        <TabsContent value="listings" className="space-y-4">
          <ListingsPanel />
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <TradesPanel />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <ConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
