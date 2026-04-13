import { MarketplaceExplorer } from "@/components/marketplace/marketplace-explorer";
import { Card, CardContent } from "@/components/ui/card";
import { getFeaturedBots } from "@/lib/api";

export default async function MarketplacePage() {
  const bots = await getFeaturedBots();

  return (
    <div className="page-shell space-y-8">
      <section className="space-y-4">
        <span className="eyebrow">Marketplace</span>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Choose bots by performance, transparency, and multi-network compatibility</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
              This view combines reputation, 4/4 checks, and monetization capability so users compare bots as products, not promises.
            </p>
          </div>
          <Card className="min-w-[280px]">
            <CardContent className="p-5 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Current criteria</p>
              <p className="mt-2 leading-7">Prioritizing bots with the strongest combined signal from win rate, followers, and execution discipline.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <MarketplaceExplorer bots={bots} />
    </div>
  );
}