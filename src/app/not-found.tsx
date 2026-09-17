import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/status-screen";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.status404.meta };
}

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <StatusScreen code={t.status404.code} icon={Compass} title={t.status404.title} description={t.status404.text}>
      <Button asChild size="lg">
        <Link href="/courses">{t.common.catalog}</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/">{t.common.toHome}</Link>
      </Button>
    </StatusScreen>
  );
}
