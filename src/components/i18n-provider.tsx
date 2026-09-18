"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { createFormatter, type Formatter } from "@/lib/i18n/format";
import type { Ui } from "@/lib/i18n/ui";

type I18n = { locale: Locale; t: Ui; f: Formatter };

const I18nContext = createContext<I18n | null>(null);

/** Hands the interface texts chosen on the server to client components. */
export function I18nProvider({ locale, t, children }: { locale: Locale; t: Ui; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t, f: createFormatter(locale, t) }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
