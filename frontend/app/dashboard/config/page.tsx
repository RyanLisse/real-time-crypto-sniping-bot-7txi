import { Suspense } from "react";
import { ConfigForm } from "./components/ConfigForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Configuration page - manage trading limits and auto-trade toggle
 * User Story 2 T112: Configuration panel
 */
export default function ConfigPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Manage risk limits and trading mode
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Limits</CardTitle>
            <CardDescription>
              Configure maximum trade and position sizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading configuration...</div>}>
              <ConfigForm />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Information</CardTitle>
            <CardDescription>Understanding the configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Max Trade (USDT)</h4>
              <p className="text-muted-foreground">
                Maximum quote currency amount per single trade. Trades exceeding this limit will be rejected.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Max Position (USDT)</h4>
              <p className="text-muted-foreground">
                Maximum total exposure across all trades (24-hour rolling window). Must be ≥ max trade amount.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">High-Value Threshold</h4>
              <p className="text-muted-foreground">
                Trades above this amount require dashboard confirmation (default: $500 USDT).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Auto-Trade Mode</h4>
              <p className="text-muted-foreground">
                <span className="font-semibold text-destructive">OFF (dry-run)</span>: Simulates trades without hitting the exchange.
                <br />
                <span className="font-semibold text-primary">ON (live)</span>: Executes real orders on MEXC.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
