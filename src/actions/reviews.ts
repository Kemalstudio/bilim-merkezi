"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { reviewSchema } from "@/lib/validations/review";

export type ReviewActionState = { error?: string } | undefined;

export async function createReviewAction(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const user = await requireUser();

  const parsed = reviewSchema.safeParse({
    courseId: formData.get("courseId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте данные отзыва" };
  }

  // A parent can hold several enrollments on one course (one per child), so
  // this is no longer a unique lookup — any active one earns the right to review.
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: parsed.data.courseId, status: "ACTIVE" },
  });
  if (!enrollment) {
    return { error: "Оставить отзыв можно только после записи на курс" };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { slug: true },
  });

  await prisma.review.upsert({
    where: { userId_courseId: { userId: user.id, courseId: parsed.data.courseId } },
    create: {
      userId: user.id,
      courseId: parsed.data.courseId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  if (course) revalidatePath(`/courses/${course.slug}`);
}
