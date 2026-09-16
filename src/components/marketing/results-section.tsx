import { ArrowRight, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ExamLookupDialog } from "@/components/marketing/exam-lookup-dialog";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { CountUp } from "@/components/shared/count-up";
import { SplitHeading } from "@/components/shared/split-heading";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Score bands, strongest first — the order they are shown in. */
const BANDS = [
  { key: "top", min: 90, tone: "bg-emerald" },
  { key: "high", min: 75, tone: "bg-brand-start" },
  { key: "mid", min: 60, tone: "bg-accent" },
  { key: "low", min: 0, tone: "bg-border" },
] as const;

/**
 * The proof block: what children who studied here actually scored. Every number
 * is computed from recorded exam results rather than written into the copy, so
 * it cannot drift away from reality.
 */
export async function ResultsSection({ labels }: { labels: Dictionary["results"] }) {
  const results = await prisma.examResult.findMany({
    select: { score: true, maxScore: true },
    where: { maxScore: { gt: 0 } },
  });

  const percents = results.map((result) => (result.score / result.maxScore) * 100);
  const total = percents.length;

  const average = total ? Math.round(percents.reduce((sum, value) => sum + value, 0) / total) : 0;
  const strongShare = total
    ? Math.round((percents.filter((percent) => percent >= 75).length / total) * 100)
    : 0;

  const distribution = BANDS.map((band, index) => {
    const upper = index === 0 ? Infinity : BANDS[index - 1].min;
    const count = percents.filter((percent) => percent >= band.min && percent < upper).length;
    return {
      ...band,
      label: labels.bands[band.key],
      share: total ? Math.round((count / total) * 100) : 0,
    };
  });

  return (
    <section id="results" className="scroll-mt-24 px-3 py-20 sm:px-5 lg:py-28">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-[#f0b968] sm:rounded-[2.4rem]">
        <AnimeReveal className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12 lg:py-24">
          <div>
            <Badge className="gap-1.5 border-[#0b2233]/10 bg-[#0b2233] text-white">
              <Trophy aria-hidden className="h-3 w-3" /> {labels.eyebrow}
            </Badge>
            <SplitHeading className="section-title mt-6 max-w-lg text-[#0b2233]">{labels.title}</SplitHeading>
            <p className="mt-6 max-w-md leading-7 text-[#2f4d63]">{labels.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="border-l-2 border-[#0b2233] pl-4">
                <p className="font-display text-5xl font-bold tracking-[-0.06em] text-[#0b2233]">
                  <CountUp value={average} suffix="%" />
                </p>
                <p className="mt-2 max-w-32 text-xs font-semibold leading-5 text-[#41607a]">{labels.averageLabel}</p>
              </div>
              <div className="border-l-2 border-[#0b2233] pl-4">
                <p className="font-display text-5xl font-bold tracking-[-0.06em] text-[#0b2233]">
                  <CountUp value={strongShare} suffix="%" />
                </p>
                <p className="mt-2 max-w-36 text-xs font-semibold leading-5 text-[#41607a]">{labels.strongLabel}</p>
              </div>
            </div>

            <ExamLookupDialog>
              <button
                type="button"
                className="group mt-9 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0b2233] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0b3950] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2233] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0b968]"
              >
                {labels.cta}
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </ExamLookupDialog>
          </div>

          <div className="rounded-[1.7rem] border border-black/10 bg-[#ffffff] p-6 shadow-[0_28px_70px_-35px_rgba(17,17,17,0.55)] sm:p-8">
            <p className="text-sm font-bold text-[#0b2233]">
              {labels.distributionTitle}
              {total > 0 && (
                <span className="font-normal text-[#6a8299]">
                  {" "}
                  · {total} {labels.worksSuffix}
                </span>
              )}
            </p>

            {total === 0 ? (
              <p className="mt-6 text-sm text-[#6a8299]">{labels.empty}</p>
            ) : (
              <ul className="mt-6 flex flex-col gap-4">
                {distribution.map((band) => (
                  <li key={band.key} className="flex items-center gap-4">
                    <span className="w-20 shrink-0 text-sm text-[#6a8299]">{band.label}</span>
                    <span
                      className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e2ebf2]"
                      role="img"
                      aria-label={`${band.label}: ${band.share}%`}
                    >
                      <span
                        className={`block h-full rounded-full ${band.tone}`}
                        style={{ width: `${band.share}%` }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right text-sm font-bold text-[#0b2233]">
                      {band.share}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AnimeReveal>
      </div>
    </section>
  );
}
