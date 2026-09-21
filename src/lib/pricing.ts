import type { DiscountType } from "@prisma/client";

export type PromoLike = {
  active: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  discountType: DiscountType;
  discountValue: number | string | { toString(): string };
};

export function isPromoUsable(promo: PromoLike | null | undefined, now = new Date()): promo is PromoLike {
  return Boolean(
    promo &&
      promo.active &&
      (!promo.expiresAt || promo.expiresAt > now) &&
      (promo.maxUses == null || promo.usedCount < promo.maxUses)
  );
}

/** The price after a promo code (TMT), rounded to whole manat and never below zero. */
export function applyPromo(price: number, promo: Pick<PromoLike, "discountType" | "discountValue">) {
  const value = Number(promo.discountValue);
  const discount = promo.discountType === "PERCENT" ? price * (value / 100) : value;
  return Math.max(0, Math.round(price - discount));
}
