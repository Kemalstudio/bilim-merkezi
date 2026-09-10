"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { childSchema } from "@/lib/validations/child";

export type ChildActionState = { error?: string; success?: boolean; childId?: string } | undefined;

function parseChildForm(formData: FormData) {
  return childSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    grade: formData.get("grade") ?? undefined,
    notes: (formData.get("notes") as string | null)?.trim() || null,
  });
}

/**
 * Ownership check used by every child-scoped read and write. Looking a child up
 * by id *and* parentId means a forged id from another parent simply misses.
 */
async function findOwnedChild(childId: string, parentId: string) {
  return prisma.child.findFirst({ where: { id: childId, parentId } });
}

export async function createChildAction(
  _prev: ChildActionState,
  formData: FormData
): Promise<ChildActionState> {
  const user = await requireUser();
  const parsed = parseChildForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const siblings = await prisma.child.count({ where: { parentId: user.id } });
  if (siblings >= 10) {
    return { error: "Достигнут лимит профилей детей в одном аккаунте." };
  }

  const child = await prisma.child.create({
    data: {
      ...parsed.data,
      parentId: user.id,
      // Spreads sibling avatars around the colour wheel so cards stay distinct.
      avatarHue: (siblings * 67) % 360,
    },
  });

  // A newly added child immediately has exam results if the centre already
  // recorded any against the parent's phone.
  if (user.id) {
    const parent = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true },
    });
    if (parent?.phone) {
      await prisma.examResult.updateMany({
        where: {
          phone: parent.phone,
          childId: null,
          studentName: { contains: parsed.data.firstName, mode: "insensitive" },
        },
        data: { childId: child.id },
      });
    }
  }

  revalidatePath("/account");
  revalidatePath("/account/children");
  return { success: true, childId: child.id };
}

export async function updateChildAction(
  childId: string,
  _prev: ChildActionState,
  formData: FormData
): Promise<ChildActionState> {
  const user = await requireUser();
  const existing = await findOwnedChild(childId, user.id);
  if (!existing) return { error: "Профиль ребёнка не найден" };

  const parsed = parseChildForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  await prisma.child.update({ where: { id: existing.id }, data: parsed.data });

  revalidatePath("/account");
  revalidatePath("/account/children");
  revalidatePath(`/account/children/${childId}`);
  return { success: true, childId };
}

export async function deleteChildAction(childId: string): Promise<ChildActionState> {
  const user = await requireUser();
  const existing = await findOwnedChild(childId, user.id);
  if (!existing) return { error: "Профиль ребёнка не найден" };

  const activeEnrollments = await prisma.enrollment.count({
    where: { childId: existing.id, status: "ACTIVE" },
  });
  if (activeEnrollments > 0) {
    return { error: "Нельзя удалить профиль с активными записями на курсы." };
  }

  await prisma.child.delete({ where: { id: existing.id } });

  revalidatePath("/account");
  revalidatePath("/account/children");
  return { success: true };
}
