import type { Locale } from "@/lib/i18n/config";
import type { PluralForms, Ui } from "@/lib/i18n/ui/types";

/** BCP 47 tags: the site's "tm" is Turkmen, whose language code is "tk". */
export const LANGUAGE_TAGS: Record<Locale, string> = { ru: "ru", en: "en", tm: "tk" };
const INTL_TAGS: Record<Locale, string> = { ru: "ru-RU", en: "en-US", tm: "tk-TM" };

/** Replaces `{name}` placeholders; unknown ones are left as they are. */
export function tpl(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Turkmen ordinal suffix for 1–12 follows the last word's vowels: "9-njy", "8-nji". */
function turkmenOrdinal(n: number) {
  const back = new Set([6, 9, 10]);
  return `${n}-${back.has(n) ? "njy" : "nji"}`;
}

export type CourseFormatLike = { lessonsPerWeek: number; weeklyHoursMin: number; weeklyHoursMax: number };

/**
 * Locale-aware formatting for dates, money, counted nouns and the course vocabulary.
 * Works the same on the server and in the browser.
 */
export function createFormatter(locale: Locale, t: Ui) {
  const tag = INTL_TAGS[locale];
  const plural = new Intl.PluralRules(tag);
  const dateFormat = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric" });
  const shortDateFormat = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" });
  const timeFormat = new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit" });
  const weekdayFormat = new Intl.DateTimeFormat(tag, { weekday: "short" });
  const moneyFormat = new Intl.NumberFormat(tag, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const word = (count: number, forms: PluralForms) => forms[plural.select(count) as keyof PluralForms] ?? forms.other;
  const count = (value: number, forms: PluralForms) => `${value} ${word(value, forms)}`;
  const range = (min: number, max: number) => (min === max ? `${min}` : `${min}–${max}`);

  const minutes = (total: number) => {
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (hours === 0) return `${rest} ${t.units.minuteShort}`;
    return rest === 0 ? `${hours} ${t.units.hourShort}` : `${hours} ${t.units.hourShort} ${rest} ${t.units.minuteShort}`;
  };

  return {
    locale,
    tag,
    word,
    count,
    range,
    minutes,
    date: (value: Date | string) => dateFormat.format(new Date(value)),
    shortDate: (value: Date | string) => shortDateFormat.format(new Date(value)),
    time: (value: Date | string) => timeFormat.format(new Date(value)),
    weekday: (value: Date | string) => weekdayFormat.format(new Date(value)),
    currency: (amount: number | string | { toString(): string }) => moneyFormat.format(Number(amount)),
    lessonsPerWeek: (n: number) => tpl(t.format.lessonsPerWeek, { count: count(n, t.units.lesson) }),
    weeklyHours: (format: CourseFormatLike) =>
      tpl(t.format.weeklyHours, { range: range(format.weeklyHoursMin, format.weeklyHoursMax) }),
    weeks: (n: number) => count(n, t.units.week),
    totalHours: (weeks: number, format: CourseFormatLike) => {
      const max = weeks * format.weeklyHoursMax;
      return `${range(weeks * format.weeklyHoursMin, max)} ${word(max, t.units.hour)}`;
    },
    level: (level: string) => t.level[level as keyof Ui["level"]] ?? level,
    status: (status: string) => t.status[status as keyof Ui["status"]] ?? status,
    track: (track: string) => t.tracks[track as keyof Ui["tracks"]] ?? track,
    grade: (grade: number) => tpl(t.format.grade, { grade: locale === "tm" ? turkmenOrdinal(grade) : grade }),
    /** "7–10 лет", "с 14 лет", "до 10 лет", or null when the course has no age range. */
    ageRange: (min: number | null | undefined, max: number | null | undefined) => {
      if (min != null && max != null) {
        return min === max ? count(min, t.units.year) : tpl(t.format.ageRange, { min, max });
      }
      if (min != null) return tpl(t.format.ageFrom, { min });
      if (max != null) return tpl(t.format.ageTo, { max });
      return null;
    },
    fileSize: (kb: number | null) => {
      if (!kb) return null;
      return kb < 1024 ? `${kb} ${t.units.kb}` : `${(kb / 1024).toFixed(1)} ${t.units.mb}`;
    },
  };
}

export type Formatter = ReturnType<typeof createFormatter>;
