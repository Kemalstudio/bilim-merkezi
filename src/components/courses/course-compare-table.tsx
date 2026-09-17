import Link from "next/link";
import { Star } from "lucide-react";
import type { CourseCardData } from "@/components/courses/course-card";
import { getLevelLabel } from "@/lib/course-visuals";
import { ageRangeLabel } from "@/lib/course-levels";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export type CompareRow = CourseCardData & { lessons: number };

/**
 * The catalogue as one table: every course with its age, level, length, hours and price side by
 * side, so parents can compare programmes without opening each one.
 */
export function CourseCompareTable({ courses }: { courses: CompareRow[] }) {
  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-border bg-surface">
      <table className="w-full min-w-[860px] text-sm">
        <caption className="sr-only">Сравнение курсов: возраст, уровень, длительность, часы и цена</caption>
        <thead className="bg-surface-sunken text-left text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Курс</th>
            <th scope="col" className="px-3 py-3">Возраст</th>
            <th scope="col" className="px-3 py-3">Уровень</th>
            <th scope="col" className="px-3 py-3 text-right">Недель</th>
            <th scope="col" className="px-3 py-3 text-right">Уроков</th>
            <th scope="col" className="px-3 py-3">В неделю</th>
            <th scope="col" className="px-3 py-3 text-right">Всего часов</th>
            <th scope="col" className="px-3 py-3">Старт</th>
            <th scope="col" className="px-4 py-3 text-right">Цена</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map((course) => {
            const finalPrice = Number(course.discountPrice ?? course.price);
            const hasDiscount = course.discountPrice != null && finalPrice < Number(course.price);
            const weekly =
              course.weeklyHoursMin === course.weeklyHoursMax ? `${course.weeklyHoursMax}` : `${course.weeklyHoursMin}–${course.weeklyHoursMax}`;
            return (
              <tr key={course.slug} className="transition-colors hover:bg-surface-sunken/50">
                <th scope="row" className="max-w-[20rem] px-4 py-3 text-left font-normal">
                  <Link href={`/courses/${course.slug}`} className="font-bold text-ink underline-offset-4 hover:text-brand-ink hover:underline">
                    {course.title}
                  </Link>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    {course.category.name}
                    {course.avgRating > 0 && (
                      <span className="flex items-center gap-0.5 text-amber">
                        <Star aria-hidden className="h-3 w-3 fill-current" />
                        {course.avgRating.toFixed(1)}
                      </span>
                    )}
                  </span>
                </th>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{ageRangeLabel(course.ageMin, course.ageMax) ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                  {getLevelLabel(course.level)}
                  {course.levelCode && <span className="text-muted"> · {course.levelCode}</span>}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{course.weeks || "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{course.lessons || "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                  {course.lessonsPerWeek} ур. · {weekly} ч
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-ink">
                  {course.weeks > 0
                    ? `${course.weeks * course.weeklyHoursMin}–${course.weeks * course.weeklyHoursMax}`
                    : course.durationHours}{" "}
                  ч
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{course.startDate ? formatShortDate(course.startDate) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {hasDiscount && <span className="mr-1.5 text-xs text-muted line-through">{formatCurrency(course.price)}</span>}
                  <span className="font-display font-bold text-ink">{formatCurrency(finalPrice)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
