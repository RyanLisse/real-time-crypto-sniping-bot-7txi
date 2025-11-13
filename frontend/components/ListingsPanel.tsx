import { useEffect, useState } from "react";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "~backend/api/listings";

export function ListingsPanel() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const result = await backend.api.listListings({ limit: 100 });
      setListings(result.listings);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Listings ({listings.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No listings detected yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Symbol</th>
                    <th className="pb-2 font-medium">Pair</th>
                    <th className="pb-2 font-medium">First Price</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Detected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-muted/50">
                      <td className="py-3 font-mono font-semibold">{listing.symbol}</td>
                      <td className="py-3">
                        {listing.baseCurrency}/{listing.quoteCurrency}
                      </td>
                      <td className="py-3 font-mono">
                        {listing.firstPrice?.toFixed(8) || "N/A"}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{listing.listingSource}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(listing.detectedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
