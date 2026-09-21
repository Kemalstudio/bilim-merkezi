"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { signOut, updateSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { isSmsSimulated } from "@/lib/sms";
import { maskPhone } from "@/lib/phone";
import { deletedEmail } from "@/lib/account";
import { rateLimit } from "@/lib/rate-limit";
import { getI18n } from "@/lib/i18n/server";
import { issueText, type Ui } from "@/lib/i18n/ui";
import { tpl } from "@/lib/i18n/format";
import {
  changeEmailSchema,
  confirmPhoneChangeSchema,
  deleteAccountSchema,
  requestPhoneChangeSchema,
  setPasswordSchema,
} from "@/lib/validations/profile";
import { otpCodeField } from "@/lib/validations/auth";

export type SettingsState = { error?: string; success?: string } | undefined;

export type CodeRequestState =
  | { status: "error"; error: string }
  | { status: "sent"; maskedPhone: string; simulated: boolean }
  /** Nothing to confirm by SMS: the account has no phone number to send it to. */
  | { status: "not-needed" };

/** Everything the actions need to know about the signed-in person, read fresh from the database. */
async function currentAccount() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { id: true, role: true, email: true, phone: true, passwordHash: true },
  });
  return user;
}

/** For changes that could hand the account to someone else: prove it with the current password. */
async function passwordProof(passwordHash: string | null, supplied: string | undefined, t: Ui): Promise<string | null> {
  if (!passwordHash) return null;
  if (!supplied) return t.errors.currentPasswordRequired;
  return (await bcrypt.compare(supplied, passwordHash)) ? null : t.errors.currentPasswordWrong;
}

/** Sends a settings code, with limits that hold whatever the number: SMS costs money. */
async function sendCode(userId: string, phone: string, purpose: "PHONE_CHANGE" | "PASSWORD_SET" | "ACCOUNT_DELETE", template: string, t: Ui): Promise<CodeRequestState> {
  if (!(await rateLimit(`settings-code:${userId}`, 6, 60 * 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }
  const issued = await issueOtp(phone, purpose, template);
  if (!issued.ok) {
    if (issued.reason === "unavailable") return { status: "error", error: t.errors.smsUnavailable };
    return { status: "error", error: tpl(t.errors.codeCooldown, { seconds: issued.retryInSeconds }) };
  }
  return { status: "sent", maskedPhone: maskPhone(phone), simulated: isSmsSimulated };
}

/** The visible fields stay in sync with the database without a full sign-out. */
async function refreshSession(user: { name?: string | null; email?: string | null; image?: string | null }) {
  try {
    await updateSession({ user });
  } catch {
    // The header catches up within minutes anyway (see the role re-check in the jwt callback).
  }
}

/* ── email ────────────────────────────────────────────────────────────────────────── */

export async function changeEmailAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { t } = await getI18n();
  const account = await currentAccount();
  if (!(await rateLimit(`settings-email:${account.id}`, 10, 60 * 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email"),
    currentPassword: String(formData.get("currentPassword") ?? "") || undefined,
  });
  if (!parsed.success) return { error: issueText(t, parsed.error.issues) };

  if (parsed.data.email === account.email) return { error: t.errors.emailSame };
  const proof = await passwordProof(account.passwordHash, parsed.data.currentPassword, t);
  if (proof) return { error: proof };

  if (await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })) {
    return { error: t.errors.emailTaken };
  }

  await prisma.user.update({ where: { id: account.id }, data: { email: parsed.data.email, emailVerified: null } });
  await logAction(account.id, "auth.email_changed", "user", account.id);
  await refreshSession({ email: parsed.data.email });
  revalidatePath("/account/settings");
  return { success: t.errors.emailUpdated };
}

/* ── phone ────────────────────────────────────────────────────────────────────────── */

/** Step one of changing the number: text a code to the NEW number. */
export async function requestPhoneChangeCodeAction(formData: FormData): Promise<CodeRequestState> {
  const { t } = await getI18n();
  const account = await currentAccount();

  const parsed = requestPhoneChangeSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) return { status: "error", error: issueText(t, parsed.error.issues) };
  if (parsed.data.phone === account.phone) return { status: "error", error: t.errors.phoneSame };

  const proof = await passwordProof(account.passwordHash, String(formData.get("currentPassword") ?? "") || undefined, t);
  if (proof) return { status: "error", error: proof };

  if (await prisma.user.findUnique({ where: { phone: parsed.data.phone }, select: { id: true } })) {
    return { status: "error", error: t.errors.phoneTaken };
  }
  return sendCode(account.id, parsed.data.phone, "PHONE_CHANGE", t.sms.phoneChange, t);
}

/** Step two: the code from that SMS proves the number is theirs. */
export async function confirmPhoneChangeAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { t } = await getI18n();
  const account = await currentAccount();
  if (!(await rateLimit(`settings-phone:${account.id}`, 10, 60 * 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = confirmPhoneChangeSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    currentPassword: String(formData.get("currentPassword") ?? "") || undefined,
  });
  if (!parsed.success) return { error: issueText(t, parsed.error.issues) };

  const proof = await passwordProof(account.passwordHash, parsed.data.currentPassword, t);
  if (proof) return { error: proof };

  const verified = await verifyOtp(parsed.data.phone, "PHONE_CHANGE", parsed.data.code);
  if (!verified.ok) return { error: verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid };

  // Someone may have registered the number while the SMS was on its way.
  if (await prisma.user.findFirst({ where: { phone: parsed.data.phone, NOT: { id: account.id } }, select: { id: true } })) {
    return { error: t.errors.phoneTaken };
  }

  await prisma.user.update({ where: { id: account.id }, data: { phone: parsed.data.phone } });
  await logAction(account.id, "auth.phone_changed", "user", account.id);
  revalidatePath("/account/settings");
  return { success: t.errors.phoneUpdated };
}

/* ── password ─────────────────────────────────────────────────────────────────────── */

/** Texts a code to the account's own number for setting a password or deleting the account. */
export async function requestSecurityCodeAction(purpose: "PASSWORD_SET" | "ACCOUNT_DELETE"): Promise<CodeRequestState> {
  const { t } = await getI18n();
  const account = await currentAccount();
  if (!account.phone) return { status: "not-needed" };
  const template = purpose === "PASSWORD_SET" ? t.sms.passwordSet : t.sms.accountDelete;
  return sendCode(account.id, account.phone, purpose, template, t);
}

/** A first password for an account that signed up by SMS or Google. */
export async function setPasswordAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { t } = await getI18n();
  const account = await currentAccount();
  if (!(await rateLimit(`settings-password:${account.id}`, 10, 60 * 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }
  if (account.passwordHash) return { error: t.errors.passwordAlreadySet };

  const parsed = setPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
    code: String(formData.get("code") ?? "") || undefined,
  });
  if (!parsed.success) return { error: issueText(t, parsed.error.issues) };

  // A session alone must not be enough to add a way in: the number's owner confirms it too.
  if (account.phone) {
    const code = otpCodeField.safeParse(parsed.data.code);
    if (!code.success) return { error: t.errors.codeRequired };
    const verified = await verifyOtp(account.phone, "PASSWORD_SET", code.data);
    if (!verified.ok) return { error: verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid };
  }

  await prisma.user.update({ where: { id: account.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  await logAction(account.id, "auth.password_set", "user", account.id);
  revalidatePath("/account/settings");
  return { success: t.errors.passwordSet };
}

/* ── delete account ───────────────────────────────────────────────────────────────── */

/**
 * Deletes the account the way a shop with a ledger has to: the person disappears, the books do
 * not. Name, contacts, password, sign-in links and children's profiles are erased; payments and
 * enrolments stay, attached to an anonymous row, because they are financial records.
 */
export async function deleteAccountAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { t } = await getI18n();
  const account = await currentAccount();
  if (!(await rateLimit(`settings-delete:${account.id}`, 5, 60 * 60_000)).success) {
    return { error: t.errors.tooManyAttempts };
  }

  const parsed = deleteAccountSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? "") || undefined,
    code: String(formData.get("code") ?? "") || undefined,
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: issueText(t, parsed.error.issues) };

  if (account.role !== "STUDENT") return { error: t.errors.staffCannotDelete };

  if (account.passwordHash) {
    const proof = await passwordProof(account.passwordHash, parsed.data.currentPassword, t);
    if (proof) return { error: proof };
  } else if (account.phone) {
    const code = otpCodeField.safeParse(parsed.data.code);
    if (!code.success) return { error: t.errors.codeRequired };
    const verified = await verifyOtp(account.phone, "ACCOUNT_DELETE", code.data);
    if (!verified.ok) return { error: verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid };
  }

  if (await prisma.enrollment.count({ where: { userId: account.id, status: "ACTIVE" } })) {
    return { error: t.errors.hasActiveEnrollments };
  }

  await prisma.$transaction([
    prisma.enrollment.updateMany({ where: { userId: account.id, status: "PENDING" }, data: { status: "CANCELLED" } }),
    prisma.child.deleteMany({ where: { parentId: account.id } }),
    prisma.account.deleteMany({ where: { userId: account.id } }),
    prisma.session.deleteMany({ where: { userId: account.id } }),
    prisma.user.update({
      where: { id: account.id },
      data: {
        name: null,
        email: deletedEmail(account.id),
        emailVerified: null,
        phone: null,
        image: null,
        passwordHash: null,
      },
    }),
  ]);
  await logAction(account.id, "account.deleted", "user", account.id);

  try {
    await signOut({ redirectTo: "/?account=deleted" });
  } catch (error) {
    if (error instanceof AuthError) return { error: t.errors.generic };
    throw error;
  }
}
