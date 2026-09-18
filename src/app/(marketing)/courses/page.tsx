import type { Metadata } from "next";
import Link from "next/link";
import type { CourseLevel, Prisma } from "@prisma/client";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toCourseCardData } from "@/lib/course-mappers";
import { getI18n } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/format";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCatalog, type CategoryOption } from "@/components/courses/course-catalog";
import { CourseGridReveal } from "@/components/courses/course-grid-reveal";
import { CourseCompareTable } from "@/components/courses/course-compare-table";
import { AGE_GROUPS, DURATION_GROUPS } from "@/lib/course-levels";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollFadeAway } from "@/components/shared/scroll-fade-away";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.catalog.metaTitle,
    description: t.catalog.metaDescription,
    alternates: { canonical: "/courses" },
  };
}

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type SearchParams = { q?: string; category?: string; level?: string; sort?: string; age?: string; duration?: string; view?: string };

/** Matches the course itself, its instructor, week themes and lesson titles. */
function searchFilter(q: string): Prisma.CourseWhereInput {
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { title: contains },
      { summary: contains },
      { instructorName: contains },
      { modules: { some: { title: contains } } },
      { modules: { some: { lessons: { some: { title: contains } } } } },
      { skills: { has: q } },
    ],
  };
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, { t, f }] = await Promise.all([searchParams, getI18n()]);
  const q = params.q?.trim() ?? "";
  const level = LEVELS.find((value) => value === params.level);
  const sort = params.sort ?? "popular";
  const ageGroup = AGE_GROUPS.find((group) => group.value === params.age);
  const durationGroup = DURATION_GROUPS.find((group) => group.value === params.duration);
  const view = params.view === "table" ? "table" : "grid";

  // A course without an age range suits every age; otherwise its range must overlap the group.
  const ageFilter: Prisma.CourseWhereInput = ageGroup
    ? {
        AND: [
          { OR: [{ ageMin: null }, { ageMin: { lte: ageGroup.max } }] },
          { OR: [{ ageMax: null }, { ageMax: { gte: ageGroup.min } }] },
        ],
      }
    : {};
  const durationFilter: Prisma.CourseWhereInput = durationGroup
    ? { durationHours: { gte: durationGroup.min, ...(durationGroup.max != null ? { lte: durationGroup.max } : {}) } }
    : {};

  // Category counts ignore the category filter itself, so every chip shows what it would give.
  const base: Prisma.CourseWhereInput = {
    published: true,
    ...(level ? { level } : {}),
    AND: [q ? searchFilter(q) : {}, ageFilter, durationFilter],
  };
  const where: Prisma.CourseWhereInput = params.category ? { ...base, category: { slug: params.category } } : base;

  const [categories, grouped, courses, overview, formats, published] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.course.groupBy({ by: ["categoryId"], where: base, _count: { _all: true } }),
    prisma.course.findMany({
      where,
      include: {
        category: true,
        reviews: { select: { rating: true } },
        _count: { select: { modules: true, enrollments: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.aggregate({
      where: { published: true },
      _count: { _all: true },
      _min: { lessonsPerWeek: true, weeklyHoursMin: true },
      _max: { lessonsPerWeek: true, weeklyHoursMax: true },
    }),
    prisma.course.groupBy({
      by: ["lessonsPerWeek", "weeklyHoursMin", "weeklyHoursMax"],
      where: { published: true },
      _count: { _all: true },
    }),
    prisma.course.groupBy({ by: ["categoryId"], where: { published: true }, _count: { _all: true } }),
  ]);
  const publishedByCategory = new Set(published.map((group) => group.categoryId));

  // The hero shows a typical week: the weekly format most courses use, with their average lesson.
  const typical = formats.sort((a, b) => b._count._all - a._count._all)[0];
  const lessonAverage = await prisma.lesson.aggregate({
    where: {
      module: {
        course: {
          published: true,
          ...(typical
            ? {
                lessonsPerWeek: typical.lessonsPerWeek,
                weeklyHoursMin: typical.weeklyHoursMin,
                weeklyHoursMax: typical.weeklyHoursMax,
              }
            : {}),
        },
      },
    },
    _avg: { durationMin: true },
  });

  const items = courses.map((course) => ({
    card: toCourseCardData(course),
    lessons: course.modules.reduce((sum, week) => sum + week._count.lessons, 0),
    enrollments: course._count.enrollments,
    createdAt: course.createdAt.getTime(),
  }));
  type Item = (typeof items)[number];
  const finalPrice = (item: Item) => Number(item.card.discountPrice ?? item.card.price);
  const startTime = (item: Item) => (item.card.startDate ? new Date(item.card.startDate).getTime() : Number.POSITIVE_INFINITY);
  const sorters: Record<string, (a: Item, b: Item) => number> = {
    popular: (a, b) => b.enrollments - a.enrollments || b.card.reviewCount - a.card.reviewCount,
    rating: (a, b) => b.card.avgRating - a.card.avgRating || b.card.reviewCount - a.card.reviewCount,
    start: (a, b) => (startTime(a) === startTime(b) ? 0 : startTime(a) - startTime(b)),
    "price-asc": (a, b) => finalPrice(a) - finalPrice(b),
    "price-desc": (a, b) => finalPrice(b) - finalPrice(a),
    new: (a, b) => b.createdAt - a.createdAt,
  };
  items.sort(sorters[sort] ?? sorters.popular);

  const countByCategory = new Map(grouped.map((group) => [group.categoryId, group._count._all]));
  // Categories without published courses are left out, unless the visitor is filtering by one.
  const categoryOptions: CategoryOption[] = categories
    .filter((category) => publishedByCategory.has(category.id) || category.slug === params.category)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: countByCategory.get(category.id) ?? 0,
    }));
  const allCount = grouped.reduce((sum, group) => sum + group._count._all, 0);

  // The weekly format range across the catalogue, for the hero stats.
  const total = overview._count._all;
  const lessonsMin = overview._min.lessonsPerWeek ?? 3;
  const lessonsMax = overview._max.lessonsPerWeek ?? 3;
  const hoursMin = overview._min.weeklyHoursMin ?? 15;
  const hoursMax = overview._max.weeklyHoursMax ?? 20;
  // The typical week, for the card next to them.
  const weekLessons = typical?.lessonsPerWeek ?? 3;
  const weekHoursMin = typical?.weeklyHoursMin ?? 15;
  const weekHoursMax = typical?.weeklyHoursMax ?? 20;
  const lessonMinutes = Math.round((lessonAverage._avg.durationMin ?? 90) / 5) * 5;
  const classMinutes = lessonMinutes * weekLessons;
  const classHours = classMinutes / 60;
  const practiceMin = Math.max(0, Math.round(weekHoursMin - classHours));
  const practiceMax = Math.max(0, Math.round(weekHoursMax - classHours));
  const classShare = Math.min(1, classHours / weekHoursMax);

  const stats = [
    { value: `${total}`, label: f.word(total, t.catalog.statPrograms) },
    {
      value: f.range(lessonsMin, lessonsMax),
      label: tpl(t.catalog.statLessonsPerWeek, { lessons: f.word(lessonsMax, t.units.lesson) }),
    },
    { value: f.range(hoursMin, hoursMax), label: t.catalog.statHours },
  ];
  const c = t.catalog;

  return (
    <div className="pb-24">
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-panel px-5 py-16 text-white sm:rounded-[2.4rem] sm:px-10 lg:py-20">
          <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <ScrollFadeAway>
              <p className="eyebrow !text-accent">{c.eyebrow}</p>
              <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
                {c.title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                {c.lead}
              </p>
              <dl className="mt-10 grid max-w-xl grid-cols-3 border-t border-white/15 pt-6">
                {stats.map((stat, index) => (
                  <div key={stat.label} className={`flex flex-col-reverse ${index === 0 ? "pr-4" : "border-l border-white/15 px-4"}`}>
                    <dt className="mt-1 text-xs font-semibold leading-4 text-white/55">{stat.label}</dt>
                    <dd className="font-display text-3xl font-bold tracking-[-0.05em] text-accent sm:text-4xl">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </ScrollFadeAway>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{c.typicalWeek}</p>
              <ol className="mt-5 flex flex-col gap-3">
                {Array.from({ length: Math.min(weekLessons, 4) }, (_, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 font-display text-sm font-bold text-accent">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{tpl(c.lessonN, { n: index + 1 })}</p>
                      <p className="text-xs text-white/50">{tpl(c.lessonHint, { minutes: f.minutes(lessonMinutes) })}</p>
                    </div>
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-[#0b2233]">
                    +
                  </span>
                  <div>
                    <p className="text-sm font-bold">{c.practice}</p>
                    <p className="text-xs text-white/50">{tpl(c.practiceHint, { min: practiceMin, max: practiceMax })}</p>
                  </div>
                </li>
              </ol>
              <div className="mt-6">
                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-white/10"
                  role="img"
                  aria-label={tpl(c.weekBarLabel, { minutes: f.minutes(classMinutes), min: practiceMin, max: practiceMax })}
                >
                  <span className="h-full bg-accent" style={{ width: `${classShare * 100}%` }} />
                  <span className="h-full bg-white/35" style={{ width: `${(1 - classShare) * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs font-semibold text-white/55">
                  <span>{tpl(c.withTeacher, { minutes: f.minutes(classMinutes) })}</span>
                  <span>{tpl(c.total, { min: weekHoursMin, max: weekHoursMax })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <CourseCatalog categories={categoryOptions} resultCount={items.length} allCount={allCount}>
          {items.length > 0 && view === "table" ? (
            <CourseCompareTable courses={items.map((item) => ({ ...item.card, lessons: item.lessons }))} />
          ) : items.length > 0 ? (
            <CourseGridReveal
              // Remounts when the filters or sorting change, so the new set of cards plays in too.
              key={`${q}|${params.category ?? ""}|${level ?? ""}|${sort}|${ageGroup?.value ?? ""}|${durationGroup?.value ?? ""}`}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((item) => (
                <CourseCard key={item.card.slug} course={item.card} />
              ))}
            </CourseGridReveal>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="w-full">
                <EmptyState
                  icon={SearchX}
                  animation="/lottie/empty.json"
                  title={c.emptyTitle}
                  description={c.emptyDescription}
                />
              </div>
              <Button asChild variant="outline">
                <Link href="/courses">{c.resetFilters}</Link>
              </Button>
            </div>
          )}
        </CourseCatalog>
      </div>
    </div>
  );
}
