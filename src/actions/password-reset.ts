"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { realEmail } from "@/lib/phone";
import { isMailSimulated } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { redeemResetToken, requestEmailReset } from "@/lib/password-reset";
import { emailField, newPasswordField } from "@/lib/validations/auth";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";

export type ResetEmailState =
  | { status: "error"; error: string }
  | { status: "sent"; email: string; simulated: boolean };

/**
 * "Forgot password" by email. The answer is the same whether or not the address has an
 * account, so the form cannot be used to find out who is registered.
 */
export async function requestPasswordResetEmailAction(formData: FormData): Promise<ResetEmailState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`reset-email:${await getClientIp()}`, 5, 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }

  const parsed = emailField.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", error: issueText(t, parsed.error.issues) };
  const email = parsed.data;

  const outcome = await requestEmailReset(t, email);
  if (outcome === "rate-limited") return { status: "error", error: t.errors.tooManyRequests };
  if (outcome === "mail-failed") return { status: "error", error: t.errors.mailUnavailable };
  return { status: "sent", email, simulated: isMailSimulated };
}

export type ResetWithLinkState = { error?: string } | undefined;

const resetWithLinkSchema = z
  .object({
    token: z.string().min(1).max(128),
    password: newPasswordField,
    confirmPassword: z.string({ error: "passwordMismatch" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

/** The page behind the link: sets the new password, spends the link and signs the parent in. */
export async function resetPasswordWithLinkAction(_prev: ResetWithLinkState, formData: FormData): Promise<ResetWithLinkState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`reset-link:${await getClientIp()}`, 10, 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = resetWithLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: issueText(t, parsed.error.issues) };

  const account = await redeemResetToken(parsed.data.token, parsed.data.password);
  if (!account) return { error: t.errors.resetLinkInvalid };
  await logAction(account.id, "auth.password_reset", "user", account.id, { via: "link" });

  const login = realEmail(account.email) ?? account.phone;
  if (!login) return { error: t.errors.autoLoginFailed };
  try {
    await signIn("credentials", { login, password: parsed.data.password, redirectTo: "/account" });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.errors.autoLoginFailed };
    throw error;
  }
}
