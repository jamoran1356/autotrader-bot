/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Direct server-side queries — used by server components to avoid HTTP roundtrip.
 */

import { ethers } from "ethers";
import { prisma } from "./prisma";
import { getEngine } from "./trading-engine";
import { mockBots, mockLeaderboard, mockStats, mockTrades } from "@/lib/mock-data";
import type { ActiveTrade, BotProfile, LeaderboardEntry, PlatformStats } from "@/lib/types";

function formatUsdAmount(value: number) {
  return `$${Number(value).toFixed(2)}`;
}

function parseTokenAmount(value: any) {
  return Number(ethers.formatUnits(value, 18));
}

function normalizeTrade(trade: any) {
  return {
    tradeId: Number(trade.id),
    pair: trade.pair,
    entryPrice: parseTokenAmount(trade.entryPrice),
    tp1: parseTokenAmount(trade.tp1),
    tp2: parseTokenAmount(trade.tp2),
    tp3: parseTokenAmount(trade.tp3),
    sl: parseTokenAmount(trade.sl),
    amount: parseTokenAmount(trade.amount),
    timestamp: new Date(Number(trade.timestamp) * 1000).toISOString(),
    trader: trade.trader,
    isOpen: trade.isOpen,
    exitPrice: parseTokenAmount(trade.exitPrice),
    profit: parseTokenAmount(trade.profit),
    rsi: Number(trade.rsi),
    confirmations: Number(trade.confirmations),
  };
}

async function getOnChainTrades(executor: any): Promise<any[]> {
  if (!executor?.hasContract()) return [];

  const tradeCount = Number(await executor.getTradeCount());
  if (tradeCount === 0) return [];

  const trades = await Promise.all(
    Array.from({ length: tradeCount }, async (_, i) => {
      const result = await executor.getTradeDetails(i + 1);
      return result.status === "success" ? normalizeTrade(result.trade) : null;
    }),
  );
  return trades.filter(Boolean);
}

function buildLeaderboardFromTrades(trades: any[]): LeaderboardEntry[] {
  const aggregates = new Map<string, any>();

  for (const trade of trades) {
    const current = aggregates.get(trade.trader) ?? {
      botId: trade.trader ? `${trade.trader.slice(0, 6)}...${trade.trader.slice(-4)}` : "unknown",
      totalTrades: 0,
      winTrades: 0,
      totalProfit: 0,
      totalAmount: 0,
      followers: 0,
    };

    current.totalTrades += 1;
    current.totalProfit += trade.profit;
    current.totalAmount += trade.amount;
    if (!trade.isOpen && trade.profit > 0) current.winTrades += 1;

    aggregates.set(trade.trader, current);
  }

  return Array.from(aggregates.values())
    .map((e) => ({
      ...e,
      winRate: e.totalTrades > 0 ? e.winTrades / e.totalTrades : 0,
      performance30d: e.totalAmount > 0 ? e.totalProfit / e.totalAmount : 0,
    }))
    .sort((a, b) => (b.totalProfit !== a.totalProfit ? b.totalProfit - a.totalProfit : b.totalTrades - a.totalTrades))
    .map((e, i) => ({
      rank: i + 1,
      botId: e.botId,
      totalTrades: e.totalTrades,
      winRate: e.winRate,
      totalProfit: e.totalProfit,
      performance30d: e.performance30d,
      followers: e.followers,
    }));
}

export async function getStats(): Promise<PlatformStats> {
  try {
    const engine = getEngine();
    if (!engine.executor?.hasContract()) {
      return {
        totalTrades: "0",
        totalVolume: "$0.00",
        winRate: "0%",
        activeTrades: "0",
      };
    }

    const [tradeCount, totalVolumeRaw, trades] = await Promise.all([
      engine.executor.getTradeCount(),
      engine.executor.getTotalVolume(),
      getOnChainTrades(engine.executor),
    ]);

    const active = trades.filter((t) => t.isOpen);
    const closed = trades.filter((t) => !t.isOpen);
    const profitable = closed.filter((t) => t.profit > 0);
    const totalVolume = parseTokenAmount(totalVolumeRaw);

    return {
      totalTrades: tradeCount.toString(),
      totalVolume: formatUsdAmount(totalVolume),
      winRate: `${closed.length > 0 ? ((profitable.length / closed.length) * 100).toFixed(1) : "0.0"}%`,
      activeTrades: String(active.length),
    };
  } catch {
    return mockStats;
  }
}

export async function getActiveTrades(): Promise<ActiveTrade[]> {
  try {
    const engine = getEngine();
    if (!engine.executor?.hasContract()) return [];

    const trades = await getOnChainTrades(engine.executor);
    return trades
      .filter((t) => t.isOpen)
      .map((t) => ({
        txHash: `trade-${t.tradeId}`,
        pair: t.pair,
        entryPrice: t.entryPrice,
        status: "open",
        timestamp: t.timestamp,
      }));
  } catch {
    return mockTrades;
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const engine = getEngine();
    if (!engine.executor?.hasContract()) return mockLeaderboard;

    const trades = await getOnChainTrades(engine.executor);
    const lb = buildLeaderboardFromTrades(trades);
    return lb.length > 0 ? lb : mockLeaderboard;
  } catch {
    return mockLeaderboard;
  }
}

export async function getFeaturedBots(): Promise<BotProfile[]> {
  const lb = await getLeaderboard();

  if (!lb.length) return mockBots;

  return lb.map((entry, index) => {
    const base = mockBots[index] ?? mockBots[0];
    const winRate = Number(entry.winRate);
    const performance30d = Number(entry.performance30d);
    return {
      ...base,
      followers: entry.followers == null ? base.followers : Number(entry.followers),
      winRate: Number.isFinite(winRate) ? `${Math.round(winRate * 100)}%` : base.winRate,
      performance30d: Number.isFinite(performance30d)
        ? `${performance30d >= 0 ? "+" : ""}${(performance30d * 100).toFixed(1)}%`
        : base.performance30d,
    };
  });
}

// Re-export prisma for convenience
export { prisma };
