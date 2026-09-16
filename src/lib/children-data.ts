import "server-only";

import { prisma } from "@/lib/prisma";

export type ExamPoint = {
  id: string;
  examName: string;
  score: number;
  maxScore: number;
  percent: number;
  examDate: string;
  courseTitle: string | null;
};

export type ChildSummary = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  grade: number | null;
  notes: string | null;
  avatarHue: number;
  activeCourses: number;
  latestExam: ExamPoint | null;
  /** Percentage-point change between the two most recent exams, if any. */
  trend: number | null;
};

export type ChildDetail = ChildSummary & {
  exams: ExamPoint[];
  averagePercent: number | null;
  bestPercent: number | null;
  enrollments: {
    id: string;
    status: "PENDING" | "ACTIVE" | "CANCELLED";
    courseTitle: string;
    courseSlug: string;
    categoryName: string;
    createdAt: string;
  }[];
  upcoming: ScheduleItem[];
};

export type ScheduleItem = {
  id: string;
  title: string;
  courseTitle: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  childName: string | null;
};

function toPoint(result: {
  id: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: Date;
  course: { title: string } | null;
}): ExamPoint {
  return {
    id: result.id,
    examName: result.examName,
    score: result.score,
    maxScore: result.maxScore,
    percent: result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0,
    examDate: result.examDate.toISOString(),
    courseTitle: result.course?.title ?? null,
  };
}

const examSelect = {
  id: true,
  examName: true,
  score: true,
  maxScore: true,
  examDate: true,
  course: { select: { title: true } },
} as const;

/** All children of one parent, with just enough data for the overview cards. */
export async function getChildrenForParent(parentId: string): Promise<ChildSummary[]> {
  const children = await prisma.child.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    include: {
      examResults: { select: examSelect, orderBy: { examDate: "desc" }, take: 2 },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });

  return children.map((child) => {
    const [latest, previous] = child.examResults.map(toPoint);
    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      birthDate: child.birthDate.toISOString(),
      grade: child.grade,
      notes: child.notes,
      avatarHue: child.avatarHue,
      activeCourses: child._count.enrollments,
      latestExam: latest ?? null,
      trend: latest && previous ? latest.percent - previous.percent : null,
    };
  });
}

/**
 * One child, scoped by parentId so a forged id from another account misses
 * rather than leaking. Returns null when the child is not the caller's.
 */
export async function getChildDetail(
  childId: string,
  parentId: string
): Promise<ChildDetail | null> {
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    include: {
      examResults: { select: examSelect, orderBy: { examDate: "asc" } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: { course: { select: { title: true, slug: true, category: true } } },
      },
    },
  });
  if (!child) return null;

  const exams = child.examResults.map(toPoint);
  const percents = exams.map((exam) => exam.percent);
  const courseIds = child.enrollments
    .filter((enrollment) => enrollment.status === "ACTIVE")
    .map((enrollment) => enrollment.courseId);

  const events = courseIds.length
    ? await prisma.scheduleEvent.findMany({
        where: { courseId: { in: courseIds }, startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 5,
        include: { course: { select: { title: true } } },
      })
    : [];

  const ordered = [...exams].reverse();
  const [latest, previous] = ordered;

  return {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    birthDate: child.birthDate.toISOString(),
    grade: child.grade,
    notes: child.notes,
    avatarHue: child.avatarHue,
    activeCourses: courseIds.length,
    latestExam: latest ?? null,
    trend: latest && previous ? latest.percent - previous.percent : null,
    exams,
    averagePercent: percents.length
      ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length)
      : null,
    bestPercent: percents.length ? Math.max(...percents) : null,
    enrollments: child.enrollments.map((enrollment) => ({
      id: enrollment.id,
      status: enrollment.status,
      courseTitle: enrollment.course.title,
      courseSlug: enrollment.course.slug,
      categoryName: enrollment.course.category.name,
      createdAt: enrollment.createdAt.toISOString(),
    })),
    upcoming: events.map((event) => ({
      id: event.id,
      title: event.title,
      courseTitle: event.course.title,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      location: event.location,
      childName: child.firstName,
    })),
  };
}

/** Next events across every child of one parent, for the dashboard timeline. */
export async function getUpcomingForParent(
  parentId: string,
  take = 5
): Promise<ScheduleItem[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: parentId, status: "ACTIVE" },
    select: { courseId: true, child: { select: { firstName: true } } },
  });
  if (enrollments.length === 0) return [];

  const childByCourse = new Map(
    enrollments.map((enrollment) => [enrollment.courseId, enrollment.child?.firstName ?? null])
  );

  const events = await prisma.scheduleEvent.findMany({
    where: { courseId: { in: [...childByCourse.keys()] }, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take,
    include: { course: { select: { title: true } } },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    courseTitle: event.course.title,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    location: event.location,
    childName: childByCourse.get(event.courseId) ?? null,
  }));
}
