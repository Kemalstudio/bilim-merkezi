"use server";

import type { ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";

export type ReviewModerationActionState = { error?: string } | undefined;

const ACTION_BY_STATUS: Record<ReviewStatus, string> = {
  PENDING: "review.pending",
  APPROVED: "review.approved",
  HIDDEN: "review.hidden",
};

export async function setReviewStatusAction(id: string, status: ReviewStatus): Promise<ReviewModerationActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const review = await prisma.review.findUnique({ where: { id }, select: { course: { select: { slug: true } } } });
  if (!review) return { error: "Отзыв не найден" };

  await prisma.review.update({ where: { id }, data: { status } });
  await logAction(admin.id, ACTION_BY_STATUS[status], "review", id);

  revalidatePath("/bilim/admin/reviews");
  revalidatePath(`/courses/${review.course.slug}`);
}
