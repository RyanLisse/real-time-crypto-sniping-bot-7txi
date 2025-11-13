import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import type { DashboardEvent } from "~backend/api/dashboard-stream";

interface LiveFeedProps {
  events: DashboardEvent[];
}

export function LiveFeed({ events }: LiveFeedProps) {
  const getEventBadge = (type: string) => {
    switch (type) {
      case "listing":
        return <Badge variant="default">New Listing</Badge>;
      case "market":
        return <Badge variant="secondary">Market Data</Badge>;
      case "trade":
        return <Badge variant="outline">Trade</Badge>;
      case "health":
        return <Badge variant="outline">Health</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Event Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events yet. Start monitoring to see live updates.
            </p>
          ) : (
            events.map((event, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex-shrink-0 mt-1">{getEventBadge(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <pre className="text-sm mt-1 overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
