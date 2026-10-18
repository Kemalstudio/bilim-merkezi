import { prisma } from "@/lib/prisma";
import { confirmEnrollmentPayment } from "@/lib/enrollment-service";
import { fail, ok, withMobileUser } from "@/lib/mobile/http";

/**
 * Called when the app comes back from the payment page: asks Stripe directly, so the seat is
 * active even before the webhook arrives. Answers with the enrollment's current status.
 */
export const POST = withMobileUser<{ id: string }>(async ({ user, params, ctx: { t } }) => {
  const result = await confirmEnrollmentPayment(user.id, params.id);
  if (result === "not-found") return fail(t.errors.notFound, 404, "not_found");

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: params.id, userId: user.id },
    select: { status: true, payment: { select: { status: true } } },
  });
  return ok({ status: enrollment?.status ?? "PENDING", paymentStatus: enrollment?.payment?.status ?? null, result });
});
