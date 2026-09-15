import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { getSections } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SectionsForm } from "@/components/admin/site/sections-form";

export const metadata: Metadata = { title: "Секции главной" };

export default async function SiteSectionsPage() {
  await requireRole("ADMIN");
  const sections = await getSections();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Сайт"
        title="Секции главной"
        description="Показывайте и скрывайте блоки главной страницы и меняйте их порядок стрелками. Первый экран и цифры доверия всегда открывают страницу: при прокрутке они работают как одна сцена."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/" target="_blank">
              Открыть главную <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <div className="mt-8">
        <SectionsForm initial={sections} />
      </div>
    </div>
  );
}
