-- Performance optimization: Composite index for source-specific queries
CREATE INDEX idx_listings_source_created ON listings (source, created_at DESC);

-- Partial index for recent listings only (last 7 days)
-- This improves query performance for dashboard's "recent listings" view
CREATE INDEX idx_listings_recent ON listings (created_at DESC) 
  WHERE created_at > now() - INTERVAL '7 days';

COMMENT ON INDEX idx_listings_source_created IS 'Speeds up queries filtered by source and sorted by creation time';
COMMENT ON INDEX idx_listings_recent IS 'Optimized index for recent listings (last 7 days)';
