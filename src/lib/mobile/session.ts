import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { isDeletedEmail } from "@/lib/account";

/** A phone stays signed in for half a year of use; every day of activity pushes it forward. */
const SESSION_TTL_MS = 180 * 24 * 60 * 60_000;
const TOUCH_EVERY_MS = 24 * 60 * 60_000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type MobileUser = { id: string; sessionId: string };

export async function createMobileSession(userId: string, device: string | null): Promise<string> {
  const token = `bm_${randomBytes(32).toString("base64url")}`;
  await prisma.mobileSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      device: device?.slice(0, 120) || null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(bm_[A-Za-z0-9_-]{20,100})$/.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * The account behind the request's bearer token, or null. A session dies with the account,
 * with a password reset made after it signed in, and on expiry or sign-out.
 */
export async function authenticateMobile(request: Request): Promise<MobileUser | null> {
  const token = bearer(request);
  if (!token) return null;

  const session = await prisma.mobileSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { id: true, email: true, passwordChangedAt: true } },
    },
  });
  const now = new Date();
  if (!session || session.revokedAt || session.expiresAt <= now) return null;
  if (isDeletedEmail(session.user.email)) return null;
  if (session.user.passwordChangedAt && session.user.passwordChangedAt > session.createdAt) return null;

  if (now.getTime() - session.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
    await prisma.mobileSession.update({
      where: { id: session.id },
      data: { lastUsedAt: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) },
    });
  }
  return { id: session.user.id, sessionId: session.id };
}

export async function revokeMobileSession(sessionId: string) {
  await prisma.mobileSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
}
