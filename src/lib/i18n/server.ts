import "server-only";
import { cache } from "react";
import { getLocale } from "@/lib/i18n/get-locale";
import { createFormatter } from "@/lib/i18n/format";
import { getUiDictionary } from "@/lib/i18n/ui";

/** The visitor's language, its interface texts and formatter — resolved once per request. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  const t = getUiDictionary(locale);
  return { locale, t, f: createFormatter(locale, t) };
});
