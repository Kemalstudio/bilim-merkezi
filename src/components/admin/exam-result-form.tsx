"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExamResultAction } from "@/actions/admin-exam-results";

type Student = { enrollmentId: string; courseId: string; courseTitle: string; childName: string };

const today = () => new Date().toISOString().slice(0, 10);

export function ExamResultForm({ students }: { students: Student[] }) {
  const courses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of students) seen.set(s.courseId, s.courseTitle);
    return [...seen].map(([id, title]) => ({ id, title }));
  }, [students]);

  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const inCourse = students.filter((s) => s.courseId === courseId);
  const [enrollmentId, setEnrollmentId] = useState(inCourse[0]?.enrollmentId ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function pickCourse(id: string) {
    setCourseId(id);
    setEnrollmentId(students.find((s) => s.courseId === id)?.enrollmentId ?? "");
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createExamResultAction(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Баллы сохранены — родитель получит уведомление");
      // Keep course, student, exam name and maximum: scores of one test are entered in a row.
      const score = formRef.current?.elements.namedItem("score") as HTMLInputElement | null;
      if (score) {
        score.value = "";
        score.focus();
      }
      router.refresh();
    });
  }

  if (students.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
        Пока нет учеников с подтверждённой записью — баллы ставятся детям, записанным на курс.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-6"
    >
      <input type="hidden" name="enrollmentId" value={enrollmentId} />

      <div className="flex flex-col gap-1.5 lg:col-span-3">
        <Label htmlFor="result-course">Курс</Label>
        <Select value={courseId} onValueChange={pickCourse}>
          <SelectTrigger id="result-course">
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
        <Label htmlFor="result-student">Ученик</Label>
        <Select value={enrollmentId} onValueChange={setEnrollmentId}>
          <SelectTrigger id="result-student">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inCourse.map((s) => (
              <SelectItem key={s.enrollmentId} value={s.enrollmentId}>
                {s.childName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="examName">Контрольная или экзамен</Label>
        <Input id="examName" name="examName" placeholder="Контрольная №2. Дроби" required maxLength={120} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="score">Баллы</Label>
        <Input id="score" name="score" type="number" min={0} inputMode="numeric" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="maxScore">Из</Label>
        <Input id="maxScore" name="maxScore" type="number" min={1} max={1000} defaultValue={100} inputMode="numeric" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="examDate">Дата</Label>
        <Input id="examDate" name="examDate" type="date" defaultValue={today()} required />
      </div>

      <div className="flex items-end sm:col-span-2 lg:col-span-6">
        <Button type="submit" disabled={isPending || !enrollmentId} className="ml-auto">
          {isPending ? "Сохранение..." : "Сохранить баллы"}
        </Button>
      </div>
    </form>
  );
}
