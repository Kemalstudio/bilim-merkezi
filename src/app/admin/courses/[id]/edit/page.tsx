import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";
import { updateCourseAction } from "@/actions/admin-courses";

export const metadata: Metadata = { title: "Редактировать курс" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, course] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findUnique({
      where: { id },
      include: {
        modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      },
    }),
  ]);

  if (!course) notFound();

  const boundAction = updateCourseAction.bind(null, course.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Редактировать курс</h1>
      <div className="mt-6">
        <CourseForm
          categories={categories}
          action={boundAction}
          submitLabel="Сохранить изменения"
          initialData={{
            title: course.title,
            summary: course.summary,
            description: course.description,
            level: course.level,
            durationHours: course.durationHours,
            startDate: course.startDate?.toISOString() ?? null,
            price: course.price.toString(),
            discountPrice: course.discountPrice?.toString() ?? null,
            categoryId: course.categoryId,
            instructorName: course.instructorName,
            instructorTitle: course.instructorTitle,
            instructorBio: course.instructorBio,
            coverImage: course.coverImage,
            published: course.published,
            featured: course.featured,
            modules: course.modules.map((m) => ({
              title: m.title,
              lessons: m.lessons.map((l) => ({ title: l.title, durationMin: l.durationMin })),
            })),
          }}
        />
      </div>
    </div>
  );
}
