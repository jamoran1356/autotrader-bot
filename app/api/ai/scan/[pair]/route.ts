import { NextResponse } from "next/server";
import { getEngine } from "@/lib/server/trading-engine";

/**
 * GET /api/ai/scan/[pair]
 *
 * Public endpoint — runs live technical analysis on a trading pair using
 * Gate.io data (RSI, MACD, ATR, volume, order book, 4/4 confirmations).
 * No AI key required. Useful for judges/reviewers to verify the pipeline works.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const normalizedPair = pair.trim().toUpperCase();

  try {
    const engine = getEngine();
    if (!engine.scanner) {
      return NextResponse.json(
        { error: "Market scanner not initialized" },
        { status: 503 },
      );
    }

    const analysis = await engine.scanner.analyzePair(normalizedPair);
    if (!analysis) {
      return NextResponse.json(
        { error: `Unable to fetch data for ${normalizedPair}. Ensure the pair exists on Gate.io (e.g., BTC_USDT).` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        pair: analysis.pair,
        currentPrice: analysis.currentPrice,
        change24h: `${analysis.change24h > 0 ? "+" : ""}${analysis.change24h.toFixed(2)}%`,
        volume24h: `$${analysis.volume24h.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
        high24h: analysis.high24h,
        low24h: analysis.low24h,
        indicators: {
          rsi: analysis.rsi ? Number(analysis.rsi.toFixed(2)) : null,
          macd: analysis.macd
            ? {
                value: Number(analysis.macd.macd.toFixed(6)),
                signal: Number(analysis.macd.signal.toFixed(6)),
                histogram: Number(analysis.macd.histogram.toFixed(6)),
              }
            : null,
          atr: analysis.atr ? Number(analysis.atr.toFixed(6)) : null,
        },
        orderBook: {
          buyPercentage: Number(analysis.orderBook.buyPercentage.toFixed(1)),
          sellPercentage: Number((100 - analysis.orderBook.buyPercentage).toFixed(1)),
        },
        confirmations: {
          rsiExtreme: analysis.confirmations.rsiExtreme,
          macdExtreme: analysis.confirmations.macdExtreme,
          volumeSpike: analysis.confirmations.volumeSpike,
          orderBookExtreme: analysis.confirmations.orderBookExtreme,
          total: `${analysis.confirmations.total}/4`,
        },
        sentiment: analysis.sentiment ?? null,
        timestamp: analysis.timestamp,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 },
    );
  }
}
