"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Award, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  lookupExamResultsAction,
  requestExamCodeAction,
  type ExamResultItem,
} from "@/actions/exam-results";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneField } from "@/components/auth/phone-field";
import { OtpInput } from "@/components/auth/otp-input";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import { tpl } from "@/lib/i18n/format";

function scoreColor(score: number, maxScore: number) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 0.7) return "text-emerald";
  if (pct >= 0.5) return "text-amber";
  return "text-rose";
}

type Sent = { phone: string; maskedPhone: string };

/**
 * Exam results for a parent who has not signed in: phone number, then the SMS code, then the
 * scores. The code step keeps a child's results private to whoever holds the phone.
 */
export function ExamLookupDialog({ children }: { children: ReactNode }) {
  const { t, f } = useI18n();
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResultItem[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const codeFormRef = useRef<HTMLFormElement>(null);

  function reset() {
    setSent(null);
    setError(null);
    setResults(null);
  }

  function requestCode(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const state = await requestExamCodeAction(formData);
      if (state.status === "error") {
        setError(state.error);
        return;
      }
      setSent({ phone: state.phone, maskedPhone: state.maskedPhone });
      if (state.simulated) toast.info(t.auth.simulated, { duration: 8000 });
    });
  }

  function showResults(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const state = await lookupExamResultsAction(formData);
      if (state.status === "error") setError(state.error);
      else setResults(state.results);
    });
  }

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award aria-hidden className="h-5 w-5 text-brand-start" /> {t.exam.title}
          </DialogTitle>
          <DialogDescription>
            {sent ? tpl(t.exam.codeStep, { phone: sent.maskedPhone }) : t.exam.phoneStep}
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <form action={requestCode} className="flex flex-col gap-3">
            <PhoneField name="phone" autoFocus disabled={isPending} />
            {error && (
              <p role="alert" className="text-sm text-rose">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isPending} className="mt-1">
              {isPending ? t.exam.searching : t.exam.getCode}
            </Button>
          </form>
        ) : results === null ? (
          <form ref={codeFormRef} action={showResults} className="flex flex-col gap-3">
            <input type="hidden" name="phone" value={sent.phone} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t.auth.code}</Label>
              <OtpInput disabled={isPending} onComplete={() => codeFormRef.current?.requestSubmit()} />
            </div>
            {error && (
              <p role="alert" className="text-sm text-rose">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? t.exam.searching : t.exam.show}
            </Button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 self-start text-xs text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden className="h-3 w-3" /> {t.exam.otherNumber}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {results.length === 0 ? (
              <p className="rounded-xl bg-surface-sunken p-4 text-sm text-muted">{t.exam.empty}</p>
            ) : (
              <ul className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
                {results.map((result) => (
                  <li
                    key={result.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-sunken/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{result.examName}</p>
                      <p className="truncate text-xs text-muted">
                        {result.studentName} · {result.courseTitle ?? t.exam.generalExam} · {f.date(result.examDate)}
                      </p>
                    </div>
                    <p className={cn("shrink-0 font-display text-lg font-bold", scoreColor(result.score, result.maxScore))}>
                      {result.score}/{result.maxScore}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken p-3 text-xs text-ink-soft">
              <span className="flex items-center gap-2">
                <ShieldCheck aria-hidden className="h-4 w-4 shrink-0 text-emerald" />
                {t.exam.loginHint}
              </span>
              <Link href="/login?callbackUrl=%2Faccount" className="shrink-0 font-semibold text-brand-ink hover:underline">
                {t.exam.toAccount}
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
