import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LibraryResourceForm } from "@/components/admin/library-resource-form";
import { LibraryResourceTable } from "@/components/admin/library-resource-table";

export const metadata: Metadata = { title: "Библиотека" };

export default async function AdminLibraryPage() {
  const [resources, courses] = await Promise.all([
    prisma.libraryResource.findMany({ include: { course: true }, orderBy: { createdAt: "desc" } }),
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  const rows = resources.map((r) => ({
    id: r.id,
    title: r.title,
    fileType: r.fileType,
    fileSizeKb: r.fileSizeKb,
    courseTitle: r.course?.title ?? null,
    published: r.published,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Библиотека материалов</h1>
        <p className="mt-1 text-muted">Учебные материалы, доступные студентам на странице «Библиотека»</p>
      </div>
      <LibraryResourceForm courses={courses} />
      <LibraryResourceTable resources={rows} />
    </div>
  );
}
