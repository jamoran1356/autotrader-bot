/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TRADE EXECUTOR - Executes trades on HashKey Chain
 */

import { ethers } from "ethers";

const UNIT_DECIMALS = 18;
const NATIVE_DECIMALS = 18;

function serializeBigInts(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serializeBigInts);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serializeBigInts(v)]));
  }
  return value;
}

export class TradeExecutor {
  provider: any;
  signer: any;
  contractAddress: string | undefined;
  contractABI: any;
  contract: any;

  constructor(config: any = {}) {
    this.provider = config.provider;
    this.signer = config.signer;
    this.contractAddress = config.contractAddress;
    this.contractABI = config.contractABI;
    this.contract = null;

    if (this.signer && this.contractAddress && this.contractABI) {
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
    }
  }

  hasContract() {
    return Boolean(this.contract);
  }

  getSignerAddress() {
    return this.signer?.address ?? null;
  }

  async deposit(amount: string) {
    try {
      if (!this.contract) throw new Error("Contract not initialized");
      const amountWei = ethers.parseUnits(amount, NATIVE_DECIMALS);
      const tx = await this.contract.deposit({ value: amountWei });
      const receipt = await tx.wait(1);
      return { status: "success", txHash: tx.hash, blockNumber: receipt.blockNumber, amount };
    } catch (error: any) {
      return { status: "error", error: error.message };
    }
  }

  async getUserBalance(address: string) {
    if (!this.contract) throw new Error("Contract not initialized");
    return this.contract.getBalance(address);
  }

  async getWalletStatus() {
    if (!this.contract) throw new Error("Contract not initialized");
    const signerAddress = this.getSignerAddress();
    if (!signerAddress) throw new Error("Signer address not available");

    const [walletBalance, contractBalance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      this.getUserBalance(signerAddress),
    ]);

    return {
      address: signerAddress,
      walletBalance: ethers.formatUnits(walletBalance, NATIVE_DECIMALS),
      contractBalance: ethers.formatUnits(contractBalance, NATIVE_DECIMALS),
    };
  }

  formatTradeData(opportunity: any) {
    const atr = opportunity.atr || 1;
    return {
      pair: opportunity.pair,
      entryPrice: ethers.parseUnits(opportunity.currentPrice.toString(), UNIT_DECIMALS),
      tp1: ethers.parseUnits((opportunity.currentPrice + atr * 0.5).toString(), UNIT_DECIMALS),
      tp2: ethers.parseUnits((opportunity.currentPrice + atr * 1.0).toString(), UNIT_DECIMALS),
      tp3: ethers.parseUnits((opportunity.currentPrice + atr * 1.5).toString(), UNIT_DECIMALS),
      sl: ethers.parseUnits((opportunity.currentPrice - atr * 0.3).toString(), UNIT_DECIMALS),
      rsi: Math.round(opportunity.rsi),
      macd: opportunity.macd.macd,
      timestamp: Math.floor(Date.now() / 1000),
      confirmations: opportunity.confirmations.total,
    };
  }

  async executeTrade(opportunity: any, amount = "100") {
    try {
      if (!this.contract) throw new Error("Contract not initialized");

      const tradeData = this.formatTradeData(opportunity);
      const amountWei = ethers.parseUnits(amount, UNIT_DECIMALS);

      const estimatedGas = await this.contract.executeTrade.estimateGas(
        tradeData.pair,
        tradeData.entryPrice,
        tradeData.tp1,
        tradeData.tp2,
        tradeData.tp3,
        tradeData.sl,
        amountWei,
        tradeData.rsi,
        tradeData.confirmations,
      );

      const feeData = await this.provider.getFeeData();
      const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
      const txOptions: any = { gasLimit };
      if (feeData.gasPrice) txOptions.gasPrice = feeData.gasPrice;

      const tx = await this.contract.executeTrade(
        tradeData.pair,
        tradeData.entryPrice,
        tradeData.tp1,
        tradeData.tp2,
        tradeData.tp3,
        tradeData.sl,
        amountWei,
        tradeData.rsi,
        tradeData.confirmations,
        txOptions,
      );

      const receipt = await tx.wait(1);

      return {
        status: "success",
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: new Date(),
        tradeData: serializeBigInts(tradeData),
      };
    } catch (error: any) {
      return { status: "error", error: error.message, timestamp: new Date() };
    }
  }

  async getTradeDetails(tradeId: number) {
    try {
      const details = await this.contract.getTrade(tradeId);
      return { status: "success", trade: details };
    } catch (error: any) {
      return { status: "error", error: error.message };
    }
  }

  async getTradeCount() {
    if (!this.contract) throw new Error("Contract not initialized");
    return this.contract.getTradeCount();
  }

  async getTotalVolume() {
    if (!this.contract) throw new Error("Contract not initialized");
    return this.contract.getTotalVolume();
  }
}
