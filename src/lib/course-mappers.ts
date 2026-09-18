import type { Prisma } from "@prisma/client";
import type { CourseCardData } from "@/components/courses/course-card";

export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: { category: true; reviews: { select: { rating: true } } };
}> & {
  /** Include `_count: { select: { modules: true } }` to show the programme length on the card. */
  _count?: { modules?: number };
};

export function toCourseCardData(course: CourseWithRelations): CourseCardData {
  const reviewCount = course.reviews.length;
  const avgRating =
    reviewCount > 0 ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  return {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    price: course.price.toString(),
    discountPrice: course.discountPrice?.toString() ?? null,
    level: course.level,
    durationHours: course.durationHours,
    startDate: course.startDate,
    instructorName: course.instructorName,
    category: { name: course.category.name, slug: course.category.slug },
    avgRating,
    reviewCount,
    weeks: course._count?.modules ?? 0,
    lessonsPerWeek: course.lessonsPerWeek,
    weeklyHoursMin: course.weeklyHoursMin,
    weeklyHoursMax: course.weeklyHoursMax,
    ageMin: course.ageMin,
    ageMax: course.ageMax,
    levelCode: course.levelCode,
  };
}
