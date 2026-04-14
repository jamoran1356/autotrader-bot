import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { getEngine } from "@/lib/server/trading-engine";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { provider, apiKey } = await request.json();
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey are required" }, { status: 400 });
  }

  try {
    const engine = getEngine();
    const providerDef = engine.analyst.constructor === Object ? null : (await import("@/lib/server/strategy-analyst")).StrategyAnalyst.getProviderOptions().find((p) => p.id === provider);
    const model = providerDef?.defaultModel || "openai/gpt-4o-mini";

    const result = await engine.analyst.analyze(
      "BTC_USDT",
      {
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
      },
      { provider, apiKey, model },
    );

    return NextResponse.json({ status: "success", data: { valid: true, model, recommendation: result.recommendation } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: "error", error: `Key validation failed: ${message}`, data: { valid: false } }, { status: 400 });
  }
}
