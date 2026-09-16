import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, CalendarRange, Clock, LineChart, Repeat, Signal, Star, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate, initials, pluralizeRu } from "@/lib/utils";
import { getLevelLabel } from "@/lib/course-visuals";
import { lessonsPerWeekLabel, totalHoursLabel, weeklyHoursLabel, weeksLabel } from "@/lib/course-schedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CourseCover } from "@/components/courses/course-cover";
import { WeeklyProgram } from "@/components/courses/weekly-program";
import { ReviewList } from "@/components/courses/review-list";
import { ReviewForm } from "@/components/courses/review-form";
import { EnrollmentDialog } from "@/components/courses/enrollment-dialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true, summary: true },
  });
  if (!course) return {};
  return { title: course.title, description: course.summary };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) notFound();

  const canPreviewUnpublished = session?.user.role === "ADMIN" || session?.user.role === "MODERATOR";
  if (!course.published && !canPreviewUnpublished) notFound();

  const reviewCount = course.reviews.length;
  const avgRating =
    reviewCount > 0 ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const hasDiscount = course.discountPrice != null && Number(course.discountPrice) < Number(course.price);
  const format = {
    lessonsPerWeek: course.lessonsPerWeek,
    weeklyHoursMin: course.weeklyHoursMin,
    weeklyHoursMax: course.weeklyHoursMax,
  };
  const weekCount = course.modules.length;

  const enrollment = session?.user
    ? await prisma.enrollment.findFirst({
        where: { userId: session.user.id, courseId: course.id },
        orderBy: { status: "asc" },
      })
    : null;

  const isActive = enrollment?.status === "ACTIVE";

  // Powers step one of the enrollment wizard, so a returning parent picks a
  // saved child instead of retyping their details.
  const enrollableChildren = session?.user
    ? await prisma.child.findMany({
        where: { parentId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, firstName: true, lastName: true, grade: true, avatarHue: true },
      })
    : [];
  const myReview = session?.user
    ? course.reviews.find((review) => review.userId === session.user.id)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Навигация" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/courses" className="transition-colors hover:text-ink">
          Каталог
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/courses?category=${course.category.slug}`} className="transition-colors hover:text-ink">
          {course.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{course.category.name}</Badge>
            <Badge variant="neutral">{getLevelLabel(course.level)}</Badge>
            {!course.published && <Badge variant="rose">Черновик</Badge>}
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">{course.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-soft">{course.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5 text-amber">
              <Star className="h-4 w-4 fill-current" />
              {avgRating > 0 ? avgRating.toFixed(1) : "новый курс"}
              {reviewCount > 0 && (
                <span className="text-muted">
                  ({reviewCount} {pluralizeRu(reviewCount, ["отзыв", "отзыва", "отзывов"])})
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4 text-brand-start" /> {course._count.enrollments}{" "}
              {pluralizeRu(course._count.enrollments, ["ученик", "ученика", "учеников"])}
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-brand-start" /> {lessonsPerWeekLabel(course.lessonsPerWeek)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-start" /> {weeklyHoursLabel(format)}
            </span>
            {weekCount > 0 && (
              <span className="flex items-center gap-1.5">
                <CalendarRange className="h-4 w-4 text-brand-start" /> {weeksLabel(weekCount)}
              </span>
            )}
            {course.startDate && (
              <span className="flex items-center gap-1.5 text-accent-deep">
                <CalendarDays className="h-4 w-4" /> Старт {formatDate(course.startDate)}
              </span>
            )}
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">О курсе</h2>
            <p className="mt-3 whitespace-pre-line text-ink-soft">{course.description}</p>
          </div>

          <div className="mt-12" id="program">
            <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">Программа по неделям</h2>
            <p className="mt-1 text-sm text-muted">
              Выберите неделю, чтобы увидеть уроки и темы. Часы в неделю включают уроки, практику и домашние задания.
            </p>
            <div className="mt-5">
              <WeeklyProgram weeks={course.modules} format={format} />
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-bold text-ink">Преподаватель</h2>
            <div className="mt-4 flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-base">{initials(course.instructorName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-ink">{course.instructorName}</p>
                {course.instructorTitle && <p className="text-sm text-muted">{course.instructorTitle}</p>}
              </div>
            </div>
            {course.instructorBio && <p className="mt-4 text-sm text-ink-soft">{course.instructorBio}</p>}
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink">
              Отзывы {reviewCount > 0 && `(${reviewCount})`}
            </h2>
            <div className="mt-4">
              {isActive && (
                <div className="mb-6">
                  <ReviewForm courseId={course.id} hasReviewed={Boolean(myReview)} />
                </div>
              )}
              <ReviewList reviews={course.reviews} />
            </div>
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-glow-md">
            <CourseCover categorySlug={course.category.slug} className="aspect-video w-full" />
            <div className="p-6">
              <div className="flex items-baseline gap-2">
                {hasDiscount && (
                  <span className="text-lg text-muted line-through">
                    {formatCurrency(course.price.toString())}
                  </span>
                )}
                <span className="font-display text-3xl font-bold text-ink">
                  {formatCurrency((course.discountPrice ?? course.price).toString())}
                </span>
              </div>

              <div className="mt-6">
                {!session?.user ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/login?callbackUrl=/courses/${course.slug}`}>Войти, чтобы записаться</Link>
                  </Button>
                ) : isActive ? (
                  <Link
                    href="/account/enrollments"
                    className="flex h-11 w-full items-center justify-center rounded-full bg-emerald/10 text-sm font-semibold text-emerald"
                  >
                    Вы записаны · Перейти к курсу
                  </Link>
                ) : (
                  <EnrollmentDialog
                    courseId={course.id}
                    label={enrollment?.status === "PENDING" ? "Продолжить оплату" : "Записать ребёнка"}
                    profiles={enrollableChildren}
                  />
                )}
              </div>

              <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-soft">
                {course.startDate && (
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-start" /> Старт {formatDate(course.startDate)}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-brand-start" /> {lessonsPerWeekLabel(course.lessonsPerWeek)}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-start" /> {weeklyHoursLabel(format)} учёбы
                </li>
                {weekCount > 0 && (
                  <li className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 text-brand-start" /> {weeksLabel(weekCount)} ·{" "}
                    {totalHoursLabel(weekCount, format)}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-brand-start" /> Уровень: {getLevelLabel(course.level)}
                </li>
                <li className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-brand-start" /> Прогресс виден в личном кабинете
                </li>
              </ul>

              {weekCount > 0 && (
                <a
                  href="#program"
                  className="mt-5 block rounded-xl bg-surface-sunken px-4 py-3 text-center text-sm font-bold text-brand-ink transition-colors hover:bg-border"
                >
                  Смотреть программу по неделям
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
