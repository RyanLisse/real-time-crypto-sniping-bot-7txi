"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

/**
 * System Health component
 * User Story 3 AS-1: Display system health, version, and component status
 */

interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  components: {
    database: "healthy" | "degraded" | "down";
    mexc: "healthy" | "degraded" | "down";
    websocket: "healthy" | "degraded" | "down";
  };
  uptime: number;
}

async function fetchHealth(): Promise<HealthResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch health");
  }

  return response.json();
}

export function SystemHealth() {
  const { data: health, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      healthy: "default",
      degraded: "secondary",
      down: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Health
          {health && getStatusBadge(health.status)}
        </CardTitle>
        <CardDescription>
          Version {health?.version || "unknown"} • {health?.environment || "unknown"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {health && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.components.database)}
                  <span className="font-medium">Database</span>
                </div>
                {getStatusBadge(health.components.database)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.components.mexc)}
                  <span className="font-medium">MEXC API</span>
                </div>
                {getStatusBadge(health.components.mexc)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.components.websocket)}
                  <span className="font-medium">WebSocket</span>
                </div>
                {getStatusBadge(health.components.websocket)}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Uptime: {formatUptime(health.uptime)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
