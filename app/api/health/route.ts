import { NextResponse } from "next/server";
import { getEngine } from "@/lib/server/trading-engine";

export async function GET() {
  const engine = getEngine();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    runtime: engine.executor?.hasContract() ? "testnet-live" : "auth-only",
  });
}
