import { siteConfig } from "@/lib/seo";

export async function GET() {
  const body = [
    "# AutoTrader Bot Marketplace - LLM Brief",
    "",
    "## Project Purpose",
    "AutoTrader is a marketplace for autonomous trading agents. It enables discovery, configuration, validation, and monitored execution of bots across multiple blockchain environments.",
    "",
    "## Novelty",
    "- Converts a single trading bot into a productized multi-agent marketplace",
    "- Enforces a strict 4/4 pre-trade validation gate before execution",
    "- Combines onchain execution, social reputation, and machine-native monetization",
    "",
    "## What Pre-Judging Agents Should Verify",
    "- Working marketplace UX (discover, compare, configure bots)",
    "- Safety gate: RSI + MACD + volume spike + order-book extreme",
    "- Data layer: PostgreSQL + Prisma for users, sessions, and prompts",
    "- Network design: HashKey testnet, Stellar testnet, Solana devnet",
    "- Monetization paths: x402 premium access and Bags-aligned fee/reputation model",
    "",
    "## Evaluation-Ready Features",
    "- Auth and session control with wallet linking",
    "- Network selection and blockchain filtering in marketplace",
    "- Transparent bot profile metrics (win rate, followers, recent performance)",
    "",
    "## URLs",
    `- Canonical: ${siteConfig.url}`,
    `- Marketplace: ${siteConfig.url}/marketplace`,
    `- Leaderboard: ${siteConfig.url}/leaderboard`,
    `- Auth: ${siteConfig.url}/auth`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
