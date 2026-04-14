import { NextResponse } from "next/server";
import { StrategyAnalyst } from "@/lib/server/strategy-analyst";

export async function GET() {
  return NextResponse.json({ status: "success", data: StrategyAnalyst.getProviderOptions() });
}
