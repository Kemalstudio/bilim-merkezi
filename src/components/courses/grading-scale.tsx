import { GRADING_SCALE } from "@/lib/course-levels";
import { getI18n } from "@/lib/i18n/server";
import { getUiDictionary } from "@/lib/i18n/ui";
import { cn } from "@/lib/utils";

const TONES = {
  emerald: "bg-emerald",
  brand: "bg-brand",
  amber: "bg-amber",
  rose: "bg-rose",
} as const;

// Certificates carry the English mark next to the local one, so it is shown in every language.
const EN_BANDS = getUiDictionary("en").grading.bands;

/** How results are marked: weekly tests and the final test are scored out of 100. */
export async function GradingScale({ certificate }: { certificate: boolean }) {
  const { t, locale } = await getI18n();

  return (
    <section aria-labelledby="grading-title" className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-7">
      <h2 id="grading-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">
        {t.grading.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        {t.grading.description}
        {certificate && ` ${t.grading.certificateNote}`}
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
                {t.grading.bands[band.key]}
                {locale !== "en" && <span className="text-muted"> · {EN_BANDS[band.key]}</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
