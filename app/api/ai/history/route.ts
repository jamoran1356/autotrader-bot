import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const [logs, total] = await Promise.all([
    prisma.aiTradeLog.findMany({
      where: { userId: auth.sub },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.aiTradeLog.count({ where: { userId: auth.sub } }),
  ]);

  return NextResponse.json({
    status: "success",
    data: {
      logs: logs.map((log) => ({
        id: log.id,
        pair: log.pair,
        recommendation: log.recommendation,
        confidence: log.confidence,
        reasoning: log.reasoning,
        marketRegime: log.marketRegime,
        keyRisks: log.keyRisks ? JSON.parse(log.keyRisks) : [],
        entryLow: log.entryLow,
        entryHigh: log.entryHigh,
        stopLoss: log.stopLoss,
        riskReward: log.riskReward,
        executed: log.executed,
        txHash: log.txHash,
        executionError: log.executionError,
        provider: log.provider,
        model: log.model,
        createdAt: log.createdAt,
      })),
      total,
      limit,
      offset,
    },
  });
}
