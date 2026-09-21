"use client";

import { useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Moon, Sun } from "lucide-react";
import { setLocaleAction } from "@/actions/locale";
import type { Locale } from "@/lib/i18n/config";
import { LANGUAGE_META } from "@/lib/site-settings-schema";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { SettingsGroup } from "@/components/account/settings/settings-section";

const readTheme = () => document.documentElement.classList.contains("dark");

/** The theme lives as a class on <html> (also flipped by the header's toggle), so watch it there. */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const choice = (selected: boolean) =>
  cn(
    "flex min-h-12 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors cursor-pointer disabled:cursor-wait",
    selected
      ? "border-brand bg-brand/10 text-brand-ink"
      : "border-border bg-surface text-ink-soft hover:border-brand/50 hover:bg-surface-sunken/60"
  );

/** Language (a cookie, so it follows the visitor everywhere) and theme (this device only). */
export function PreferencesPanel({ locale, languages }: { locale: Locale; languages: readonly Locale[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Unknown on the server, which cannot see which theme this browser stored.
  const dark = useSyncExternalStore(subscribeToTheme, readTheme, () => null);

  function pickLanguage(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  function pickTheme(nextDark: boolean) {
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch {
      // Private mode: the choice still applies until the page is closed.
    }
  }

  return (
    <>
      {languages.length > 1 && (
        <SettingsGroup title={t.settings.preferences.language}>
          <div role="radiogroup" aria-label={t.settings.preferences.language} className="grid gap-2 sm:grid-cols-3">
            {languages.map((code) => (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={code === locale}
                disabled={isPending}
                onClick={() => pickLanguage(code)}
                className={choice(code === locale)}
              >
                <span aria-hidden className="text-lg leading-none">
                  {LANGUAGE_META[code].flag}
                </span>
                <span className="flex-1">{LANGUAGE_META[code].label}</span>
                {code === locale && <Check aria-hidden className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </SettingsGroup>
      )}

      <SettingsGroup title={t.settings.preferences.theme}>
        <div role="radiogroup" aria-label={t.settings.preferences.theme} className="grid gap-2 sm:grid-cols-2">
          <button type="button" role="radio" aria-checked={dark === false} onClick={() => pickTheme(false)} className={choice(dark === false)}>
            <Sun aria-hidden className="h-4 w-4" />
            <span className="flex-1">{t.settings.preferences.light}</span>
            {dark === false && <Check aria-hidden className="h-4 w-4" />}
          </button>
          <button type="button" role="radio" aria-checked={dark === true} onClick={() => pickTheme(true)} className={choice(dark === true)}>
            <Moon aria-hidden className="h-4 w-4" />
            <span className="flex-1">{t.settings.preferences.dark}</span>
            {dark === true && <Check aria-hidden className="h-4 w-4" />}
          </button>
        </div>
      </SettingsGroup>
    </>
  );
}
