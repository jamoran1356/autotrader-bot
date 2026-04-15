import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";

/**
 * GET /api/users/bots — List all bots created by the authenticated user.
 */
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const bots = await prisma.botPersonalityPrompt.findMany({
    where: { userId: auth.sub },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ status: "success", data: bots });
}

/**
 * POST /api/users/bots — Create a new bot personality.
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const body = await request.json();
  const { name, pair, prompt, tone, riskMode } = body as {
    name?: string;
    pair?: string;
    prompt?: string;
    tone?: string;
    riskMode?: string;
  };

  if (!name || !pair || !prompt) {
    return NextResponse.json({ error: "name, pair, and prompt are required" }, { status: 400 });
  }

  // Generate a slug-style botId from name
  const botId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

  // Check for duplicates
  const existing = await prisma.botPersonalityPrompt.findUnique({
    where: { userId_botId: { userId: auth.sub, botId } },
  });

  if (existing) {
    return NextResponse.json({ error: "A bot with this name already exists." }, { status: 409 });
  }

  // Store pair in the prompt metadata (prepend to prompt text)
  const fullPrompt = `[pair:${pair.toUpperCase()}] ${prompt}`;

  const bot = await prisma.botPersonalityPrompt.create({
    data: {
      userId: auth.sub,
      botId,
      prompt: fullPrompt,
      tone: tone || "balanced",
      riskMode: riskMode || "balanced",
    },
  });

  return NextResponse.json({ status: "success", data: bot }, { status: 201 });
}
