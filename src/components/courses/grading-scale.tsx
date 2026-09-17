import { GRADING_SCALE } from "@/lib/course-levels";
import { cn } from "@/lib/utils";

const TONES = {
  emerald: "bg-emerald",
  brand: "bg-brand",
  amber: "bg-amber",
  rose: "bg-rose",
} as const;

/** How results are marked: weekly tests and the final test are scored out of 100. */
export function GradingScale({ certificate }: { certificate: boolean }) {
  return (
    <section aria-labelledby="grading-title" className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-7">
      <h2 id="grading-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">
        Как оцениваем результат
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Каждую неделю — короткий тест, в конце курса — итоговая работа. Баллы из 100 сразу появляются в личном кабинете
        родителя.
        {certificate && " Сертификат выдаём при итоговом результате от 60 баллов, оценка указывается в нём."}
      </p>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full" aria-hidden>
        {[...GRADING_SCALE].reverse().map((band) => (
          <span key={band.min} className={cn("h-full", TONES[band.tone])} style={{ width: `${band.max - band.min + 1}%` }} />
        ))}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GRADING_SCALE.map((band) => (
          <li key={band.min} className="flex items-center gap-3 rounded-2xl bg-surface-sunken/60 p-3.5">
            <span aria-hidden className={cn("h-9 w-1.5 shrink-0 rounded-full", TONES[band.tone])} />
            <div>
              <p className="font-display text-lg font-bold tabular-nums tracking-[-0.02em] text-ink">
                {band.min}–{band.max}
              </p>
              <p className="text-xs font-semibold text-ink-soft">
                {band.label} <span className="text-muted">· {band.en}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
