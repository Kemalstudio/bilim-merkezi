import type { Metadata } from "next";
import Link from "next/link";
import type { CourseLevel, Prisma } from "@prisma/client";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toCourseCardData } from "@/lib/course-mappers";
import { formatMinutes } from "@/lib/course-schedule";
import { pluralizeRu } from "@/lib/utils";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCatalog, type CategoryOption } from "@/components/courses/course-catalog";
import { CourseGridReveal } from "@/components/courses/course-grid-reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollFadeAway } from "@/components/shared/scroll-fade-away";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Каталог курсов",
  description:
    "Курсы по программированию, дизайну, маркетингу, языкам и бизнесу: 3 урока в неделю, программа по неделям и понятная нагрузка.",
};

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type SearchParams = { q?: string; category?: string; level?: string; sort?: string };

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
    ],
  };
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const level = LEVELS.find((value) => value === params.level);
  const sort = params.sort ?? "popular";

  // Category counts ignore the category filter itself, so every chip shows what it would give.
  const base: Prisma.CourseWhereInput = { published: true, ...(level ? { level } : {}), ...(q ? searchFilter(q) : {}) };
  const where: Prisma.CourseWhereInput = params.category ? { ...base, category: { slug: params.category } } : base;

  const [categories, grouped, courses, overview, lessonAverage] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.course.groupBy({ by: ["categoryId"], where: base, _count: { _all: true } }),
    prisma.course.findMany({
      where,
      include: {
        category: true,
        reviews: { select: { rating: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.aggregate({
      where: { published: true },
      _count: { _all: true },
      _min: { lessonsPerWeek: true, weeklyHoursMin: true },
      _max: { lessonsPerWeek: true, weeklyHoursMax: true },
    }),
    prisma.lesson.aggregate({ where: { module: { course: { published: true } } }, _avg: { durationMin: true } }),
  ]);

  const items = courses.map((course) => ({
    card: toCourseCardData(course),
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
  const categoryOptions: CategoryOption[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: countByCategory.get(category.id) ?? 0,
  }));
  const allCount = grouped.reduce((sum, group) => sum + group._count._all, 0);

  // The weekly format across the catalogue, for the hero.
  const total = overview._count._all;
  const lessonsMin = overview._min.lessonsPerWeek ?? 3;
  const lessonsMax = overview._max.lessonsPerWeek ?? 3;
  const hoursMin = overview._min.weeklyHoursMin ?? 15;
  const hoursMax = overview._max.weeklyHoursMax ?? 20;
  const lessonMinutes = Math.round(lessonAverage._avg.durationMin ?? 90);
  const classMinutes = lessonMinutes * lessonsMax;
  const classHours = classMinutes / 60;
  const practiceMin = Math.max(0, Math.round(hoursMin - classHours));
  const practiceMax = Math.max(0, Math.round(hoursMax - classHours));
  const classShare = Math.min(1, classHours / hoursMax);

  const stats = [
    { value: `${total}`, label: pluralizeRu(total, ["программа", "программы", "программ"]) },
    { value: lessonsMin === lessonsMax ? `${lessonsMax}` : `${lessonsMin}–${lessonsMax}`, label: `${pluralizeRu(lessonsMax, ["урок", "урока", "уроков"])} в неделю` },
    { value: `${hoursMin}–${hoursMax}`, label: "часов учёбы в неделю" },
  ];

  return (
    <div className="pb-24">
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-panel px-5 py-16 text-white sm:rounded-[2.4rem] sm:px-10 lg:py-20">
          <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <ScrollFadeAway>
              <p className="eyebrow !text-accent">Программы Bilim</p>
              <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
                Найдите курс под цель, а не просто предмет
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
                У каждого курса — программа по неделям: какие темы проходим на каждом уроке, сколько времени занимает
                учёба и что ребёнок умеет к концу недели.
              </p>
              <dl className="mt-10 grid max-w-xl grid-cols-3 border-t border-white/15 pt-6">
                {stats.map((stat, index) => (
                  <div key={stat.label} className={index === 0 ? "pr-4" : "border-l border-white/15 px-4"}>
                    <dd className="font-display text-3xl font-bold tracking-[-0.05em] text-accent sm:text-4xl">{stat.value}</dd>
                    <dt className="mt-1 text-xs font-semibold leading-4 text-white/55">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </ScrollFadeAway>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Как устроена учебная неделя</p>
              <ol className="mt-5 flex flex-col gap-3">
                {Array.from({ length: Math.min(lessonsMax, 4) }, (_, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 font-display text-sm font-bold text-accent">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold">Урок {index + 1} с преподавателем</p>
                      <p className="text-xs text-white/50">≈ {formatMinutes(lessonMinutes)} · новые темы и разбор задач</p>
                    </div>
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-[#0b2233]">
                    +
                  </span>
                  <div>
                    <p className="text-sm font-bold">Практика и домашние задания</p>
                    <p className="text-xs text-white/50">
                      {practiceMin}–{practiceMax} ч в неделю · закрепляем темы уроков
                    </p>
                  </div>
                </li>
              </ol>
              <div className="mt-6">
                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-white/10"
                  role="img"
                  aria-label={`Около ${formatMinutes(classMinutes)} уроков и ${practiceMin}–${practiceMax} ч практики в неделю`}
                >
                  <span className="h-full bg-accent" style={{ width: `${classShare * 100}%` }} />
                  <span className="h-full bg-white/35" style={{ width: `${(1 - classShare) * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs font-semibold text-white/55">
                  <span>С преподавателем ≈ {formatMinutes(classMinutes)}</span>
                  <span>
                    Всего {hoursMin}–{hoursMax} ч
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <CourseCatalog categories={categoryOptions} resultCount={items.length} allCount={allCount}>
          {items.length > 0 ? (
            <CourseGridReveal
              // Remounts when the filters or sorting change, so the new set of cards plays in too.
              key={`${q}|${params.category ?? ""}|${level ?? ""}|${sort}`}
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
                  title="Ничего не найдено"
                  description="Попробуйте другой запрос — ищем по названию курса, темам недель, урокам и преподавателю."
                />
              </div>
              <Button asChild variant="outline">
                <Link href="/courses">Сбросить фильтры</Link>
              </Button>
            </div>
          )}
        </CourseCatalog>
      </div>
    </div>
  );
}
