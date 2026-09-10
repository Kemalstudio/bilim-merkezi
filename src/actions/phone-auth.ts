"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";
import { isSmsSimulated } from "@/lib/sms";
import { maskPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import {
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "@/lib/validations/phone-auth";

export type RequestOtpState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "sent"; phone: string; maskedPhone: string; simulated: boolean }
  | undefined;

async function clientKey() {
  return (await headers()).get("x-forwarded-for") ?? "unknown";
}

export async function requestOtpAction(
  _prev: RequestOtpState,
  formData: FormData
): Promise<RequestOtpState> {
  if (!rateLimit(`otp-request:${await clientKey()}`, 5, 60_000).success) {
    return { status: "error", error: "Слишком много запросов. Попробуйте через минуту." };
  }

  const parsed = requestOtpSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Проверьте номер телефона",
    };
  }

  const purpose = formData.get("purpose") === "recovery" ? "RECOVERY" : "LOGIN";
  const { phone } = parsed.data;

  if (purpose === "RECOVERY") {
    const account = await prisma.user.findUnique({ where: { phone } });
    // Deliberately does not reveal whether the number is registered.
    if (!account) {
      return {
        status: "sent",
        phone,
        maskedPhone: maskPhone(phone),
        simulated: isSmsSimulated,
      };
    }
  }

  const result = await issueOtp(phone, purpose);
  if (!result.ok) {
    return {
      status: "error",
      error: `Код уже отправлен. Запросить новый можно через ${result.retryInSeconds} с.`,
    };
  }

  return { status: "sent", phone, maskedPhone: maskPhone(phone), simulated: isSmsSimulated };
}

export type VerifyOtpState = { error?: string } | undefined;

export async function verifyOtpAction(
  _prev: VerifyOtpState,
  formData: FormData
): Promise<VerifyOtpState> {
  if (!rateLimit(`otp-verify:${await clientKey()}`, 10, 60_000).success) {
    return { error: "Слишком много попыток. Попробуйте через минуту." };
  }

  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    name: (formData.get("name") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте введённый код" };
  }

  const callbackUrl = formData.get("callbackUrl");
  const redirectTo =
    typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/account";

  try {
    await signIn("phone-otp", { ...parsed.data, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный или истёкший код. Запросите новый." };
    }
    throw error;
  }
}

export type ResetPasswordState = { error?: string; success?: boolean } | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  if (!rateLimit(`password-reset:${await clientKey()}`, 10, 60_000).success) {
    return { error: "Слишком много попыток. Попробуйте через минуту." };
  }

  const parsed = resetPasswordSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте введённые данные" };
  }

  const { verifyOtp } = await import("@/lib/otp");
  const result = await verifyOtp(parsed.data.phone, "RECOVERY", parsed.data.code);
  if (!result.ok) {
    return {
      error:
        result.reason === "locked"
          ? "Слишком много неверных попыток. Запросите новый код."
          : "Неверный или истёкший код. Запросите новый.",
    };
  }

  const account = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
  if (!account) {
    return { error: "Аккаунт с этим номером не найден." };
  }

  await prisma.user.update({
    where: { id: account.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });

  return { success: true };
}
