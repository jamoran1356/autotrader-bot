import { NextResponse } from "next/server";
import { getEngine } from "@/lib/server/trading-engine";

export async function POST(request: Request) {
  const engine = getEngine();
  if (!engine.executor?.hasContract() || !engine.scanner) {
    return NextResponse.json({ error: "Trading engine is disabled" }, { status: 503 });
  }

  const body = await request.json();
  const pair = String(body?.pair || "").trim().toUpperCase();
  const amount = String(body?.amount || "0.01");
  const forceConfirmations = body?.forceConfirmations === true;

  if (!pair) return NextResponse.json({ error: "Pair is required" }, { status: 400 });

  const analysis = await engine.scanner.analyzePair(pair);
  if (!analysis) return NextResponse.json({ error: `Unable to analyze pair ${pair}` }, { status: 404 });

  if (analysis.confirmations.total < 4 && !forceConfirmations) {
    return NextResponse.json(
      {
        error: `Pair ${pair} has only ${analysis.confirmations.total}/4 confirmations`,
        data: { pair, amount, currentPrice: analysis.currentPrice, confirmations: analysis.confirmations, canForce: true },
      },
      { status: 400 },
    );
  }

  const opportunity = {
    ...analysis,
    confirmations: forceConfirmations
      ? { rsiExtreme: true, macdExtreme: true, volumeSpike: true, orderBookExtreme: true, total: 4 }
      : analysis.confirmations,
    testMode: true,
    manualOverride: forceConfirmations,
    originalConfirmations: analysis.confirmations,
  };

  const result = await engine.executor.executeTrade(opportunity, amount);

  return NextResponse.json(
    {
      ...result,
      testMode: true,
      forcedConfirmations: forceConfirmations,
      analyzedPair: {
        pair: opportunity.pair,
        currentPrice: opportunity.currentPrice,
        confirmations: opportunity.originalConfirmations,
        appliedConfirmations: opportunity.confirmations,
      },
    },
    { status: result.status === "success" ? 200 : 400 },
  );
}
