"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { isSmsSimulated } from "@/lib/sms";
import { maskPhone } from "@/lib/phone";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";
import { tpl } from "@/lib/i18n/format";
import { requestOtpSchema, resetPasswordSchema, verifyOtpSchema } from "@/lib/validations/phone-auth";

export type RequestOtpState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "sent"; phone: string; maskedPhone: string; simulated: boolean }
  | undefined;

export async function requestOtpAction(_prev: RequestOtpState, formData: FormData): Promise<RequestOtpState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`otp-request:${await getClientIp()}`, 5, 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }

  const parsed = requestOtpSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { status: "error", error: issueText(t, parsed.error.issues) };
  }

  const purpose = formData.get("purpose") === "recovery" ? "RECOVERY" : "LOGIN";
  const { phone } = parsed.data;
  const sent = { status: "sent" as const, phone, maskedPhone: maskPhone(phone), simulated: isSmsSimulated };

  // Every SMS costs money, so one number gets at most a handful per hour whatever the source.
  if (!(await rateLimit(`otp-phone:${phone}`, 5, 60 * 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }

  if (purpose === "RECOVERY") {
    const account = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    // Deliberately does not reveal whether the number is registered.
    if (!account) return sent;
  }

  const result = await issueOtp(phone, purpose, t.sms.code);
  if (!result.ok) {
    return { status: "error", error: tpl(t.errors.codeCooldown, { seconds: result.retryInSeconds }) };
  }
  return sent;
}

export type VerifyOtpState = { error?: string } | undefined;

export async function verifyOtpAction(_prev: VerifyOtpState, formData: FormData): Promise<VerifyOtpState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`otp-verify:${await getClientIp()}`, 10, 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    name: String(formData.get("name") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  try {
    await signIn("phone-otp", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl"), "/account"),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.errors.codeInvalid };
    throw error;
  }
}

export type ResetPasswordState = { error?: string; success?: boolean } | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`password-reset:${await getClientIp()}`, 10, 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = resetPasswordSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  const result = await verifyOtp(parsed.data.phone, "RECOVERY", parsed.data.code);
  if (!result.ok) {
    return { error: result.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid };
  }

  const account = await prisma.user.findUnique({ where: { phone: parsed.data.phone }, select: { id: true } });
  if (!account) {
    return { error: t.errors.accountNotFound };
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });
  return { success: true };
}
