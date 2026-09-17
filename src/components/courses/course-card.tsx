import Link from "next/link";
import { Star, Clock, CalendarDays, UserRound } from "lucide-react";
import { CourseCover } from "@/components/courses/course-cover";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate, pluralizeRu } from "@/lib/utils";
import { getLevelLabel } from "@/lib/course-visuals";
import { ageRangeLabel } from "@/lib/course-levels";

export type CourseCardData = {
  slug: string;
  title: string;
  summary: string;
  price: number | string;
  discountPrice?: number | string | null;
  level: string;
  durationHours: number;
  startDate?: Date | string | null;
  instructorName: string;
  category: { name: string; slug: string };
  avgRating: number;
  reviewCount: number;
  /** Number of weeks in the programme (0 when it has none yet). */
  weeks: number;
  lessonsPerWeek: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  ageMin: number | null;
  ageMax: number | null;
  /** Ladder step such as "A2", shown next to the level. */
  levelCode: string | null;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  const price = Number(course.price);
  const finalPrice = Number(course.discountPrice ?? course.price);
  const hasDiscount = course.discountPrice != null && finalPrice < price;
  const discountPercent = hasDiscount ? Math.round((1 - finalPrice / price) * 100) : 0;
  const weeklyHours =
    course.weeklyHoursMin === course.weeklyHoursMax ? `${course.weeklyHoursMax}` : `${course.weeklyHoursMin}–${course.weeklyHoursMax}`;
  const totalHours =
    course.weeks > 0
      ? `${course.weeks * course.weeklyHoursMin}–${course.weeks * course.weeklyHoursMax} ч`
      : `${course.durationHours} ч`;

  const age = ageRangeLabel(course.ageMin, course.ageMax);

  const format = [
    { value: course.lessonsPerWeek, label: `${pluralizeRu(course.lessonsPerWeek, ["урок", "урока", "уроков"])} в нед.` },
    { value: weeklyHours, label: "часов в нед." },
    { value: course.weeks, label: pluralizeRu(course.weeks, ["неделя", "недели", "недель"]) },
  ];

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/35 hover:shadow-glow-md"
    >
      <div className="relative">
        <CourseCover categorySlug={course.category.slug} className="aspect-[16/9] w-full" />
        {hasDiscount && (
          <span className="absolute left-4 top-4 rounded-full bg-rose px-2.5 py-1 text-xs font-extrabold text-white shadow-glow-sm">
            −{discountPercent}%
          </span>
        )}
        {course.startDate && (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#0b2233] shadow-glow-sm backdrop-blur-sm">
            <CalendarDays aria-hidden className="h-3.5 w-3.5" /> Старт {formatShortDate(course.startDate)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{course.category.name}</Badge>
          <Badge variant="neutral">
            {getLevelLabel(course.level)}
            {course.levelCode && ` · ${course.levelCode}`}
          </Badge>
          {age && (
            <Badge variant="amber">
              <UserRound aria-hidden className="h-3 w-3" /> {age}
            </Badge>
          )}
        </div>

        <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.03em] text-ink transition-colors group-hover:text-brand-ink line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-muted line-clamp-2">{course.summary}</p>

        {course.weeks > 0 && (
          <dl className="grid grid-cols-3 gap-1 rounded-xl bg-surface-sunken/70 p-2 text-center">
            {format.map((item) => (
              <div key={item.label} className="rounded-lg px-1 py-1.5 transition-colors group-hover:bg-surface/70">
                <dd className="font-display text-base font-bold tracking-[-0.02em] text-ink">{item.value}</dd>
                <dt className="text-[0.65rem] font-semibold leading-tight text-muted">{item.label}</dt>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 text-sm text-ink-soft">
          <span className="truncate">{course.instructorName}</span>
          <span className="flex shrink-0 items-center gap-1 text-amber">
            <Star className="h-4 w-4 fill-current group-hover:animate-icon-pop" />
            {course.avgRating > 0 ? course.avgRating.toFixed(1) : "новый"}
            {course.reviewCount > 0 && <span className="text-muted">({course.reviewCount})</span>}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            {totalHours} за курс
          </span>
          <div className="flex items-baseline gap-2">
            {hasDiscount && <span className="text-sm text-muted line-through">{formatCurrency(course.price)}</span>}
            <span className="font-display text-lg font-semibold text-ink">{formatCurrency(finalPrice)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
