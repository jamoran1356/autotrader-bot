"use client";

import { BotGrid } from "@/components/marketplace/bot-grid";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/lib/app-state";
import type { BlockchainName, BotProfile } from "@/lib/types";

const chainMap = {
  "hashkey-testnet": "HashKey",
  "stellar-testnet": "Stellar",
  "solana-devnet": "Solana",
} as const;

const filters: BlockchainName[] = ["HashKey", "Stellar", "Solana"];

export function MarketplaceExplorer({ bots }: { bots: BotProfile[] }) {
  const { selectedNetwork, blockchainFilters, toggleBlockchainFilter, clearBlockchainFilters } = useAppState();

  const filtered = bots.filter((bot) => {
    const byNetwork =
      selectedNetwork === "all"
        ? true
        : bot.blockchains.includes(chainMap[selectedNetwork as keyof typeof chainMap]);

    const byChains =
      blockchainFilters.length === 0
        ? true
        : blockchainFilters.some((chain) => bot.blockchains.includes(chain));

    return byNetwork && byChains;
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = blockchainFilters.includes(filter);
          return (
            <button key={filter} onClick={() => toggleBlockchainFilter(filter)}>
              <Badge
                tone={active ? "primary" : "neutral"}
                className={active ? "px-4 py-2 text-sm" : "bg-white/80 px-4 py-2 text-sm"}
              >
                {filter}
              </Badge>
            </button>
          );
        })}
        <button
          onClick={clearBlockchainFilters}
          className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--muted)]"
        >
          Clear filters
        </button>
      </section>

      <p className="text-sm text-[var(--muted)]">Showing {filtered.length} bots matching selected network and blockchain filters.</p>

      <BotGrid bots={filtered} />
    </div>
  );
}
