"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/rbac";
import { env } from "@/lib/env";
import { logAction } from "@/lib/audit";
import { applyPromo, isPromoUsable, STRIPE_MIN_CHARGE } from "@/lib/pricing";
import { enrollmentDocumentSchema } from "@/lib/validations/enrollment";
import { childSchema } from "@/lib/validations/child";
import { realEmail } from "@/lib/phone";
import { getI18n } from "@/lib/i18n/server";
import { issueText, type Ui } from "@/lib/i18n/ui";

// Returned rather than thrown: in production Next.js replaces thrown messages with a generic
// one, and the parent needs to know it was, say, the promo code that failed.
export type EnrollActionResult = { error: string } | undefined;

/**
 * Starts an enrollment for one child and hands off to Stripe Checkout.
 *
 * The child is either picked from the parent's existing profiles (`childId`) or
 * created inline from the wizard's first step — either way the name and birth
 * date on the application come from the child record, never from the request,
 * so a forged `childId` belonging to another parent simply fails to resolve.
 * Everything that can be checked is checked before anything is written.
 */
export async function enrollAction(courseId: string, formData: FormData): Promise<EnrollActionResult> {
  const user = await requireUser();
  const { t } = await getI18n();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) {
    return { error: t.errors.courseNotFound };
  }

  const document = enrollmentDocumentSchema.safeParse({
    patronymic: formData.get("patronymic") || undefined,
    documentNumber: formData.get("documentNumber"),
    documentFile: formData.get("documentFile"),
  });
  if (!document.success) {
    return { error: issueText(t, document.error.issues) };
  }

  let price = Number(course.discountPrice ?? course.price);
  let promoCodeId: string | undefined;

  const promoInput = String(formData.get("promoCode") ?? "").trim().toUpperCase();
  if (promoInput) {
    const promo = await prisma.promoCode.findUnique({ where: { code: promoInput } });
    if (!isPromoUsable(promo)) {
      return { error: t.errors.promoInvalid };
    }
    promoCodeId = promo.id;
    price = applyPromo(price, promo);
  }

  if (price > 0 && price < STRIPE_MIN_CHARGE) {
    return { error: t.errors.amountTooSmall };
  }

  const child = await resolveChild(user.id, formData, t);
  if ("error" in child) return child;

  const existing = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId, childId: child.id },
  });
  if (existing?.status === "ACTIVE") {
    redirect("/account/enrollments");
  }

  const enrollment =
    existing ??
    (await prisma.enrollment.create({
      data: { userId: user.id, courseId, childId: child.id, status: "PENDING" },
    }));

  const application = {
    lastName: child.lastName,
    firstName: child.firstName,
    birthDate: child.birthDate,
    ...document.data,
  };
  await prisma.enrollmentApplication.upsert({
    where: { enrollmentId: enrollment.id },
    create: { enrollmentId: enrollment.id, ...application },
    update: application,
  });

  // A promo code that covers the whole price needs no card: the seat is confirmed right away.
  if (price === 0) {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { enrollmentId: enrollment.id },
        create: { enrollmentId: enrollment.id, userId: user.id, courseId, amount: 0, status: "SUCCEEDED" },
        update: { amount: 0, status: "SUCCEEDED", stripeCheckoutId: null },
      });
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "ACTIVE" } });
      if (promoCodeId) {
        await tx.promoRedemption.create({ data: { promoCodeId, userId: user.id, paymentId: payment.id } });
        await tx.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
      }
    });
    await logAction(user.id, "enrollment.free", "enrollment", enrollment.id, { promoCodeId });
    redirect("/account/enrollments");
  }

  let checkoutUrl: string | null;
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: realEmail(user.email) ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: course.title,
              description: `${course.summary} · ${child.firstName} ${child.lastName}`,
            },
          },
        },
      ],
      success_url: `${env.NEXT_PUBLIC_SITE_URL}/account/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/courses/${course.slug}`,
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
      update: {
        amount: price,
        stripeCheckoutId: checkoutSession.id,
        status: "PENDING",
      },
    });
    checkoutUrl = checkoutSession.url;
  } catch (error) {
    console.error("[enroll] could not start checkout", error);
    return { error: t.errors.paymentUnavailable };
  }

  if (!checkoutUrl) return { error: t.errors.checkoutFailed };
  redirect(checkoutUrl);
}

/** Picks the parent's existing child, or creates one from the wizard's step 1. */
async function resolveChild(parentId: string, formData: FormData, t: Ui) {
  const childId = formData.get("childId");

  if (typeof childId === "string" && childId) {
    const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
    return child ?? { error: t.errors.childNotFound };
  }

  const parsed = childSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    grade: formData.get("grade") ?? undefined,
    notes: null,
  });
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  const siblings = await prisma.child.count({ where: { parentId } });
  if (siblings >= 10) {
    return { error: t.errors.childLimit };
  }
  return prisma.child.create({
    data: { ...parsed.data, parentId, avatarHue: (siblings * 67) % 360 },
  });
}
