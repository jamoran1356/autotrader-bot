/**
 * AUTOTRADER BOT - Express Backend Server
 * Main entry point for the trading bot
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const MarketScanner = require('./scanner/MarketScanner');
const TradeExecutor = require('./executor/TradeExecutor');
const { loadContractAbi } = require('./lib/contract-runtime');
const prisma = require('./lib/prisma');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Global state
let scanner = null;
let executor = null;
let opportunities = [];
let activeTrades = {};
let leaderboard = [];
let server = null;
const autoExecutionEnabled = process.env.AUTO_EXECUTION_ENABLED === 'true';
const defaultTradeAmount = process.env.DEFAULT_TRADE_AMOUNT || '0.01';

function formatUsdAmount(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatAddress(value) {
  if (!value) {
    return 'unknown';
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function parseTokenAmount(value) {
  return Number(ethers.formatUnits(value, 18));
}

function normalizeTrade(trade) {
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

function buildControlledTestOpportunity(analysis, forceConfirmations) {
  const confirmations = forceConfirmations
    ? {
        rsiExtreme: true,
        macdExtreme: true,
        volumeSpike: true,
        orderBookExtreme: true,
        total: 4,
      }
    : analysis.confirmations;

  return {
    ...analysis,
    confirmations,
    testMode: true,
    manualOverride: forceConfirmations,
    originalConfirmations: analysis.confirmations,
  };
}

async function getOnChainTrades() {
  if (!executor?.hasContract()) {
    return [];
  }

  const tradeCount = Number(await executor.getTradeCount());
  if (tradeCount === 0) {
    return [];
  }

  const tradePromises = Array.from({ length: tradeCount }, async (_, index) => {
    const result = await executor.getTradeDetails(index + 1);
    return result.status === 'success' ? normalizeTrade(result.trade) : null;
  });

  const trades = await Promise.all(tradePromises);
  return trades.filter(Boolean);
}

function buildLeaderboardFromTrades(trades) {
  const aggregates = new Map();

  for (const trade of trades) {
    const current = aggregates.get(trade.trader) ?? {
      botId: formatAddress(trade.trader),
      totalTrades: 0,
      winTrades: 0,
      totalProfit: 0,
      totalAmount: 0,
      performance30d: 0,
      followers: 0,
    };

    current.totalTrades += 1;
    current.totalProfit += trade.profit;
    current.totalAmount += trade.amount;
    if (!trade.isOpen && trade.profit > 0) {
      current.winTrades += 1;
    }

    aggregates.set(trade.trader, current);
  }

  return Array.from(aggregates.values())
    .map((entry) => ({
      ...entry,
      winRate: entry.totalTrades > 0 ? entry.winTrades / entry.totalTrades : 0,
      performance30d: entry.totalAmount > 0 ? entry.totalProfit / entry.totalAmount : 0,
    }))
    .sort((left, right) => {
      if (right.totalProfit !== left.totalProfit) {
        return right.totalProfit - left.totalProfit;
      }

      return right.totalTrades - left.totalTrades;
    })
    .map((entry, index) => ({
      rank: index + 1,
      botId: entry.botId,
      totalTrades: entry.totalTrades,
      winRate: entry.winRate,
      totalProfit: entry.totalProfit,
      performance30d: entry.performance30d,
      followers: entry.followers,
    }));
}

async function getOnChainSnapshot() {
  if (!executor?.hasContract()) {
    return null;
  }

  const [tradeCount, totalVolumeRaw, trades] = await Promise.all([
    executor.getTradeCount(),
    executor.getTotalVolume(),
    getOnChainTrades(),
  ]);

  const activeTradeList = trades.filter((trade) => trade.isOpen);
  const closedTrades = trades.filter((trade) => !trade.isOpen);
  const profitableTrades = closedTrades.filter((trade) => trade.profit > 0);
  const totalVolume = parseTokenAmount(totalVolumeRaw);
  const leaderboardData = buildLeaderboardFromTrades(trades);

  return {
    stats: {
      totalTrades: tradeCount.toString(),
      totalVolume: formatUsdAmount(totalVolume),
      winRate: `${closedTrades.length > 0 ? ((profitableTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0'}%`,
      activeTrades: String(activeTradeList.length),
      lastScan: opportunities.length > 0 ? opportunities[0].timestamp : null,
      mode: 'testnet-live',
    },
    activeTrades: activeTradeList.map((trade) => ({
      txHash: `trade-${trade.tradeId}`,
      pair: trade.pair,
      entryPrice: trade.entryPrice,
      status: 'open',
      timestamp: trade.timestamp,
      trader: trade.trader,
    })),
    leaderboard: leaderboardData,
  };
}

// Initialize
async function initialize() {
  console.log('[APP] Initializing AutoTrader Bot...');

  const hasTradingEnv =
    Boolean(process.env.BOT_PRIVATE_KEY) &&
    Boolean(process.env.CONTRACT_ADDRESS) &&
    Boolean(process.env.HASHKEY_RPC_URL);

  if (!hasTradingEnv) {
    console.log('[APP] Trading engine disabled: missing BOT_PRIVATE_KEY / CONTRACT_ADDRESS / HASHKEY_RPC_URL');
    console.log('[APP] Auth, users and prompt APIs are active with PostgreSQL + Prisma');
    return;
  }

  // Initialize Scanner
  scanner = new MarketScanner({
    gateUrl: 'https://api.gateio.ws/api/v4',
    apiKey: process.env.GATE_API_KEY,
    apiSecret: process.env.GATE_API_SECRET,
    scanInterval: parseInt(process.env.SCAN_INTERVAL || 3600000)
  });

  // Initialize Executor
  const provider = new ethers.JsonRpcProvider(process.env.HASHKEY_RPC_URL);
  const signer = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, provider);
  const contractABI = loadContractAbi();

  executor = new TradeExecutor({
    provider,
    signer,
    contractAddress: process.env.CONTRACT_ADDRESS,
    contractABI,
  });

  // Listen for scan results
  scanner.on('scan-complete', (results) => {
    opportunities = results;
    console.log(`[APP] Updated opportunities: ${results.length}`);

    // Auto-execute if conditions met
    if (autoExecutionEnabled && results.length > 0) {
      handleAutoExecution(results[0]);
    }
  });

  console.log(`[APP] ✅ Initialization complete (${autoExecutionEnabled ? 'auto-trading enabled' : 'manual execution only'})`);
}

/**
 * Auto-execute trade if conditions are met
 */
async function handleAutoExecution(opportunity) {
  if (!executor) {
    return;
  }

  if (opportunity.confirmations.total < 4) {
    console.log('[APP] Skipping auto-execution: < 4 confirmations');
    return;
  }

  console.log(`[APP] Auto-executing trade: ${opportunity.pair}`);

  const result = await executor.executeTrade(opportunity, defaultTradeAmount);

  if (result.status === 'success') {
    activeTrades[result.txHash] = {
      pair: opportunity.pair,
      entryPrice: opportunity.currentPrice,
      txHash: result.txHash,
      timestamp: new Date(),
      ...opportunity
    };
  }
}

/**
 * Calculate leaderboard
 */
function updateLeaderboard() {
  // This would aggregate data from all trades
  // For now, return mock data
  leaderboard = [
    {
      rank: 1,
      botId: 'bot_1',
      totalTrades: 42,
      winRate: 0.71,
      totalProfit: 1250.50,
      performance30d: 0.23,
      followers: 145
    },
    {
      rank: 2,
      botId: 'bot_2',
      totalTrades: 38,
      winRate: 0.68,
      totalProfit: 980.25,
      performance30d: 0.18,
      followers: 98
    },
    {
      rank: 3,
      botId: 'bot_3',
      totalTrades: 55,
      winRate: 0.65,
      totalProfit: 750.75,
      performance30d: 0.12,
      followers: 67
    }
  ];
}

// ==================== ROUTES ====================

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    runtime: executor?.hasContract() ? 'testnet-live' : 'auth-only',
    autoExecutionEnabled,
    defaultTradeAmount,
  });
});

/**
 * GET /wallet/status - Get bot wallet and contract balances
 */
app.get('/wallet/status', async (req, res) => {
  if (!executor?.hasContract()) {
    return res.status(503).json({ error: 'Trading engine is disabled: missing runtime env vars' });
  }

  const status = await executor.getWalletStatus();
  return res.json({
    status: 'success',
    data: status,
  });
});

/**
 * POST /wallet/deposit - Deposit HSK into the contract balance
 */
app.post('/wallet/deposit', async (req, res) => {
  if (!executor?.hasContract()) {
    return res.status(503).json({ error: 'Trading engine is disabled: missing runtime env vars' });
  }

  const amount = String(req.body?.amount || defaultTradeAmount);
  const result = await executor.deposit(amount);

  if (result.status === 'error') {
    return res.status(400).json(result);
  }

  return res.json(result);
});

/**
 * POST /trades/test-execute - Controlled manual trade execution on testnet
 */
app.post('/trades/test-execute', async (req, res) => {
  if (!executor?.hasContract() || !scanner) {
    return res.status(503).json({ error: 'Trading engine is disabled: missing runtime env vars' });
  }

  const pair = String(req.body?.pair || '').trim().toUpperCase();
  const amount = String(req.body?.amount || defaultTradeAmount);
  const forceConfirmations = req.body?.forceConfirmations === true;

  if (!pair) {
    return res.status(400).json({ error: 'Pair is required' });
  }

  const analysis = await scanner.analyzePair(pair);

  if (!analysis) {
    return res.status(404).json({ error: `Unable to analyze pair ${pair}` });
  }

  if (analysis.confirmations.total < 4 && !forceConfirmations) {
    return res.status(400).json({
      error: `Pair ${pair} has only ${analysis.confirmations.total}/4 confirmations`,
      data: {
        pair,
        amount,
        currentPrice: analysis.currentPrice,
        confirmations: analysis.confirmations,
        canForce: true,
      },
    });
  }

  const opportunity = buildControlledTestOpportunity(analysis, forceConfirmations);
  const result = await executor.executeTrade(opportunity, amount);

  if (result.status === 'success') {
    activeTrades[result.txHash] = {
      pair: opportunity.pair,
      entryPrice: opportunity.currentPrice,
      txHash: result.txHash,
      timestamp: new Date(),
      ...opportunity,
    };
  }

  return res.status(result.status === 'success' ? 200 : 400).json({
    ...result,
    testMode: true,
    forcedConfirmations: forceConfirmations,
    analyzedPair: {
      pair: opportunity.pair,
      currentPrice: opportunity.currentPrice,
      confirmations: opportunity.originalConfirmations,
      appliedConfirmations: opportunity.confirmations,
    },
  });
});

/**
 * GET /opportunities - Get current opportunities
 */
app.get('/opportunities', (req, res) => {
  res.json({
    status: 'success',
    count: opportunities.length,
    data: opportunities.slice(0, 10).map(opp => ({
      pair: opp.pair,
      currentPrice: opp.currentPrice,
      rsi: opp.rsi.toFixed(2),
      macd: opp.macd.macd.toFixed(8),
      volume24h: opp.volume24h,
      change24h: opp.change24h,
      confirmations: opp.confirmations.total,
      orderBook: {
        buyPercentage: opp.orderBook.buyPercentage.toFixed(1),
        sellPercentage: opp.orderBook.sellPercentage.toFixed(1)
      },
      timestamp: opp.timestamp
    }))
  });
});

/**
 * GET /opportunities/:pair - Get specific pair analysis
 */
app.get('/opportunities/:pair', (req, res) => {
  const { pair } = req.params;
  const opp = opportunities.find(o => o.pair === pair.toUpperCase());

  if (!opp) {
    return res.status(404).json({ error: 'Pair not found' });
  }

  res.json({
    status: 'success',
    data: opp
  });
});

/**
 * POST /trades/execute - Manual trade execution
 */
app.post('/trades/execute', async (req, res) => {
  if (!executor) {
    return res.status(503).json({ error: 'Trading engine is disabled: missing runtime env vars' });
  }

  const { pair, amount } = req.body;

  if (!pair) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const opp = opportunities.find(o => o.pair === pair.toUpperCase());

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const result = await executor.executeTrade(opp, String(amount || defaultTradeAmount));
  res.json(result);
});

/**
 * GET /trades/active - Get active trades
 */
app.get('/trades/active', (req, res) => {
  (async () => {
    const snapshot = await getOnChainSnapshot();
    if (snapshot) {
      return res.json({
        status: 'success',
        count: snapshot.activeTrades.length,
        data: snapshot.activeTrades,
      });
    }

    const trades = Object.values(activeTrades).map(trade => ({
      txHash: trade.txHash,
      pair: trade.pair,
      entryPrice: trade.entryPrice,
      status: 'open',
      timestamp: trade.timestamp
    }));

    return res.json({
      status: 'success',
      count: trades.length,
      data: trades
    });
  })().catch((error) => {
    console.error('[APP] Failed to fetch active trades:', error);
    res.status(500).json({ error: 'Failed to fetch active trades' });
  });
});

/**
 * GET /leaderboard - Get top trading bots
 */
app.get('/leaderboard', (req, res) => {
  (async () => {
    const snapshot = await getOnChainSnapshot();

    if (snapshot) {
      return res.json({
        status: 'success',
        count: snapshot.leaderboard.length,
        data: snapshot.leaderboard,
      });
    }

    updateLeaderboard();
    return res.json({
      status: 'success',
      count: leaderboard.length,
      data: leaderboard,
    });
  })().catch((error) => {
    console.error('[APP] Failed to build leaderboard:', error);
    res.status(500).json({ error: 'Failed to build leaderboard' });
  });
});

/**
 * GET /stats - Get global bot statistics
 */
app.get('/stats', async (req, res) => {
  if (!executor?.hasContract()) {
    return res.json({
      status: 'success',
      data: {
        totalTrades: '0',
        totalProfit: '0',
        totalVolume: '$0.00',
        winRate: '0%',
        activeTrades: Object.keys(activeTrades).length,
        lastScan: null,
        mode: 'auth-only',
      },
    });
  }

  const snapshot = await getOnChainSnapshot();
  res.json({
    status: 'success',
    data: snapshot?.stats,
  });
});

/**
 * POST /copy-trading/follow - Follow a bot for copy-trading
 */
app.post('/copy-trading/follow', (req, res) => {
  const { botId, amount } = req.body;

  if (!botId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // TODO: Implement copy-trading logic
  res.json({
    status: 'success',
    message: `Started copying ${botId} with amount ${amount}`,
    copyId: 'copy_' + Date.now()
  });
});

/**
 * GET /copy-trading/my - Get user's copy-trading positions
 */
app.get('/copy-trading/my', (req, res) => {
  // TODO: Implement get user copy positions
  res.json({
    status: 'success',
    data: []
  });
});

/**
 * Error handler
 */
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Start server
 */
async function start() {
  try {
    await initialize();

    server = app.listen(PORT, () => {
      console.log(`[APP] Server running on http://localhost:${PORT}`);
      console.log('[APP] ✅ Ready to receive requests');

      // Start scanning
      if (scanner) {
        const pairs = (process.env.SCAN_PAIRS || 'BTC_USDT,ETH_USDT,SOL_USDT').split(',');
        scanner.startScanning(pairs);
      }
    });
  } catch (error) {
    console.error('[APP] Failed to start:', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`[APP] Shutting down gracefully (${signal})...`);

  if (scanner) {
    scanner.stopScanning();
  }

  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  await prisma.$disconnect();

  if (signal === 'SIGUSR2') {
    process.kill(process.pid, 'SIGUSR2');
    return;
  }

  process.exit(0);
}

let isShuttingDown = false;

function registerShutdown(signal) {
  process.on(signal, () => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    shutdown(signal).catch((error) => {
      console.error('[APP] Shutdown failed:', error);
      process.exit(1);
    });
  });
}

registerShutdown('SIGINT');
registerShutdown('SIGTERM');
registerShutdown('SIGUSR2');

start();

module.exports = app;
