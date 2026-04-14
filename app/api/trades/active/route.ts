import { NextResponse } from "next/server";
import { getActiveTrades } from "@/lib/server/queries";

export async function GET() {
  const data = await getActiveTrades();
  return NextResponse.json({ status: "success", count: data.length, data });
}
