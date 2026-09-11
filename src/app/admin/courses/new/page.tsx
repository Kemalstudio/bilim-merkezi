import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";
import { createCourseAction } from "@/actions/admin-courses";

export const metadata: Metadata = { title: "Новый курс" };

export default async function NewCoursePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Новый курс</h1>
      <div className="mt-6">
        <CourseForm categories={categories} action={createCourseAction} submitLabel="Создать курс" />
      </div>
    </div>
  );
}
