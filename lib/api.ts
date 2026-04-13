import { mockBots, mockLeaderboard, mockStats, mockTrades } from "@/lib/mock-data";
import type {
  ActiveTrade,
  AiAnalysisResponse,
  AiAutoTradeSettings,
  AiConfigResponse,
  AiExecutionResponse,
  AiProviderOption,
  AiTradeHistoryResponse,
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

// ── AI Strategy Analyst API ──

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("autotrader_auth_token");
}

async function fetchJsonAuth<T>(path: string): Promise<T | null> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${path}`, { cache: "no-store", headers });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function postJsonAuth<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function putJsonAuth<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function deleteJsonAuth(path: string): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { method: "DELETE", headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Request failed");
  }
}

export async function getAiProviders(): Promise<AiProviderOption[]> {
  const response = await fetchJson<{ data: AiProviderOption[] }>("/ai/providers");
  return response?.data ?? [];
}

export async function getAiConfig(): Promise<AiConfigResponse> {
  const response = await fetchJsonAuth<{ data: AiConfigResponse }>("/ai/config");
  return response?.data ?? null;
}

export async function saveAiConfig(config: {
  provider: string;
  apiKey: string;
  model?: string;
}): Promise<AiConfigResponse> {
  const response = await putJsonAuth<{ data: AiConfigResponse }>("/ai/config", config);
  return response.data;
}

export async function deleteAiConfig(): Promise<void> {
  await deleteJsonAuth("/ai/config");
}

export async function validateAiKey(provider: string, apiKey: string): Promise<{ valid: boolean; model?: string }> {
  const response = await postJsonAuth<{ data: { valid: boolean; model?: string } }>("/ai/validate-key", { provider, apiKey });
  return response.data;
}

export async function runAiAnalysis(pair: string): Promise<AiAnalysisResponse> {
  const response = await postJsonAuth<{ data: AiAnalysisResponse }>(`/ai/analyze/${encodeURIComponent(pair)}`, {});
  return response.data;
}

export async function getAiTradeHistory(limit = 50, offset = 0): Promise<AiTradeHistoryResponse> {
  const response = await fetchJsonAuth<{ data: AiTradeHistoryResponse }>(`/ai/history?limit=${limit}&offset=${offset}`);
  return response?.data ?? { logs: [], total: 0, limit, offset };
}

export async function getAiAutoTradeSettings(): Promise<AiAutoTradeSettings> {
  const response = await fetchJsonAuth<{ data: AiAutoTradeSettings }>("/ai/auto-trade");
  return response?.data ?? { enabled: false, minConfidence: 0.7 };
}

export async function updateAiAutoTradeSettings(settings: Partial<AiAutoTradeSettings>): Promise<AiAutoTradeSettings> {
  const response = await putJsonAuth<{ data: AiAutoTradeSettings }>("/ai/auto-trade", settings as Record<string, unknown>);
  return response.data;
}

export async function runAiExecution(pair: string, amount?: string): Promise<AiExecutionResponse> {
  const body: Record<string, unknown> = {};
  if (amount) body.amount = amount;
  const response = await postJsonAuth<{ data: AiExecutionResponse }>(`/ai/execute/${encodeURIComponent(pair)}`, body);
  return response.data;
}