import "server-only";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { isDeletedEmail } from "@/lib/account";
import { actionEmailHtml, sendMail } from "@/lib/mail";
import { tpl } from "@/lib/i18n/format";
import { rateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import type { Ui } from "@/lib/i18n/ui/types";

/** A link the parent asked for by email: short, since the mailbox may be shared. */
export const EMAIL_RESET_TTL_MS = 60 * 60_000;
/** A link an admin hands over in person or by messenger: long enough to reach the parent. */
export const ADMIN_RESET_TTL_MS = 24 * 60 * 60_000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function resetUrl(token: string): string {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
}

/**
 * Makes a new reset link for the account. Any earlier link still outstanding is burned, so
 * only the newest one in the mailbox works.
 */
export async function createResetToken(userId: string, ttlMs: number, createdById?: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + ttlMs), createdById },
    }),
  ]);
  return token;
}

/** The account a link opens, or null when the link is unknown, used, expired or the account is gone. */
export async function findResetAccount(token: string) {
  if (!token || token.length > 128) return null;
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      usedAt: true,
      expiresAt: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!row || row.usedAt || row.expiresAt <= new Date() || isDeletedEmail(row.user.email)) return null;
  return row.user;
}

/**
 * Spends the link and sets the new password, all or nothing. The link is claimed with a
 * conditional update, so two tabs submitting at once cannot both use it.
 */
export async function redeemResetToken(token: string, password: string) {
  const account = await findResetAccount(token);
  if (!account) return null;

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { tokenHash: hashToken(token), usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count === 0) return null;
    await tx.user.update({ where: { id: account.id }, data: { passwordHash, passwordChangedAt: now } });
    return account;
  });
}

/** Sends the reset link in the given language; false when the mail server refused it. */
export async function sendResetEmail(
  t: Ui,
  to: string,
  name: string | null,
  url: string,
  validFor: "hour" | "day"
): Promise<boolean> {
  const greeting = tpl(t.mail.resetGreeting, { name: name?.trim() || to });
  const intro = tpl(t.mail.resetIntro, { hours: t.mail[validFor] });
  const result = await sendMail({
    to,
    subject: t.mail.resetSubject,
    text: [greeting, "", intro, "", url, "", t.mail.resetIgnore, "", t.mail.resetFooter].join("\n"),
    html: actionEmailHtml({
      heading: t.mail.resetHeading,
      paragraphs: [greeting, intro],
      buttonLabel: t.mail.resetAction,
      buttonUrl: url,
      footer: `${t.mail.resetIgnore} ${t.mail.resetFooter}`,
    }),
  });
  return result.ok;
}

/**
 * "Forgot password" by email, for the website and the app alike. The outcome is "sent" whether
 * or not the address has an account, so callers cannot reveal who is registered.
 */
export async function requestEmailReset(t: Ui, email: string): Promise<"sent" | "rate-limited" | "mail-failed"> {
  // A mailbox gets a few letters an hour at most, whoever keeps pressing the button.
  if (!(await rateLimit(`reset-email-to:${email}`, 3, 60 * 60_000)).success) return "rate-limited";

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (!user || isDeletedEmail(user.email)) return "sent";

  const token = await createResetToken(user.id, EMAIL_RESET_TTL_MS);
  if (!(await sendResetEmail(t, email, user.name, resetUrl(token), "hour"))) return "mail-failed";
  await logAction(user.id, "auth.reset_link_sent", "user", user.id, { via: "email" });
  return "sent";
}
