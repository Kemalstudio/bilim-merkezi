"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SaveBar } from "@/components/admin/save-bar";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { resetSiteSettingAction, saveSiteSettingAction } from "@/actions/admin-site";
import { locales, type Locale } from "@/lib/i18n/config";
import { DEFAULT_LANGUAGES, LANGUAGE_META, type LanguageSettings } from "@/lib/site-settings-schema";
import { cn } from "@/lib/utils";

export function LanguagesForm({ initial }: { initial: LanguageSettings }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const { pending, run } = useSettingSaver();

  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  function setEnabled(locale: Locale, on: boolean) {
    setValue((current) => {
      // The main language and the last one left cannot be switched off.
      if (!on && (current.defaultLocale === locale || current.enabled.length === 1)) return current;
      const enabled = on
        ? locales.filter((code) => code === locale || current.enabled.includes(code))
        : current.enabled.filter((code) => code !== locale);
      return { ...current, enabled };
    });
  }

  function makeDefault(locale: Locale) {
    setValue((current) => ({
      enabled: locales.filter((code) => code === locale || current.enabled.includes(code)),
      defaultLocale: locale,
    }));
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {locales.map((locale) => {
          const on = value.enabled.includes(locale);
          const isDefault = value.defaultLocale === locale;
          const locked = isDefault || (on && value.enabled.length === 1);

          return (
            <div
              key={locale}
              className={cn(
                "flex flex-col rounded-[1.4rem] border bg-surface p-5 shadow-glow-sm transition-colors",
                isDefault ? "border-accent/60" : "border-border",
                !on && "bg-surface-sunken/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("text-4xl leading-none", !on && "grayscale")}>{LANGUAGE_META[locale].flag}</span>
                <Switch
                  checked={on}
                  disabled={locked}
                  onCheckedChange={(checked) => setEnabled(locale, checked)}
                  aria-label={`Язык ${LANGUAGE_META[locale].label} включён`}
                />
              </div>
              <p className="mt-4 font-display text-xl font-bold text-ink">{LANGUAGE_META[locale].label}</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{locale}</p>

              <div className="mt-5 flex flex-1 flex-col justify-end gap-3">
                {isDefault ? (
                  <Badge variant="amber" className="w-fit">
                    <Star className="h-3 w-3 fill-current" /> Основной язык
                  </Badge>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => makeDefault(locale)}>
                    Сделать основным
                  </Button>
                )}
                <Link
                  href={`/bilim/admin/site/texts?locale=${locale}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline"
                >
                  Тексты на этом языке <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-border bg-surface-sunken/50 p-4 text-sm leading-6 text-muted">
        Основной язык видят новые посетители. Выключенный язык пропадает из переключателя на сайте, а те, кто выбирал его
        раньше, увидят основной. Если включён только один язык, переключатель скрывается.
      </div>

      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={() => run(() => saveSiteSettingAction("languages", value), "Языки сохранены", () => setSaved(value))}
        onDiscard={() => setValue(saved)}
        onReset={() =>
          run(() => resetSiteSettingAction("languages"), "Все языки снова включены", () => {
            setValue(DEFAULT_LANGUAGES);
            setSaved(DEFAULT_LANGUAGES);
          })
        }
      />
    </>
  );
}
