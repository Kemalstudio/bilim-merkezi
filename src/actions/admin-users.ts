"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";

export async function updateUserRoleAction(userId: string, role: Role) {
  const admin = await requireRole("ADMIN");
  if (admin.id === userId) {
    return { error: "Нельзя изменить свою собственную роль" };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAction(admin.id, "user.role_changed", "user", userId, { role });
  revalidatePath("/admin/users");
}
