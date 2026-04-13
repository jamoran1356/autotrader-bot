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