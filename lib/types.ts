export type BotConfirmations = {
  rsiExtreme: boolean;
  macdExtreme: boolean;
  volumeSpike: boolean;
  orderBookExtreme: boolean;
  total: number;
};

export type BlockchainName = "HashKey" | "Stellar" | "Solana";

export type TradingNetwork = "all" | "hashkey-testnet" | "stellar-testnet" | "solana-devnet";

export type BotProfile = {
  id: string;
  name: string;
  category: string;
  summary: string;
  blockchains: BlockchainName[];
  defaultNetwork: Exclude<TradingNetwork, "all">;
  winRate: string;
  performance30d: string;
  followers: number;
  riskProfile: string;
  bagsToken: boolean;
  pair: string;
  currentPrice: string;
  capitalRequired: string;
  confirmations: BotConfirmations;
};

export type PlatformStats = {
  totalTrades: string;
  totalVolume: string;
  winRate: string;
  activeTrades: string;
};

export type ActiveTrade = {
  txHash: string;
  pair: string;
  entryPrice: number;
  status: string;
  timestamp: string;
};

export type LeaderboardEntry = {
  rank: number;
  botId: string;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  performance30d: number;
  followers: number;
};

export type WalletStatus = {
  address: string;
  walletBalance: string;
  contractBalance: string;
};

export type WalletActionResult = {
  status: "success" | "error";
  txHash?: string;
  blockNumber?: number;
  amount?: string;
  error?: string;
};

export type ManualTradeResult = {
  status: "success" | "error";
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
  testMode?: boolean;
  forcedConfirmations?: boolean;
};

// ── AI Strategy Types ──

export type AiProvider = "openrouter" | "openai" | "anthropic";

export type AiProviderOption = {
  id: AiProvider;
  name: string;
  description: string;
  defaultModel: string;
  models: string[];
};

export type AiConfigResponse = {
  id: string;
  provider: AiProvider;
  model: string;
  apiKeyMasked: string;
  hasKey: boolean;
  updatedAt: string;
} | null;

export type AiTakeProfit = {
  level: string;
  price: number;
  rationale: string;
};

export type AiAnalysisResult = {
  recommendation: "LONG" | "SHORT" | "NO_TRADE";
  confidence: number;
  reasoning: string;
  entry_zone?: { low: number; high: number };
  take_profits?: AiTakeProfit[];
  stop_loss?: { price: number; rationale: string };
  position_size_pct?: number;
  risk_reward_ratio?: number;
  market_regime: string;
  key_risks: string[];
  invalidation?: string;
  provider: string;
  model: string;
  analyzedAt: string;
  pair: string;
  cached: boolean;
};

export type AiAnalysisResponse = {
  ai: AiAnalysisResult;
  technical: {
    pair: string;
    currentPrice: number;
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    atr: number;
    volume24h: string;
    change24h: string;
    confirmations: BotConfirmations;
    orderBook: { buyPercentage: number; sellPercentage: number };
  };
};

// ── AI Trade Log Types ──

export type AiTradeLogEntry = {
  id: string;
  pair: string;
  recommendation: "LONG" | "SHORT" | "NO_TRADE" | "ERROR";
  confidence: number;
  reasoning: string;
  marketRegime: string | null;
  keyRisks: string[];
  entryLow: number | null;
  entryHigh: number | null;
  stopLoss: number | null;
  riskReward: number | null;
  executed: boolean;
  txHash: string | null;
  executionError: string | null;
  provider: string;
  model: string;
  createdAt: string;
};

export type AiTradeHistoryResponse = {
  logs: AiTradeLogEntry[];
  total: number;
  limit: number;
  offset: number;
};

export type AiAutoTradeSettings = {
  enabled: boolean;
  minConfidence: number;
};

export type AiExecutionResponse = {
  ai: AiAnalysisResult;
  technical: {
    pair: string;
    currentPrice: number;
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    atr: number;
    confirmations: BotConfirmations;
  };
  execution: {
    attempted: boolean;
    status?: string;
    txHash?: string | null;
    error?: string | null;
    reason?: string;
  };
};