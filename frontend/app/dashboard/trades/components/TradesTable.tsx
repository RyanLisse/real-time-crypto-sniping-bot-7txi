"use client";

import { useTrades } from "../hooks/useTrades";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Trades table component with filtering and pagination
 * User Story 2 T106-T111: Display columns, badges, pagination, filters
 */
export function TradesTable() {
  const [mode, setMode] = useState<"dry-run" | "live" | undefined>();
  const [status, setStatus] = useState<"filled" | "rejected" | "failed" | "pending" | undefined>();
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useTrades({
    limit,
    offset: page * limit,
    mode,
    status,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load trades: {error.message}
      </div>
    );
  }

  const trades = data?.trades || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // T108: Status badges with colors
  const getStatusBadge = (tradeStatus: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      filled: "default", // green
      rejected: "secondary", // yellow
      failed: "destructive", // red
      pending: "outline", // blue
    };
    return (
      <Badge variant={variants[tradeStatus] || "outline"}>
        {tradeStatus}
      </Badge>
    );
  };

  // T109: Mode badges
  const getModeBadge = (tradeMode: string) => {
    return (
      <Badge variant={tradeMode === "live" ? "default" : "secondary"}>
        {tradeMode}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* T111: Filter controls */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Filter by Mode</label>
          <Select
            value={mode || "all"}
            onValueChange={(value) => {
              setMode(value === "all" ? undefined : value as "dry-run" | "live");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="dry-run">Dry-run</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Filter by Status</label>
          <Select
            value={status || "all"}
            onValueChange={(value) => {
              setStatus(value === "all" ? undefined : value as any);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* T128: Empty state */}
      {trades.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No trades yet</p>
          <p className="text-sm mt-2">Execute a trade to see it here</p>
        </div>
      ) : (
        <>
          {/* T107: Trades table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quote Qty</TableHead>
                  <TableHead>Base Qty</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-mono text-xs">{trade.id}</TableCell>
                    <TableCell className="font-semibold">{trade.symbol}</TableCell>
                    <TableCell>{trade.side}</TableCell>
                    <TableCell>${trade.quoteQty.toFixed(2)}</TableCell>
                    <TableCell>
                      {trade.baseQty ? trade.baseQty.toFixed(8) : "-"}
                    </TableCell>
                    <TableCell>{getModeBadge(trade.mode)}</TableCell>
                    <TableCell>{getStatusBadge(trade.status)}</TableCell>
                    <TableCell>
                      <span className={trade.latencyMs > 100 ? "text-destructive" : ""}>
                        {trade.latencyMs}ms
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(trade.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {trade.errorReason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* T110: Pagination controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total} trades
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {page + 1} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
