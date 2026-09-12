"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { createChildAction, updateChildAction } from "@/actions/children";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ChildFormValues = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  grade: number | null;
  notes: string | null;
};

/** Add or edit a child profile. The same form serves both, keyed by `child`. */
export function ChildFormDialog({
  child,
  triggerVariant = "primary",
}: {
  child?: ChildFormValues;
  triggerVariant?: "primary" | "outline" | "subtle";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(child);

  // The action is dispatched by hand rather than through `useActionState` so
  // closing the dialog and raising the toast happen where the result arrives,
  // instead of in an effect watching for a state change.
  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = child
        ? await updateChildAction(child.id, undefined, formData)
        : await createChildAction(undefined, formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Профиль обновлён" : "Профиль ребёнка добавлен");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant={triggerVariant} size="sm">
            <Pencil aria-hidden className="h-3.5 w-3.5" /> Изменить
          </Button>
        ) : (
          <Button variant={triggerVariant}>
            <Plus aria-hidden className="h-4 w-4" /> Добавить ребёнка
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Профиль ребёнка" : "Новый профиль"}</DialogTitle>
          <DialogDescription>
            Эти данные видите только вы. Они подставятся при записи на курс.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={child?.lastName}
                required
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={child?.firstName}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="birthDate">Дата рождения</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={child?.birthDate.slice(0, 10)}
                required
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grade">Класс</Label>
              <Input
                id="grade"
                name="grade"
                type="number"
                min={1}
                max={12}
                placeholder="9"
                defaultValue={child?.grade ?? undefined}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Заметка для преподавателя</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="Например: готовимся к экзамену по математике в мае"
              defaultValue={child?.notes ?? ""}
              disabled={isPending}
            />
          </div>

          <Button type="submit" size="lg" className="mt-1" disabled={isPending}>
            {isPending ? "Сохраняем..." : isEdit ? "Сохранить" : "Добавить профиль"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
