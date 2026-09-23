import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ScheduleEventForm } from "@/components/admin/schedule-event-form";
import { ScheduleEventTable } from "@/components/admin/schedule-event-table";

export const metadata: Metadata = { title: "Расписание" };

export default async function AdminSchedulePage() {
  const [courses, events] = await Promise.all([
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.scheduleEvent.findMany({
      orderBy: { startsAt: "asc" },
      include: { course: { select: { title: true } } },
    }),
  ]);

  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    courseTitle: e.course.title,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    location: e.location,
    isPast: e.startsAt < new Date(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-ink">Расписание</h1>
        <p className="mt-1 text-muted">Занятия по курсам — отображаются в кабинете родителя и на странице курса</p>
      </div>
      <ScheduleEventForm courses={courses} />
      <ScheduleEventTable events={rows} />
    </div>
  );
}
