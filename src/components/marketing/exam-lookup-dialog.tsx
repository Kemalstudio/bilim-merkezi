"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Award, Phone } from "lucide-react";
import { lookupExamResultsAction, type ExamResultItem } from "@/actions/exam-results";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";

function scoreColor(score: number, maxScore: number) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 0.7) return "text-emerald";
  if (pct >= 0.5) return "text-amber";
  return "text-rose";
}

export function ExamLookupDialog({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExamResultItem[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    formData.set("phone", phone);
    startTransition(async () => {
      const state = await lookupExamResultsAction(undefined, formData);
      if (state?.error) {
        setError(state.error);
        setResults(null);
      } else {
        setResults(state?.results ?? []);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setPhone("");
      setError(null);
      setResults(null);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-start" /> Результаты экзаменов
          </DialogTitle>
          <DialogDescription>
            Введите номер телефона, указанный при записи на курс, чтобы посмотреть баллы.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exam-phone">Номер телефона</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="exam-phone"
                type="tel"
                placeholder="+993 65 123456"
                className="pl-11"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
          </div>
          <Button type="button" onClick={handleSubmit} disabled={isPending} className="mt-1">
            {isPending ? "Поиск..." : "Проверить результаты"}
          </Button>
        </div>

        {results && results.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-sunken/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{result.examName}</p>
                  <p className="truncate text-xs text-muted">
                    {result.courseTitle ?? "Общий экзамен"} · {formatDate(result.examDate)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-display text-lg font-bold",
                    scoreColor(result.score, result.maxScore)
                  )}
                >
                  {result.score}/{result.maxScore}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
