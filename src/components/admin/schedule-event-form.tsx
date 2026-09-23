"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createScheduleEventAction } from "@/actions/admin-schedule";

export function ScheduleEventForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [courseId, setCourseId] = useState<string>(courses[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createScheduleEventAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Занятие добавлено в расписание");
      formRef.current?.reset();
    });
  }

  if (courses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
        Сначала создайте хотя бы один курс — расписание привязывается к курсу.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <input type="hidden" name="courseId" value={courseId} />

      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <Label htmlFor="courseId-select">Курс</Label>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger id="courseId-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-3">
        <Label htmlFor="title">Название занятия</Label>
        <Input id="title" name="title" placeholder="Урок 5. Дроби" required />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-2">
        <Label htmlFor="startsAt">Начало</Label>
        <Input id="startsAt" name="startsAt" type="datetime-local" required />
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <Label htmlFor="endsAt">Окончание (необязательно)</Label>
        <Input id="endsAt" name="endsAt" type="datetime-local" />
      </div>

      <div className="flex flex-col gap-1.5 lg:col-span-1">
        <Label htmlFor="location">Место</Label>
        <Input id="location" name="location" placeholder="Кабинет 3" />
      </div>

      <div className="flex items-end lg:col-span-5">
        <Button type="submit" disabled={isPending} className="ml-auto">
          {isPending ? "Добавление..." : "Добавить в расписание"}
        </Button>
      </div>
    </form>
  );
}
