"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";

/*
 * Scores entered by the centre. A new row reaches the parent on its own: the account feed and
 * the app's "new scores" notification are both read from exam_results, nothing else to send.
 */

export type ExamResultActionState = { error?: string; success?: boolean } | undefined;

const examResultSchema = z
  .object({
    enrollmentId: z.string().min(1, "Выберите ученика"),
    examName: z.string().trim().min(2, "Минимум 2 символа").max(120, "Максимум 120 символов"),
    score: z.coerce.number({ error: "Укажите баллы" }).int("Целое число").min(0, "Не меньше 0"),
    maxScore: z.coerce.number({ error: "Укажите максимум" }).int("Целое число").min(1, "Не меньше 1").max(1000, "Не больше 1000"),
    examDate: z.coerce.date({ error: "Укажите дату" }),
  })
  .refine((v) => v.score <= v.maxScore, { message: "Баллы не могут быть больше максимума", path: ["score"] })
  .refine((v) => v.examDate.getTime() <= Date.now() + 86_400_000, { message: "Дата экзамена ещё не наступила", path: ["examDate"] });

export async function createExamResultAction(formData: FormData): Promise<ExamResultActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const parsed = examResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };

  // The score is attached through an enrollment, so it always lands on a child of that course.
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: parsed.data.enrollmentId },
    select: {
      courseId: true,
      user: { select: { phone: true } },
      child: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!enrollment?.child) return { error: "Запись не найдена или у неё нет ребёнка" };

  const result = await prisma.examResult.create({
    data: {
      // The parent's number keeps the "results by phone" lookup on the home page working.
      phone: enrollment.user.phone ?? "",
      studentName: `${enrollment.child.firstName} ${enrollment.child.lastName}`,
      examName: parsed.data.examName,
      score: parsed.data.score,
      maxScore: parsed.data.maxScore,
      examDate: parsed.data.examDate,
      courseId: enrollment.courseId,
      childId: enrollment.child.id,
    },
  });

  await logAction(admin.id, "examResult.created", "examResult", result.id, {
    childId: enrollment.child.id,
    score: result.score,
    maxScore: result.maxScore,
  });
  revalidatePath("/bilim/admin/results");
  revalidatePath("/account");
  return { success: true };
}

export async function deleteExamResultAction(id: string): Promise<ExamResultActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");
  const deleted = await prisma.examResult.deleteMany({ where: { id } });
  if (deleted.count === 0) return { error: "Результат не найден" };
  await logAction(admin.id, "examResult.deleted", "examResult", id);
  revalidatePath("/bilim/admin/results");
  revalidatePath("/account");
}
