import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthUser } from "@/lib/server/auth";

export async function PATCH(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const { walletAddress } = await request.json();

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.sub },
    data: { walletAddress },
    select: { id: true, email: true, displayName: true, role: true, walletAddress: true },
  });

  return NextResponse.json({ status: "success", data: user });
}
