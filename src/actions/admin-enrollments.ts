"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { stripe } from "@/lib/stripe";

export async function refundEnrollmentAction(enrollmentId: string) {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { payment: true },
  });
  if (!enrollment?.payment?.stripePaymentIntentId || enrollment.payment.status !== "SUCCEEDED") {
    return { error: "У этой записи нет успешной оплаты для возврата" };
  }

  await stripe.refunds.create({ payment_intent: enrollment.payment.stripePaymentIntentId });

  await prisma.$transaction([
    prisma.payment.update({ where: { enrollmentId }, data: { status: "REFUNDED" } }),
    prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: "CANCELLED" } }),
  ]);

  await logAction(admin.id, "payment.refunded", "enrollment", enrollmentId);
  revalidatePath("/admin/enrollments");
}
