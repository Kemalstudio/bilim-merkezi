import "server-only";

import type { Child } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logAction } from "@/lib/audit";
import { getPaymentSettings } from "@/lib/site-settings";
import { applyPromo, isPromoUsable } from "@/lib/pricing";
import { minCardChargeTmt, toStripeUsdCents } from "@/lib/money";
import { realEmail } from "@/lib/phone";
import { fulfillCheckoutSession, type FulfillResult } from "@/lib/checkout";
import type { EnrollmentDocumentInput } from "@/lib/validations/enrollment";

/*
 * Starting an enrollment, shared by the website's wizard and the mobile app. Everything that
 * can be checked is checked before anything is written. Failures are `errors` keys of the UI
 * dictionary, for the caller to put in the parent's language.
 */

export type EnrollmentFailure = {
  error: "courseNotFound" | "promoInvalid" | "amountTooSmall" | "paymentUnavailable" | "checkoutFailed";
};

export type EnrollmentStart =
  | EnrollmentFailure
  /** The seat is confirmed: free with a promo code, or paid earlier. */
  | { status: "active"; enrollmentId: string }
  | { status: "checkout"; enrollmentId: string; url: string };

export type EnrollmentRequest = {
  user: { id: string; email: string };
  courseId: string;
  /** Already resolved to one of the parent's children by the caller. */
  child: Pick<Child, "id" | "firstName" | "lastName" | "birthDate">;
  document: EnrollmentDocumentInput;
  promoCode?: string;
  successUrl: string;
  cancelUrl: (courseSlug: string) => string;
};

/** The price a promo code leaves to pay, or why the code cannot be used. */
export async function quotePrice(
  course: { price: unknown; discountPrice: unknown },
  promoInput: string | undefined
): Promise<{ error: "promoInvalid" } | { price: number; promoCodeId?: string }> {
  let price = Number(course.discountPrice ?? course.price);
  let promoCodeId: string | undefined;
  const code = promoInput?.trim().toUpperCase();
  if (code) {
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!isPromoUsable(promo)) return { error: "promoInvalid" as const };
    promoCodeId = promo.id;
    price = applyPromo(price, promo);
  }
  return { price, promoCodeId };
}

export async function startEnrollment(request: EnrollmentRequest): Promise<EnrollmentStart> {
  const { user, child, courseId } = request;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) return { error: "courseNotFound" };

  const quote = await quotePrice(course, request.promoCode);
  if ("error" in quote) return quote;
  const { price, promoCodeId } = quote;
  // Payments switched off in the admin panel (testing): every seat is confirmed without a card.
  const paymentsOn = (await getPaymentSettings()).enabled;
  if (paymentsOn && price > 0 && price < minCardChargeTmt()) return { error: "amountTooSmall" };

  const existing = await prisma.enrollment.findFirst({ where: { userId: user.id, courseId, childId: child.id } });
  if (existing?.status === "ACTIVE") return { status: "active", enrollmentId: existing.id };

  const enrollment =
    existing ??
    (await prisma.enrollment.create({
      data: { userId: user.id, courseId, childId: child.id, status: "PENDING" },
    }));

  // Name and birth date always come from the child record, never from the request.
  const application = {
    lastName: child.lastName,
    firstName: child.firstName,
    birthDate: child.birthDate,
    ...request.document,
  };
  await prisma.enrollmentApplication.upsert({
    where: { enrollmentId: enrollment.id },
    create: { enrollmentId: enrollment.id, ...application },
    update: application,
  });

  // A promo code that covers the whole price needs no card: the seat is confirmed right away.
  // So does any seat while payments are off; nothing is charged and the promo code is kept.
  if (price === 0 || !paymentsOn) {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { enrollmentId: enrollment.id },
        create: { enrollmentId: enrollment.id, userId: user.id, courseId, amount: 0, status: "SUCCEEDED" },
        update: { amount: 0, status: "SUCCEEDED", stripeCheckoutId: null },
      });
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "ACTIVE" } });
      if (promoCodeId && paymentsOn) {
        await tx.promoRedemption.create({ data: { promoCodeId, userId: user.id, paymentId: payment.id } });
        await tx.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
      }
    });
    await logAction(user.id, paymentsOn ? "enrollment.free" : "enrollment.payments_off", "enrollment", enrollment.id, {
      promoCodeId,
      ...(paymentsOn ? {} : { price }),
    });
    return { status: "active", enrollmentId: enrollment.id };
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: realEmail(user.email) ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            // Stripe does not charge in TMT: the manat price is converted at TMT_PER_USD.
            currency: "usd",
            unit_amount: toStripeUsdCents(price),
            product_data: {
              name: course.title,
              description: `${course.summary} · ${child.firstName} ${child.lastName}`,
            },
          },
        },
      ],
      success_url: request.successUrl,
      cancel_url: request.cancelUrl(course.slug),
      metadata: {
        enrollmentId: enrollment.id,
        userId: user.id,
        courseId: course.id,
        childId: child.id,
        ...(promoCodeId ? { promoCodeId } : {}),
      },
    });

    await prisma.payment.upsert({
      where: { enrollmentId: enrollment.id },
      create: {
        enrollmentId: enrollment.id,
        userId: user.id,
        courseId: course.id,
        amount: price,
        stripeCheckoutId: checkoutSession.id,
        status: "PENDING",
      },
      update: { amount: price, stripeCheckoutId: checkoutSession.id, status: "PENDING" },
    });
    if (!checkoutSession.url) return { error: "checkoutFailed" };
    return { status: "checkout", enrollmentId: enrollment.id, url: checkoutSession.url };
  } catch (error) {
    console.error("[enroll] could not start checkout", error);
    return { error: "paymentUnavailable" };
  }
}

/**
 * Asks Stripe about the enrollment's latest checkout and activates the seat if it was paid —
 * for the app returning from the payment page before the webhook has arrived.
 */
export async function confirmEnrollmentPayment(userId: string, enrollmentId: string): Promise<FulfillResult | "not-found"> {
  const payment = await prisma.payment.findFirst({
    where: { enrollmentId, userId },
    select: { status: true, stripeCheckoutId: true },
  });
  if (!payment) return "not-found";
  if (payment.status === "SUCCEEDED") return "already-fulfilled";
  if (!payment.stripeCheckoutId) return "not-paid";
  try {
    const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutId);
    if (session.metadata?.userId !== userId) return "unknown";
    return await fulfillCheckoutSession(session);
  } catch (error) {
    console.error("[enroll] could not confirm payment", error);
    return "unknown";
  }
}
