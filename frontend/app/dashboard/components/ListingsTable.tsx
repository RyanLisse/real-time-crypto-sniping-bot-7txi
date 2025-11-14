"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useListings, type Listing } from "../hooks/useListings";
import { formatDistanceToNow } from "date-fns";

const sourceColors = {
  mexc_websocket: "bg-green-500",
  mexc_rest_api: "bg-blue-500",
  test_injection: "bg-yellow-500",
} as const;

const sourceLabels = {
  mexc_websocket: "WebSocket",
  mexc_rest_api: "REST API",
  test_injection: "Test",
} as const;

export function ListingsTable() {
  const { data, isLoading, error } = useListings(50);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Failed to load listings: {error.message}</p>
      </div>
    );
  }

  if (!data || data.listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-1">No listings yet</h3>
        <p className="text-sm text-muted-foreground">
          New MEXC listings will appear here when detected
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>
        Showing {data.listings.length} of {data.total} total listings
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Listed At</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Detected</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.listings.map((listing: Listing) => (
          <TableRow key={listing.id}>
            <TableCell className="font-mono font-semibold">
              {listing.symbol}
            </TableCell>
            <TableCell className="text-sm">
              {formatDistanceToNow(new Date(listing.listedAt), {
                addSuffix: true,
              })}
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={`${sourceColors[listing.source]} text-white`}
              >
                {sourceLabels[listing.source]}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(listing.createdAt), {
                addSuffix: true,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
