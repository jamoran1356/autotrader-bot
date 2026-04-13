import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BagsIntegrationCard({
  enabled,
  operatorAddress,
}: {
  enabled: boolean;
  operatorAddress?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Badge tone={enabled ? "success" : "warning"}>{enabled ? "Bags ready" : "API key required"}</Badge>
        <CardTitle className="mt-3 text-2xl font-semibold">Bags fee sharing and bot reputation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-7 text-[var(--muted)]">
        <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
          Each bot can expose token data, followers, and claimable fees to build a verifiable social and monetization layer.
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
          Current state: {enabled ? "SDK and API key are available for live queries." : "SDK installed; BAGS_API_KEY is still missing from dev.bags.fm."}
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
          Solana operator: {operatorAddress || "PENDING_SOLANA_OPERATOR"}
        </div>
      </CardContent>
    </Card>
  );
}