import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getBaseDictionary } from "@/lib/i18n/dictionaries";
import { getTextOverrides } from "@/lib/site-settings";
import { TEXT_GROUP_META, deepMerge, type JsonValue } from "@/lib/site-settings-schema";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TextGroupEditor } from "@/components/admin/site/text-group-editor";

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  const { group } = await params;
  return { title: `Тексты · ${TEXT_GROUP_META[group]?.label ?? group}` };
}

export default async function SiteTextGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ group: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  await requireRole("ADMIN");
  const [{ group }, { locale }] = await Promise.all([params, searchParams]);

  const [bases, overrides] = await Promise.all([
    Promise.all(locales.map((code) => getBaseDictionary(code))),
    Promise.all(locales.map((code) => getTextOverrides(code))),
  ]);
  if (!Object.hasOwn(bases[0], group)) notFound();

  const templates = {} as Record<Locale, JsonValue>;
  const initial = {} as Record<Locale, JsonValue>;
  const edited = {} as Record<Locale, boolean>;
  locales.forEach((code, index) => {
    const shipped = (bases[index] as Record<string, unknown>)[group];
    const override = overrides[index][group];
    templates[code] = shipped as JsonValue;
    initial[code] = deepMerge(shipped, override) as JsonValue;
    edited[code] = override !== undefined;
  });

  const meta = TEXT_GROUP_META[group] ?? { label: group, description: "" };

  return (
    <div>
      <Link
        href="/bilim/admin/site/texts"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Все тексты
      </Link>
      <div className="mt-4">
        <AdminPageHeader eyebrow="Тексты сайта" title={meta.label} description={meta.description} />
      </div>
      <div className="mt-8">
        <TextGroupEditor
          key={group}
          group={group}
          templates={templates}
          initial={initial}
          edited={edited}
          initialLocale={isLocale(locale) ? locale : "ru"}
        />
      </div>
    </div>
  );
}
