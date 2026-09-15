import type { Metadata } from "next";
import Link from "next/link";
import { Type } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getHeroReport } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HeroReportForm } from "@/components/admin/site/hero-report-form";

export const metadata: Metadata = { title: "Карточка отчёта" };

export default async function SiteHeroCardPage() {
  await requireRole("ADMIN");
  const [report, dict] = await Promise.all([getHeroReport(), getDictionary("ru")]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Сайт · первый экран"
        title="Карточка отчёта"
        description="Недельный отчёт на первом экране главной: баллы пробных экзаменов по неделям и освоение тем. Подписи карточки («Отчёт для родителя», «Неделя» и другие) меняются в текстах первого экрана."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/bilim/admin/site/texts/hero">
              <Type className="h-4 w-4" /> Подписи карточки
            </Link>
          </Button>
        }
      />
      <div className="mt-8">
        <HeroReportForm initial={report} labels={dict.hero.report} />
      </div>
    </div>
  );
}
