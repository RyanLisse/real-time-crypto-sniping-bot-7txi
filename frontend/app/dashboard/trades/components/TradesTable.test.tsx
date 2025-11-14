import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TradesTable } from "./TradesTable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Component tests for TradesTable
 * User Story 2 T140: Component test with mock data
 */

// Mock the useTrades hook
vi.mock("../hooks/useTrades", () => ({
  useTrades: vi.fn(),
}));

const { useTrades } = await import("../hooks/useTrades");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("TradesTable", () => {
  it("should display loading state", () => {
    vi.mocked(useTrades).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<TradesTable />, { wrapper: createWrapper() });

    // Check for loading spinner by class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should display error state", () => {
    vi.mocked(useTrades).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch trades"),
    } as any);

    render(<TradesTable />, { wrapper: createWrapper() });

    expect(screen.getByText(/Failed to load trades/i)).toBeInTheDocument();
  });

  it("should display empty state when no trades", () => {
    vi.mocked(useTrades).mockReturnValue({
      data: {
        trades: [],
        total: 0,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<TradesTable />, { wrapper: createWrapper() });

    expect(screen.getByText(/No trades yet/i)).toBeInTheDocument();
  });

  it("should render trades table with data", () => {
    const mockTrades = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "BUY",
        quoteQty: 100.5,
        baseQty: 0.00123456,
        latencyMs: 45,
        mode: "dry-run",
        status: "filled",
        errorReason: null,
        exchangeOrderId: null,
        createdAt: "2025-11-14T10:00:00.000Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "BUY",
        quoteQty: 50.0,
        baseQty: null,
        latencyMs: 120,
        mode: "live",
        status: "rejected",
        errorReason: "exceeds_max_trade_usdt",
        exchangeOrderId: null,
        createdAt: "2025-11-14T09:00:00.000Z",
      },
    ];

    vi.mocked(useTrades).mockReturnValue({
      data: {
        trades: mockTrades,
        total: 2,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<TradesTable />, { wrapper: createWrapper() });

    // Check table headers
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Mode")).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    expect(screen.getByText("$100.50")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
  });

  it("should highlight high latency trades", () => {
    const mockTrade = {
      id: 1,
      symbol: "BTCUSDT",
      side: "BUY",
      quoteQty: 100,
      baseQty: 0.001,
      latencyMs: 150, // > 100ms
      mode: "live",
      status: "filled",
      errorReason: null,
      exchangeOrderId: "12345",
      createdAt: "2025-11-14T10:00:00.000Z",
    };

    vi.mocked(useTrades).mockReturnValue({
      data: {
        trades: [mockTrade],
        total: 1,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<TradesTable />, { wrapper: createWrapper() });

    const latencyCell = screen.getByText("150ms");
    expect(latencyCell).toHaveClass("text-destructive");
  });

  it("should display correct status badges", () => {
    const mockTrades = [
      {
        id: 1,
        symbol: "BTC",
        side: "BUY",
        quoteQty: 100,
        baseQty: 0.001,
        latencyMs: 50,
        mode: "dry-run",
        status: "filled",
        errorReason: null,
        exchangeOrderId: null,
        createdAt: "2025-11-14T10:00:00.000Z",
      },
      {
        id: 2,
        symbol: "ETH",
        side: "BUY",
        quoteQty: 50,
        baseQty: null,
        latencyMs: 30,
        mode: "live",
        status: "rejected",
        errorReason: "risk_check_failed",
        exchangeOrderId: null,
        createdAt: "2025-11-14T09:00:00.000Z",
      },
    ];

    vi.mocked(useTrades).mockReturnValue({
      data: {
        trades: mockTrades,
        total: 2,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<TradesTable />, { wrapper: createWrapper() });

    // Status badges should be rendered
    expect(screen.getByText("filled")).toBeInTheDocument();
    expect(screen.getByText("rejected")).toBeInTheDocument();
  });
});
