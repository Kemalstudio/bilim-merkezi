import { pluralizeRu } from "@/lib/utils";

/** The weekly format a course is taught in. */
export type CourseFormat = {
  lessonsPerWeek: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
};

export const DEFAULT_COURSE_FORMAT: CourseFormat = { lessonsPerWeek: 3, weeklyHoursMin: 15, weeklyHoursMax: 20 };

const range = (min: number, max: number) => (min === max ? `${min}` : `${min}–${max}`);

/** "3 урока в неделю" */
export function lessonsPerWeekLabel(count: number) {
  return `${count} ${pluralizeRu(count, ["урок", "урока", "уроков"])} в неделю`;
}

/** "15–20 ч в неделю" */
export function weeklyHoursLabel({ weeklyHoursMin, weeklyHoursMax }: CourseFormat) {
  return `${range(weeklyHoursMin, weeklyHoursMax)} ч в неделю`;
}

/** "4 недели" */
export function weeksLabel(count: number) {
  return `${count} ${pluralizeRu(count, ["неделя", "недели", "недель"])}`;
}

/** "60–80 часов" for the whole programme. */
export function totalHoursLabel(weeks: number, { weeklyHoursMin, weeklyHoursMax }: CourseFormat) {
  const max = weeks * weeklyHoursMax;
  return `${range(weeks * weeklyHoursMin, max)} ${pluralizeRu(max, ["час", "часа", "часов"])}`;
}

/** Stored total duration: the middle of the weekly range times the number of weeks. */
export function estimateDurationHours(weeks: number, { weeklyHoursMin, weeklyHoursMax }: CourseFormat) {
  return Math.max(1, Math.round((weeks * (weeklyHoursMin + weeklyHoursMax)) / 2));
}

/** "1 ч 30 мин", "2 ч", "45 мин" */
export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} мин`;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}

/**
 * How a week splits into time in class and self-study: class time is the sum of the lessons,
 * and the rest of the weekly hours is practice and homework (never below zero).
 */
export function weekLoad(lessonMinutes: number[], format: CourseFormat) {
  const classMinutes = lessonMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const classHours = Math.round((classMinutes / 60) * 10) / 10;
  return {
    classMinutes,
    classHours,
    practiceMin: Math.max(0, Math.round(format.weeklyHoursMin - classHours)),
    practiceMax: Math.max(0, Math.round(format.weeklyHoursMax - classHours)),
    /** Share of the upper weekly bound spent in class, 0–1, for a progress bar. */
    classShare: format.weeklyHoursMax > 0 ? Math.min(1, classHours / format.weeklyHoursMax) : 0,
  };
}
