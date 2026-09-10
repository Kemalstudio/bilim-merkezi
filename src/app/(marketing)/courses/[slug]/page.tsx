import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, Signal, Star, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate, initials, pluralizeRu } from "@/lib/utils";
import { getLevelLabel } from "@/lib/course-visuals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CourseCover } from "@/components/courses/course-cover";
import { Curriculum } from "@/components/courses/curriculum";
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
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{course.category.name}</Badge>
            <Badge variant="neutral">{getLevelLabel(course.level)}</Badge>
            {!course.published && <Badge variant="rose">Черновик</Badge>}
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">{course.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{course.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-ink-soft">
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
              {pluralizeRu(course._count.enrollments, ["студент", "студента", "студентов"])}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-start" /> {course.durationHours}{" "}
              {pluralizeRu(course.durationHours, ["час", "часа", "часов"])}
            </span>
            <span className="flex items-center gap-1.5">
              <Signal className="h-4 w-4 text-brand-start" /> {getLevelLabel(course.level)}
            </span>
            {course.startDate && (
              <span className="flex items-center gap-1.5 text-accent-deep">
                <CalendarDays className="h-4 w-4" /> Старт {formatDate(course.startDate)}
              </span>
            )}
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink">О курсе</h2>
            <p className="mt-3 whitespace-pre-line text-ink-soft">{course.description}</p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-ink">Программа курса</h2>
            <p className="mt-1 text-sm text-muted">
              {course.modules.length} {pluralizeRu(course.modules.length, ["модуль", "модуля", "модулей"])} ·{" "}
              {(() => {
                const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
                return `${lessonCount} ${pluralizeRu(lessonCount, ["урок", "урока", "уроков"])}`;
              })()}
            </p>
            <div className="mt-4">
              <Curriculum modules={course.modules} />
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
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
                  <Clock className="h-4 w-4 text-brand-start" /> {course.durationHours}{" "}
                  {pluralizeRu(course.durationHours, ["час", "часа", "часов"])} видео и практики
                </li>
                <li className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-brand-start" /> Уровень: {getLevelLabel(course.level)}
                </li>
                <li className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-brand-start" /> Доступ навсегда
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
