import { Bell, CalendarDays, ChartNoAxesColumn, CreditCard, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** The mock is laid out at this fixed size and scaled to fit, like a screenshot. */
export const DASH_WIDTH = 1120;

// Sample data shown in the mock; the counters run from `from` to `to` with the scroll.
export const KPI_VALUES = [
  { from: 54, to: 87, suffix: "%" },
  { from: 80, to: 96, suffix: "%" },
  { from: 60, to: 42, suffix: "" },
];
const SCORES = [54, 58, 57, 63, 69, 72, 79, 87];
const points = SCORES.map((score, i) => [36 + i * 64, 250 - (score - 40) * 4] as const);
const SCORE_LINE = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
const SUBJECT_SCORES = [
  { key: "math", value: 92, tone: "bg-brand" },
  { key: "physics", value: 78, tone: "bg-accent-deep" },
  { key: "english", value: 85, tone: "bg-amber" },
] as const;
const SCHEDULE_SUBJECTS = ["math", "english"] as const;
const navIcons = [LayoutDashboard, CalendarDays, ChartNoAxesColumn, CreditCard];

type Props = {
  labels: Dictionary["dashboard"];
  subjects: Dictionary["gridZoom"]["subjects"];
};

/** A parent-dashboard screen, marked with data-dash-* hooks for DashboardShowcaseSection. */
export function DashboardMock({ labels, subjects }: Props) {
  return (
    <div className="flex h-[680px] w-[1120px] bg-background text-ink">
      <aside className="flex w-[210px] shrink-0 flex-col border-r border-border bg-surface-sunken/60 p-5">
        <div className="flex items-center gap-2.5">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-bold text-white">
            B
          </span>
          <span className="font-display text-base font-bold tracking-[-0.03em]">Bilim</span>
        </div>
        <nav className="mt-8 flex flex-col gap-1.5">
          {labels.nav.map((item, i) => {
            const Icon = navIcons[i] ?? LayoutDashboard;
            return (
              <span
                key={item}
                data-dash-nav
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold",
                  i === 0 ? "bg-surface text-ink shadow-glow-sm" : "text-muted"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                {item}
              </span>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-accent p-4 text-[#0b2233]">
          <p className="text-xs font-bold">{labels.goalTitle}</p>
          <p className="mt-1 font-display text-lg font-bold leading-tight">{labels.goalText}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#0b2233]/15">
            <div data-dash-goal className="h-full w-[87%] origin-left rounded-full bg-[#0b2233]" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold tracking-[-0.04em]">{labels.student}</p>
            <p className="mt-1 text-sm text-muted">{labels.studentMeta}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
              <Bell className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-white">
              A
            </span>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          {labels.kpis.map((label, i) => (
            <div key={label} data-dash-kpi className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-semibold text-muted">{label}</p>
              <p className="mt-2 font-display text-4xl font-bold tracking-[-0.05em]">
                <span data-dash-count>{KPI_VALUES[i].to}</span>
                {KPI_VALUES[i].suffix}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald">{labels.kpiNotes[i]}</p>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1.45fr_1fr] gap-3">
          <div className="flex flex-col rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-bold">{labels.chartTitle}</p>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-[#0b2233]">+33</span>
            </div>
            <svg viewBox="0 0 520 300" className="mt-3 w-full">
              {[70, 130, 190, 250].map((y) => (
                <line key={y} x1="20" x2="500" y1={y} y2={y} className="stroke-border" strokeDasharray="4 6" />
              ))}
              <path data-dash-area d={`${SCORE_LINE} L484 250 L36 250 Z`} className="fill-accent" fillOpacity="0.35" />
              <path
                data-dash-line
                d={SCORE_LINE}
                fill="none"
                className="stroke-brand"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map(([x, y], i) => {
                const isLast = i === points.length - 1;
                return (
                  <circle
                    key={x}
                    data-dash-dot
                    cx={x}
                    cy={y}
                    r={isLast ? 7 : 4.5}
                    className={isLast ? "fill-accent stroke-brand" : "fill-surface stroke-brand"}
                    strokeWidth="3"
                  />
                );
              })}
              {points.map(([x], i) => (
                <text key={x} x={x} y="284" textAnchor="middle" className="fill-muted text-[13px] font-semibold">
                  {i + 1}
                </text>
              ))}
            </svg>
            <p className="mt-auto text-right text-xs font-semibold text-muted">{labels.weeks}</p>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-display text-base font-bold">{labels.subjectsTitle}</p>
              <div className="mt-3.5 flex flex-col gap-3">
                {SUBJECT_SCORES.map(({ key, value, tone }) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{subjects[key]}</span>
                      <span className="text-muted">{value}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
                      <div data-dash-bar className={cn("h-full origin-left rounded-full", tone)} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-border bg-surface p-4">
              <p className="font-display text-base font-bold">{labels.scheduleTitle}</p>
              <div className="mt-3 flex flex-col gap-2">
                {SCHEDULE_SUBJECTS.map((key, i) => (
                  <div key={key} data-dash-row className="flex items-center gap-3 rounded-xl bg-surface-sunken/70 px-3 py-2">
                    <span className="h-8 w-1 rounded-full bg-brand" />
                    <div>
                      <p className="text-sm font-bold">{subjects[key]}</p>
                      <p className="text-xs text-muted">{labels.schedule[i]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
