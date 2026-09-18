"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { courseSchema, type CourseInput } from "@/lib/validations/course";
import { logAction } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { estimateDurationHours } from "@/lib/course-schedule";
import { invalidateKnowledge } from "@/lib/ai/knowledge";

export type CourseActionState = { error?: string } | undefined;

/** Non-empty trimmed lines of a textarea. */
function lines(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseCourseForm(formData: FormData) {
  const raw = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    level: formData.get("level"),
    lessonsPerWeek: formData.get("lessonsPerWeek"),
    weeklyHoursMin: formData.get("weeklyHoursMin"),
    weeklyHoursMax: formData.get("weeklyHoursMax"),
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
    outcomes: lines(formData, "outcomes"),
    skills: lines(formData, "skills"),
    requirements: lines(formData, "requirements"),
    audience: lines(formData, "audience"),
    ageMin: formData.get("ageMin") || undefined,
    ageMax: formData.get("ageMax") || undefined,
    groupSize: formData.get("groupSize") || undefined,
    teachingLanguage: formData.get("teachingLanguage") || undefined,
    certificate: formData.get("certificate") === "on",
    track: formData.get("track") || undefined,
    levelCode: formData.get("levelCode") || undefined,
    modules: JSON.parse((formData.get("modulesJson") as string) || "[]"),
  };
  return courseSchema.safeParse(raw);
}

/** Course fields shared by create and update; the total duration follows from the weeks. */
function courseFields(data: CourseInput) {
  return {
    title: data.title,
    summary: data.summary,
    description: data.description,
    level: data.level,
    lessonsPerWeek: data.lessonsPerWeek,
    weeklyHoursMin: data.weeklyHoursMin,
    weeklyHoursMax: data.weeklyHoursMax,
    durationHours: estimateDurationHours(data.modules.length, data),
    startDate: data.startDate ?? null,
    price: data.price,
    discountPrice: data.discountPrice ?? null,
    categoryId: data.categoryId,
    instructorName: data.instructorName,
    instructorTitle: data.instructorTitle,
    instructorBio: data.instructorBio,
    coverImage: data.coverImage,
    published: data.published,
    featured: data.featured,
    outcomes: data.outcomes,
    skills: data.skills,
    requirements: data.requirements,
    audience: data.audience,
    ageMin: data.ageMin ?? null,
    ageMax: data.ageMax ?? null,
    groupSize: data.groupSize ?? null,
    teachingLanguage: data.teachingLanguage || null,
    certificate: data.certificate,
    track: data.track || null,
    levelCode: data.track ? data.levelCode || null : null,
  };
}

/** Weeks (modules) with their lessons and topics, in form order. */
function weeksCreate(data: CourseInput) {
  return {
    create: data.modules.map((week, index) => ({
      title: week.title,
      goal: week.goal || null,
      position: index,
      lessons: {
        create: week.lessons.map((lesson, lessonIndex) => ({
          title: lesson.title,
          durationMin: lesson.durationMin,
          topics: lesson.topics,
          position: lessonIndex,
        })),
      },
    })),
  };
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
    data: { ...courseFields(parsed.data), slug, modules: weeksCreate(parsed.data) },
  });

  await logAction(admin.id, "course.created", "course", course.id, { title: course.title });
  revalidatePath("/bilim/admin/courses");
  revalidatePath("/courses");
  invalidateKnowledge();
  redirect("/bilim/admin/courses");
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
      data: { ...courseFields(parsed.data), modules: weeksCreate(parsed.data) },
    });
  });

  await logAction(admin.id, "course.updated", "course", courseId);
  revalidatePath("/bilim/admin/courses");
  revalidatePath("/courses");
  invalidateKnowledge();
  redirect("/bilim/admin/courses");
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
  revalidatePath("/bilim/admin/courses");
  revalidatePath("/courses");
  invalidateKnowledge();
}

export async function toggleCoursePublishedAction(courseId: string, published: boolean) {
  const admin = await requireRole("ADMIN", "MODERATOR");
  await prisma.course.update({ where: { id: courseId }, data: { published } });
  await logAction(admin.id, published ? "course.published" : "course.unpublished", "course", courseId);
  revalidatePath("/bilim/admin/courses");
  revalidatePath("/courses");
  invalidateKnowledge();
}
