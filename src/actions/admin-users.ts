"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { isDeletedEmail } from "@/lib/account";
import { realEmail } from "@/lib/phone";
import { isMailSimulated } from "@/lib/mail";
import { ADMIN_RESET_TTL_MS, createResetToken, resetUrl, sendResetEmail } from "@/lib/password-reset";
import { getI18n } from "@/lib/i18n/server";

export async function updateUserRoleAction(userId: string, role: Role) {
  const admin = await requireRole("ADMIN");
  if (admin.id === userId) {
    return { error: "Нельзя изменить свою собственную роль" };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAction(admin.id, "user.role_changed", "user", userId, { role });
  revalidatePath("/bilim/admin/users");
}

export type ResetLinkResult =
  | { error: string }
  | { url: string; emailedTo: string | null; emailFailed: boolean; emailSimulated: boolean };

/**
 * Makes a one-time "set a new password" link for a parent who is locked out — e.g. an
 * email-only account with no phone for SMS recovery. The link is emailed when the account has
 * a real address, and always shown to the admin to pass on by phone or messenger.
 */
export async function createPasswordResetLinkAction(userId: string): Promise<ResetLinkResult> {
  const admin = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user || isDeletedEmail(user.email)) return { error: "Пользователь не найден или удалён" };

  const token = await createResetToken(user.id, ADMIN_RESET_TTL_MS, admin.id);
  const url = resetUrl(token);
  const emailedTo = realEmail(user.email);
  let emailFailed = false;
  if (emailedTo) {
    const { t } = await getI18n();
    emailFailed = !(await sendResetEmail(t, emailedTo, user.name, url, "day"));
  }
  await logAction(admin.id, "user.reset_link_created", "user", user.id, { emailed: Boolean(emailedTo) && !emailFailed });
  return { url, emailedTo, emailFailed, emailSimulated: isMailSimulated };
}
