import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaderboard } from "@/lib/api";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="page-shell space-y-8">
      <section className="space-y-4">
        <span className="eyebrow">Leaderboard</span>
        <h1 className="text-4xl font-semibold tracking-tight">Public bot ranking by performance and followers</h1>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
            <Trophy className="h-6 w-6 text-[var(--accent)]" />
            Current top bots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-sm text-[var(--muted)]">
              No onchain leaderboard entries yet. Execute the first trade on HashKey testnet to populate this ranking.
            </div>
          ) : leaderboard.map((entry) => (
            <div key={entry.botId} className="grid gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 md:grid-cols-[80px_1.2fr_0.8fr_0.8fr_0.8fr] md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Rank</p>
                <p className="mt-1 text-2xl font-semibold">#{entry.rank}</p>
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">{entry.botId}</p>
                <p className="text-sm text-[var(--muted)]">{entry.totalTrades} closed trades</p>
              </div>
              <Metric label="Win rate" value={`${Math.round(entry.winRate * 100)}%`} />
              <Metric label="Profit" value={`$${entry.totalProfit.toFixed(2)}`} tone="success" />
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <Badge tone="primary">{entry.followers} followers</Badge>
                <Badge tone="accent">{(entry.performance30d * 100).toFixed(1)}% 30d</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "success" ? "text-[var(--success)]" : "text-[var(--foreground)]"}`}>{value}</p>
    </div>
  );
}