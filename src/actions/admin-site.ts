"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { isLocale } from "@/lib/i18n/config";
import { getBaseDictionary } from "@/lib/i18n/dictionaries";
import { getTextOverrides, removeSetting, writeSetting } from "@/lib/site-settings";
import {
  animationsSchema,
  assistantSchema,
  conformsTo,
  contactsSchema,
  heroReportSchema,
  languagesSchema,
  normalizeSections,
  sectionsSchema,
  textsKey,
  type SectionSetting,
  type SettingKey,
} from "@/lib/site-settings-schema";

export type SiteActionState = { error?: string; success?: boolean };

const SCHEMAS: Record<SettingKey, z.ZodType> = {
  sections: sectionsSchema,
  animations: animationsSchema,
  contacts: contactsSchema,
  languages: languagesSchema,
  heroReport: heroReportSchema,
  assistant: assistantSchema,
};

const isSettingKey = (key: unknown): key is SettingKey => typeof key === "string" && Object.hasOwn(SCHEMAS, key);

/** Site settings touch every page, so the whole tree is re-rendered on the next request. */
function refreshSite() {
  revalidatePath("/", "layout");
}

export async function saveSiteSettingAction(key: SettingKey, value: unknown): Promise<SiteActionState> {
  const admin = await requireRole("ADMIN");
  if (!isSettingKey(key)) return { error: "Неизвестная настройка" };

  const parsed = SCHEMAS[key].safeParse(value);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };

  const data = key === "sections" ? normalizeSections(parsed.data as SectionSetting[]) : parsed.data;
  await writeSetting(key, data as Prisma.InputJsonValue, admin.id);
  await logAction(admin.id, `site.${key}.updated`, "siteSetting", key);
  refreshSite();
  return { success: true };
}

export async function resetSiteSettingAction(key: SettingKey): Promise<SiteActionState> {
  const admin = await requireRole("ADMIN");
  if (!isSettingKey(key)) return { error: "Неизвестная настройка" };

  await removeSetting(key);
  await logAction(admin.id, `site.${key}.reset`, "siteSetting", key);
  refreshSite();
  return { success: true };
}

export async function saveTextsAction(locale: string, group: string, value: unknown): Promise<SiteActionState> {
  const admin = await requireRole("ADMIN");
  if (!isLocale(locale)) return { error: "Неизвестный язык" };

  const base = (await getBaseDictionary(locale)) as Record<string, unknown>;
  if (!Object.hasOwn(base, group)) return { error: "Неизвестный раздел текстов" };
  if (!conformsTo(base[group], value)) {
    return { error: "Структура текстов не совпадает с сайтом. Обновите страницу и попробуйте снова." };
  }

  const overrides = { ...(await getTextOverrides(locale)) };
  // A group edited back to exactly the shipped texts is simply no longer an edit.
  if (JSON.stringify(value) === JSON.stringify(base[group])) delete overrides[group];
  else overrides[group] = value;

  if (Object.keys(overrides).length === 0) await removeSetting(textsKey(locale));
  else await writeSetting(textsKey(locale), overrides as Prisma.InputJsonValue, admin.id);

  await logAction(admin.id, "site.texts.updated", "siteSetting", textsKey(locale), { group });
  refreshSite();
  return { success: true };
}

export async function resetTextsAction(locale: string, group: string): Promise<SiteActionState> {
  const admin = await requireRole("ADMIN");
  if (!isLocale(locale)) return { error: "Неизвестный язык" };

  const overrides = { ...(await getTextOverrides(locale)) };
  delete overrides[group];

  if (Object.keys(overrides).length === 0) await removeSetting(textsKey(locale));
  else await writeSetting(textsKey(locale), overrides as Prisma.InputJsonValue, admin.id);

  await logAction(admin.id, "site.texts.reset", "siteSetting", textsKey(locale), { group });
  refreshSite();
  return { success: true };
}
