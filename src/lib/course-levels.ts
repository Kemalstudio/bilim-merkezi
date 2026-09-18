/*
 * Language-neutral course reference data. Labels live in the interface dictionaries
 * (src/lib/i18n/ui) and the formatter (src/lib/i18n/format.ts).
 */

/** One step of a course ladder: the CEFR code and the course name used on certificates. */
export type LadderStep = { code: string; name: string };

/** The language ladder the centre teaches by: a starter course, then seven numbered courses. */
export const LANGUAGE_LADDER: LadderStep[] = [
  { code: "A1", name: "Beginner" },
  { code: "A1+", name: "Elementary" },
  { code: "A2", name: "Pre-Intermediate" },
  { code: "B1", name: "Intermediate" },
  { code: "B1+", name: "Intermediate Plus" },
  { code: "B2", name: "Upper-Intermediate" },
  { code: "C1", name: "Advanced" },
  { code: "C1+", name: "Advanced Plus" },
];

/** Russian track names for the admin form; the public site uses the dictionaries. */
export const TRACK_NAMES: Record<string, string> = {
  english: "Английский язык",
  turkmen: "Туркменский язык",
  russian: "Русский язык",
  german: "Немецкий язык",
  french: "Французский язык",
  korean: "Корейский язык",
  chinese: "Китайский язык",
  japanese: "Японский язык",
};

/** Scores out of 100 and the mark they give, as printed on the centre's certificates. */
export const GRADING_SCALE = [
  { min: 90, max: 100, key: "excellent", tone: "emerald" },
  { min: 70, max: 89, key: "good", tone: "brand" },
  { min: 60, max: 69, key: "average", tone: "amber" },
  { min: 0, max: 59, key: "retake", tone: "rose" },
] as const;

/** Age groups for the catalogue filter; a course fits a group when their age ranges overlap. */
export const AGE_GROUPS = [
  { value: "5-7", min: 5, max: 7 },
  { value: "8-10", min: 8, max: 10 },
  { value: "11-13", min: 11, max: 13 },
  { value: "14-17", min: 14, max: 17 },
] as const;

/** Total study time buckets for the catalogue filter, by Course.durationHours. */
export const DURATION_GROUPS = [
  { value: "short", min: 0, max: 30 },
  { value: "medium", min: 31, max: 60 },
  { value: "long", min: 61, max: null },
] as const;
