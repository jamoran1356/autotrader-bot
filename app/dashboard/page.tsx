import { Badge } from "@/components/ui/badge";
import { TradingOpsPanel } from "@/components/dashboard/trading-ops-panel";
import { AiSettingsPanel } from "@/components/dashboard/ai-settings-panel";
import { AiAnalysisPanel } from "@/components/dashboard/ai-analysis-panel";
import { AiAutoTradePanel } from "@/components/dashboard/ai-auto-trade-panel";
import { AiHistoryPanel } from "@/components/dashboard/ai-history-panel";
import { OnboardingStepper } from "@/components/dashboard/onboarding-stepper";
import { LiveScanPanel } from "@/components/dashboard/live-scan-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveTrades, getStats } from "@/lib/server/queries";

export default async function DashboardPage() {
  const [stats, trades] = await Promise.all([getStats(), getActiveTrades()]);

  return (
    <div className="page-shell space-y-8">
      <section className="space-y-4">
        <span className="eyebrow">Dashboard</span>
        <h1 className="text-4xl font-semibold tracking-tight">AI-Powered Trading on HashKey Chain</h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--muted)]">
          Configure your AI provider, run intelligent market analysis, and let the AI gate every on-chain execution. Every decision is logged for full transparency.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard label="Total trades" value={stats.totalTrades} />
        <StatCard label="Win rate" value={stats.winRate} />
        <StatCard label="P&L / volume" value={stats.totalVolume} />
        <StatCard label="Active trades" value={stats.activeTrades} />
      </section>

      {/* Onboarding guide — disappears once all steps are complete */}
      <section>
        <OnboardingStepper />
      </section>

      {/* Live scanner — works without AI key, immediate demo value */}
      <section>
        <LiveScanPanel />
      </section>

      <section id="ai-settings" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Active trades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trades.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
                No open onchain trades yet. Use the AI One-Shot Execution below or fund the bot balance and enable AI Auto-Trade.
              </div>
            ) : trades.map((trade) => (
              <div key={trade.txHash} className="flex flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{trade.pair}</p>
                  <p className="text-sm text-[var(--muted)]">{trade.txHash}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="success">{trade.status}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${trade.entryPrice}</p>
                    <p className="text-xs text-[var(--muted)]">Entry</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <AiSettingsPanel />
      </section>

      <section id="ai-analysis">
        <AiAnalysisPanel />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AiAutoTradePanel />
        <AiHistoryPanel />
      </section>

      <section>
        <TradingOpsPanel />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}