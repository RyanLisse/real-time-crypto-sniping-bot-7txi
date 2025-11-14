"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive font-mono">{error.message}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = "/"} variant="outline" className="flex-1">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
