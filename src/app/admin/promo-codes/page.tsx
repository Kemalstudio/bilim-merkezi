import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PromoCodeForm } from "@/components/admin/promo-code-form";
import { PromoCodeTable } from "@/components/admin/promo-code-table";

export const metadata: Metadata = { title: "Промокоды" };

export default async function AdminPromoCodesPage() {
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  const rows = promoCodes.map((p) => ({
    id: p.id,
    code: p.code,
    discountType: p.discountType,
    discountValue: p.discountValue.toString(),
    maxUses: p.maxUses,
    usedCount: p.usedCount,
    expiresAt: p.expiresAt,
    active: p.active,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Промокоды</h1>
        <p className="mt-1 text-muted">Скидочные коды для оформления записи на курс</p>
      </div>
      <PromoCodeForm />
      <PromoCodeTable promoCodes={rows} />
    </div>
  );
}
