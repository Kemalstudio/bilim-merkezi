import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANGUAGE_LADDER } from "@/lib/course-levels";
import { getI18n } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

type LadderCourse = { slug: string; levelCode: string | null };

/**
 * The level path: every step of the ladder, the current course highlighted, and the steps that
 * have a published course linked to it — so a parent sees where the child starts and what comes next.
 */
export async function LevelLadder({
  track,
  levelCode,
  courses,
}: {
  track: string;
  levelCode: string | null;
  /** Published courses of the same track, including this one. */
  courses: LadderCourse[];
}) {
  const { t, f } = await getI18n();
  const slugByCode = new Map(courses.filter((c) => c.levelCode).map((c) => [c.levelCode!, c.slug]));
  const currentIndex = LANGUAGE_LADDER.findIndex((step) => step.code === levelCode);
  const next = currentIndex >= 0 ? LANGUAGE_LADDER.slice(currentIndex + 1).find((step) => slugByCode.has(step.code)) : undefined;

  return (
    <section aria-labelledby="ladder-title" className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-ink">{f.track(track)}</p>
      <h2 id="ladder-title" className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-ink">
        {t.ladder.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t.ladder.description}</p>

      <ol className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {LANGUAGE_LADDER.map((step, index) => {
          const current = step.code === levelCode;
          const passed = currentIndex >= 0 && index < currentIndex;
          const slug = slugByCode.get(step.code);
          // The first step is the starter course; the rest are numbered from 1.
          const stage = index === 0 ? t.ladder.starter : tpl(t.ladder.numbered, { n: index });
          const body = (
            <>
              <span
                className={cn(
                  "flex h-10 w-12 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold",
                  current ? "bg-accent text-[#0b2233]" : passed ? "bg-emerald/15 text-emerald" : "bg-surface-sunken text-ink-soft"
                )}
              >
                {step.code}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[0.65rem] font-bold uppercase tracking-[0.1em]", current ? "text-accent" : "text-muted")}>
                  {stage}
                  {current && <span className="sr-only"> — {t.ladder.current}</span>}
                </span>
                <span className="block text-sm font-bold leading-tight">{step.name}</span>
              </span>
            </>
          );
          const className = cn(
            "flex items-center gap-3 rounded-2xl border p-2.5 transition-all duration-200",
            current ? "border-panel bg-panel text-white shadow-glow-md" : "border-border bg-surface text-ink"
          );
          return (
            <li key={step.code}>
              {slug && !current ? (
                <Link href={`/courses/${slug}`} className={cn(className, "hover:-translate-y-0.5 hover:border-brand/40")}>
                  {body}
                </Link>
              ) : (
                <div className={cn(className, !current && !slug && "opacity-70")} aria-current={current ? "step" : undefined}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {next && (
        <Link
          href={`/courses/${slugByCode.get(next.code)}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-ink underline-offset-4 hover:underline"
        >
          {tpl(t.ladder.next, { name: next.name, code: next.code })}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
