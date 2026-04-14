import { NextResponse } from "next/server";
import { getEngine } from "@/lib/server/trading-engine";

export async function GET() {
  const engine = getEngine();
  if (!engine.executor?.hasContract()) {
    return NextResponse.json({ error: "Trading engine is disabled" }, { status: 503 });
  }

  const status = await engine.executor.getWalletStatus();
  return NextResponse.json({ status: "success", data: status });
}
