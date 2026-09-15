import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Type } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { isLocale, locales } from "@/lib/i18n/config";
import { getBaseDictionary } from "@/lib/i18n/dictionaries";
import { getTextOverrides } from "@/lib/site-settings";
import { LANGUAGE_META, TEXT_GROUP_META, countTextFields } from "@/lib/site-settings-schema";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const metadata: Metadata = { title: "Тексты" };

function plural(count: number, forms: [string, string, string]) {
  const tens = count % 100;
  const ones = count % 10;
  if (tens > 10 && tens < 20) return forms[2];
  if (ones === 1) return forms[0];
  if (ones >= 2 && ones <= 4) return forms[1];
  return forms[2];
}

export default async function SiteTextsPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  await requireRole("ADMIN");
  const { locale } = await searchParams;
  const focus = isLocale(locale) ? locale : null;

  const [base, overrides] = await Promise.all([
    getBaseDictionary("ru"),
    Promise.all(locales.map((code) => getTextOverrides(code))),
  ]);
  const dictionary = base as Record<string, unknown>;

  const groups = [
    ...Object.keys(TEXT_GROUP_META).filter((group) => group in dictionary),
    ...Object.keys(dictionary).filter((group) => !(group in TEXT_GROUP_META)),
  ];
  const editedGroups = groups.filter((group) => overrides.some((edits) => group in edits)).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Сайт"
        title="Тексты"
        description="Все надписи сайта на трёх языках. Откройте раздел, поменяйте текст и сохраните — сайт обновится сразу."
      />

      <p className="mt-6 text-sm text-muted">
        <span className="font-semibold text-ink">{groups.length}</span> {plural(groups.length, ["раздел", "раздела", "разделов"])} ·{" "}
        <span className="font-semibold text-ink">{editedGroups}</span> {plural(editedGroups, ["изменён", "изменено", "изменено"])}
        {focus && <> · открываются на языке {LANGUAGE_META[focus].flag} {LANGUAGE_META[focus].label}</>}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const meta = TEXT_GROUP_META[group] ?? { label: group, description: "" };
          const fields = countTextFields(dictionary[group]);
          const editedIn = locales.filter((_, index) => group in overrides[index]);

          return (
            <Link
              key={group}
              href={`/bilim/admin/site/texts/${group}${focus ? `?locale=${focus}` : ""}`}
              className="group flex flex-col rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-glow-md"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken text-brand-ink transition-colors group-hover:bg-panel group-hover:text-accent">
                  <Type className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-ink" />
              </span>
              <span className="mt-4 font-display text-lg font-bold text-ink">{meta.label}</span>
              <span className="mt-1 flex-1 text-sm text-muted">{meta.description}</span>
              <span className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-ink-soft">
                  {fields} {plural(fields, ["поле", "поля", "полей"])}
                </span>
                {editedIn.map((code) => (
                  <Badge key={code} variant="amber">
                    {LANGUAGE_META[code].flag} изменено
                  </Badge>
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
