import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { issueToken, hashToken } from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, displayName } = body;

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: "email, password and displayName are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, displayName, passwordHash },
  });

  const token = issueToken(user);
  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(
    {
      status: "success",
      data: {
        token,
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      },
    },
    { status: 201 },
  );
}
