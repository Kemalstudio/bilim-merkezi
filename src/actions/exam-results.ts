"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { examLookupSchema } from "@/lib/validations/exam-lookup";

export type ExamResultItem = {
  id: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: string;
  courseTitle: string | null;
};

export type ExamLookupState = { error?: string; results?: ExamResultItem[] } | undefined;

export async function lookupExamResultsAction(
  _prev: ExamLookupState,
  formData: FormData
): Promise<ExamLookupState> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`exam-lookup:${ip}`, 10, 60_000).success) {
    return { error: "Слишком много попыток. Попробуйте через минуту." };
  }

  const parsed = examLookupSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте номер телефона" };
  }

  const normalizedPhone = parsed.data.phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) {
    return { error: "Введите корректный номер телефона" };
  }

  const results = await prisma.examResult.findMany({
    where: { phone: normalizedPhone },
    include: { course: { select: { title: true } } },
    orderBy: { examDate: "desc" },
  });

  if (results.length === 0) {
    return { error: "Результаты не найдены. Проверьте номер телефона или обратитесь в поддержку." };
  }

  return {
    results: results.map((r) => ({
      id: r.id,
      examName: r.examName,
      score: r.score,
      maxScore: r.maxScore,
      examDate: r.examDate.toISOString(),
      courseTitle: r.course?.title ?? null,
    })),
  };
}
