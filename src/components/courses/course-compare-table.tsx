import Link from "next/link";
import { Star } from "lucide-react";
import type { CourseCardData } from "@/components/courses/course-card";
import { getI18n } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/format";

export type CompareRow = CourseCardData & { lessons: number };

/**
 * The catalogue as one table: every course with its age, level, length, hours and price side by
 * side, so parents can compare programmes without opening each one.
 */
export async function CourseCompareTable({ courses }: { courses: CompareRow[] }) {
  const { t, f } = await getI18n();
  const c = t.compare;

  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-border bg-surface">
      <table className="w-full min-w-[860px] text-sm">
        <caption className="sr-only">{c.caption}</caption>
        <thead className="bg-surface-sunken text-left text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">{c.course}</th>
            <th scope="col" className="px-3 py-3">{c.age}</th>
            <th scope="col" className="px-3 py-3">{c.level}</th>
            <th scope="col" className="px-3 py-3 text-right">{c.weeks}</th>
            <th scope="col" className="px-3 py-3 text-right">{c.lessons}</th>
            <th scope="col" className="px-3 py-3">{c.perWeek}</th>
            <th scope="col" className="px-3 py-3 text-right">{c.totalHours}</th>
            <th scope="col" className="px-3 py-3">{c.start}</th>
            <th scope="col" className="px-4 py-3 text-right">{c.price}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map((course) => {
            const finalPrice = Number(course.discountPrice ?? course.price);
            const hasDiscount = course.discountPrice != null && finalPrice < Number(course.price);
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
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{f.ageRange(course.ageMin, course.ageMax) ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                  {f.level(course.level)}
                  {course.levelCode && <span className="text-muted"> · {course.levelCode}</span>}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{course.weeks || "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{course.lessons || "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                  {tpl(c.perWeekValue, {
                    lessons: course.lessonsPerWeek,
                    hours: f.range(course.weeklyHoursMin, course.weeklyHoursMax),
                  })}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-ink">
                  {course.weeks > 0
                    ? f.range(course.weeks * course.weeklyHoursMin, course.weeks * course.weeklyHoursMax)
                    : course.durationHours}{" "}
                  {t.units.hourShort}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{course.startDate ? f.shortDate(course.startDate) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {hasDiscount && <span className="mr-1.5 text-xs text-muted line-through">{f.currency(course.price)}</span>}
                  <span className="font-display font-bold text-ink">{f.currency(finalPrice)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
