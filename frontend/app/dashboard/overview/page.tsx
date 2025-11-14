import { Suspense } from "react";
import { SystemHealth } from "./components/SystemHealth";
import { RiskMetrics } from "./components/RiskMetrics";
import { TradeAnalytics } from "./components/TradeAnalytics";

/**
 * Overview page - System health, risk metrics, and analytics
 * User Story 3: Operate and Inspect the Bot via Dashboard
 */
export default function OverviewPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor bot health, risk metrics, and performance analytics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Suspense fallback={<div>Loading system health...</div>}>
          <SystemHealth />
        </Suspense>

        {/* Risk Metrics */}
        <Suspense fallback={<div>Loading risk metrics...</div>}>
          <RiskMetrics />
        </Suspense>
      </div>

      {/* Trade Analytics */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <TradeAnalytics />
      </Suspense>
    </div>
  );
}
