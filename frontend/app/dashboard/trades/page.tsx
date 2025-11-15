import { Suspense } from "react";
import { TradesTable } from "./components/TradesTable";
import { TestTradeButton } from "./components/TestTradeButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Trades page - displays execution history
 * User Story 2 T105: Trades table layout
 */
export default function TradesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
        <p className="text-muted-foreground mt-2">
          View all trade executions (dry-run and live)
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              Execution history with status, mode, and latency tracking
            </CardDescription>
          </div>
          <TestTradeButton />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading trades...</div>}>
            <TradesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
