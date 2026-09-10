"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { courseSchema } from "@/lib/validations/course";
import { logAction } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export type CourseActionState = { error?: string } | undefined;

function parseCourseForm(formData: FormData) {
  const raw = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    level: formData.get("level"),
    durationHours: formData.get("durationHours"),
    startDate: formData.get("startDate") || undefined,
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") || undefined,
    categoryId: formData.get("categoryId"),
    instructorName: formData.get("instructorName"),
    instructorTitle: formData.get("instructorTitle") || undefined,
    instructorBio: formData.get("instructorBio") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    modules: JSON.parse((formData.get("modulesJson") as string) || "[]"),
  };
  return courseSchema.safeParse(raw);
}

export async function createCourseAction(
  _prev: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");
  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const baseSlug = slugify(parsed.data.title);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++counter}`;
  }

  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      description: parsed.data.description,
      level: parsed.data.level,
      durationHours: parsed.data.durationHours,
      startDate: parsed.data.startDate ?? null,
      price: parsed.data.price,
      discountPrice: parsed.data.discountPrice ?? null,
      categoryId: parsed.data.categoryId,
      instructorName: parsed.data.instructorName,
      instructorTitle: parsed.data.instructorTitle,
      instructorBio: parsed.data.instructorBio,
      coverImage: parsed.data.coverImage,
      published: parsed.data.published,
      featured: parsed.data.featured,
      modules: {
        create: parsed.data.modules.map((mod, index) => ({
          title: mod.title,
          position: index,
          lessons: {
            create: mod.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              durationMin: lesson.durationMin,
              position: lessonIndex,
            })),
          },
        })),
      },
    },
  });

  await logAction(admin.id, "course.created", "course", course.id, { title: course.title });
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect("/admin/courses");
}

export async function updateCourseAction(
  courseId: string,
  _prev: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");
  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.lesson.deleteMany({ where: { module: { courseId } } });
    await tx.courseModule.deleteMany({ where: { courseId } });

    await tx.course.update({
      where: { id: courseId },
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        description: parsed.data.description,
        level: parsed.data.level,
        durationHours: parsed.data.durationHours,
        startDate: parsed.data.startDate ?? null,
        price: parsed.data.price,
        discountPrice: parsed.data.discountPrice ?? null,
        categoryId: parsed.data.categoryId,
        instructorName: parsed.data.instructorName,
        instructorTitle: parsed.data.instructorTitle,
        instructorBio: parsed.data.instructorBio,
        coverImage: parsed.data.coverImage,
        published: parsed.data.published,
        featured: parsed.data.featured,
        modules: {
          create: parsed.data.modules.map((mod, index) => ({
            title: mod.title,
            position: index,
            lessons: {
              create: mod.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                durationMin: lesson.durationMin,
                position: lessonIndex,
              })),
            },
          })),
        },
      },
    });
  });

  await logAction(admin.id, "course.updated", "course", courseId);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect("/admin/courses");
}

export async function deleteCourseAction(courseId: string): Promise<CourseActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const enrollmentCount = await prisma.enrollment.count({ where: { courseId } });
  if (enrollmentCount > 0) {
    return {
      error: "Нельзя удалить курс с записями студентов. Снимите курс с публикации вместо удаления.",
    };
  }

  await prisma.course.delete({ where: { id: courseId } });
  await logAction(admin.id, "course.deleted", "course", courseId);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}

export async function toggleCoursePublishedAction(courseId: string, published: boolean) {
  const admin = await requireRole("ADMIN", "MODERATOR");
  await prisma.course.update({ where: { id: courseId }, data: { published } });
  await logAction(admin.id, published ? "course.published" : "course.unpublished", "course", courseId);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}
