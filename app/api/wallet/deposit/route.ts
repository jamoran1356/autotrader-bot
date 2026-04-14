import { NextResponse } from "next/server";
import { getEngine } from "@/lib/server/trading-engine";

export async function POST(request: Request) {
  const engine = getEngine();
  if (!engine.executor?.hasContract()) {
    return NextResponse.json({ error: "Trading engine is disabled" }, { status: 503 });
  }

  const body = await request.json();
  const amount = String(body?.amount || "0.01");
  const result = await engine.executor.deposit(amount);

  if (result.status === "error") {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
