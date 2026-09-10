"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { promoCodeSchema } from "@/lib/validations/promo-code";

export type PromoCodeActionState = { error?: string; success?: boolean } | undefined;

function parsePromoForm(formData: FormData) {
  return promoCodeSchema.safeParse({
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    maxUses: formData.get("maxUses") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createPromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData
): Promise<PromoCodeActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");
  const parsed = parsePromoForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const existing = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return { error: "Промокод с таким названием уже существует" };
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: parsed.data.code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ?? null,
      active: parsed.data.active,
    },
  });

  await logAction(admin.id, "promoCode.created", "promoCode", promo.id, { code: promo.code });
  revalidatePath("/admin/promo-codes");
  return { success: true };
}

export async function togglePromoCodeActiveAction(id: string, active: boolean) {
  const admin = await requireRole("ADMIN", "MODERATOR");
  await prisma.promoCode.update({ where: { id }, data: { active } });
  await logAction(admin.id, active ? "promoCode.activated" : "promoCode.deactivated", "promoCode", id);
  revalidatePath("/admin/promo-codes");
}

export async function deletePromoCodeAction(id: string): Promise<PromoCodeActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const redemptionCount = await prisma.promoRedemption.count({ where: { promoCodeId: id } });
  if (redemptionCount > 0) {
    return { error: "Нельзя удалить промокод, которым уже воспользовались. Отключите его вместо удаления." };
  }

  await prisma.promoCode.delete({ where: { id } });
  await logAction(admin.id, "promoCode.deleted", "promoCode", id);
  revalidatePath("/admin/promo-codes");
}
