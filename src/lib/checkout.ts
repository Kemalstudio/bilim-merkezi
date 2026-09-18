import "server-only";

import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export type FulfillResult = "fulfilled" | "already-fulfilled" | "not-paid" | "unknown";

/**
 * Activates the enrollment behind a paid Checkout Session.
 *
 * Called from the Stripe webhook and from the success page, so it must be safe to run twice,
 * even at the same time: the payment row is flipped with a conditional update, and only the
 * call that actually flipped it records the promo redemption and the audit entry.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<FulfillResult> {
  const enrollmentId = session.metadata?.enrollmentId;
  if (!enrollmentId) return "unknown";
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return "not-paid";
  }

  const promoCodeId = session.metadata?.promoCodeId || undefined;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const result = await prisma.$transaction(async (tx) => {
    const flipped = await tx.payment.updateMany({
      where: { enrollmentId, status: { not: "SUCCEEDED" } },
      data: {
        status: "SUCCEEDED",
        stripeCheckoutId: session.id,
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      },
    });
    if (flipped.count === 0) {
      const exists = await tx.payment.findUnique({ where: { enrollmentId }, select: { id: true } });
      return exists ? ("already-fulfilled" as const) : ("unknown" as const);
    }

    const enrollment = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
      select: { id: true, userId: true },
    });

    if (promoCodeId) {
      const payment = await tx.payment.findUniqueOrThrow({ where: { enrollmentId }, select: { id: true } });
      await tx.promoRedemption.create({
        data: { promoCodeId, userId: enrollment.userId, paymentId: payment.id },
      });
      await tx.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
    }

    return { enrollment };
  });

  if (typeof result === "string") return result;

  await logAction(result.enrollment.userId, "payment.succeeded", "enrollment", result.enrollment.id, {
    stripeCheckoutId: session.id,
    ...(promoCodeId ? { promoCodeId } : {}),
  });
  return "fulfilled";
}

/**
 * Marks a pending payment failed when its Checkout Session expires. Only the session the
 * payment currently points at counts: an older abandoned session must not undo a newer one.
 */
export async function expireCheckoutSession(session: Stripe.Checkout.Session) {
  const enrollmentId = session.metadata?.enrollmentId;
  if (!enrollmentId) return;
  await prisma.payment.updateMany({
    where: { enrollmentId, stripeCheckoutId: session.id, status: "PENDING" },
    data: { status: "FAILED" },
  });
}
