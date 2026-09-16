import Link from "next/link";
import { ArrowRight, Award, ListChecks, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Constellation } from "@/components/marketing/constellation";
import { ExamLookupDialog } from "@/components/marketing/exam-lookup-dialog";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function QuickActionsSection({ labels }: { labels: Dictionary["quickActions"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
      <AnimeReveal className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Link
          href="/courses"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl brand-gradient p-8 shadow-glow-lg transition-transform duration-300 hover:-translate-y-1 sm:p-10"
        >
          <Constellation
            variant="watermark"
            className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 text-white opacity-20"
          />
          <div className="relative">
            <Badge className="bg-white/15 text-white">{labels.badge}</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">{labels.title}</h2>
            <p className="mt-3 max-w-sm text-white/85">{labels.description}</p>
          </div>
          <span className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-ink transition-transform group-hover:translate-x-1">
            {labels.cta} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <div className="flex flex-col gap-6">
          <Link
            href="/courses"
            className="group flex flex-1 items-center gap-4 rounded-3xl border border-border bg-surface p-6 shadow-glow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-sunken">
              <ListChecks className="h-6 w-6 text-brand-start" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-ink">{labels.catalogTitle}</h3>
              <p className="mt-1 text-sm text-muted">{labels.catalogDesc}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
          </Link>

          <ExamLookupDialog>
            <button
              type="button"
              className="group flex flex-1 w-full items-center gap-4 rounded-3xl border border-border bg-surface p-6 text-left shadow-glow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-md cursor-pointer"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-sunken">
                <Award className="h-6 w-6 text-brand-start" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-ink">{labels.examTitle}</h3>
                  <Badge variant="amber" className="gap-1">
                    <Sparkles className="h-3 w-3" /> {labels.examBadge}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{labels.examDesc}</p>
              </div>
            </button>
          </ExamLookupDialog>
        </div>
      </AnimeReveal>
    </section>
  );
}
