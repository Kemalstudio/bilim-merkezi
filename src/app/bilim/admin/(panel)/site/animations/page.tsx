import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { getAnimations } from "@/lib/site-settings";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnimationsForm } from "@/components/admin/site/animations-form";

export const metadata: Metadata = { title: "Анимации" };

export default async function SiteAnimationsPage() {
  await requireRole("ADMIN");
  const animations = await getAnimations();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Сайт"
        title="Анимации"
        description="Включайте и выключайте движение на сайте. Если сайт кажется тяжёлым на слабых устройствах, начните с 3D-созвездия и сцены первого экрана."
      />
      <div className="mt-8">
        <AnimationsForm initial={animations} />
      </div>
    </div>
  );
}
