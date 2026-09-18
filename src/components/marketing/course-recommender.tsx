"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Question = { question: string; options: string[] };

type RecommenderLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  questions: Question[];
  resultTitle: string;
  resultReason: string;
  resultCta: string;
  restart: string;
  next: string;
};

// Index of the "interest" question (question 2) options maps 1:1 to real category slugs,
// kept in the same order across every locale dictionary.
const INTEREST_QUESTION_INDEX = 1;
const INTEREST_SLUGS = ["programming", "creative", "languages", "math"];

export function CourseRecommender({ labels }: { labels: RecommenderLabels }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const isDone = answers.length === labels.questions.length;

  function selectOption(optionIndex: number) {
    const next = [...answers, optionIndex];
    setAnswers(next);
    if (next.length < labels.questions.length) setStep(step + 1);
  }

  function restart() {
    setAnswers([]);
    setStep(0);
  }

  const interestAnswer = answers[INTEREST_QUESTION_INDEX];
  const recommendedSlug =
    interestAnswer !== undefined ? INTEREST_SLUGS[interestAnswer] ?? "programming" : "programming";
  const recommendedLabel =
    interestAnswer !== undefined
      ? labels.questions[INTEREST_QUESTION_INDEX].options[interestAnswer]
      : labels.questions[INTEREST_QUESTION_INDEX].options[0];

  return (
    <div className="grid overflow-hidden rounded-[1.6rem] border border-border bg-surface lg:grid-cols-[0.82fr_1.18fr]">
      <div className="relative overflow-hidden bg-[#e2604f] p-7 text-white sm:p-10">
        <div aria-hidden className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full border-[34px] border-white/10" />
        <div className="relative flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-white/75">
          <Sparkles className="h-4 w-4" /> {labels.eyebrow}
        </div>
        <h3 className="relative mt-5 max-w-sm font-display text-3xl font-bold leading-[1.04] tracking-[-0.05em] sm:text-4xl">{labels.title}</h3>
        <p className="relative mt-5 max-w-sm text-sm leading-6 text-white/75">{labels.subtitle}</p>
      </div>

      {!isDone ? (
        <div key={step} className="animate-overlay-in p-7 sm:p-10">
          <div className="mb-4 flex items-center gap-1.5">
            {labels.questions.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < step ? "bg-brand" : i === step ? "bg-accent-deep/50" : "bg-border"
                )}
              />
            ))}
          </div>
          <p className="mt-8 font-display text-xl font-bold tracking-[-0.03em] text-ink">{labels.questions[step].question}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {labels.questions[step].options.map((option, i) => (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(i)}
                className="cursor-pointer rounded-xl border border-border bg-surface-sunken/50 px-4 py-3.5 text-left text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-brand hover:bg-accent"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-overlay-in m-7 rounded-[1.3rem] border border-border bg-surface-sunken/60 p-6 text-center sm:m-10">
          <p className="text-sm font-semibold text-brand-ink">{labels.resultTitle}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{recommendedLabel}</p>
          <p className="mt-2 text-sm text-muted">{labels.resultReason}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="group">
              <Link href={`/courses?category=${recommendedSlug}`}>
                {labels.resultCta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button variant="ghost" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
              {labels.restart}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
