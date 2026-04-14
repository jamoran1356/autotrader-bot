import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/server/queries";

export async function GET() {
  const data = await getLeaderboard();
  return NextResponse.json({ status: "success", count: data.length, data });
}
