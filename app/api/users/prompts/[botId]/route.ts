import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { botId } = await params;

  const prompt = await prisma.botPersonalityPrompt.findUnique({
    where: { userId_botId: { userId: auth.sub, botId } },
  });

  return NextResponse.json({ status: "success", data: prompt });
}

export async function POST(request: Request, { params }: { params: Promise<{ botId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { botId } = await params;
  const { prompt, tone = "balanced", riskMode = "balanced" } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const saved = await prisma.botPersonalityPrompt.upsert({
    where: { userId_botId: { userId: auth.sub, botId } },
    update: { prompt, tone, riskMode },
    create: { userId: auth.sub, botId, prompt, tone, riskMode },
  });

  return NextResponse.json({ status: "success", data: saved });
}
