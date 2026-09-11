import type { Metadata } from "next";
import type { CourseLevel, Prisma } from "@prisma/client";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toCourseCardData } from "@/lib/course-mappers";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFilters } from "@/components/courses/course-filters";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Каталог курсов",
  description: "Найдите курс по программированию, дизайну, маркетингу, языкам и бизнесу.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; level?: string }>;
}) {
  const params = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const where: Prisma.CourseWhereInput = { published: true };
  if (params.category) where.category = { slug: params.category };
  if (params.level) where.level = params.level as CourseLevel;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { summary: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: { category: true, reviews: { select: { rating: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pb-24">
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-[#10241f] px-5 py-16 text-white sm:rounded-[2.4rem] sm:px-10 lg:py-24">
          <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-7xl">
            <p className="eyebrow !text-accent">Программы Bilim</p>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">Найдите курс под цель, а не просто предмет</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/55">Подготовка к экзаменам, развитие базы и уверенный следующий уровень — с понятной программой и контролем прогресса.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[1.3rem] border border-border bg-surface p-4 shadow-glow-sm">
        <CourseFilters categories={categories} />
      </div>

      {courses.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={toCourseCardData(course)} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={SearchX}
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или сбросить фильтры."
          />
        </div>
      )}
      </div>
    </div>
  );
}
