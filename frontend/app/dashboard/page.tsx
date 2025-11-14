"use client";

import { BotStatusCard } from "./components/BotStatusCard";
import { MonitorControls } from "./components/MonitorControls";
import { ListingsTable } from "./components/ListingsTable";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">MEXC Sniper Bot</h1>
        <p className="text-muted-foreground">
          Monitor new MEXC listings in near real-time
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BotStatusCard />
        <MonitorControls />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Listings</h2>
          <ListingsTable />
        </div>
      </div>
    </div>
  );
}
