import Link from "next/link";
import { ArrowUpRight, CandlestickChart, Copy, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BotProfile } from "@/lib/types";

export function BotCard({ bot }: { bot: BotProfile }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{bot.category}</Badge>
              {bot.bagsToken ? <Badge tone="accent">Bags token</Badge> : null}
            </div>
            <CardTitle className="mt-4 text-2xl font-semibold">{bot.name}</CardTitle>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{bot.summary}</p>
          </div>
          <div className="rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
            <CandlestickChart className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
            <p className="text-xs text-[var(--muted)]">Win rate</p>
            <p className="mt-1 text-lg font-semibold">{bot.winRate}</p>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
            <p className="text-xs text-[var(--muted)]">Profit 30d</p>
            <p className="mt-1 text-lg font-semibold text-[var(--success)]">{bot.performance30d}</p>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
            <p className="text-xs text-[var(--muted)]">Followers</p>
            <p className="mt-1 text-lg font-semibold">{bot.followers}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,159,111,0.12)] px-3 py-1 font-semibold text-[var(--success)]">
            <ShieldAlert className="h-3.5 w-3.5" />
            {bot.confirmations.total}/4 confirmations
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-[var(--muted)] border border-[var(--border)]">
            <Users className="h-3.5 w-3.5" />
            {bot.riskProfile}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-[var(--muted)] border border-[var(--border)]">
            <Copy className="h-3.5 w-3.5" />
            Copy trading ready
          </span>
          {bot.blockchains.map((chain) => (
            <span
              key={`${bot.id}-${chain}`}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 py-1 font-semibold text-[var(--primary)]"
            >
              {chain}
            </span>
          ))}
        </div>

        <Link
          href={`/marketplace/${bot.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"
        >
          View details and configure
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}