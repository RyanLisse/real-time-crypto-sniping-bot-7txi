"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMonitorStatus, useStartMonitor, useStopMonitor } from "../hooks/useMonitorStatus";
import { Play, Square, Loader2 } from "lucide-react";

export function MonitorControls() {
  const { data: status } = useMonitorStatus();
  const startMutation = useStartMonitor();
  const stopMutation = useStopMonitor();

  const isRunning = status?.status === "running";
  const isLoading = startMutation.isPending || stopMutation.isPending;

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to start monitor:", error);
    }
  };

  const handleStop = async () => {
    try {
      await stopMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to stop monitor:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor Controls</CardTitle>
        <CardDescription>Start or stop listing detection</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          onClick={handleStart}
          disabled={isRunning || isLoading}
          className="flex-1"
          variant={isRunning ? "secondary" : "default"}
        >
          {isLoading && startMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Start
        </Button>
        <Button
          onClick={handleStop}
          disabled={!isRunning || isLoading}
          className="flex-1"
          variant={isRunning ? "destructive" : "secondary"}
        >
          {isLoading && stopMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          Stop
        </Button>
      </CardContent>
    </Card>
  );
}
