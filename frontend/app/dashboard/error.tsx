"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Error</h1>
        <p className="text-muted-foreground">
          Failed to load the dashboard
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error.message || "An unexpected error occurred"}</p>
          {error.digest && (
            <p className="text-xs font-mono">Error ID: {error.digest}</p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button onClick={reset}>
          Retry
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Page
        </Button>
      </div>
    </div>
  );
}
