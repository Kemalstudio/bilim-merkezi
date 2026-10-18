import "server-only";

import { prisma } from "@/lib/prisma";
import type { ChildInput } from "@/lib/validations/child";

/*
 * Writes to a parent's children, shared by the website's server actions and the mobile API.
 * Every lookup is by id *and* parentId, so a forged id from another parent simply misses.
 * Failures are `errors` keys of the UI dictionary, for the caller to put in the parent's language.
 */

export const MAX_CHILDREN = 10;

type Failure = { error: "childLimit" | "childNotFound" | "childHasActive" };

export async function createChild(parentId: string, data: ChildInput): Promise<{ id: string } | Failure> {
  const siblings = await prisma.child.count({ where: { parentId } });
  if (siblings >= MAX_CHILDREN) return { error: "childLimit" };

  const child = await prisma.child.create({
    // Spreads sibling avatars around the colour wheel so cards stay distinct.
    data: { ...data, parentId, avatarHue: (siblings * 67) % 360 },
  });

  // A newly added child immediately has exam results if the centre already recorded any
  // against the parent's phone.
  const parent = await prisma.user.findUnique({ where: { id: parentId }, select: { phone: true } });
  if (parent?.phone) {
    await prisma.examResult.updateMany({
      where: {
        phone: parent.phone,
        childId: null,
        studentName: { contains: data.firstName, mode: "insensitive" },
      },
      data: { childId: child.id },
    });
  }
  return { id: child.id };
}

export async function updateChild(parentId: string, childId: string, data: ChildInput): Promise<{ id: string } | Failure> {
  const existing = await prisma.child.findFirst({ where: { id: childId, parentId }, select: { id: true } });
  if (!existing) return { error: "childNotFound" };
  await prisma.child.update({ where: { id: existing.id }, data });
  return { id: existing.id };
}

/** A child with a running course stays: the enrollment and its payment must keep their owner. */
export async function deleteChild(parentId: string, childId: string): Promise<{ id: string } | Failure> {
  const existing = await prisma.child.findFirst({ where: { id: childId, parentId }, select: { id: true } });
  if (!existing) return { error: "childNotFound" };

  const active = await prisma.enrollment.count({ where: { childId: existing.id, status: "ACTIVE" } });
  if (active > 0) return { error: "childHasActive" };

  await prisma.child.delete({ where: { id: existing.id } });
  return { id: existing.id };
}
