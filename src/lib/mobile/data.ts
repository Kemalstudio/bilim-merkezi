import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/*
 * Read models for the mobile app. The API returns data, not sentences: the app writes the
 * words in the parent's language. Money is in whole manat (numbers), dates are ISO strings.
 */

const money = (value: Prisma.Decimal | null) => (value === null ? null : Number(value));

const courseCardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  level: true,
  levelCode: true,
  track: true,
  price: true,
  discountPrice: true,
  durationHours: true,
  lessonsPerWeek: true,
  startDate: true,
  ageMin: true,
  ageMax: true,
  groupSize: true,
  coverImage: true,
  instructorName: true,
  instructorAvatar: true,
  featured: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.CourseSelect;

type CourseCardRow = Prisma.CourseGetPayload<{ select: typeof courseCardSelect }>;

async function ratingsFor(courseIds: string[]) {
  if (courseIds.length === 0) return new Map<string, { average: number; count: number }>();
  const rows = await prisma.review.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((row) => [row.courseId, { average: Math.round((row._avg.rating ?? 0) * 10) / 10, count: row._count._all }])
  );
}

function toCourseCard(course: CourseCardRow, rating: { average: number; count: number } | undefined) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    level: course.level,
    levelCode: course.levelCode,
    track: course.track,
    price: money(course.price)!,
    discountPrice: money(course.discountPrice),
    durationHours: course.durationHours,
    lessonsPerWeek: course.lessonsPerWeek,
    startDate: course.startDate?.toISOString() ?? null,
    ageMin: course.ageMin,
    ageMax: course.ageMax,
    groupSize: course.groupSize,
    coverImage: course.coverImage,
    instructorName: course.instructorName,
    instructorAvatar: course.instructorAvatar,
    featured: course.featured,
    category: course.category,
    rating: rating ?? { average: 0, count: 0 },
  };
}

export type CourseCardDto = ReturnType<typeof toCourseCard>;

/** The published catalogue, featured first, with the categories that have courses. */
export async function getCatalog() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: courseCardSelect,
  });
  const ratings = await ratingsFor(courses.map((course) => course.id));
  const categories = new Map<string, { slug: string; name: string; count: number }>();
  for (const course of courses) {
    const entry = categories.get(course.category.slug) ?? { ...course.category, count: 0 };
    entry.count += 1;
    categories.set(course.category.slug, entry);
  }
  return {
    categories: [...categories.values()],
    courses: courses.map((course) => toCourseCard(course, ratings.get(course.id))),
  };
}

export async function getCourseDetail(slug: string) {
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    select: {
      ...courseCardSelect,
      description: true,
      outcomes: true,
      skills: true,
      requirements: true,
      audience: true,
      teachingLanguage: true,
      certificate: true,
      weeklyHoursMin: true,
      weeklyHoursMax: true,
      instructorTitle: true,
      instructorBio: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          goal: true,
          lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, durationMin: true } },
        },
      },
      scheduleEvents: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 5,
        select: { id: true, title: true, startsAt: true, endsAt: true, location: true },
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });
  if (!course) return null;

  const rating = (await ratingsFor([course.id])).get(course.id);
  return {
    ...toCourseCard(course, rating),
    description: course.description,
    outcomes: course.outcomes,
    skills: course.skills,
    requirements: course.requirements,
    audience: course.audience,
    teachingLanguage: course.teachingLanguage,
    certificate: course.certificate,
    weeklyHoursMin: course.weeklyHoursMin,
    weeklyHoursMax: course.weeklyHoursMax,
    instructorTitle: course.instructorTitle,
    instructorBio: course.instructorBio,
    modules: course.modules,
    upcoming: course.scheduleEvents.map((event) => ({
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
    })),
    reviews: course.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      author: review.user.name?.split(" ")[0] ?? null,
    })),
  };
}

/** Every enrollment of the parent, newest first. */
export async function getEnrollments(userId: string, take?: number) {
  const rows = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      course: { select: { id: true, slug: true, title: true, category: { select: { name: true, slug: true } } } },
      child: { select: { id: true, firstName: true, lastName: true, avatarHue: true } },
      payment: { select: { status: true, amount: true } },
    },
  });
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    payment: row.payment ? { status: row.payment.status, amount: money(row.payment.amount)! } : null,
  }));
}

/** Lessons of the parent's active courses between now and `days` ahead, with whose they are. */
export async function getSchedule(userId: string, days: number, take?: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    select: { courseId: true, child: { select: { id: true, firstName: true, avatarHue: true } } },
  });
  if (enrollments.length === 0) return [];

  const childrenByCourse = new Map<string, { id: string; firstName: string; avatarHue: number }[]>();
  for (const enrollment of enrollments) {
    const list = childrenByCourse.get(enrollment.courseId) ?? [];
    if (enrollment.child) list.push(enrollment.child);
    childrenByCourse.set(enrollment.courseId, list);
  }

  const now = new Date();
  const events = await prisma.scheduleEvent.findMany({
    where: {
      courseId: { in: [...childrenByCourse.keys()] },
      startsAt: { gte: new Date(now.getTime() - 2 * 60 * 60_000), lte: new Date(now.getTime() + days * 86_400_000) },
    },
    orderBy: { startsAt: "asc" },
    take,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      location: true,
      course: { select: { id: true, slug: true, title: true, category: { select: { slug: true } } } },
    },
  });
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    location: event.location,
    course: { id: event.course.id, slug: event.course.slug, title: event.course.title, categorySlug: event.course.category.slug },
    children: childrenByCourse.get(event.course.id) ?? [],
  }));
}

export type FeedItem = {
  id: string;
  type: "enrollment_active" | "awaiting_payment" | "exam_result" | "lesson_soon";
  at: string;
  childName: string | null;
  courseTitle: string | null;
  /** exam_result: the exam and its score; lesson_soon: the lesson title and start. */
  examName?: string;
  score?: number;
  maxScore?: number;
  lessonTitle?: string;
  startsAt?: string;
};

/**
 * What happened lately, derived from the data itself rather than stored messages: seats
 * confirmed, payments waiting, new exam scores and lessons in the next two days. Nothing has to
 * remember to "send" anything, and admin edits show up on their own.
 */
export async function getFeed(userId: string, take = 30): Promise<FeedItem[]> {
  const since = new Date(Date.now() - 60 * 86_400_000);
  const [enrollments, exams, lessons] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, updatedAt: { gte: since }, status: { in: ["ACTIVE", "PENDING"] } },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        course: { select: { title: true } },
        child: { select: { firstName: true } },
        payment: { select: { status: true } },
      },
    }),
    prisma.examResult.findMany({
      where: { child: { parentId: userId }, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        examName: true,
        score: true,
        maxScore: true,
        createdAt: true,
        child: { select: { firstName: true } },
        course: { select: { title: true } },
      },
    }),
    getSchedule(userId, 2, 10),
  ]);

  const items: FeedItem[] = [];
  for (const enrollment of enrollments) {
    const waiting = enrollment.status === "PENDING" && enrollment.payment?.status === "PENDING";
    if (enrollment.status !== "ACTIVE" && !waiting) continue;
    items.push({
      id: `enrollment-${enrollment.id}-${enrollment.status}`,
      type: waiting ? "awaiting_payment" : "enrollment_active",
      at: enrollment.updatedAt.toISOString(),
      childName: enrollment.child?.firstName ?? null,
      courseTitle: enrollment.course.title,
    });
  }
  for (const exam of exams) {
    items.push({
      id: `exam-${exam.id}`,
      type: "exam_result",
      at: exam.createdAt.toISOString(),
      childName: exam.child?.firstName ?? null,
      courseTitle: exam.course?.title ?? null,
      examName: exam.examName,
      score: exam.score,
      maxScore: exam.maxScore,
    });
  }
  for (const lesson of lessons) {
    if (new Date(lesson.startsAt) < new Date()) continue;
    items.push({
      id: `lesson-${lesson.id}`,
      type: "lesson_soon",
      // Surfaces a day before the lesson (or now, if it is sooner).
      at: new Date(Math.min(Date.now(), new Date(lesson.startsAt).getTime() - 86_400_000)).toISOString(),
      childName: lesson.children.map((child) => child.firstName).join(", ") || null,
      courseTitle: lesson.course.title,
      lessonTitle: lesson.title,
      startsAt: lesson.startsAt,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, take);
}
