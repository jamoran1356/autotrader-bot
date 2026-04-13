/**
 * AI STRATEGY ANALYST - LLM-powered market analysis for trading decisions
 *
 * Supports multiple providers via a unified interface:
 * - OpenRouter (access to 100+ models)
 * - OpenAI (GPT-4o, GPT-4o-mini, etc.)
 * - Anthropic (Claude)
 *
 * The analyst receives raw technical indicators from the MarketScanner
 * and produces structured risk/reward assessments and trade recommendations.
 */

const PROVIDER_ENDPOINTS = {
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
};

const DEFAULT_MODELS = {
  openrouter: "openai/gpt-4o-mini",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
};

/**
 * Build system prompt for the trading strategist agent
 */
function buildSystemPrompt() {
  return `You are an elite quantitative trading strategist AI embedded in AutoTrader, an autonomous DeFi trading system deployed on HashKey Chain. Your role is to analyze raw market data and produce actionable, risk-aware trade intelligence.

CORE RESPONSIBILITIES:
1. Interpret technical indicators (RSI, MACD, ATR, volume, order book) in combination — never in isolation.
2. Identify confluence zones where multiple signals align for high-probability setups.
3. Assess macro regime context (trending, ranging, volatile, low-liquidity) from the data provided.
4. Produce a clear TRADE or NO-TRADE recommendation with quantified confidence.
5. When recommending a trade, specify precise entry zone, take-profit levels (TP1/TP2/TP3), stop-loss, and position sizing guidance.

ANALYTICAL FRAMEWORK:
- RSI: Values <30 signal potential reversal long; >70 signal potential reversal short. But RSI in isolation is unreliable — require volume or MACD confirmation.
- MACD: Histogram divergence from price action is the strongest signal. Crossovers matter only with volume confirmation.
- Volume: A spike >1.2x average confirms momentum. Declining volume on a move signals exhaustion.
- Order Book: Imbalance >60% buy = bullish absorption; >60% sell = bearish distribution. Spoofing risk exists — flag thin books.
- ATR: Determines volatility regime. High ATR = wider stops, smaller position. Low ATR = tighter stops, larger position.

RISK MANAGEMENT RULES (non-negotiable):
- Never recommend risking more than 2% of portfolio on a single trade.
- Stop-loss must always be defined. "No stop" is never acceptable.
- If data quality is poor or indicators conflict, the correct answer is NO-TRADE.
- Always disclose uncertainty. Overconfidence kills portfolios.

OUTPUT FORMAT (strict JSON):
{
  "recommendation": "LONG" | "SHORT" | "NO_TRADE",
  "confidence": 0-100,
  "reasoning": "2-3 sentence explanation of the primary thesis",
  "entry_zone": { "low": number, "high": number },
  "take_profits": [
    { "level": "TP1", "price": number, "rationale": "string" },
    { "level": "TP2", "price": number, "rationale": "string" },
    { "level": "TP3", "price": number, "rationale": "string" }
  ],
  "stop_loss": { "price": number, "rationale": "string" },
  "position_size_pct": number,
  "risk_reward_ratio": number,
  "market_regime": "trending_up" | "trending_down" | "ranging" | "volatile" | "uncertain",
  "key_risks": ["string"],
  "invalidation": "string describing what would invalidate this thesis"
}

If recommendation is NO_TRADE, omit entry_zone, take_profits, stop_loss, position_size_pct, and risk_reward_ratio — but still provide reasoning, market_regime, key_risks, and confidence.`;
}

/**
 * Build the user prompt with real market data
 */
function buildAnalysisPrompt(pair, analysis) {
  const { rsi, macd, atr, orderBook, confirmations, currentPrice, volume24h, change24h, high24h, low24h } = analysis;

  return `Analyze the following live market data for ${pair} and produce your structured assessment.

PAIR: ${pair}
CURRENT PRICE: ${currentPrice}
24H CHANGE: ${change24h || "N/A"}
24H HIGH: ${high24h || "N/A"}
24H LOW: ${low24h || "N/A"}
24H VOLUME: ${volume24h || "N/A"}

TECHNICAL INDICATORS:
- RSI(14): ${typeof rsi === "number" ? rsi.toFixed(2) : "N/A"}
- MACD Line: ${macd?.macd != null ? macd.macd.toFixed(8) : "N/A"}
- MACD Signal: ${macd?.signal != null ? macd.signal.toFixed(8) : "N/A"}
- MACD Histogram: ${macd?.histogram != null ? macd.histogram.toFixed(8) : "N/A"}
- ATR(14): ${atr != null ? (typeof atr === "number" ? atr.toFixed(8) : atr) : "N/A"}

ORDER BOOK:
- Buy %: ${orderBook?.buyPercentage != null ? orderBook.buyPercentage.toFixed(1) : "N/A"}
- Sell %: ${orderBook?.sellPercentage != null ? orderBook.sellPercentage.toFixed(1) : "N/A"}
- Total Buy Volume: ${orderBook?.totalBuyVolume || "N/A"}
- Total Sell Volume: ${orderBook?.totalSellVolume || "N/A"}

SCANNER CONFIRMATIONS: ${confirmations?.total || 0}/4
- RSI Extreme: ${confirmations?.rsiExtreme ? "YES" : "NO"}
- MACD Extreme: ${confirmations?.macdExtreme ? "YES" : "NO"}
- Volume Spike: ${confirmations?.volumeSpike ? "YES" : "NO"}
- Order Book Extreme: ${confirmations?.orderBookExtreme ? "YES" : "NO"}

Produce your JSON analysis now. Return ONLY the JSON object, no markdown fences or extra text.`;
}

/**
 * Call OpenAI-compatible API (works for OpenRouter and OpenAI)
 */
async function callOpenAICompatible(endpoint, apiKey, model, systemPrompt, userPrompt, provider) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://autotrader.bot";
    headers["X-Title"] = "AutoTrader AI Strategy Analyst";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${provider} API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

/**
 * Call Anthropic API
 */
async function callAnthropic(apiKey, model, systemPrompt, userPrompt) {
  const response = await fetch(PROVIDER_ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || null;
}

/**
 * Parse the LLM response into structured analysis
 */
function parseLLMResponse(raw) {
  if (!raw) {
    return null;
  }

  // Strip markdown fences if the model wrapped them anyway
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.recommendation || typeof parsed.confidence !== "number") {
      return null;
    }

    // Clamp confidence
    parsed.confidence = Math.max(0, Math.min(100, parsed.confidence));

    return parsed;
  } catch {
    console.error("[AI] Failed to parse LLM response:", cleaned.slice(0, 200));
    return null;
  }
}

class StrategyAnalyst {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze a trading pair using the user's configured AI provider
   */
  async analyze(pair, marketAnalysis, providerConfig) {
    const { provider, apiKey, model } = providerConfig;

    if (!apiKey) {
      throw new Error("AI API key is not configured");
    }

    // Check cache
    const cacheKey = `${pair}:${provider}:${model}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { ...cached.data, cached: true };
    }

    const resolvedProvider = provider || "openrouter";
    const resolvedModel = model || DEFAULT_MODELS[resolvedProvider] || DEFAULT_MODELS.openrouter;

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildAnalysisPrompt(pair, marketAnalysis);

    let rawResponse;

    if (resolvedProvider === "anthropic") {
      rawResponse = await callAnthropic(apiKey, resolvedModel, systemPrompt, userPrompt);
    } else {
      const endpoint = PROVIDER_ENDPOINTS[resolvedProvider] || PROVIDER_ENDPOINTS.openrouter;
      rawResponse = await callOpenAICompatible(endpoint, apiKey, resolvedModel, systemPrompt, userPrompt, resolvedProvider);
    }

    const parsed = parseLLMResponse(rawResponse);

    if (!parsed) {
      throw new Error("AI returned an invalid or unparseable response");
    }

    // Enrich with metadata
    parsed.provider = resolvedProvider;
    parsed.model = resolvedModel;
    parsed.analyzedAt = new Date().toISOString();
    parsed.pair = pair;
    parsed.cached = false;

    // Cache result
    this.cache.set(cacheKey, { data: parsed, timestamp: Date.now() });

    return parsed;
  }

  /**
   * Get available providers and their default models
   */
  static getProviderOptions() {
    return [
      {
        id: "openrouter",
        name: "OpenRouter",
        description: "Access 100+ models (GPT-4o, Claude, Llama, Mixtral, etc.)",
        defaultModel: DEFAULT_MODELS.openrouter,
        models: [
          "openai/gpt-4o",
          "openai/gpt-4o-mini",
          "anthropic/claude-sonnet-4-20250514",
          "anthropic/claude-3.5-haiku",
          "meta-llama/llama-3.1-70b-instruct",
          "google/gemini-pro-1.5",
          "mistralai/mixtral-8x7b-instruct",
        ],
      },
      {
        id: "openai",
        name: "OpenAI",
        description: "Direct OpenAI API (GPT-4o, GPT-4o-mini)",
        defaultModel: DEFAULT_MODELS.openai,
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
      },
      {
        id: "anthropic",
        name: "Anthropic",
        description: "Direct Anthropic API (Claude)",
        defaultModel: DEFAULT_MODELS.anthropic,
        models: ["claude-sonnet-4-20250514", "claude-3.5-haiku-20241022"],
      },
    ];
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = StrategyAnalyst;
