import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { startEnrollment } from "@/lib/enrollment-service";
import { getEnrollments } from "@/lib/mobile/data";
import { enrollmentDocumentSchema } from "@/lib/validations/enrollment";
import { fail, invalid, ok, readJson, withMobileUser } from "@/lib/mobile/http";

export const GET = withMobileUser(async ({ user }) => ok(await getEnrollments(user.id)));

const enrollSchema = enrollmentDocumentSchema.extend({
  courseId: z.string().min(1),
  childId: z.string().min(1),
  promoCode: z.string().trim().max(40).optional(),
});

/**
 * Enrols one of the parent's children. The answer is either "active" (free with a promo code,
 * or already paid) or "checkout" with the payment page the app opens; after paying, the app
 * calls /enrollments/{id}/confirm.
 */
export const POST = withMobileUser(async ({ request, user, ctx: { t } }) => {
  if (!(await rateLimit(`enroll:${user.id}`, 10, 10 * 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const body = await readJson(request);
  const parsed = enrollSchema.safeParse({ ...body, patronymic: body.patronymic || undefined });
  if (!parsed.success) return invalid(t, parsed.error.issues);
  const { courseId, childId, promoCode, ...document } = parsed.data;

  const [child, account] = await Promise.all([
    prisma.child.findFirst({ where: { id: childId, parentId: user.id } }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true } }),
  ]);
  if (!child) return fail(t.errors.childNotFound, 404, "childNotFound");

  const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const started = await startEnrollment({
    user: { id: user.id, email: account.email },
    courseId,
    child,
    document,
    promoCode,
    successUrl: `${site}/app/payment?status=success`,
    cancelUrl: () => `${site}/app/payment?status=cancelled`,
  });
  if ("error" in started) return fail(t.errors[started.error], 400, started.error);
  return ok(started, 201);
});
