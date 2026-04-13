import { mockBots, mockLeaderboard, mockStats, mockTrades } from "@/lib/mock-data";
import type {
  ActiveTrade,
  BotProfile,
  LeaderboardEntry,
  ManualTradeResult,
  PlatformStats,
  WalletActionResult,
  WalletStatus,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

export async function getFeaturedBots(): Promise<BotProfile[]> {
  const response = await fetchJson<{ data: Array<Record<string, unknown>> }>("/leaderboard");
  if (!response?.data?.length) {
    return mockBots;
  }

  return response.data.map((entry, index) => {
    const base = mockBots[index] ?? mockBots[0];
    const winRate = Number(entry.winRate);
    const performance30d = Number(entry.performance30d);
    return {
      ...base,
      followers: entry.followers == null ? base.followers : Number(entry.followers),
      winRate: Number.isFinite(winRate) ? `${Math.round(winRate * 100)}%` : base.winRate,
      performance30d: Number.isFinite(performance30d) ? `${performance30d >= 0 ? '+' : ''}${(
        performance30d * 100
      ).toFixed(1)}%` : base.performance30d,
    };
  });
}

export async function getBotById(botId: string): Promise<BotProfile | null> {
  const bots = await getFeaturedBots();
  return bots.find((bot) => bot.id === botId) ?? mockBots.find((bot) => bot.id === botId) ?? null;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const response = await fetchJson<{ data: Record<string, unknown> }>("/stats");
  if (!response?.data) {
    return mockStats;
  }

  return {
    totalTrades: String(response.data.totalTrades ?? mockStats.totalTrades),
    totalVolume: String(response.data.totalVolume ?? mockStats.totalVolume),
    winRate: String(response.data.winRate ?? mockStats.winRate),
    activeTrades: String(response.data.activeTrades ?? mockStats.activeTrades),
  };
}

export async function getActiveTrades(): Promise<ActiveTrade[]> {
  const response = await fetchJson<{ data: ActiveTrade[] }>("/trades/active");
  if (!response) {
    return mockTrades;
  }

  return response.data ?? [];
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetchJson<{ data: LeaderboardEntry[] }>("/leaderboard");
  if (!response) {
    return mockLeaderboard;
  }

  return response.data ?? [];
}

export async function getWalletStatus(): Promise<WalletStatus> {
  const response = await fetchJson<{ data: WalletStatus }>("/wallet/status");

  if (!response?.data) {
    throw new Error("Wallet status is unavailable");
  }

  return response.data;
}

export async function depositWalletBalance(amount: string): Promise<WalletActionResult> {
  return postJson<WalletActionResult>("/wallet/deposit", { amount });
}

export async function executeControlledTestTrade(input: {
  pair: string;
  amount: string;
  forceConfirmations: boolean;
}): Promise<ManualTradeResult> {
  return postJson<ManualTradeResult>("/trades/test-execute", input);
}