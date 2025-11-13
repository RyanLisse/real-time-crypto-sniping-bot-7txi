import { useEffect, useState } from "react";
import backend from "~backend/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import type { TradingConfig } from "~backend/risk-manager/config";

export function ConfigPanel() {
  const [config, setConfig] = useState<TradingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await backend.risk_manager.getConfig();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load config:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await backend.risk_manager.updateConfig(config);
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });
    } catch (error) {
      console.error("Failed to save config:", error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Configuration</CardTitle>
        <CardDescription>Configure risk management and trading parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Trading</Label>
            <p className="text-sm text-muted-foreground">
              Master switch for all trading operations
            </p>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxPositionSize">Max Position Size ($)</Label>
            <Input
              id="maxPositionSize"
              type="number"
              step="0.01"
              value={config.maxPositionSize}
              onChange={(e) =>
                setConfig({ ...config, maxPositionSize: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTradeAmount">Max Trade Amount ($)</Label>
            <Input
              id="maxTradeAmount"
              type="number"
              step="0.01"
              value={config.maxTradeAmount}
              onChange={(e) =>
                setConfig({ ...config, maxTradeAmount: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
            <Input
              id="riskPerTrade"
              type="number"
              step="0.001"
              value={config.riskPerTrade}
              onChange={(e) =>
                setConfig({ ...config, riskPerTrade: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLossPct">Stop Loss (%)</Label>
            <Input
              id="stopLossPct"
              type="number"
              step="0.01"
              value={config.stopLossPct}
              onChange={(e) =>
                setConfig({ ...config, stopLossPct: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takeProfitPct">Take Profit (%)</Label>
            <Input
              id="takeProfitPct"
              type="number"
              step="0.01"
              value={config.takeProfitPct}
              onChange={(e) =>
                setConfig({ ...config, takeProfitPct: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxSlippagePct">Max Slippage (%)</Label>
            <Input
              id="maxSlippagePct"
              type="number"
              step="0.001"
              value={config.maxSlippagePct}
              onChange={(e) =>
                setConfig({ ...config, maxSlippagePct: parseFloat(e.target.value) })
              }
            />
          </div>
        </div>

        <Button onClick={saveConfig} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}
