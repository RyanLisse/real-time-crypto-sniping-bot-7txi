export interface TradeRequest {
  symbol: string;
  side: "buy" | "sell";
  orderType: "market" | "limit";
  quantity: number;
  price?: number;
  listingId?: number;
}

export interface TradeResponse {
  tradeId: number;
  orderId?: string;
  status: "executed" | "pending" | "failed";
  executedPrice?: number;
  latencyMs: number;
  errorMessage?: string;
}

export interface MEXCOrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: string;
  price?: string;
  timestamp: number;
  signature: string;
}

export interface MEXCOrderResponse {
  orderId: string;
  symbol: string;
  status: string;
  executedQty: string;
  price: string;
}
