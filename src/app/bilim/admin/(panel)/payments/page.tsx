import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { getPaymentSettings } from "@/lib/site-settings";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PaymentsToggle } from "@/components/admin/site/payments-form";

export const metadata: Metadata = { title: "Оплата" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireRole("ADMIN");
  const settings = await getPaymentSettings();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Продажи"
        title="Оплата"
        description="Пока центр тестирует сайт и приложение, оплату можно выключить: записи будут подтверждаться сразу и бесплатно."
      />
      <PaymentsToggle initial={settings} />
    </div>
  );
}
