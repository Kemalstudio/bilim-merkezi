"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { getUiDictionary, issueText } from "@/lib/i18n/ui";

export type AdminLoginState = { error?: string } | undefined;

const ADMIN_HOME = "/bilim/admin";
const INVALID_CREDENTIALS = "Неверный email или пароль";
// The admin panel is Russian-only.
const ADMIN_TEXTS = getUiDictionary("ru");

export async function adminLoginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const ip = await getClientIp();
  if (!(await rateLimit(`admin-login:${ip}`, 8, 60_000)).success) {
    return { error: "Слишком много попыток. Попробуйте через минуту." };
  }

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { error: issueText(ADMIN_TEXTS, parsed.error.issues) };
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Checked before signing in, so a parent's correct password never opens a session from
  // this form. The message stays the same either way, so it does not reveal who is staff.
  const user = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true, role: true } });
  const passwordMatches = user?.passwordHash ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !passwordMatches || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return { error: INVALID_CREDENTIALS };
  }

  const callbackUrl = formData.get("callbackUrl");
  const redirectTo = safeCallbackUrl(callbackUrl, ADMIN_HOME, ADMIN_HOME);

  try {
    await signIn("credentials", { login: email, password: parsed.data.password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return { error: INVALID_CREDENTIALS };
    throw error;
  }
}

export async function adminSignOutAction() {
  await signOut({ redirectTo: "/bilim/admin/login" });
}
