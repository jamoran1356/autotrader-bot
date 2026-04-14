import { NextResponse } from "next/server";
import { getStats } from "@/lib/server/queries";

export async function GET() {
  const stats = await getStats();
  return NextResponse.json({ status: "success", data: stats });
}
