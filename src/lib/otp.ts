import "server-only";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import type { OtpPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { gatewaySendOtp, gatewayVerifyOtp, isOtpGatewayEnabled } from "@/lib/otp-gateway";
import { tpl } from "@/lib/i18n/format";
import { OTP_LENGTH, OTP_TTL_MS, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp-constants";

export { OTP_LENGTH, OTP_TTL_MS };
/** Wrong guesses allowed before a code is burned and must be re-requested. */
export const OTP_MAX_ATTEMPTS = 5;
/** A new code cannot be requested for the same number more often than this. */
export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;

export type IssueResult =
  | { ok: true; expiresAt: Date }
  | { ok: false; reason: "cooldown"; retryInSeconds: number }
  | { ok: false; reason: "unavailable" };

function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

/**
 * Issues a one-time code for `phone` and sends it by SMS; `messageTemplate` is the SMS text in
 * the visitor's language with `{code}` and `{minutes}` placeholders.
 *
 * Any code still outstanding for the same number and purpose is consumed first,
 * so only the newest code can ever be redeemed.
 *
 * With the OTP gateway enabled the gateway generates the code and substitutes it
 * into our text, and we only keep its `otp_id`.
 */
export async function issueOtp(phone: string, purpose: OtpPurpose, messageTemplate: string): Promise<IssueResult> {
  const now = new Date();

  const recent = await prisma.phoneOtp.findFirst({
    where: { phone, purpose, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const elapsed = now.getTime() - recent.createdAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "cooldown",
        retryInSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  if (isOtpGatewayEnabled) {
    const sent = await gatewaySendOtp(phone, tpl(messageTemplate, { minutes: OTP_TTL_MS / 60_000 }));
    if (!sent.ok) {
      return sent.reason === "rate_limited"
        ? { ok: false, reason: "cooldown", retryInSeconds: sent.retryInSeconds }
        : { ok: false, reason: "unavailable" };
    }

    await prisma.phoneOtp.updateMany({
      where: { phone, purpose, consumedAt: null },
      data: { consumedAt: now },
    });
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    await prisma.phoneOtp.create({ data: { phone, purpose, gatewayOtpId: sent.otpId, expiresAt } });
    return { ok: true, expiresAt };
  }

  await prisma.phoneOtp.updateMany({
    where: { phone, purpose, consumedAt: null },
    data: { consumedAt: now },
  });

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await prisma.phoneOtp.create({
    data: { phone, purpose, codeHash: await bcrypt.hash(code, 10), expiresAt },
  });

  await sendSms({
    to: phone,
    text: tpl(messageTemplate, { code, minutes: OTP_TTL_MS / 60_000 }),
  });

  return { ok: true, expiresAt };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "locked" };

/**
 * Checks a submitted code and, on success, consumes it so it cannot be reused.
 * Wrong guesses are counted; passing the limit burns the code.
 */
export async function verifyOtp(
  phone: string,
  purpose: OtpPurpose,
  code: string
): Promise<VerifyResult> {
  const now = new Date();
  const record = await prisma.phoneOtp.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt <= now) return { ok: false, reason: "expired" };
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: now } });
    return { ok: false, reason: "locked" };
  }

  if (record.gatewayOtpId) {
    const result = await gatewayVerifyOtp(record.gatewayOtpId, code);
    if (result.ok) {
      await prisma.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: now } });
      return { ok: true };
    }
    if (result.reason === "invalid") {
      await prisma.phoneOtp.update({ where: { id: record.id }, data: { attempts: record.attempts + 1 } });
      return { ok: false, reason: "invalid" };
    }
    await prisma.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: now } });
    return { ok: false, reason: result.reason };
  }

  if (!record.codeHash || !(await bcrypt.compare(code, record.codeHash))) {
    const attempts = record.attempts + 1;
    await prisma.phoneOtp.update({
      where: { id: record.id },
      data: { attempts, ...(attempts >= OTP_MAX_ATTEMPTS ? { consumedAt: now } : {}) },
    });
    return { ok: false, reason: attempts >= OTP_MAX_ATTEMPTS ? "locked" : "invalid" };
  }

  await prisma.phoneOtp.update({ where: { id: record.id }, data: { consumedAt: now } });
  return { ok: true };
}
