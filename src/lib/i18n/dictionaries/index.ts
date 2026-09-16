import type { Locale } from "@/lib/i18n/config";
import { getTextOverrides } from "@/lib/site-settings";
import { deepMerge } from "@/lib/site-settings-schema";
import ru from "./ru";

export type Dictionary = typeof ru;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  ru: () => Promise.resolve(ru),
  en: () => import("./en").then((m) => m.default),
  tm: () => import("./tm").then((m) => m.default),
};

/** The texts as shipped in code, without anything edited in the admin panel. */
export async function getBaseDictionary(locale: Locale): Promise<Dictionary> {
  const load = loaders[locale] ?? loaders.ru;
  return load();
}

/** The texts the site renders: the shipped ones with the admin panel's edits laid over them. */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const [base, overrides] = await Promise.all([getBaseDictionary(locale), getTextOverrides(locale)]);
  return deepMerge(base, overrides);
}
