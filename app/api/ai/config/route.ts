import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";
import { encrypt, decrypt, maskKey } from "@/lib/server/crypto";
import { StrategyAnalyst } from "@/lib/server/strategy-analyst";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const config = await prisma.aiProviderConfig.findUnique({ where: { userId: auth.sub } });

  if (!config) return NextResponse.json({ status: "success", data: null });

  let maskedApiKey = "****";
  try {
    maskedApiKey = maskKey(decrypt(config.apiKey));
  } catch {
    maskedApiKey = "****";
  }

  return NextResponse.json({
    status: "success",
    data: {
      id: config.id,
      provider: config.provider,
      model: config.model,
      apiKeyMasked: maskedApiKey,
      hasKey: true,
      updatedAt: config.updatedAt,
    },
  });
}

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { provider, apiKey, model } = await request.json();

  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey are required" }, { status: 400 });
  }

  const validProviders = ["openrouter", "openai", "anthropic"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: `Invalid provider. Supported: ${validProviders.join(", ")}` }, { status: 400 });
  }

  const providers = StrategyAnalyst.getProviderOptions();
  const providerDef = providers.find((p) => p.id === provider);
  const resolvedModel = model || providerDef?.defaultModel || "openai/gpt-4o-mini";
  const encryptedKey = encrypt(apiKey);

  const saved = await prisma.aiProviderConfig.upsert({
    where: { userId: auth.sub },
    update: { provider, apiKey: encryptedKey, model: resolvedModel },
    create: { userId: auth.sub, provider, apiKey: encryptedKey, model: resolvedModel },
  });

  return NextResponse.json({
    status: "success",
    data: {
      id: saved.id,
      provider: saved.provider,
      model: saved.model,
      apiKeyMasked: maskKey(apiKey),
      hasKey: true,
      updatedAt: saved.updatedAt,
    },
  });
}

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  await prisma.aiProviderConfig.delete({ where: { userId: auth.sub } }).catch(() => null);

  return NextResponse.json({ status: "success" });
}
