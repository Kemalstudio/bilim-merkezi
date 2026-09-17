"use server";

import { prisma } from "@/lib/prisma";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { isSmsSimulated } from "@/lib/sms";
import { maskPhone } from "@/lib/phone";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";
import { tpl } from "@/lib/i18n/format";
import { otpCodeField, phoneField } from "@/lib/validations/phone-auth";

/*
 * Exam results by phone number, for parents who have not signed in. A child's scores are
 * personal data, so the number alone is never enough: an SMS code proves the visitor holds the
 * phone. The code is only sent when the number has results, but the reply is the same either
 * way, so the form cannot be used to find out which numbers are on file.
 */

export type ExamResultItem = {
  id: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: string;
  courseTitle: string | null;
  studentName: string;
};

export type ExamCodeState =
  | { status: "sent"; phone: string; maskedPhone: string; simulated: boolean }
  | { status: "error"; error: string };

export async function requestExamCodeAction(formData: FormData): Promise<ExamCodeState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`exam-code:${await getClientIp()}`, 5, 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }

  const parsed = phoneField.safeParse(formData.get("phone"));
  if (!parsed.success) return { status: "error", error: issueText(t, parsed.error.issues) };
  const phone = parsed.data;

  if (!(await rateLimit(`otp-phone:${phone}`, 5, 60 * 60_000)).success) {
    return { status: "error", error: t.errors.tooManyRequests };
  }

  const hasResults = (await prisma.examResult.count({ where: { phone } })) > 0;
  if (hasResults) {
    const issued = await issueOtp(phone, "RESULTS", t.sms.code);
    if (!issued.ok) {
      return { status: "error", error: tpl(t.errors.codeCooldown, { seconds: issued.retryInSeconds }) };
    }
  }

  return { status: "sent", phone, maskedPhone: maskPhone(phone), simulated: isSmsSimulated };
}

export type ExamLookupState = { status: "ok"; results: ExamResultItem[] } | { status: "error"; error: string };

export async function lookupExamResultsAction(formData: FormData): Promise<ExamLookupState> {
  const { t } = await getI18n();
  if (!(await rateLimit(`exam-lookup:${await getClientIp()}`, 10, 60_000)).success) {
    return { status: "error", error: t.errors.tooManyAttempts };
  }

  const phone = phoneField.safeParse(formData.get("phone"));
  const code = otpCodeField.safeParse(formData.get("code"));
  if (!phone.success) return { status: "error", error: issueText(t, phone.error.issues) };
  if (!code.success) return { status: "error", error: issueText(t, code.error.issues) };

  // A number without results has no code to redeem, so it fails exactly like a wrong code.
  const verified = await verifyOtp(phone.data, "RESULTS", code.data);
  if (!verified.ok) {
    return { status: "error", error: verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid };
  }

  const results = await prisma.examResult.findMany({
    where: { phone: phone.data },
    include: { course: { select: { title: true } } },
    orderBy: { examDate: "desc" },
    take: 50,
  });

  return {
    status: "ok",
    results: results.map((result) => ({
      id: result.id,
      examName: result.examName,
      score: result.score,
      maxScore: result.maxScore,
      examDate: result.examDate.toISOString(),
      courseTitle: result.course?.title ?? null,
      studentName: result.studentName,
    })),
  };
}
