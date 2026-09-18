"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { explainProgressAction } from "@/actions/insight";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { tpl } from "@/lib/i18n/format";

/** On-demand summary of a child's results, written for the parent. */
export function ProgressInsight({ childId, name, hasExams }: { childId: string; name: string; hasExams: boolean }) {
  const { t } = useI18n();
  const i = t.account.insight;
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await explainProgressAction(childId);
        if ("error" in result) setError(result.error);
        else setText(result.text);
      } catch {
        setError(i.failed);
      }
    });
  }

  return (
    <section
      aria-labelledby="insight-title"
      aria-busy={isPending}
      className="rounded-2xl border border-border bg-surface p-6 shadow-glow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-xl items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[#0b2233]">
            <Sparkles aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <h2 id="insight-title" className="font-display text-lg font-semibold text-ink">
              {i.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{hasExams ? tpl(i.text, { name }) : i.needExams}</p>
          </div>
        </div>
        {hasExams && (
          <Button type="button" variant={text ? "outline" : "primary"} onClick={generate} disabled={isPending}>
            {text && !isPending && <RotateCcw aria-hidden className="h-4 w-4" />}
            {isPending ? i.generating : text ? i.regenerate : i.generate}
          </Button>
        )}
      </div>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </p>
        )}
        {text && (
          <div className="mt-5 rounded-xl bg-surface-sunken p-4">
            <p className="whitespace-pre-line text-sm leading-6 text-ink">{text}</p>
            <p className="mt-3 text-xs text-muted">{i.disclaimer}</p>
          </div>
        )}
      </div>
    </section>
  );
}
