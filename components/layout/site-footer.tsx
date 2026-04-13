export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white/60">
      <div className="page-shell flex flex-col gap-4 py-8 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-[var(--foreground)]">AutoTrader Bot Marketplace</p>
          <p>Clear design, bot selection, and execution protected by 4 confirmations.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <span>HashKey Testnet ready</span>
          <span>Stellar x402 planned</span>
          <span>Bags integration scaffolded</span>
        </div>
      </div>
    </footer>
  );
}