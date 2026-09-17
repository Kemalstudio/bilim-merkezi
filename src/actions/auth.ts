"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { credentialsSchema, registerSchema } from "@/lib/validations/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";

export type ActionState = { error?: string } | undefined;

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const ip = await getClientIp();
  if (!(await rateLimit(`register:${ip}`, 5, 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"), "/account");

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: t.errors.emailTaken };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
  });

  try {
    await signIn("credentials", { login: parsed.data.email, password: parsed.data.password, redirectTo });
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
