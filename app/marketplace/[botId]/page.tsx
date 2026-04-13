import { notFound } from "next/navigation";
import { BagsIntegrationCard } from "@/components/bags/bags-integration-card";
import { BotPersonalityPanel } from "@/components/marketplace/bot-personality-panel";
import { X402PaymentCard } from "@/components/stellar/x402-payment-card";
import { ConfirmationChecklist } from "@/components/trade/confirmation-checklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBotById } from "@/lib/api";

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const { botId } = await params;
  const bot = await getBotById(botId);

  if (!bot) {
    notFound();
  }

  const canExecute = bot.confirmations.total === 4;

  return (
    <div className="page-shell space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{bot.category}</Badge>
              <Badge tone={canExecute ? "success" : "warning"}>{bot.confirmations.total}/4 confirmations</Badge>
            </div>
            <CardTitle className="text-4xl font-semibold">{bot.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">{bot.summary}</p>
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Main pair" value={bot.pair} />
              <Metric label="Current price" value={bot.currentPrice} />
              <Metric label="Minimum capital" value={bot.capitalRequired} />
              <Metric label="Profile" value={bot.riskProfile} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Quick setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputRow label="Allocated capital" value="$500" />
            <InputRow label="Risk per trade" value="1.5%" />
            <InputRow label="Copy-trading mode" value="Active" />
            <InputRow label="x402 premium signals" value="Unlockable" />
            <Button className="w-full justify-center" disabled={!canExecute}>
              {canExecute ? "Run strategy" : "Waiting for 4 confirmations"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Execution status</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfirmationChecklist confirmations={bot.confirmations} compact={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">How users can improve results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[var(--muted)]">
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              Tune capital and per-asset exposure to match the bot profile and the user risk appetite.
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              Enable premium signals when the bot is outperforming the monthly benchmark and monetize that edge with x402.
            </div>
            <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
              Turn the bot into a social asset with Bags: fee sharing, verifiable reputation, and follower growth.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <BotPersonalityPanel botId={bot.id} />
        <BagsIntegrationCard
          enabled={Boolean(process.env.BAGS_API_KEY)}
          operatorAddress={process.env.NEXT_PUBLIC_SOLANA_OPERATOR_ADDRESS}
        />
        <X402PaymentCard botId={bot.id} />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function InputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}