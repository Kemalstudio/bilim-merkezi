"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/rbac";
import { env } from "@/lib/env";
import { enrollmentApplicationSchema } from "@/lib/validations/enrollment";
import { childSchema } from "@/lib/validations/child";

/**
 * Starts an enrollment for one child and hands off to Stripe Checkout.
 *
 * The child is either picked from the parent's existing profiles (`childId`) or
 * created inline from the wizard's first step — either way the name and birth
 * date on the application come from the child record, never from the request,
 * so a forged `childId` belonging to another parent simply fails to resolve.
 */
export async function enrollAction(courseId: string, formData: FormData) {
  const user = await requireUser();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) {
    throw new Error("Курс не найден");
  }

  const child = await resolveChild(user.id, formData);

  const parsedApplication = enrollmentApplicationSchema.safeParse({
    lastName: child.lastName,
    firstName: child.firstName,
    patronymic: formData.get("patronymic") || undefined,
    birthDate: child.birthDate,
    documentNumber: formData.get("documentNumber"),
    documentFile: formData.get("documentFile"),
  });
  if (!parsedApplication.success) {
    throw new Error(parsedApplication.error.issues[0]?.message ?? "Проверьте поля формы");
  }

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

  await prisma.enrollmentApplication.upsert({
    where: { enrollmentId: enrollment.id },
    create: { enrollmentId: enrollment.id, ...parsedApplication.data },
    update: parsedApplication.data,
  });

  let price = Number(course.discountPrice ?? course.price);
  let promoCodeId: string | undefined;

  const promoInput = (formData.get("promoCode") as string | null)?.trim().toUpperCase();
  if (promoInput) {
    const promo = await prisma.promoCode.findUnique({ where: { code: promoInput } });
    const now = new Date();
    const isValid =
      promo &&
      promo.active &&
      (!promo.expiresAt || promo.expiresAt > now) &&
      (promo.maxUses == null || promo.usedCount < promo.maxUses);

    if (!isValid) {
      throw new Error("Промокод недействителен или истёк");
    }

    promoCodeId = promo.id;
    const discount =
      promo.discountType === "PERCENT"
        ? price * (Number(promo.discountValue) / 100)
        : Number(promo.discountValue);
    price = Math.max(0, Math.round((price - discount) * 100) / 100);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
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

  if (!checkoutSession.url) throw new Error("Не удалось создать сессию оплаты");
  redirect(checkoutSession.url);
}

/** Picks the parent's existing child, or creates one from the wizard's step 1. */
async function resolveChild(parentId: string, formData: FormData) {
  const childId = formData.get("childId");

  if (typeof childId === "string" && childId) {
    const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
    if (!child) throw new Error("Профиль ребёнка не найден");
    return child;
  }

  const parsed = childSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    grade: formData.get("grade") ?? undefined,
    notes: null,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Заполните данные ребёнка");
  }

  const siblings = await prisma.child.count({ where: { parentId } });
  return prisma.child.create({
    data: { ...parsed.data, parentId, avatarHue: (siblings * 67) % 360 },
  });
}
