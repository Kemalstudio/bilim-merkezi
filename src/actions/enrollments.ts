"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { startEnrollment } from "@/lib/enrollment-service";
import { createChild } from "@/lib/children-service";
import { env } from "@/lib/env";
import { enrollmentDocumentSchema } from "@/lib/validations/enrollment";
import { childSchema } from "@/lib/validations/child";
import { getI18n } from "@/lib/i18n/server";
import { issueText, type Ui } from "@/lib/i18n/ui";

// Returned rather than thrown: in production Next.js replaces thrown messages with a generic
// one, and the parent needs to know it was, say, the promo code that failed.
export type EnrollActionResult = { error: string } | undefined;

/**
 * Starts an enrollment for one child and hands off to Stripe Checkout (see enrollment-service).
 *
 * The child is either picked from the parent's existing profiles (`childId`) or
 * created inline from the wizard's first step — either way the name and birth
 * date on the application come from the child record, never from the request,
 * so a forged `childId` belonging to another parent simply fails to resolve.
 */
export async function enrollAction(courseId: string, formData: FormData): Promise<EnrollActionResult> {
  const user = await requireUser();
  const { t } = await getI18n();

  const document = enrollmentDocumentSchema.safeParse({
    patronymic: formData.get("patronymic") || undefined,
    documentNumber: formData.get("documentNumber"),
    documentFile: formData.get("documentFile"),
  });
  if (!document.success) {
    return { error: issueText(t, document.error.issues) };
  }

  // Checked before a child might be created inline; the service checks it again.
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { published: true } });
  if (!course?.published) return { error: t.errors.courseNotFound };

  const child = await resolveChild(user.id, formData, t);
  if ("error" in child) return child;

  const started = await startEnrollment({
    user: { id: user.id, email: user.email ?? "" },
    courseId,
    child,
    document: document.data,
    promoCode: String(formData.get("promoCode") ?? ""),
    successUrl: `${env.NEXT_PUBLIC_SITE_URL}/account/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: (slug) => `${env.NEXT_PUBLIC_SITE_URL}/courses/${slug}`,
  });
  if ("error" in started) return { error: t.errors[started.error] };
  if (started.status === "active") redirect("/account/enrollments");
  redirect(started.url);
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

  const created = await createChild(parentId, parsed.data);
  if ("error" in created) return { error: t.errors[created.error] };
  return prisma.child.findUniqueOrThrow({ where: { id: created.id } });
}
