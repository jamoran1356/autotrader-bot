import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/server/prisma";
import { issueToken, hashToken } from "@/lib/server/auth";

/**
 * POST /api/auth/wallet
 *
 * Authenticate (or auto-register) using a wallet address.
 * If the wallet has been seen before, log in.
 * Otherwise, create a new user linked to that wallet.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { walletAddress, chain } = body;

  if (!walletAddress || typeof walletAddress !== "string" || walletAddress.length < 10) {
    return NextResponse.json({ error: "valid walletAddress is required" }, { status: 400 });
  }

  const normalizedAddress = walletAddress.toLowerCase();
  const chainLabel = chain || "evm";

  // Look for existing user by wallet
  let user = await prisma.user.findFirst({
    where: { walletAddress: { contains: normalizedAddress, mode: "insensitive" } },
  });

  if (!user) {
    // Auto-register with wallet
    const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    // Generate a random password hash (user won't use password auth)
    const dummyHash = crypto.randomBytes(32).toString("hex");

    user = await prisma.user.create({
      data: {
        email: `${normalizedAddress.slice(2, 10)}-${randomSuffix}@wallet.autotrader.bot`,
        displayName: `${chainLabel}:${shortAddr}`,
        passwordHash: dummyHash,
        walletAddress: `${chainLabel}:${normalizedAddress}`,
      },
    });
  }

  const token = issueToken(user);
  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({
    status: "success",
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    },
  });
}
