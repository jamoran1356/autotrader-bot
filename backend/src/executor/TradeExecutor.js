/**
 * TRADE EXECUTOR - Executes trades on HashKey Chain
 * Interacts with smart contracts for on-chain execution
 */

const ethers = require('ethers');

const UNIT_DECIMALS = 18;
const NATIVE_DECIMALS = 18;

function serializeBigInts(value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInts);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, serializeBigInts(entryValue)])
    );
  }

  return value;
}

class TradeExecutor {
  constructor(config = {}) {
    this.provider = config.provider; // ethers.js provider (HashKey RPC)
    this.signer = config.signer;     // ethers.js signer (bot wallet)
    this.contractAddress = config.contractAddress;
    this.contractABI = config.contractABI;
    this.contract = null;

    if (this.signer && this.contractAddress && this.contractABI) {
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.signer
      );
    }
  }

  hasContract() {
    return Boolean(this.contract);
  }

  getSignerAddress() {
    return this.signer?.address ?? null;
  }

  async deposit(amount) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const amountWei = ethers.parseUnits(amount, NATIVE_DECIMALS);
      const tx = await this.contract.deposit({ value: amountWei });
      const receipt = await tx.wait(1);

      return {
        status: 'success',
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        amount,
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ Deposit failed:', error.message);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async getUserBalance(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return this.contract.getBalance(address);
  }

  async getWalletStatus() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const signerAddress = this.getSignerAddress();
    if (!signerAddress) {
      throw new Error('Signer address not available');
    }

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

  /**
   * Format trade data for blockchain
   */
  formatTradeData(opportunity) {
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
      confirmations: opportunity.confirmations.total
    };
  }

  /**
   * Execute trade on blockchain
   */
  async executeTrade(opportunity, amount = '100') {
    try {
      console.log(`[EXECUTOR] Executing trade for ${opportunity.pair}...`);

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

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
        tradeData.confirmations
      );

      const feeData = await this.provider.getFeeData();
      const gasLimit = (estimatedGas * 120n) / 100n;
      const txOptions = {
        gasLimit,
      };

      if (feeData.gasPrice) {
        txOptions.gasPrice = feeData.gasPrice;
      }

      // Call smart contract function
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
        txOptions
      );

      console.log(`[EXECUTOR] ✅ Trade tx submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);
      console.log(`[EXECUTOR] ✅ Trade confirmed on block ${receipt.blockNumber}`);

      return {
        status: 'success',
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: new Date(),
        tradeData: serializeBigInts(tradeData)
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ Trade execution failed:', error.message);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Update take profit
   */
  async updateTakeProfit(tradeId, tp1, tp2, tp3) {
    try {
      console.log(`[EXECUTOR] Updating TP for trade ${tradeId}...`);

      const tx = await this.contract.updateTakeProfit(
        tradeId,
        ethers.parseUnits(tp1.toString(), UNIT_DECIMALS),
        ethers.parseUnits(tp2.toString(), UNIT_DECIMALS),
        ethers.parseUnits(tp3.toString(), UNIT_DECIMALS)
      );

      await tx.wait(1);
      console.log(`[EXECUTOR] ✅ TP updated: ${tx.hash}`);

      return {
        status: 'success',
        txHash: tx.hash,
        tradeId
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ TP update failed:', error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Update stop loss
   */
  async updateStopLoss(tradeId, sl) {
    try {
      console.log(`[EXECUTOR] Updating SL for trade ${tradeId}...`);

      const tx = await this.contract.updateStopLoss(
        tradeId,
        ethers.parseUnits(sl.toString(), UNIT_DECIMALS)
      );

      await tx.wait(1);
      console.log(`[EXECUTOR] ✅ SL updated: ${tx.hash}`);

      return {
        status: 'success',
        txHash: tx.hash,
        tradeId
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ SL update failed:', error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Close trade
   */
  async closeTrade(tradeId, exitPrice) {
    try {
      console.log(`[EXECUTOR] Closing trade ${tradeId}...`);

      const tx = await this.contract.closeTrade(
        tradeId,
        ethers.parseUnits(exitPrice.toString(), UNIT_DECIMALS)
      );

      await tx.wait(1);
      console.log(`[EXECUTOR] ✅ Trade closed: ${tx.hash}`);

      return {
        status: 'success',
        txHash: tx.hash,
        tradeId,
        exitPrice
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ Trade close failed:', error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get trade details
   */
  async getTradeDetails(tradeId) {
    try {
      const details = await this.contract.getTrade(tradeId);
      return {
        status: 'success',
        trade: details
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ Get trade failed:', error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async getTradeCount() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return this.contract.getTradeCount();
  }

  async getTotalVolume() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    return this.contract.getTotalVolume();
  }

  /**
   * Get bot statistics
   */
  async getBotStats(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const targetAddress = address || this.getSignerAddress();
      if (!targetAddress) {
        throw new Error('Target address is required to read bot statistics');
      }

      const stats = await this.contract.getBotStatistics(targetAddress);
      return {
        status: 'success',
        stats: {
          address: targetAddress,
          totalTrades: stats.totalTrades.toString(),
          totalProfit: ethers.formatUnits(stats.totalProfit, UNIT_DECIMALS),
          winRate: (Number(stats.winRate) / 100).toFixed(2) + '%',
          lastTrade: new Date(Number(stats.lastTradeTime) * 1000)
        }
      };
    } catch (error) {
      console.error('[EXECUTOR] ❌ Get stats failed:', error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = TradeExecutor;
