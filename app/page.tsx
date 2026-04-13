import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, ChartColumnIncreasing, Coins, ShieldCheck, Sparkles } from "lucide-react";
import { HeroActions } from "@/components/home/hero-actions";
import { BotGrid } from "@/components/marketplace/bot-grid";
import { ConfirmationChecklist } from "@/components/trade/confirmation-checklist";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturedBots, getPlatformStats } from "@/lib/api";
import { siteConfig } from "@/lib/seo";

const pillars = [
  {
    title: "Curated marketplace",
    text: "Bots compete on real performance, risk discipline, and operational clarity so users can choose with context.",
    icon: ChartColumnIncreasing,
  },
  {
    title: "4/4 safety gate",
    text: "No trade can run without validating RSI, MACD, volume, and order book. The interface keeps this visible at all times.",
    icon: ShieldCheck,
  },
  {
    title: "Monetization model",
    text: "Bags for reputation and fee sharing, Stellar x402 for premium signals, and HashKey for onchain execution.",
    icon: Coins,
  },
];

const hackathonTargets = [
  "HashKey Chain: onchain execution and transparent trade traceability.",
  "Stellar Agents: premium signal monetization through x402 HTTP payments.",
  "Bags Hackathon: fee sharing, verified profile, and social signal for each bot.",
];

const architectureCards = [
  {
    title: "End-to-end execution flow",
    text: "Signal detection, validation, and trade dispatch are connected across scanner, smart contract, and UI layers — each step is visible, not hidden.",
  },
  {
    title: "HashKey onchain settlement",
    text: "Trade lifecycle is managed by a Solidity contract deployed to HashKey testnet. Every outcome produces a verifiable onchain record.",
  },
  {
    title: "x402 machine payments",
    text: "Premium signal access is gated behind per-request HTTP micropayments — bots and agents can unlock intelligence programmatically without human intervention.",
  },
  {
    title: "Network effects built in",
    text: "Leaderboard rankings, follower counts, and Bags fee-sharing create compounding incentives: better bots attract capital, capital validates reputation.",
  },
  {
    title: "Non-negotiable safety gate",
    text: "Four independent signals — RSI, MACD, volume, order book — must align simultaneously. The gate cannot be bypassed through the UI or the API.",
  },
  {
    title: "Isolated persistence layer",
    text: "PostgreSQL in Docker with Prisma schema migrations. User state, sessions, and bot prompts are versioned and recoverable independently of the trading engine.",
  },
];

export const metadata: Metadata = {
  title: "Autonomous Trading Agent Marketplace",
  description:
    "Explore, configure, and run autonomous trading agents with mandatory 4-point validation, cross-chain execution, and judge-ready architecture evidence.",
  keywords: [
    "autonomous agents",
    "trading bot marketplace",
    "judge-ready AI project",
    "prejudging hackathon project",
    "onchain algorithmic trading",
  ],
};

export default async function Home() {
  const [featuredBots, stats] = await Promise.all([
    getFeaturedBots(),
    getPlatformStats(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        name: siteConfig.name,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description:
          "Judge-ready platform to evaluate, configure, and execute autonomous trading agents with enforced signal-based safety and cross-network support.",
        featureList: [
          "4/4 mandatory pre-trade confirmations",
          "Marketplace ranking by performance and followers",
          "Wallet linking and network-aware execution setup",
          "PostgreSQL + Prisma persistence for user and prompt state",
          "Monetization path through x402 and Bags-aligned economics",
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "CreativeWork",
        name: "AutoTrader Innovation Summary",
        abstract:
          "Transforms a single bot into a transparent marketplace of autonomous agents with enforceable safety controls and measurable product readiness for hackathon evaluation pipelines.",
        keywords: siteConfig.keywords.join(", "),
      },
    ],
  };

  return (
    <div className="page-shell space-y-10 md:space-y-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] px-6 py-8 shadow-[var(--shadow-soft)] md:px-10 md:py-12">
        <div className="hero-orb one" />
        <div className="hero-orb two" />
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="eyebrow">
              <Sparkles className="h-4 w-4" />
              Bot marketplace for HashKey, Bags, and Stellar
            </span>
            <div className="space-y-4">
              <h1 className="section-title max-w-4xl font-semibold text-[var(--foreground)]">
                Pick the best bot, configure it precisely, and trade only when all 4 checks are aligned.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] md:text-xl">
                AutoTrader evolves from a standalone bot into a clear, traceable, and elegant marketplace: performance-based discovery, strategy-level configuration, and real-time validated execution.
              </p>
            </div>
            <HeroActions />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="metric-strip rounded-[20px] px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Auditable trades</p>
                <p className="mt-1 text-2xl font-semibold">{stats.totalTrades}</p>
              </div>
              <div className="metric-strip rounded-[20px] px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Average win rate</p>
                <p className="mt-1 text-2xl font-semibold">{stats.winRate}</p>
              </div>
              <div className="metric-strip rounded-[20px] px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Managed volume</p>
                <p className="mt-1 text-2xl font-semibold">{stats.totalVolume}</p>
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden border-none bg-white/88">
            <div className="grid-pattern absolute inset-0 opacity-50" />
            <CardHeader className="relative space-y-4">
              <div className="flex items-center justify-between">
                <Badge tone="primary">Protected execution</Badge>
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                  4 out of 4 required
                </span>
              </div>
              <CardTitle className="text-2xl font-semibold">Always-visible pre-trade panel</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <ConfirmationChecklist
                confirmations={{
                  rsiExtreme: true,
                  macdExtreme: true,
                  volumeSpike: true,
                  orderBookExtreme: true,
                  total: 4,
                }}
                compact={false}
              />
              <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-medium text-[var(--foreground)]">Execution condition</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Users can see why a bot can or cannot open a trade. No black box: clear explanation, metrics, and criterion-level status.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {pillars.map(({ title, text, icon: Icon }) => (
          <Card key={title}>
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm leading-7 text-[var(--muted)]">{text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="eyebrow">
              <BadgeCheck className="h-4 w-4" />
              Featured bots
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Initial marketplace selection</h2>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-[var(--primary)]">
            View all bots
          </Link>
        </div>
        <BotGrid bots={featuredBots} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge tone="accent">Hackathons target</Badge>
            <CardTitle className="mt-3 text-3xl font-semibold">Architecture built to satisfy real requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hackathonTargets.map((item) => (
              <div key={item} className="rounded-[18px] border border-[var(--border)] bg-white/70 px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_100%)]">
          <CardHeader>
            <Badge tone="success">Product model</Badge>
            <CardTitle className="mt-3 text-3xl font-semibold">Discover, configure, improve, and monetize</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Discovery</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Ranking, followers, fee sharing, and performance to choose bots with social signal and proven results.</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Config</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Capital, risk profile, preferred assets, copy-trading activation, and x402 premium access.</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Improve</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Parameter tuning, cross-bot comparison, and transparent evaluation of all 4 confirmations.</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">Monetize</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Premium bots, HTTP micropayments, and Bags-powered reputation to attract liquidity and community.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div>
          <span className="eyebrow">Under the hood</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Every design decision has a reason</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[var(--muted)]">
            The architecture connects signal intelligence, onchain execution, and economic incentives into a single coherent product — not a demo, not a prototype.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {architectureCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="space-y-3 p-5">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{card.title}</h3>
                <p className="text-sm leading-7 text-[var(--muted)]">{card.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
