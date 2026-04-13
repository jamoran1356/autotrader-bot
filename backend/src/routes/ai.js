const express = require("express");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { verifyToken } = require("../lib/auth");
const StrategyAnalyst = require("../ai/StrategyAnalyst");

const router = express.Router();
const analyst = new StrategyAnalyst();

// ── Auth middleware (same pattern as users.js) ──

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "missing bearer token" });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

// ── Encryption helpers for API keys at rest ──

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.AI_KEY_SECRET || process.env.JWT_SECRET || "autotrader-ai-key-secret")
  .digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(data) {
  const [ivHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function maskKey(key) {
  if (!key || key.length < 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

// ── GET /ai/providers ── Public list of supported providers ──

router.get("/providers", (_req, res) => {
  return res.json({
    status: "success",
    data: StrategyAnalyst.getProviderOptions(),
  });
});

// ── GET /ai/config ── Get user's current AI config (masked key) ──

router.get("/config", requireAuth, async (req, res) => {
  const config = await prisma.aiProviderConfig.findUnique({
    where: { userId: req.user.sub },
  });

  if (!config) {
    return res.json({
      status: "success",
      data: null,
    });
  }

  let maskedKey = "****";
  try {
    maskedKey = maskKey(decrypt(config.apiKey));
  } catch {
    maskedKey = "****";
  }

  return res.json({
    status: "success",
    data: {
      id: config.id,
      provider: config.provider,
      model: config.model,
      apiKeyMasked: maskedKey,
      hasKey: true,
      updatedAt: config.updatedAt,
    },
  });
});

// ── PUT /ai/config ── Save or update AI provider config ──

router.put("/config", requireAuth, async (req, res) => {
  const { provider, apiKey, model } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "provider and apiKey are required" });
  }

  const validProviders = ["openrouter", "openai", "anthropic"];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: `Invalid provider. Supported: ${validProviders.join(", ")}` });
  }

  const providers = StrategyAnalyst.getProviderOptions();
  const providerDef = providers.find((p) => p.id === provider);
  const resolvedModel = model || providerDef?.defaultModel || "openai/gpt-4o-mini";

  const encryptedKey = encrypt(apiKey);

  const saved = await prisma.aiProviderConfig.upsert({
    where: { userId: req.user.sub },
    update: {
      provider,
      apiKey: encryptedKey,
      model: resolvedModel,
    },
    create: {
      userId: req.user.sub,
      provider,
      apiKey: encryptedKey,
      model: resolvedModel,
    },
  });

  return res.json({
    status: "success",
    data: {
      id: saved.id,
      provider: saved.provider,
      model: saved.model,
      apiKeyMasked: maskKey(apiKey),
      hasKey: true,
      updatedAt: saved.updatedAt,
    },
  });
});

// ── DELETE /ai/config ── Remove AI config ──

router.delete("/config", requireAuth, async (req, res) => {
  await prisma.aiProviderConfig
    .delete({ where: { userId: req.user.sub } })
    .catch(() => null);

  return res.json({ status: "success" });
});

// ── POST /ai/analyze/:pair ── Run AI analysis on a trading pair ──

router.post("/analyze/:pair", requireAuth, async (req, res) => {
  const { pair } = req.params;

  if (!pair) {
    return res.status(400).json({ error: "pair is required" });
  }

  // Load user's AI config
  const config = await prisma.aiProviderConfig.findUnique({
    where: { userId: req.user.sub },
  });

  if (!config) {
    return res.status(400).json({
      error: "AI provider not configured. Go to Dashboard → AI Settings to add your API key.",
    });
  }

  let decryptedKey;
  try {
    decryptedKey = decrypt(config.apiKey);
  } catch {
    return res.status(500).json({ error: "Failed to decrypt stored API key. Please re-save your key." });
  }

  // Get scanner reference from app context
  const scanner = req.app.locals.scanner;
  if (!scanner) {
    return res.status(503).json({ error: "Market scanner is not available" });
  }

  // Run technical analysis first
  let marketAnalysis;
  try {
    marketAnalysis = await scanner.analyzePair(pair.trim().toUpperCase());
  } catch (scanError) {
    return res.status(400).json({ error: `Failed to analyze pair ${pair}: ${scanError.message}` });
  }

  if (!marketAnalysis) {
    return res.status(404).json({ error: `Unable to fetch market data for ${pair}` });
  }

  // Run AI analysis
  try {
    const aiResult = await analyst.analyze(pair.trim().toUpperCase(), marketAnalysis, {
      provider: config.provider,
      apiKey: decryptedKey,
      model: config.model,
    });

    return res.json({
      status: "success",
      data: {
        ai: aiResult,
        technical: {
          pair: marketAnalysis.pair,
          currentPrice: marketAnalysis.currentPrice,
          rsi: marketAnalysis.rsi,
          macd: marketAnalysis.macd,
          atr: marketAnalysis.atr,
          volume24h: marketAnalysis.volume24h,
          change24h: marketAnalysis.change24h,
          confirmations: marketAnalysis.confirmations,
          orderBook: marketAnalysis.orderBook,
        },
      },
    });
  } catch (aiError) {
    console.error("[AI] Analysis failed:", aiError.message);
    return res.status(502).json({ error: `AI analysis failed: ${aiError.message}` });
  }
});

// ── POST /ai/validate-key ── Quick validation that the API key works ──

router.post("/validate-key", requireAuth, async (req, res) => {
  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "provider and apiKey are required" });
  }

  try {
    const providerDef = StrategyAnalyst.getProviderOptions().find((p) => p.id === provider);
    const model = providerDef?.defaultModel || "openai/gpt-4o-mini";

    const result = await analyst.analyze("BTC_USDT", {
      rsi: 45,
      macd: { macd: 0.0001, signal: 0.00005, histogram: 0.00005 },
      atr: 500,
      orderBook: { buyPercentage: 52, sellPercentage: 48, totalBuyVolume: 100, totalSellVolume: 100 },
      confirmations: { rsiExtreme: false, macdExtreme: false, volumeSpike: false, orderBookExtreme: false, total: 0 },
      currentPrice: 67000,
      volume24h: "1000000",
      change24h: "0.5%",
      high24h: 67500,
      low24h: 66500,
    }, { provider, apiKey, model });

    return res.json({
      status: "success",
      data: { valid: true, model, recommendation: result.recommendation },
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      error: `Key validation failed: ${err.message}`,
      data: { valid: false },
    });
  }
});

// ── GET /ai/history ── Get AI trade decision history ──

router.get("/history", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const [logs, total] = await Promise.all([
    prisma.aiTradeLog.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.aiTradeLog.count({ where: { userId: req.user.sub } }),
  ]);

  return res.json({
    status: "success",
    data: {
      logs: logs.map((log) => ({
        id: log.id,
        pair: log.pair,
        recommendation: log.recommendation,
        confidence: log.confidence,
        reasoning: log.reasoning,
        marketRegime: log.marketRegime,
        keyRisks: log.keyRisks ? JSON.parse(log.keyRisks) : [],
        entryLow: log.entryLow,
        entryHigh: log.entryHigh,
        stopLoss: log.stopLoss,
        riskReward: log.riskReward,
        executed: log.executed,
        txHash: log.txHash,
        executionError: log.executionError,
        provider: log.provider,
        model: log.model,
        createdAt: log.createdAt,
      })),
      total,
      limit,
      offset,
    },
  });
});

// ── GET /ai/auto-trade ── Get user's auto-trade settings ──

router.get("/auto-trade", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { aiAutoTrade: true, aiMinConfidence: true },
  });

  return res.json({
    status: "success",
    data: {
      enabled: user?.aiAutoTrade ?? false,
      minConfidence: user?.aiMinConfidence ?? 0.7,
    },
  });
});

// ── PUT /ai/auto-trade ── Toggle AI auto-trade settings ──

router.put("/auto-trade", requireAuth, async (req, res) => {
  const { enabled, minConfidence } = req.body;

  // Require AI config before enabling auto-trade
  if (enabled) {
    const config = await prisma.aiProviderConfig.findUnique({
      where: { userId: req.user.sub },
    });
    if (!config) {
      return res.status(400).json({
        error: "Configure your AI provider before enabling auto-trade.",
      });
    }
  }

  const updateData = {};
  if (typeof enabled === "boolean") updateData.aiAutoTrade = enabled;
  if (typeof minConfidence === "number" && minConfidence >= 0.1 && minConfidence <= 1.0) {
    updateData.aiMinConfidence = minConfidence;
  }

  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data: updateData,
    select: { aiAutoTrade: true, aiMinConfidence: true },
  });

  return res.json({
    status: "success",
    data: {
      enabled: user.aiAutoTrade,
      minConfidence: user.aiMinConfidence,
    },
  });
});

// ── POST /ai/execute/:pair ── AI-gated one-shot execution: analyze + execute ──

router.post("/execute/:pair", requireAuth, async (req, res) => {
  const { pair } = req.params;
  const amount = String(req.body?.amount || "0.01");

  if (!pair) {
    return res.status(400).json({ error: "pair is required" });
  }

  const config = await prisma.aiProviderConfig.findUnique({
    where: { userId: req.user.sub },
  });

  if (!config) {
    return res.status(400).json({
      error: "AI provider not configured. Go to Dashboard → AI Settings to add your API key.",
    });
  }

  let decryptedKey;
  try {
    decryptedKey = decrypt(config.apiKey);
  } catch {
    return res.status(500).json({ error: "Failed to decrypt stored API key. Please re-save your key." });
  }

  const scanner = req.app.locals.scanner;
  const executor = req.app.locals.executor;

  if (!scanner || !executor) {
    return res.status(503).json({ error: "Trading engine is not available" });
  }

  // Step 1: Technical analysis
  let marketAnalysis;
  try {
    marketAnalysis = await scanner.analyzePair(pair.trim().toUpperCase());
  } catch (scanError) {
    return res.status(400).json({ error: `Failed to analyze pair ${pair}: ${scanError.message}` });
  }

  if (!marketAnalysis) {
    return res.status(404).json({ error: `Unable to fetch market data for ${pair}` });
  }

  // Step 2: AI analysis
  let aiResult;
  try {
    aiResult = await analyst.analyze(pair.trim().toUpperCase(), marketAnalysis, {
      provider: config.provider,
      apiKey: decryptedKey,
      model: config.model,
    });
  } catch (aiError) {
    // Log the failed analysis
    await prisma.aiTradeLog.create({
      data: {
        userId: req.user.sub,
        pair: pair.trim().toUpperCase(),
        recommendation: "ERROR",
        confidence: 0,
        reasoning: `AI analysis error: ${aiError.message}`,
        executed: false,
        executionError: aiError.message,
        provider: config.provider,
        model: config.model,
      },
    });
    return res.status(502).json({ error: `AI analysis failed: ${aiError.message}` });
  }

  const isTradeSignal = aiResult.recommendation === "LONG" || aiResult.recommendation === "SHORT";

  // Step 3: Execute if AI approves
  let execution = null;
  const shouldExecute = isTradeSignal && aiResult.confidence >= 0.6;

  if (shouldExecute) {
    try {
      const opportunity = {
        ...marketAnalysis,
        confirmations: {
          rsiExtreme: true,
          macdExtreme: true,
          volumeSpike: true,
          orderBookExtreme: true,
          total: 4,
        },
      };
      execution = await executor.executeTrade(opportunity, amount);
    } catch (execError) {
      execution = { status: "error", error: execError.message };
    }
  }

  // Log the decision
  await prisma.aiTradeLog.create({
    data: {
      userId: req.user.sub,
      pair: pair.trim().toUpperCase(),
      recommendation: aiResult.recommendation,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      marketRegime: aiResult.market_regime,
      keyRisks: JSON.stringify(aiResult.key_risks || []),
      entryLow: aiResult.entry_zone?.low,
      entryHigh: aiResult.entry_zone?.high,
      stopLoss: aiResult.stop_loss?.price,
      riskReward: aiResult.risk_reward_ratio,
      executed: shouldExecute && execution?.status === "success",
      txHash: execution?.txHash || null,
      executionError: execution?.status === "error" ? execution.error : null,
      provider: aiResult.provider,
      model: aiResult.model,
      technicalData: JSON.stringify({
        rsi: marketAnalysis.rsi,
        macd: marketAnalysis.macd,
        confirmations: marketAnalysis.confirmations,
        currentPrice: marketAnalysis.currentPrice,
      }),
    },
  });

  return res.json({
    status: "success",
    data: {
      ai: aiResult,
      technical: {
        pair: marketAnalysis.pair,
        currentPrice: marketAnalysis.currentPrice,
        rsi: marketAnalysis.rsi,
        macd: marketAnalysis.macd,
        atr: marketAnalysis.atr,
        confirmations: marketAnalysis.confirmations,
      },
      execution: shouldExecute
        ? {
            attempted: true,
            status: execution?.status,
            txHash: execution?.txHash || null,
            error: execution?.status === "error" ? execution.error : null,
          }
        : {
            attempted: false,
            reason: !isTradeSignal
              ? "AI recommended NO_TRADE"
              : `Confidence ${(aiResult.confidence * 100).toFixed(0)}% below 60% execution threshold`,
          },
    },
  });
});

module.exports = router;
