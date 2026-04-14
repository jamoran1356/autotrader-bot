import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { aiAutoTrade: true, aiMinConfidence: true },
  });

  return NextResponse.json({
    status: "success",
    data: {
      enabled: user?.aiAutoTrade ?? false,
      minConfidence: user?.aiMinConfidence ?? 0.7,
    },
  });
}

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { enabled, minConfidence } = await request.json();

  if (enabled) {
    const config = await prisma.aiProviderConfig.findUnique({ where: { userId: auth.sub } });
    if (!config) {
      return NextResponse.json({ error: "Configure your AI provider before enabling auto-trade." }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (typeof enabled === "boolean") updateData.aiAutoTrade = enabled;
  if (typeof minConfidence === "number" && minConfidence >= 0.1 && minConfidence <= 1.0) {
    updateData.aiMinConfidence = minConfidence;
  }

  const user = await prisma.user.update({
    where: { id: auth.sub },
    data: updateData,
    select: { aiAutoTrade: true, aiMinConfidence: true },
  });

  return NextResponse.json({
    status: "success",
    data: { enabled: user.aiAutoTrade, minConfidence: user.aiMinConfidence },
  });
}
