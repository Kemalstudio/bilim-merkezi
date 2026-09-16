import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { getLanguages } from "@/lib/site-settings";

/** The visitor's chosen language while it is still switched on in the admin panel; otherwise the main one. */
export async function getLocale(): Promise<Locale> {
  const [store, languages] = await Promise.all([cookies(), getLanguages()]);
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) && languages.enabled.includes(value) ? value : languages.defaultLocale;
}
