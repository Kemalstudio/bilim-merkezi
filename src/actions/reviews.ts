"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { reviewSchema } from "@/lib/validations/review";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";

export type ReviewActionState = { error?: string } | undefined;

export async function createReviewAction(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const user = await requireUser();
  const { t } = await getI18n();

  const parsed = reviewSchema.safeParse({
    courseId: formData.get("courseId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  // A parent can hold several enrollments on one course (one per child), so
  // this is no longer a unique lookup — any active one earns the right to review.
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: parsed.data.courseId, status: "ACTIVE" },
  });
  if (!enrollment) {
    return { error: t.errors.reviewNeedsEnrollment };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { slug: true },
  });

  // Every submission — new or edited — starts PENDING so a moderator sees it before it goes
  // public; this also stops an already-approved review being swapped for spam after the fact.
  await prisma.review.upsert({
    where: { userId_courseId: { userId: user.id, courseId: parsed.data.courseId } },
    create: {
      userId: user.id,
      courseId: parsed.data.courseId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      status: "PENDING",
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      status: "PENDING",
    },
  });

  if (course) revalidatePath(`/courses/${course.slug}`);
}
