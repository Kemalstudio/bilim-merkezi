import { CalendarDays, ClipboardCheck } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { HeroReportSettings } from "@/lib/site-settings-schema";
import { buildReportChart, formatScoreChange } from "@/lib/hero-report-chart";

/** A still of the hero report card at its last week, for the admin form to show while editing. */
export function ReportPreview({ report, labels }: { report: HeroReportSettings; labels: Dictionary["hero"]["report"] }) {
  const checkpoints = report.checkpoints.filter((checkpoint) => Number.isFinite(checkpoint.score));

  if (checkpoints.length < 2) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-border p-8 text-center text-sm text-muted">
        Добавьте минимум две точки, чтобы увидеть карточку.
      </div>
    );
  }

  const chart = buildReportChart(checkpoints);
  const first = checkpoints[0];
  const last = checkpoints[checkpoints.length - 1];

  return (
    <div className="paper-noise relative overflow-hidden rounded-[1.6rem] bg-panel p-5 sm:p-6">
      <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mb-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#0c3b53]/90 px-3 py-2 text-[0.68rem] font-bold text-white">
          <ClipboardCheck className="h-3.5 w-3.5 text-accent" /> {labels.homework}
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#0c3b53]/90 px-3 py-2 text-[0.68rem] font-bold text-white">
          <CalendarDays className="h-3.5 w-3.5 text-accent" /> {labels.nextStep}
        </span>
      </div>

      <div className="relative rounded-[1.4rem] border border-white/30 bg-[#f6fafc] p-5 text-[#0b2233] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-[#5a8399]">{labels.eyebrow}</p>
            <p className="mt-1 font-display text-base font-bold tracking-[-0.03em]">{labels.subject}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#e2ebf2] px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.08em] text-[#35566b]">
            {labels.week} {last.week}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between border-b border-[#dbe6ee] pb-3">
          <div>
            <p className="text-[0.7rem] font-semibold text-[#6a8299]">{labels.score}</p>
            <p className="font-display text-3xl font-bold tracking-[-0.06em]">
              {last.score}
              <span className="ml-1 text-base text-[#6a8299]">/100</span>
            </p>
          </div>
          <span className="mb-1 rounded-full border border-[#cfdde9] px-2 py-0.5 text-[0.7rem] font-bold tabular-nums text-[#35566b]">
            {formatScoreChange(last.score - first.score)}
          </span>
        </div>

        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="mt-3 w-full" aria-hidden>
          <defs>
            <linearGradient id="preview-report-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5a8399" stopOpacity="0.35" />
              <stop offset="1" stopColor="#5a8399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chart.areaPath} fill="url(#preview-report-fill)" />
          <path d={chart.linePath} fill="none" stroke="#073b52" strokeWidth="4" strokeLinecap="round" />
          {chart.points.map((point) => (
            <circle key={`${point.x}-${point.week}`} cx={point.x} cy={point.y} r="6" fill="#f6fafc" stroke="#073b52" strokeWidth="3.5" />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[0.55rem] font-bold uppercase tracking-[0.08em] text-[#8aa2b5]">
          {checkpoints.map((checkpoint, index) => (
            <span key={index}>
              {labels.weekShort} {checkpoint.week}
            </span>
          ))}
        </div>

        {report.topics.length > 0 && (
          <ul className="mt-3 space-y-2">
            {report.topics.map((topic, index) => (
              <li key={index} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-[0.7rem] font-semibold text-[#35566b]">{topic.label.ru || "Без названия"}</span>
                <span className="text-[0.7rem] font-bold tabular-nums">{topic.to}%</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[#e2ebf2]">
                  <span
                    className="block h-full rounded-full bg-[#073b52]"
                    style={{ width: `${Math.min(100, Math.max(0, topic.to))}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="relative mt-3 text-center text-xs text-white/45">Так карточка выглядит в конце прокрутки, на последней неделе</p>
    </div>
  );
}
