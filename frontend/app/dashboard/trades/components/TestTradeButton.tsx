"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfig } from "../../config/hooks/useConfig";
import { useExecuteTestTrade } from "../hooks/useExecuteTestTrade";

/**
 * Test Trade button for firing a small microtrade.
 * Uses min(config.maxTradeUsdt, $10) as the quote amount.
 */
export function TestTradeButton() {
  const { data: config, isLoading: configLoading, error: configError } = useConfig();
  const executeTestTrade = useExecuteTestTrade();
  const { toast } = useToast();

  const microTradeUsdt = config ? Math.min(config.maxTradeUsdt, 10) : 10;

  const handleClick = () => {
    if (!config || executeTestTrade.isPending) return;

    executeTestTrade.mutate(
      {
        symbol: "TESTUSDT",
        side: "buy",
        quoteQty: microTradeUsdt,
      },
      {
        onSuccess: (res) => {
          if (res.status === "filled") {
            toast({
              title: "Test trade executed",
              description: `Trade ${res.tradeId} (${res.mode}) - ${microTradeUsdt.toFixed(2)} USDT`,
            });
          } else if (res.status === "rejected") {
            toast({
              title: "Test trade rejected",
              description: res.errorReason
                ? `Reason: ${res.errorReason}`
                : "Trade was rejected by risk checks.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Test trade failed",
              description: res.errorReason ?? "Unexpected error while executing test trade.",
              variant: "destructive",
            });
          }
        },
        onError: (error) => {
          toast({
            title: "Test trade error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  let label = "Test Trade";
  if (configLoading && !config) {
    label = "Loading config...";
  } else if (configError) {
    label = "Test Trade unavailable";
  } else if (config) {
    label = `Test Trade (${microTradeUsdt.toFixed(2)} USDT)`;
  }

  const disabled = configLoading || !!configError || !config || executeTestTrade.isPending;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
      >
        {executeTestTrade.isPending ? "Executing..." : label}
      </Button>
      <p className="text-xs text-muted-foreground max-w-xs text-right">
        Uses min(current max trade, $10) as the microtrade amount and the current trading mode
        (dry-run or live) from your configuration.
      </p>
    </div>
  );
}
