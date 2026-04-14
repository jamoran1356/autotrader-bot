import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, email: true, displayName: true, role: true, walletAddress: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  return NextResponse.json({ status: "success", data: user });
}
