"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { ArrowLeft, Check, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { enrollAction } from "@/actions/enrollments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "@/components/courses/document-upload";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";

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
  variant = "primary",
  profiles,
}: {
  courseId: string;
  label: string;
  variant?: "primary" | "outline";
  profiles: EnrollableChild[];
}) {
  const { t } = useI18n();
  const e = t.enroll;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string>(profiles[0]?.id ?? NEW_CHILD);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const stepOneRef = useRef<HTMLDivElement>(null);

  const isNewChild = selected === NEW_CHILD;
  const selectedChild = profiles.find((child) => child.id === selected);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep(1);
      setError(null);
      setSelected(profiles[0]?.id ?? NEW_CHILD);
    }
  }

  // Step one's inputs are hidden while step two shows, and the browser cannot point at an
  // invalid hidden field — so they are checked here, before moving on.
  function goToStepTwo() {
    const fields = stepOneRef.current?.querySelectorAll<HTMLInputElement>("input:not([type=radio])") ?? [];
    for (const field of fields) {
      if (!field.reportValidity()) return;
    }
    setError(null);
    setStep(2);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await enrollAction(courseId, formData);
        if (result?.error) setError(result.error);
      } catch (error) {
        unstable_rethrow(error);
        const message = e.networkError;
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={reset}>
      <ResponsiveDialogTrigger asChild>
        <Button size="lg" variant={variant} className="w-full">
          {label}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{step === 1 ? e.stepChild : e.stepDocument}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {step === 1 ? e.stepChildHint : e.stepDocumentHint}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <StepIndicator step={step} />

        <form action={handleSubmit} className="flex flex-col gap-4">
          {/* Step one's fields stay mounted while step two shows, so their values
              survive the transition without a second piece of state. */}
          <div ref={stepOneRef} className={cn("flex flex-col gap-4", step !== 1 && "hidden")}>
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
                {e.addChild}
              </button>
            </div>

            {isNewChild && (
              <div className="flex flex-col gap-3 rounded-xl bg-surface-sunken p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName">{e.lastName}</Label>
                    <Input id="lastName" name="lastName" required={isNewChild} minLength={2} autoComplete="family-name" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName">{e.firstName}</Label>
                    <Input id="firstName" name="firstName" required={isNewChild} minLength={2} autoComplete="given-name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="birthDate">{e.birthDate}</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      required={isNewChild}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="grade">{e.grade}</Label>
                    <Input id="grade" name="grade" type="number" min={1} max={12} placeholder="9" />
                  </div>
                </div>
              </div>
            )}

            <Button type="button" size="lg" className="mt-1 w-full" onClick={goToStepTwo}>
              {e.continue}
            </Button>
          </div>

          <div className={cn("flex flex-col gap-4", step !== 2 && "hidden")}>
            {!isNewChild && selectedChild && (
              <input type="hidden" name="childId" value={selectedChild.id} />
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documentNumber">{e.documentNumber}</Label>
              <Input id="documentNumber" name="documentNumber" required={step === 2} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documentFile-input">{e.documentFile}</Label>
              <DocumentUpload name="documentFile" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promoCode">{e.promoCode}</Label>
              <Input
                id="promoCode"
                name="promoCode"
                placeholder={e.promoPlaceholder}
                className="uppercase"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
                {error}
              </p>
            )}

            <div className="mt-1 flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                disabled={isPending}
              >
                <ArrowLeft aria-hidden className="h-4 w-4" /> {t.common.back}
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={isPending}>
                {isPending ? e.goingToPayment : e.toPayment}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
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
  const { f } = useI18n();
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
        {child.grade != null && <span className="block text-xs text-muted">{f.grade(child.grade)}</span>}
      </span>
      {checked && <Check aria-hidden className="h-4 w-4 shrink-0 text-brand-ink" />}
    </label>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const { t } = useI18n();
  const steps = [
    { number: 1 as const, label: t.enroll.stepChildShort, icon: UserRound },
    { number: 2 as const, label: t.enroll.stepDocumentShort, icon: Check },
  ];

  return (
    <ol className="flex items-center gap-2" aria-label={t.enroll.stepsLabel}>
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
