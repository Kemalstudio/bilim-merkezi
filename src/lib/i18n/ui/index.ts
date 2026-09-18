import type { Locale } from "@/lib/i18n/config";
import type { Ui } from "./types";
import ru from "./ru";
import en from "./en";
import tm from "./tm";

export type { Ui, PluralForms } from "./types";

const dictionaries: Record<Locale, Ui> = { ru, en, tm };

export function getUiDictionary(locale: Locale): Ui {
  return dictionaries[locale] ?? ru;
}

/**
 * Validation schemas report message keys (e.g. "phoneInvalid"); this turns the first issue
 * into text in the visitor's language, and anything unexpected into the generic message.
 */
export function issueText(t: Ui, issues: readonly { message: string }[] | undefined) {
  const key = issues?.[0]?.message;
  return key && key in t.errors ? t.errors[key as keyof Ui["errors"]] : t.errors.generic;
}
