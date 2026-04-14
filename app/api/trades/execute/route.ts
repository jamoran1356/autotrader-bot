import { NextResponse } from "next/server";
import { getEngine } from "@/lib/server/trading-engine";

export async function POST(request: Request) {
  const engine = getEngine();
  if (!engine.executor?.hasContract()) {
    return NextResponse.json({ error: "Trading engine is disabled" }, { status: 503 });
  }

  const { pair, amount } = await request.json();
  if (!pair) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const opp = engine.opportunities.find((o: { pair: string }) => o.pair === pair.toUpperCase());
  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const result = await engine.executor.executeTrade(opp, String(amount || "0.01"));
  return NextResponse.json(result);
}
