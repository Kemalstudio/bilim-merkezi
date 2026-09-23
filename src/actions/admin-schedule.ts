"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { scheduleEventSchema } from "@/lib/validations/schedule-event";

export type ScheduleEventActionState = { error?: string; success?: boolean } | undefined;

export async function createScheduleEventAction(
  _prev: ScheduleEventActionState,
  formData: FormData
): Promise<ScheduleEventActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const parsed = scheduleEventSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") || undefined,
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId }, select: { id: true, slug: true } });
  if (!course) {
    return { error: "Курс не найден" };
  }

  const event = await prisma.scheduleEvent.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt ?? null,
      location: parsed.data.location ?? null,
    },
  });

  await logAction(admin.id, "scheduleEvent.created", "scheduleEvent", event.id, { courseId: course.id, title: event.title });
  revalidatePath("/bilim/admin/schedule");
  revalidatePath("/account");
  revalidatePath(`/courses/${course.slug}`);
  return { success: true };
}

export async function deleteScheduleEventAction(id: string): Promise<ScheduleEventActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");

  const event = await prisma.scheduleEvent.findUnique({ where: { id }, select: { course: { select: { slug: true } } } });
  if (!event) return { error: "Занятие не найдено" };

  await prisma.scheduleEvent.delete({ where: { id } });
  await logAction(admin.id, "scheduleEvent.deleted", "scheduleEvent", id);
  revalidatePath("/bilim/admin/schedule");
  revalidatePath("/account");
  revalidatePath(`/courses/${event.course.slug}`);
}
