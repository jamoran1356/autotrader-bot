import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";
import { decrypt } from "@/lib/server/crypto";
import { getEngine } from "@/lib/server/trading-engine";

export async function POST(_request: Request, { params }: { params: Promise<{ pair: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { pair } = await params;
  if (!pair) return NextResponse.json({ error: "pair is required" }, { status: 400 });

  const config = await prisma.aiProviderConfig.findUnique({ where: { userId: auth.sub } });
  if (!config) {
    return NextResponse.json({ error: "AI provider not configured. Go to Dashboard → AI Settings to add your API key." }, { status: 400 });
  }

  let decryptedKey: string;
  try {
    decryptedKey = decrypt(config.apiKey);
  } catch {
    return NextResponse.json({ error: "Failed to decrypt stored API key. Please re-save your key." }, { status: 500 });
  }

  const engine = getEngine();
  if (!engine.scanner) {
    return NextResponse.json({ error: "Market scanner is not available" }, { status: 503 });
  }

  let marketAnalysis;
  try {
    marketAnalysis = await engine.scanner.analyzePair(pair.trim().toUpperCase());
  } catch (scanError: unknown) {
    const msg = scanError instanceof Error ? scanError.message : "Unknown error";
    return NextResponse.json({ error: `Failed to analyze pair ${pair}: ${msg}` }, { status: 400 });
  }

  if (!marketAnalysis) {
    return NextResponse.json({ error: `Unable to fetch market data for ${pair}` }, { status: 404 });
  }

  try {
    const aiResult = await engine.analyst.analyze(pair.trim().toUpperCase(), marketAnalysis, {
      provider: config.provider,
      apiKey: decryptedKey,
      model: config.model,
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
          volume24h: marketAnalysis.volume24h,
          change24h: marketAnalysis.change24h,
          confirmations: marketAnalysis.confirmations,
          orderBook: marketAnalysis.orderBook,
        },
      },
    });
  } catch (aiError: unknown) {
    const msg = aiError instanceof Error ? aiError.message : "Unknown error";
    return NextResponse.json({ error: `AI analysis failed: ${msg}` }, { status: 502 });
  }
}
