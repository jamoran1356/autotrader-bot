/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";
import { decrypt } from "@/lib/server/crypto";
import { getEngine } from "@/lib/server/trading-engine";

export async function POST(request: Request, { params }: { params: Promise<{ pair: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { pair } = await params;
  const body = await request.json();
  const amount = String(body?.amount || "0.01");

  if (!pair) return NextResponse.json({ error: "pair is required" }, { status: 400 });

  const config = await prisma.aiProviderConfig.findUnique({ where: { userId: auth.sub } });
  if (!config) {
    return NextResponse.json({ error: "AI provider not configured." }, { status: 400 });
  }

  let decryptedKey: string;
  try {
    decryptedKey = decrypt(config.apiKey);
  } catch {
    return NextResponse.json({ error: "Failed to decrypt stored API key." }, { status: 500 });
  }

  const engine = getEngine();
  if (!engine.scanner || !engine.executor) {
    return NextResponse.json({ error: "Trading engine is not available" }, { status: 503 });
  }

  // Step 1: Technical analysis
  let marketAnalysis: any;
  try {
    marketAnalysis = await engine.scanner.analyzePair(pair.trim().toUpperCase());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to analyze pair ${pair}: ${msg}` }, { status: 400 });
  }

  if (!marketAnalysis) return NextResponse.json({ error: `Unable to fetch market data for ${pair}` }, { status: 404 });

  // Step 2: AI analysis
  let aiResult: any;
  try {
    aiResult = await engine.analyst.analyze(pair.trim().toUpperCase(), marketAnalysis, {
      provider: config.provider,
      apiKey: decryptedKey,
      model: config.model,
    });
  } catch (aiError: unknown) {
    const msg = aiError instanceof Error ? aiError.message : "Unknown error";
    await prisma.aiTradeLog.create({
      data: {
        userId: auth.sub,
        pair: pair.trim().toUpperCase(),
        recommendation: "ERROR",
        confidence: 0,
        reasoning: `AI analysis error: ${msg}`,
        executed: false,
        executionError: msg,
        provider: config.provider,
        model: config.model,
      },
    });
    return NextResponse.json({ error: `AI analysis failed: ${msg}` }, { status: 502 });
  }

  const isTradeSignal = aiResult.recommendation === "LONG" || aiResult.recommendation === "SHORT";
  const shouldExecute = isTradeSignal && aiResult.confidence >= 0.6;

  // Step 3: Execute if AI approves
  let execution: any = null;

  if (shouldExecute) {
    try {
      const opportunity = {
        ...marketAnalysis,
        confirmations: { rsiExtreme: true, macdExtreme: true, volumeSpike: true, orderBookExtreme: true, total: 4 },
      };
      execution = await engine.executor.executeTrade(opportunity, amount);
    } catch (execError: unknown) {
      const msg = execError instanceof Error ? execError.message : "Unknown error";
      execution = { status: "error", error: msg };
    }
  }

  // Log the decision
  await prisma.aiTradeLog.create({
    data: {
      userId: auth.sub,
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

  return NextResponse.json({
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
        ? { attempted: true, status: execution?.status, txHash: execution?.txHash || null, error: execution?.status === "error" ? execution.error : null }
        : {
            attempted: false,
            reason: !isTradeSignal
              ? "AI recommended NO_TRADE"
              : `Confidence ${(aiResult.confidence * 100).toFixed(0)}% below 60% execution threshold`,
          },
    },
  });
}
