import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award, BookOpen, CalendarDays, CalendarRange, Clock, LineChart, NotebookPen, Repeat, Signal, Star, UserRound, Users as UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { weekLoad } from "@/lib/course-schedule";
import { siteUrl } from "@/lib/site-url";
import { getI18n } from "@/lib/i18n/server";
import { LANGUAGE_TAGS, tpl } from "@/lib/i18n/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CourseCover } from "@/components/courses/course-cover";
import { WeeklyProgram } from "@/components/courses/weekly-program";
import { ReviewList } from "@/components/courses/review-list";
import { CourseOutcomes } from "@/components/courses/course-outcomes";
import { CourseFacts } from "@/components/courses/course-facts";
import { CourseAudience } from "@/components/courses/course-audience";
import { GradingScale } from "@/components/courses/grading-scale";
import { LevelLadder } from "@/components/courses/level-ladder";
import { RatingSummary } from "@/components/courses/rating-summary";
import { ReviewForm } from "@/components/courses/review-form";
import { EnrollmentDialog } from "@/components/courses/enrollment-dialog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true, summary: true, published: true },
  });
  // Drafts stay out of titles and link previews.
  if (!course?.published) return {};
  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: `/courses/${slug}` },
    openGraph: { title: course.title, description: course.summary, url: `/courses/${slug}` },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [session, { t, f, locale }] = await Promise.all([auth(), getI18n()]);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { enrollments: true, libraryResources: { where: { published: true } } } },
    },
  });

  if (!course) notFound();

  const canPreviewUnpublished = session?.user.role === "ADMIN" || session?.user.role === "MODERATOR";
  if (!course.published && !canPreviewUnpublished) notFound();

  const reviewCount = course.reviews.length;
  const avgRating = reviewCount > 0 ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const hasDiscount = course.discountPrice != null && Number(course.discountPrice) < Number(course.price);
  const format = {
    lessonsPerWeek: course.lessonsPerWeek,
    weeklyHoursMin: course.weeklyHoursMin,
    weeklyHoursMax: course.weeklyHoursMax,
  };
  const weekCount = course.modules.length;
  const lessonMinutes = course.modules.flatMap((week) => week.lessons.map((lesson) => lesson.durationMin));
  const lessonCount = lessonMinutes.length;
  const age = f.ageRange(course.ageMin, course.ageMax);
  const levelText = course.levelCode ? `${f.level(course.level)} (${course.levelCode})` : f.level(course.level);
  // Practice hours over the whole course: the weekly remainder after lessons, per week.
  const practice = course.modules.reduce(
    (sum, week) => {
      const load = weekLoad(week.lessons.map((lesson) => lesson.durationMin), format);
      return { min: sum.min + load.practiceMin, max: sum.max + load.practiceMax };
    },
    { min: 0, max: 0 }
  );

  const [ladderCourses, myEnrollments, enrollableChildren] = await Promise.all([
    course.track
      ? prisma.course.findMany({
          where: { track: course.track, published: true },
          select: { slug: true, levelCode: true },
        })
      : Promise.resolve([]),
    // A parent can enroll several children, so every enrollment on this course matters.
    session?.user
      ? prisma.enrollment.findMany({ where: { userId: session.user.id, courseId: course.id }, select: { status: true } })
      : Promise.resolve([]),
    // Powers step one of the enrollment wizard, so a returning parent picks a saved child.
    session?.user
      ? prisma.child.findMany({
          where: { parentId: session.user.id },
          orderBy: { createdAt: "asc" },
          select: { id: true, firstName: true, lastName: true, grade: true, avatarHue: true },
        })
      : Promise.resolve([]),
  ]);

  const isActive = myEnrollments.some((item) => item.status === "ACTIVE");
  const hasPending = myEnrollments.some((item) => item.status === "PENDING");
  const myReview = session?.user ? course.reviews.find((review) => review.userId === session.user.id) : undefined;

  // schema.org Course, so search engines can show duration, level and price in results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url: `${siteUrl}/courses/${course.slug}`,
    provider: { "@type": "Organization", name: "Bilim Merkezi", sameAs: siteUrl },
    educationalLevel: f.level(course.level),
    inLanguage: LANGUAGE_TAGS[locale],
    teaches: course.skills.length > 0 ? course.skills : undefined,
    typicalAgeRange: course.ageMin && course.ageMax ? `${course.ageMin}-${course.ageMax}` : undefined,
    timeRequired: `PT${course.durationHours}H`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Blended",
      startDate: course.startDate?.toISOString().slice(0, 10),
      courseWorkload: `PT${course.weeklyHoursMax}H`,
      instructor: { "@type": "Person", name: course.instructorName },
    },
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: (course.discountPrice ?? course.price).toString(),
      priceCurrency: "USD",
    },
    ...(reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount } }
      : {}),
  };

  const sections = [
    ["#about", t.course.sections.about],
    ["#details", t.course.sections.details],
    ["#program", t.course.sections.program],
    ...(course.track ? [["#levels", t.course.sections.levels]] : []),
    ["#grading", t.course.sections.grading],
    ["#reviews", t.course.sections.reviews],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label={t.course.breadcrumbs} className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/courses" className="transition-colors hover:text-ink">
          {t.common.catalog}
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
            <Badge variant="neutral">
              {f.level(course.level)}
              {course.levelCode && ` · ${course.levelCode}`}
            </Badge>
            {age && (
              <Badge variant="amber">
                <UserRound aria-hidden className="h-3 w-3" /> {age}
              </Badge>
            )}
            {!course.published && <Badge variant="rose">{t.course.draft}</Badge>}
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">{course.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-soft">{course.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5 text-amber">
              <Star aria-hidden className="h-4 w-4 fill-current" />
              {avgRating > 0 ? avgRating.toFixed(1) : t.course.newCourse}
              {reviewCount > 0 && <span className="text-muted">({f.count(reviewCount, t.units.review)})</span>}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon aria-hidden className="h-4 w-4 text-brand-start" /> {f.count(course._count.enrollments, t.units.student)}
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat aria-hidden className="h-4 w-4 text-brand-start" /> {f.lessonsPerWeek(course.lessonsPerWeek)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden className="h-4 w-4 text-brand-start" /> {f.weeklyHours(format)}
            </span>
            {weekCount > 0 && (
              <span className="flex items-center gap-1.5">
                <CalendarRange aria-hidden className="h-4 w-4 text-brand-start" /> {f.weeks(weekCount)}
              </span>
            )}
            {course.startDate && (
              <span className="flex items-center gap-1.5 text-accent-deep">
                <CalendarDays aria-hidden className="h-4 w-4" /> {tpl(t.format.start, { date: f.date(course.startDate) })}
              </span>
            )}
          </div>

          <nav aria-label={t.course.sectionsLabel} className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1 text-sm font-semibold">
            {sections.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-ink-soft transition-colors hover:border-brand/40 hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-8 scroll-mt-28" id="about">
            <CourseOutcomes outcomes={course.outcomes} skills={course.skills} />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">{t.course.aboutTitle}</h2>
            <p className="mt-3 whitespace-pre-line text-ink-soft">{course.description}</p>
          </div>

          <div className="mt-12 scroll-mt-28" id="details">
            <CourseFacts course={course} format={format} weeks={weekCount} />
          </div>

          <div className="mt-12 scroll-mt-28" id="program">
            <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">{t.course.programTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.course.programHint}</p>
            <div className="mt-5">
              <WeeklyProgram weeks={course.modules} format={format} />
            </div>
          </div>

          {course.track && (
            <div className="mt-12 scroll-mt-28" id="levels">
              <LevelLadder track={course.track} levelCode={course.levelCode} courses={ladderCourses} />
            </div>
          )}

          <div className="mt-12">
            <CourseAudience audience={course.audience} requirements={course.requirements} />
          </div>

          <div className="mt-12 scroll-mt-28" id="grading">
            <GradingScale certificate={course.certificate} />
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-bold text-ink">{t.course.instructor}</h2>
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

          <div className="mt-10 scroll-mt-28" id="reviews">
            <h2 className="font-display text-xl font-bold text-ink">
              {t.course.reviewsTitle} {reviewCount > 0 && `(${reviewCount})`}
            </h2>
            <div className="mt-4">
              <RatingSummary ratings={course.reviews.map((review) => review.rating)} />
            </div>
            <div className="mt-6">
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
                {hasDiscount && <span className="text-lg text-muted line-through">{f.currency(course.price)}</span>}
                <span className="font-display text-3xl font-bold text-ink">{f.currency(course.discountPrice ?? course.price)}</span>
              </div>

              <div className="mt-6">
                {!session?.user ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/courses/${course.slug}`)}`}>
                      {t.course.signInToEnroll}
                    </Link>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    {isActive && (
                      <Link
                        href="/account/enrollments"
                        className="flex h-11 w-full items-center justify-center rounded-full bg-emerald/10 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/15"
                      >
                        {t.course.enrolled}
                      </Link>
                    )}
                    <EnrollmentDialog
                      courseId={course.id}
                      label={hasPending ? t.course.continuePayment : isActive ? t.course.enrollAnother : t.course.enroll}
                      variant={isActive && !hasPending ? "outline" : "primary"}
                      profiles={enrollableChildren}
                    />
                  </div>
                )}
                {!session?.user && <p className="mt-3 text-center text-xs text-muted">{t.course.signInHint}</p>}
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-muted">{t.course.includes}</p>
              <ul className="mt-3 flex flex-col gap-3 text-sm text-ink-soft">
                {lessonCount > 0 && (
                  <li className="flex items-center gap-2">
                    <BookOpen aria-hidden className="h-4 w-4 shrink-0 text-brand-start" />
                    {tpl(t.course.includesLessons, {
                      lessons: f.count(lessonCount, t.units.lesson),
                      minutes: f.minutes(lessonMinutes.reduce((a, b) => a + b, 0)),
                    })}
                  </li>
                )}
                {practice.max > 0 && (
                  <li className="flex items-center gap-2">
                    <NotebookPen aria-hidden className="h-4 w-4 shrink-0 text-brand-start" />
                    {tpl(t.course.includesPractice, { hours: f.range(practice.min, practice.max) })}
                  </li>
                )}
                {course._count.libraryResources > 0 && (
                  <li className="flex items-center gap-2">
                    <BookOpen aria-hidden className="h-4 w-4 shrink-0 text-brand-start" />
                    {tpl(t.course.includesLibrary, { materials: f.count(course._count.libraryResources, t.units.material) })}
                  </li>
                )}
                {course.certificate && (
                  <li className="flex items-center gap-2">
                    <Award aria-hidden className="h-4 w-4 shrink-0 text-brand-start" /> {t.course.includesCertificate}
                  </li>
                )}
                {age && (
                  <li className="flex items-center gap-2">
                    <UserRound aria-hidden className="h-4 w-4 shrink-0 text-brand-start" />
                    {tpl(t.course.includesAge, { age })}
                    {course.groupSize ? tpl(t.course.includesGroup, { size: course.groupSize }) : ""}
                  </li>
                )}
                {course.startDate && (
                  <li className="flex items-center gap-2">
                    <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-brand-start" />
                    {tpl(t.format.start, { date: f.date(course.startDate) })}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Repeat aria-hidden className="h-4 w-4 shrink-0 text-brand-start" /> {f.lessonsPerWeek(course.lessonsPerWeek)}
                </li>
                <li className="flex items-center gap-2">
                  <Clock aria-hidden className="h-4 w-4 shrink-0 text-brand-start" /> {f.weeklyHours(format)}
                </li>
                {weekCount > 0 && (
                  <li className="flex items-center gap-2">
                    <CalendarRange aria-hidden className="h-4 w-4 shrink-0 text-brand-start" /> {f.weeks(weekCount)} ·{" "}
                    {tpl(t.course.includesStudy, { hours: f.totalHours(weekCount, format) })}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Signal aria-hidden className="h-4 w-4 shrink-0 text-brand-start" /> {tpl(t.course.includesLevel, { level: levelText })}
                </li>
                <li className="flex items-center gap-2">
                  <LineChart aria-hidden className="h-4 w-4 shrink-0 text-brand-start" /> {t.course.includesProgress}
                </li>
              </ul>

              {weekCount > 0 && (
                <a
                  href="#program"
                  className="mt-5 block rounded-xl bg-surface-sunken px-4 py-3 text-center text-sm font-bold text-brand-ink transition-colors hover:bg-border"
                >
                  {t.course.seeProgram}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
