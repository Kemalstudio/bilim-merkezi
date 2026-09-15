import type { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { getLanguages } from "@/lib/site-settings";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LanguagesForm } from "@/components/admin/site/languages-form";

export const metadata: Metadata = { title: "Языки" };

export default async function SiteLanguagesPage() {
  await requireRole("ADMIN");
  const languages = await getLanguages();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Сайт"
        title="Языки"
        description="Какие языки доступны посетителям и какой из них основной."
      />
      <div className="mt-8">
        <LanguagesForm initial={languages} />
      </div>
    </div>
  );
}
