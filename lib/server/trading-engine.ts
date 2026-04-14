/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TRADING ENGINE - Global singleton for scanner + executor
 * Lazily initialized on first use; persists across requests in the same process.
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { MarketScanner } from "./market-scanner";
import { TradeExecutor } from "./trade-executor";
import { StrategyAnalyst } from "./strategy-analyst";

type Engine = {
  scanner: MarketScanner;
  executor: TradeExecutor | null;
  analyst: StrategyAnalyst;
  opportunities: any[];
  activeTrades: Record<string, any>;
};

const globalForEngine = globalThis as unknown as { tradingEngine?: Engine };

function loadContractAbi(): any[] | null {
  if (process.env.CONTRACT_ABI) {
    return JSON.parse(process.env.CONTRACT_ABI);
  }

  const artifactPath = path.resolve(process.cwd(), "smart-contracts/artifacts/AutoTrader.json");
  if (!fs.existsSync(artifactPath)) return null;

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return Array.isArray(artifact.abi) && artifact.abi.length > 0 ? artifact.abi : null;
}

function createEngine(): Engine {
  const analyst = new StrategyAnalyst();
  let executor: TradeExecutor | null = null;

  // Scanner always available — it only needs Gate.io (no chain credentials)
  const scanner = new MarketScanner({
    gateUrl: "https://api.gateio.ws/api/v4",
    apiKey: process.env.GATE_API_KEY,
    apiSecret: process.env.GATE_API_SECRET,
    scanInterval: parseInt(process.env.SCAN_INTERVAL || "3600000"),
  });

  const hasTradingEnv =
    Boolean(process.env.BOT_PRIVATE_KEY) &&
    Boolean(process.env.CONTRACT_ADDRESS) &&
    Boolean(process.env.HASHKEY_RPC_URL);

  if (hasTradingEnv) {
    const provider = new ethers.JsonRpcProvider(process.env.HASHKEY_RPC_URL);
    const signer = new ethers.Wallet(process.env.BOT_PRIVATE_KEY!, provider);
    const contractABI = loadContractAbi();

    if (contractABI) {
      executor = new TradeExecutor({
        provider,
        signer,
        contractAddress: process.env.CONTRACT_ADDRESS,
        contractABI,
      });
    }
  }

  return { scanner, executor, analyst, opportunities: [], activeTrades: {} };
}

export function getEngine(): Engine {
  if (!globalForEngine.tradingEngine) {
    globalForEngine.tradingEngine = createEngine();
  }
  return globalForEngine.tradingEngine;
}
