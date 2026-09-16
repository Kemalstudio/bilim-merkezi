"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResourceUpload } from "@/components/admin/resource-upload";
import { createLibraryResourceAction } from "@/actions/admin-library";

export function LibraryResourceForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [published, setPublished] = useState(true);
  const [courseId, setCourseId] = useState<string>("none");
  const formRef = useRef<HTMLFormElement>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createLibraryResourceAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Материал добавлен");
      formRef.current?.reset();
      setPublished(true);
      setCourseId("none");
      setUploadKey((key) => key + 1);
    });
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <input type="hidden" name="published" value={published ? "on" : ""} />
      <input type="hidden" name="courseId" value={courseId === "none" ? "" : courseId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Название материала</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="courseId">Привязать к курсу</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger id="courseId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без привязки</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      <div key={uploadKey} className="flex flex-col gap-1.5">
        <Label>Файл</Label>
        <ResourceUpload />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-soft">
          <Switch checked={published} onCheckedChange={setPublished} /> Опубликован
        </label>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Добавление..." : "Добавить материал"}
        </Button>
      </div>
    </form>
  );
}
