import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CourseTable } from "@/components/admin/course-table";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Курсы" };

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: { category: true, _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = courses.map((c) => ({
    id: c.id,
    title: c.title,
    category: { name: c.category.name },
    price: c.price.toString(),
    published: c.published,
    enrollmentCount: c._count.enrollments,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Курсы</h1>
          <p className="mt-1 text-muted">Управление каталогом курсов</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4" /> Добавить курс
          </Link>
        </Button>
      </div>

      {rows.length > 0 ? (
        <CourseTable courses={rows} />
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Пока нет курсов"
          description="Создайте первый курс, чтобы он появился в каталоге."
        />
      )}
    </div>
  );
}
