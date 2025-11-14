"use client";

import { useConfig, useUpdateConfig } from "../hooks/useConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Configuration form component
 * User Story 2 T113-T117: Form with validation and auto-trade toggle
 */
export function ConfigForm() {
  const { data: config, isLoading, error } = useConfig();
  const updateConfig = useUpdateConfig();
  
  const [maxTradeUsdt, setMaxTradeUsdt] = useState("");
  const [maxPositionUsdt, setMaxPositionUsdt] = useState("");
  const [highValueThresholdUsdt, setHighValueThresholdUsdt] = useState("");
  const [autoTrade, setAutoTrade] = useState(false);
  const [showAutoTradeWarning, setShowAutoTradeWarning] = useState(false);

  // Update local state when config loads
  if (config && !maxTradeUsdt) {
    setMaxTradeUsdt(config.maxTradeUsdt.toString());
    setMaxPositionUsdt(config.maxPositionUsdt.toString());
    setHighValueThresholdUsdt(config.highValueThresholdUsdt.toString());
    setAutoTrade(config.autoTrade);
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading configuration...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        Failed to load config: {error.message}
      </div>
    );
  }

  // T116: Form validation
  const validateForm = (): string | null => {
    const maxTrade = parseFloat(maxTradeUsdt);
    const maxPosition = parseFloat(maxPositionUsdt);
    const threshold = parseFloat(highValueThresholdUsdt);

    if (isNaN(maxTrade) || maxTrade <= 0) {
      return "Max trade amount must be a positive number";
    }

    if (isNaN(maxPosition) || maxPosition <= 0) {
      return "Max position amount must be a positive number";
    }

    if (maxPosition < maxTrade) {
      return "Max position must be greater than or equal to max trade";
    }

    if (isNaN(threshold) || threshold <= 0) {
      return "High-value threshold must be a positive number";
    }

    return null;
  };

  const handleSubmit = () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    updateConfig.mutate({
      maxTradeUsdt: parseFloat(maxTradeUsdt),
      maxPositionUsdt: parseFloat(maxPositionUsdt),
      highValueThresholdUsdt: parseFloat(highValueThresholdUsdt),
      autoTrade,
    });
  };

  // T115: Auto-trade toggle with warning
  const handleAutoTradeChange = (checked: boolean) => {
    if (checked && !config?.autoTrade) {
      // Show warning when enabling
      setShowAutoTradeWarning(true);
    } else {
      setAutoTrade(checked);
    }
  };

  const confirmAutoTradeEnable = () => {
    setAutoTrade(true);
    setShowAutoTradeWarning(false);
  };

  return (
    <div className="space-y-6">
      {/* T117: Display current config with timestamps */}
      {config && (
        <div className="text-xs text-muted-foreground space-y-1 border-b pb-4">
          <div>Last updated: {new Date(config.updatedAt).toLocaleString()}</div>
          <div>Created: {new Date(config.createdAt).toLocaleString()}</div>
        </div>
      )}

      {/* T114: Input fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxTrade">Max Trade (USDT)</Label>
          <Input
            id="maxTrade"
            type="number"
            step="0.01"
            min="0.01"
            value={maxTradeUsdt}
            onChange={(e) => setMaxTradeUsdt(e.target.value)}
            placeholder="100.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPosition">Max Position (USDT)</Label>
          <Input
            id="maxPosition"
            type="number"
            step="0.01"
            min="0.01"
            value={maxPositionUsdt}
            onChange={(e) => setMaxPositionUsdt(e.target.value)}
            placeholder="1000.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">High-Value Threshold (USDT)</Label>
          <Input
            id="threshold"
            type="number"
            step="0.01"
            min="0.01"
            value={highValueThresholdUsdt}
            onChange={(e) => setHighValueThresholdUsdt(e.target.value)}
            placeholder="500.00"
          />
        </div>

        <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
          <div className="space-y-0.5">
            <Label htmlFor="autoTrade" className="text-base">
              Auto-Trade Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              {autoTrade ? "Live trading enabled" : "Dry-run mode (simulated)"}
            </p>
          </div>
          <Switch
            id="autoTrade"
            checked={autoTrade}
            onCheckedChange={handleAutoTradeChange}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={updateConfig.isPending}
          className="flex-1"
        >
          {updateConfig.isPending ? "Saving..." : "Save Configuration"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (config) {
              setMaxTradeUsdt(config.maxTradeUsdt.toString());
              setMaxPositionUsdt(config.maxPositionUsdt.toString());
              setHighValueThresholdUsdt(config.highValueThresholdUsdt.toString());
              setAutoTrade(config.autoTrade);
            }
          }}
        >
          Reset
        </Button>
      </div>

      {/* T127: Confirmation dialog for auto-trade */}
      <AlertDialog open={showAutoTradeWarning} onOpenChange={setShowAutoTradeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Enable Live Trading?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to enable <strong>live trading mode</strong>. This will execute real orders on the MEXC exchange.
              </p>
              <p className="font-semibold text-destructive">
                ⚠️ Real money will be used. Ensure you have:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Verified your MEXC API keys are configured</li>
                <li>Set appropriate risk limits</li>
                <li>Understood the risks of automated trading</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAutoTrade(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAutoTradeEnable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              I Understand, Enable Live Trading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
