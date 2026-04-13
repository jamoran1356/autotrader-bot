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
    title: "AI-gated execution",
    text: "Every trade passes through your chosen LLM before on-chain execution. The AI produces structured risk analysis with confidence scores — trades only execute when AI agrees.",
    icon: Sparkles,
  },
  {
    title: "4/4 technical safety gate",
    text: "RSI, MACD, volume, and order-book signals must ALL align. Then the AI gate adds a second layer of intelligent risk assessment.",
    icon: ShieldCheck,
  },
  {
    title: "Full decision audit trail",
    text: "Every AI decision — recommendation, confidence, reasoning, and execution outcome — is persisted for transparency and continuous improvement.",
    icon: ChartColumnIncreasing,
  },
];

const hackathonTargets = [
  "AI + DeFi Track: LLM-powered strategy analyst gates every on-chain execution with confidence-scored recommendations.",
  "HashKey Chain: Solidity smart contract deployed on testnet with full trade lifecycle management using HSK.",
  "Multi-Provider AI: Users bring their own API key — OpenRouter (100+ models), OpenAI (GPT-4o), Anthropic (Claude).",
  "Full Audit Trail: Every AI decision persisted with reasoning, risk assessment, and execution outcome.",
];

const architectureCards = [
  {
    title: "AI-gated execution pipeline",
    text: "Scanner detects opportunity → 4/4 technical gate → AI analysis with confidence scoring → on-chain execution on HashKey Chain. Every step is logged and auditable.",
  },
  {
    title: "Multi-provider LLM integration",
    text: "Users choose their AI provider and model. OpenRouter gives access to 100+ models, plus direct OpenAI and Anthropic support. API keys encrypted AES-256 at rest.",
  },
  {
    title: "One-shot AI execution",
    text: "Single API call: technical analysis → AI evaluation → on-chain trade. The AI decides, HashKey Chain executes, and the decision log captures everything.",
  },
  {
    title: "Autonomous AI auto-trade",
    text: "Enable AI auto-trade and set your confidence threshold. The scanner runs continuously, and your AI provider approves or rejects each opportunity automatically.",
  },
  {
    title: "Dual safety gate",
    text: "Technical gate (RSI + MACD + volume + order book) AND AI gate (confidence threshold). Two independent layers that cannot be bypassed.",
  },
  {
    title: "Production-grade persistence",
    text: "PostgreSQL + Prisma with migration support. Users, AI configs, trade logs, and decision history are all versioned and Docker-ready for deployment.",
  },
];

export const metadata: Metadata = {
  title: "AI-Powered Autonomous DeFi Trading on HashKey Chain",
  description:
    "AutoTrader combines LLM intelligence (GPT-4, Claude, 100+ models) with on-chain execution on HashKey Chain. Every trade is gated by both technical signals AND AI risk analysis.",
  keywords: [
    "ai defi trading",
    "hashkey chain",
    "llm trading agent",
    "ai-gated execution",
    "autonomous trading bot",
    "on-chain horizon hackathon",
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
          "AI-gated autonomous trading on HashKey Chain. Combines LLM intelligence with on-chain execution — every trade passes through dual technical and AI safety gates.",
        featureList: [
          "AI-gated execution: LLM analysis before every on-chain trade",
          "Multi-provider AI: OpenRouter (100+ models), OpenAI, Anthropic",
          "4/4 mandatory pre-trade technical confirmations",
          "Full AI decision audit trail with reasoning and outcomes",
          "One-shot AI execution: analyze + decide + execute in single flow",
          "AES-256 encrypted API key storage",
          "HashKey Chain testnet deployment with verified contract",
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
              AI-Powered DeFi on HashKey Chain
            </span>
            <div className="space-y-4">
              <h1 className="section-title max-w-4xl font-semibold text-[var(--foreground)]">
                Your AI decides. HashKey Chain executes. Every decision is logged.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted)] md:text-xl">
                AutoTrader gates every on-chain trade through your chosen LLM — GPT-4, Claude, or 100+ models via OpenRouter. Combine 4/4 technical signals with deep AI risk analysis for institutional-grade DeFi automation.
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
