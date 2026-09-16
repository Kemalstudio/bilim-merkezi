"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { ArrowLeft, Check, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { enrollAction } from "@/actions/enrollments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "@/components/courses/document-upload";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EnrollableChild = {
  id: string;
  firstName: string;
  lastName: string;
  grade: number | null;
  avatarHue: number;
};

const NEW_CHILD = "__new__";

/**
 * Two steps to a paid seat: who is being enrolled, then the document. A parent
 * with a saved child profile taps once and lands straight on step two, because
 * the name and birth date are already on file.
 */
export function EnrollmentDialog({
  courseId,
  label,
  profiles,
}: {
  courseId: string;
  label: string;
  profiles: EnrollableChild[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string>(profiles[0]?.id ?? NEW_CHILD);
  const [isPending, startTransition] = useTransition();

  const isNewChild = selected === NEW_CHILD;
  const selectedChild = profiles.find((child) => child.id === selected);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep(1);
      setSelected(profiles[0]?.id ?? NEW_CHILD);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await enrollAction(courseId, formData);
      } catch (error) {
        unstable_rethrow(error);
        toast.error(error instanceof Error ? error.message : "Не удалось начать оформление");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Кого записываем?" : "Документ ребёнка"}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Выберите ребёнка или добавьте нового — данные сохранятся в вашем кабинете."
              : "Нужен один документ для подтверждения записи в центре."}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} />

        <form action={handleSubmit} className="flex flex-col gap-4">
          {/* Step one's fields stay mounted while step two shows, so their values
              survive the transition without a second piece of state. */}
          <div className={cn("flex flex-col gap-4", step !== 1 && "hidden")}>
            <div className="flex flex-col gap-2">
              {profiles.map((child) => (
                <ChildOption
                  key={child.id}
                  child={child}
                  checked={selected === child.id}
                  onSelect={() => setSelected(child.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setSelected(NEW_CHILD)}
                aria-pressed={isNewChild}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 border-dashed p-3 text-left text-sm font-semibold transition-colors",
                  isNewChild
                    ? "border-brand-start bg-brand-start/5 text-brand-ink"
                    : "border-border text-ink-soft hover:border-accent-deep hover:text-ink"
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-sunken">
                  <Plus aria-hidden className="h-4 w-4" />
                </span>
                Добавить ребёнка
              </button>
            </div>

            {isNewChild && (
              <div className="flex flex-col gap-3 rounded-xl bg-surface-sunken p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input id="lastName" name="lastName" required={isNewChild} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input id="firstName" name="firstName" required={isNewChild} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="birthDate">Дата рождения</Label>
                    <Input id="birthDate" name="birthDate" type="date" required={isNewChild} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="grade">Класс</Label>
                    <Input id="grade" name="grade" type="number" min={1} max={12} placeholder="9" />
                  </div>
                </div>
              </div>
            )}

            <Button type="button" size="lg" className="mt-1 w-full" onClick={() => setStep(2)}>
              Продолжить
            </Button>
          </div>

          <div className={cn("flex flex-col gap-4", step !== 2 && "hidden")}>
            {!isNewChild && selectedChild && (
              <input type="hidden" name="childId" value={selectedChild.id} />
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documentNumber">Номер свидетельства о рождении</Label>
              <Input id="documentNumber" name="documentNumber" required={step === 2} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Скан или фото документа</Label>
              <DocumentUpload name="documentFile" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promoCode">Промокод (если есть)</Label>
              <Input
                id="promoCode"
                name="promoCode"
                placeholder="Например, BILIM10"
                className="uppercase"
              />
            </div>

            <div className="mt-1 flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                disabled={isPending}
              >
                <ArrowLeft aria-hidden className="h-4 w-4" /> Назад
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={isPending}>
                {isPending ? "Переходим к оплате..." : "Перейти к оплате"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChildOption({
  child,
  checked,
  onSelect,
}: {
  child: EnrollableChild;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors",
        checked ? "border-brand-start bg-brand-start/5" : "border-border hover:border-accent-deep"
      )}
    >
      <input
        type="radio"
        name="childChoice"
        value={child.id}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: `hsl(${child.avatarHue} 55% 42%)` }}
      >
        {child.firstName[0]}
        {child.lastName[0]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">
          {child.firstName} {child.lastName}
        </span>
        {child.grade != null && <span className="block text-xs text-muted">{child.grade} класс</span>}
      </span>
      {checked && <Check aria-hidden className="h-4 w-4 shrink-0 text-brand-ink" />}
    </label>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { number: 1 as const, label: "Ребёнок", icon: UserRound },
    { number: 2 as const, label: "Документ", icon: Check },
  ];

  return (
    <ol className="flex items-center gap-2" aria-label="Шаги записи">
      {steps.map((item, index) => {
        const done = step > item.number;
        const active = step === item.number;
        return (
          <li key={item.number} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done || active ? "bg-brand-ink text-white" : "bg-surface-sunken text-muted"
              )}
            >
              {done ? <Check aria-hidden className="h-3.5 w-3.5" /> : item.number}
            </span>
            <span className={cn("text-xs font-semibold", active ? "text-ink" : "text-muted")}>
              {item.label}
            </span>
            {index === 0 && (
              <span className={cn("h-px flex-1", step > 1 ? "bg-brand-ink" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
