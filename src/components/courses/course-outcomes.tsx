import { Check } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

/** What the child will learn: the results of the course and the skills it trains, before the programme. */
export async function CourseOutcomes({ outcomes, skills }: { outcomes: string[]; skills: string[] }) {
  if (outcomes.length === 0 && skills.length === 0) return null;
  const { t } = await getI18n();

  return (
    <section aria-labelledby="outcomes-title" className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-7">
      <h2 id="outcomes-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">
        {t.course.outcomesTitle}
      </h2>
      {outcomes.length > 0 && (
        <ul className="mt-5 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {outcomes.map((outcome) => (
            <li key={outcome} className="flex items-start gap-3 text-sm leading-6 text-ink-soft">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {outcome}
            </li>
          ))}
        </ul>
      )}
      {skills.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t.course.skillsTitle}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill} className="rounded-full border border-brand/15 bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-ink">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
