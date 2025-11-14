"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMonitorStatus } from "../hooks/useMonitorStatus";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  running: {
    label: "Running",
    color: "bg-green-500",
    icon: "●",
  },
  stopped: {
    label: "Stopped",
    color: "bg-gray-500",
    icon: "○",
  },
  degraded: {
    label: "Degraded",
    color: "bg-yellow-500",
    icon: "◐",
  },
} as const;

export function BotStatusCard() {
  const { data, isLoading, error } = useMonitorStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Status</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Status</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load status
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) return null;

  const config = statusConfig[data.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Bot Status
          <Badge
            variant="secondary"
            className={`${config.color} text-white flex items-center gap-1`}
          >
            <span>{config.icon}</span>
            {config.label}
          </Badge>
        </CardTitle>
        <CardDescription>
          {data.status === "running"
            ? "Monitoring MEXC for new listings"
            : data.status === "degraded"
            ? "Running with issues"
            : "Not currently monitoring"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Listings Detected</p>
            <p className="text-2xl font-bold">{data.listingsDetected}</p>
          </div>
          {data.uptime !== null && (
            <div>
              <p className="text-muted-foreground">Uptime</p>
              <p className="text-xl font-semibold">
                {Math.floor(data.uptime / 60)}m {data.uptime % 60}s
              </p>
            </div>
          )}
        </div>

        {data.lastEventAt && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Last listing:{" "}
              {formatDistanceToNow(new Date(data.lastEventAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <div
            className={`h-2 w-2 rounded-full ${
              data.websocketConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-muted-foreground">
            WebSocket {data.websocketConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {data.lastError && (
          <div className="pt-2 border-t">
            <p className="text-xs text-destructive">{data.lastError}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
