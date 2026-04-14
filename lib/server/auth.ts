import crypto from "crypto";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

function getJwtSecret() {
  return process.env.JWT_SECRET || "autotrader-dev-secret";
}

type TokenPayload = {
  sub: string;
  email: string;
  displayName: string;
  role: string;
};

export function issueToken(user: { id: string; email: string; displayName: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, displayName: user.displayName, role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" },
  );
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAuthUser(): Promise<TokenPayload | null> {
  const headerList = await headers();
  const authHeader = headerList.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
