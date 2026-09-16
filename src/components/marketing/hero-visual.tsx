import { CalendarDays, ClipboardCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { HeroReportSettings } from "@/lib/site-settings-schema";
import { buildReportChart, formatScoreChange } from "@/lib/hero-report-chart";
import { HeroSceneSlot } from "@/components/marketing/hero-scene-slot";
import { HeroVisualReveal } from "@/components/marketing/hero-visual-reveal";

/**
 * The hero report card. Its checkpoints and topics come from /bilim/admin/site/hero-card and
 * its captions from the hero texts. The markup holds the last week; HeroStage walks the card
 * through the earlier ones on scroll.
 */
export function HeroVisual({
  labels,
  report,
  locale,
  allow3d = true,
}: {
  labels: Dictionary["hero"]["report"];
  report: HeroReportSettings;
  locale: Locale;
  allow3d?: boolean;
}) {
  const chart = buildReportChart(report.checkpoints);
  const first = report.checkpoints[0];
  const last = report.checkpoints[report.checkpoints.length - 1];

  return (
    <HeroVisualReveal className="relative mx-auto aspect-[0.94] w-full max-w-[520px]">
      <HeroSceneSlot className="absolute -inset-16 opacity-45" allow3d={allow3d} />

      <div data-hv-card className="absolute inset-x-9 top-8 overflow-hidden rounded-[1.8rem] border border-white/30 bg-[#f6fafc] p-6 text-[#0b2233] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)] xl:inset-x-7 xl:p-7">
        <div className="flex items-start justify-between gap-4">
          <div data-hv-fade>
            <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.16em] text-[#5a8399]">{labels.eyebrow}</p>
            <h2 className="mt-1.5 font-display text-lg font-bold tracking-[-0.03em]">{labels.subject}</h2>
          </div>
          <span data-hv-pop className="shrink-0 rounded-full bg-[#e2ebf2] px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-[#35566b]">
            {labels.week}{" "}
            <span data-report-week data-from={first.week} data-to={last.week} className="tabular-nums">
              {last.week}
            </span>
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between border-b border-[#dbe6ee] pb-4">
          <div data-hv-fade>
            <p className="text-xs font-semibold text-[#6a8299]">{labels.score}</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-[-0.06em]">
              <span data-report-score className="tabular-nums">{last.score}</span>
              <span className="ml-1 text-lg text-[#6a8299]">/100</span>
            </p>
          </div>
          <span data-hv-fade data-report-delta className="mb-1 rounded-full border border-[#cfdde9] px-2.5 py-1 text-xs font-bold tabular-nums text-[#35566b]">
            {formatScoreChange(last.score - first.score)}
          </span>
        </div>

        <div data-hv-chart className="mt-4">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="w-full"
            role="img"
            aria-label={`${labels.score}: ${report.checkpoints.map((c) => `${labels.weekShort} ${c.week} — ${c.score}`).join(", ")}`}
          >
            <defs>
              <linearGradient id="report-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5a8399" stopOpacity="0.35" />
                <stop offset="1" stopColor="#5a8399" stopOpacity="0" />
              </linearGradient>
              <clipPath id="report-reveal">
                <rect data-report-reveal x="0" y="0" width={chart.width} height={chart.height} />
              </clipPath>
            </defs>
            <path d={chart.areaPath} fill="url(#report-fill)" clipPath="url(#report-reveal)" />
            <path data-hv-line d={chart.linePath} fill="none" stroke="#073b52" strokeWidth="4" strokeLinecap="round" />
            {chart.points.map((point) => (
              <circle
                data-hv-point
                data-score={point.score}
                key={`${point.x}-${point.week}`}
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#f6fafc"
                stroke="#073b52"
                strokeWidth="3.5"
              />
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[0.58rem] font-bold uppercase tracking-[0.08em] text-[#8aa2b5]">
            {report.checkpoints.map((checkpoint, index) => (
              <span key={index}>
                {labels.weekShort} {checkpoint.week}
              </span>
            ))}
          </div>
        </div>

        {report.topics.length > 0 && (
          <ul className="mt-4 space-y-2.5">
            {report.topics.map((topic, index) => (
              <li
                data-hv-tile
                data-report-topic
                data-from={topic.from}
                data-to={topic.to}
                key={index}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
              >
                <span className="text-xs font-semibold text-[#35566b]">{topic.label[locale]}</span>
                <span data-report-percent className="text-xs font-bold tabular-nums">
                  {topic.to}%
                </span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[#e2ebf2]">
                  <span data-report-bar className="block h-full rounded-full bg-[#073b52]" style={{ width: `${topic.to}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div data-hv-chip className="absolute left-0 top-2 flex items-center gap-2 rounded-xl border border-white/12 bg-[#0c3b53]/90 px-3 py-2 text-[0.68rem] font-bold text-white shadow-xl backdrop-blur-md">
        <ClipboardCheck className="h-3.5 w-3.5 text-accent" />
        {labels.homework}
      </div>
      <div data-hv-chip className="absolute bottom-4 right-0 flex items-center gap-2 rounded-xl border border-white/12 bg-[#0c3b53]/90 px-3 py-2 text-[0.68rem] font-bold text-white shadow-xl backdrop-blur-md">
        <CalendarDays className="h-3.5 w-3.5 text-accent" />
        {labels.nextStep}
      </div>
    </HeroVisualReveal>
  );
}
