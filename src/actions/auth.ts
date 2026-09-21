"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { confirmRegistrationSchema, credentialsSchema, registerSchema } from "@/lib/validations/auth";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { isSmsSimulated } from "@/lib/sms";
import { maskPhone, placeholderEmail } from "@/lib/phone";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";
import { tpl } from "@/lib/i18n/format";
import type { Ui } from "@/lib/i18n/ui/types";

export type ActionState = { error?: string } | undefined;

export type RegistrationCodeState =
  | { status: "error"; error: string }
  | { status: "sent"; phone: string; maskedPhone: string; simulated: boolean };

/** Neither the number nor the email may already belong to someone; null when both are free. */
async function registrationConflict(t: Ui, phone: string, email: string | undefined): Promise<string | null> {
  if (await prisma.user.findUnique({ where: { phone }, select: { id: true } })) return t.errors.phoneTaken;
  if (email && (await prisma.user.findUnique({ where: { email }, select: { id: true } }))) return t.errors.emailTaken;
  return null;
}

/**
 * Registration, step one: check the details and text a confirmation code to the number.
 * Nothing is created yet — the account only exists once the code comes back.
 */
export async function requestRegistrationCodeAction(formData: FormData): Promise<RegistrationCodeState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`register:${await getClientIp()}`, 5, 60_000)).success) {
    return { status: "error", error: t.errors.tooManyAttempts };
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: issueText(t, parsed.error.issues) };

  const { phone, email } = parsed.data;
  const conflict = await registrationConflict(t, phone, email);
  if (conflict) return { status: "error", error: conflict };

  // Every SMS costs money, so one number gets at most a handful per hour whatever the source.
  if (!(await rateLimit(`otp-phone:${phone}`, 5, 60 * 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }

  const issued = await issueOtp(phone, "REGISTER", t.sms.register);
  if (!issued.ok) {
    if (issued.reason === "unavailable") return { status: "error", error: t.errors.smsUnavailable };
    return { status: "error", error: tpl(t.errors.codeCooldown, { seconds: issued.retryInSeconds }) };
  }
  return { status: "sent", phone, maskedPhone: maskPhone(phone), simulated: isSmsSimulated };
}

/** Registration, step two: redeem the SMS code, create the account and sign in. */
export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`register-confirm:${await getClientIp()}`, 10, 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = confirmRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }
  const { name, phone, email, password, code } = parsed.data;

  const verified = await verifyOtp(phone, "REGISTER", code);
  if (!verified.ok) {
    return { error: verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid };
  }

  // Re-checked: someone could have taken the number or email while the SMS was in flight.
  const conflict = await registrationConflict(t, phone, email);
  if (conflict) return { error: conflict };

  await prisma.user.create({
    data: {
      name,
      phone,
      // Auth.js needs a unique email; without one the account gets the internal placeholder.
      email: email ?? placeholderEmail(phone),
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"), "/account");
  try {
    await signIn("credentials", { login: phone, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.errors.autoLoginFailed };
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl"), "/account") });
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const ip = await getClientIp();
  if (!(await rateLimit(`login:${ip}`, 10, 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = credentialsSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  // Per account as well as per address: guessing one parent's password from many IPs stalls too.
  const account = "email" in parsed.data.login ? parsed.data.login.email : parsed.data.login.phone;
  if (!(await rateLimit(`login-account:${account}`, 10, 15 * 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  try {
    await signIn("credentials", {
      login: account,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl"), "/account"),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.errors.invalidCredentials };
    throw error;
  }
}
