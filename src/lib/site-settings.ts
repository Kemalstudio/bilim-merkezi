import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import {
  DEFAULT_ANIMATIONS,
  DEFAULT_ASSISTANT,
  assistantSchema,
  DEFAULT_CONTACTS,
  DEFAULT_HERO_REPORT,
  DEFAULT_LANGUAGES,
  animationsSchema,
  contactsSchema,
  heroReportSchema,
  isPlainObject,
  languagesSchema,
  normalizeSections,
  sectionsSchema,
  textsKey,
  type SettingKey,
} from "@/lib/site-settings-schema";

/**
 * Every saved setting, read once per request. If the table cannot be read (for example the
 * migration has not been applied yet) the site keeps working on its shipped defaults.
 */
const readSettings = cache(async (): Promise<Map<string, unknown>> => {
  try {
    const rows = await prisma.siteSetting.findMany();
    return new Map(rows.map((row) => [row.key, row.value]));
  } catch (error) {
    console.error("[site-settings] could not read settings, falling back to defaults", error);
    return new Map();
  }
});

/** A saved value that no longer fits its schema is ignored rather than breaking the page. */
async function readSetting<T>(key: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  const value = (await readSettings()).get(key);
  if (value === undefined) return fallback;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export const getSections = cache(async () => normalizeSections(await readSetting("sections", sectionsSchema, [])));

// Partial, so a switch added later defaults to on instead of discarding everything saved.
export const getAnimations = cache(async () => ({
  ...DEFAULT_ANIMATIONS,
  ...(await readSetting("animations", animationsSchema.partial(), {})),
}));

export const getAssistantSettings = cache(() => readSetting("assistant", assistantSchema, DEFAULT_ASSISTANT));

export const getContacts = cache(() => readSetting("contacts", contactsSchema, DEFAULT_CONTACTS));

export const getLanguages = cache(() => readSetting("languages", languagesSchema, DEFAULT_LANGUAGES));

export const getHeroReport = cache(() => readSetting("heroReport", heroReportSchema, DEFAULT_HERO_REPORT));

/** Text groups edited for `locale`, keyed by dictionary group; validated when saved. */
export const getTextOverrides = cache(async (locale: Locale): Promise<Record<string, unknown>> => {
  const value = (await readSettings()).get(textsKey(locale));
  return isPlainObject(value) ? value : {};
});

type StoredKey = SettingKey | ReturnType<typeof textsKey>;

export async function writeSetting(key: StoredKey, value: Prisma.InputJsonValue, userId: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, updatedById: userId },
    update: { value, updatedById: userId },
  });
}

export async function removeSetting(key: StoredKey) {
  await prisma.siteSetting.deleteMany({ where: { key } });
}
