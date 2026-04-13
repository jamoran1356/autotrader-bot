import { Badge } from "@/components/ui/badge";
import { TradingOpsPanel } from "@/components/dashboard/trading-ops-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveTrades, getPlatformStats } from "@/lib/api";

export default async function DashboardPage() {
  const [stats, trades] = await Promise.all([getPlatformStats(), getActiveTrades()]);

  return (
    <div className="page-shell space-y-8">
      <section className="space-y-4">
        <span className="eyebrow">Dashboard</span>
        <h1 className="text-4xl font-semibold tracking-tight">Live portfolio and execution overview</h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--muted)]">
          A clear summary of the bot, active positions, and managed volume. This is where onchain execution and premium micropayments connect.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard label="Total trades" value={stats.totalTrades} />
        <StatCard label="Win rate" value={stats.winRate} />
        <StatCard label="P&L / volume" value={stats.totalVolume} />
        <StatCard label="Active trades" value={stats.activeTrades} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Active trades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trades.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
                No open onchain trades yet. Use the backend execution endpoint after funding the bot balance in the contract.
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Immediate roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted)]">
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">Connect wallet and direct execution against AutoTrader on HashKey testnet.</div>
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">Add a premium feed protected by x402 HTTP payments on Stellar testnet.</div>
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">Expose token and per-bot fee sharing through Bags SDK and public API.</div>
          </CardContent>
        </Card>
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