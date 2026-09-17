"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Clock, Flag, LayoutGrid, ListTree } from "lucide-react";
import { cn, pluralizeRu } from "@/lib/utils";
import {
  formatMinutes,
  lessonsPerWeekLabel,
  totalHoursLabel,
  weekLoad,
  weeklyHoursLabel,
  weeksLabel,
  type CourseFormat,
} from "@/lib/course-schedule";

type Lesson = { id: string; title: string; durationMin: number; topics: string[] };
type Week = { id: string; title: string; goal: string | null; lessons: Lesson[] };

const VIEWS = [
  { value: "weeks", label: "По неделям", icon: LayoutGrid },
  { value: "outline", label: "Вся программа", icon: ListTree },
] as const;

/**
 * The programme in two views. "По неделям": a row of week tabs, and for the chosen week its goal,
 * how the hours split between lessons and self-study, and the lessons with their topics.
 * "Вся программа": every week as a collapsible row with lesson count and class time, with
 * expand/collapse all. Both views are always in the page (the inactive one hidden).
 */
export function WeeklyProgram({ weeks, format }: { weeks: Week[]; format: CourseFormat }) {
  const [active, setActive] = useState(0);
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("weeks");
  const [openWeeks, setOpenWeeks] = useState<ReadonlySet<number>>(() => new Set([0]));
  const tabsRef = useRef<HTMLDivElement>(null);

  if (weeks.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted">Программа скоро появится.</p>;
  }

  const totalLessons = weeks.reduce((sum, week) => sum + week.lessons.length, 0);
  const totalTopics = weeks.reduce((sum, week) => sum + week.lessons.reduce((n, lesson) => n + lesson.topics.length, 0), 0);
  const allOpen = openWeeks.size === weeks.length;

  function toggleWeek(index: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function select(index: number) {
    const next = Math.max(0, Math.min(weeks.length - 1, index));
    setActive(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus({ preventScroll: true });
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") select(active + 1);
    else if (event.key === "ArrowLeft") select(active - 1);
    else if (event.key === "Home") select(0);
    else if (event.key === "End") select(weeks.length - 1);
    else return;
    event.preventDefault();
  }

  const facts = [
    { value: weeksLabel(weeks.length), label: "длительность" },
    { value: `${totalLessons} ${pluralizeRu(totalLessons, ["урок", "урока", "уроков"])}`, label: "за весь курс" },
    { value: lessonsPerWeekLabel(format.lessonsPerWeek), label: "с преподавателем" },
    { value: weeklyHoursLabel(format), label: `${totalHoursLabel(weeks.length, format)} всего` },
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 overflow-hidden rounded-[1.4rem] border border-border bg-border sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-surface p-4">
            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{fact.label}</dt>
            <dd className="mt-1 font-display text-base font-bold tracking-[-0.02em] text-ink sm:text-lg">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Вид программы" className="flex rounded-xl bg-surface-sunken p-1">
          {VIEWS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95",
                view === value ? "bg-surface text-ink shadow-glow-sm" : "text-muted hover:text-ink"
              )}
            >
              <Icon aria-hidden className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        {view === "outline" && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
            <span>
              {weeksLabel(weeks.length)} · {totalLessons} {pluralizeRu(totalLessons, ["урок", "урока", "уроков"])} · {totalTopics}{" "}
              {pluralizeRu(totalTopics, ["тема", "темы", "тем"])}
            </span>
            <button
              type="button"
              onClick={() => setOpenWeeks(allOpen ? new Set() : new Set(weeks.map((_, index) => index)))}
              className="flex cursor-pointer items-center gap-1 font-bold text-brand-ink underline-offset-4 hover:underline"
            >
              <ChevronsUpDown aria-hidden className="h-3.5 w-3.5" />
              {allOpen ? "Свернуть все" : "Развернуть все"}
            </button>
          </div>
        )}
      </div>

      <div hidden={view !== "weeks"}>
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Недели программы"
        onKeyDown={onTabsKeyDown}
        className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2"
      >
        {weeks.map((week, index) => {
          const selected = index === active;
          return (
            <button
              key={week.id}
              type="button"
              role="tab"
              id={`week-tab-${week.id}`}
              aria-selected={selected}
              aria-controls={`week-panel-${week.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "flex min-w-[11rem] shrink-0 snap-start cursor-pointer flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? "border-panel bg-panel text-white shadow-glow-md"
                  : "border-border bg-surface text-ink hover:-translate-y-0.5 hover:border-brand/40"
              )}
            >
              <span className={cn("text-[0.65rem] font-bold uppercase tracking-[0.12em]", selected ? "text-accent" : "text-muted")}>
                Неделя {index + 1}
              </span>
              <span className="line-clamp-1 text-sm font-bold">{week.title}</span>
            </button>
          );
        })}
      </div>

      {weeks.map((week, index) => {
        const load = weekLoad(week.lessons.map((lesson) => lesson.durationMin), format);
        const practiceShare = format.weeklyHoursMax > 0 ? Math.min(1 - load.classShare, load.practiceMax / format.weeklyHoursMax) : 0;
        return (
          <section
            key={week.id}
            role="tabpanel"
            id={`week-panel-${week.id}`}
            aria-labelledby={`week-tab-${week.id}`}
            hidden={index !== active}
            className="mt-3 rounded-[1.6rem] border border-border bg-surface p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-ink">
                  Неделя {index + 1} из {weeks.length}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em] text-ink">{week.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => select(index - 1)}
                  disabled={index === 0}
                  aria-label="Предыдущая неделя"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-ink-soft transition-colors hover:border-brand/40 hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => select(index + 1)}
                  disabled={index === weeks.length - 1}
                  aria-label="Следующая неделя"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-ink-soft transition-colors hover:border-brand/40 hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {week.goal && (
              <p className="mt-4 flex w-fit items-start gap-2 rounded-xl bg-accent/15 px-3.5 py-2.5 text-sm font-semibold text-ink">
                <Flag aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-deep" />
                Итог недели: {week.goal}
              </p>
            )}

            <div className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-xs font-semibold">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand" />
                  Уроки с преподавателем — {formatMinutes(load.classMinutes)}
                </span>
                <span className="flex items-center gap-2 text-ink-soft">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
                  Практика и домашние задания — {load.practiceMin === load.practiceMax ? load.practiceMax : `${load.practiceMin}–${load.practiceMax}`} ч
                </span>
                <span className="text-muted">Всего {weeklyHoursLabel(format)}</span>
              </div>
              <div
                className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-surface-sunken"
                role="img"
                aria-label={`Неделя ${index + 1}: ${formatMinutes(load.classMinutes)} уроков и ${load.practiceMin}–${load.practiceMax} ч практики`}
              >
                <span className="h-full bg-brand" style={{ width: `${load.classShare * 100}%` }} />
                <span className="h-full bg-accent" style={{ width: `${practiceShare * 100}%` }} />
              </div>
            </div>

            <ol className="mt-6 grid gap-3 md:grid-cols-3">
              {week.lessons.map((lesson, lessonIndex) => (
                <li key={lesson.id} className="flex flex-col rounded-2xl border border-border bg-surface-sunken/40 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="rounded-full bg-panel px-2.5 py-1 text-white">Урок {lessonIndex + 1}</span>
                    <span className="flex items-center gap-1 text-muted">
                      <Clock aria-hidden className="h-3.5 w-3.5" />
                      {formatMinutes(lesson.durationMin)}
                    </span>
                  </div>
                  <h4 className="mt-3 font-display text-base font-bold leading-snug tracking-[-0.02em] text-ink">{lesson.title}</h4>
                  {lesson.topics.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2">
                      {lesson.topics.map((topic) => (
                        <li key={topic} className="flex items-start gap-2 text-sm leading-5 text-ink-soft">
                          <CheckCircle2 aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
      </div>

      <ol hidden={view !== "outline"} className="mt-4 overflow-hidden rounded-[1.4rem] border border-border">
        {weeks.map((week, index) => {
          const open = openWeeks.has(index);
          const classMinutes = week.lessons.reduce((sum, lesson) => sum + lesson.durationMin, 0);
          return (
            <li key={week.id} className="border-b border-border last:border-0">
              <h3>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`outline-week-${week.id}`}
                  onClick={() => toggleWeek(index)}
                  className="flex w-full cursor-pointer items-center gap-3 bg-surface-sunken/50 px-4 py-3.5 text-left transition-colors hover:bg-surface-sunken sm:px-5"
                >
                  <ChevronDown
                    aria-hidden
                    className={cn("h-4 w-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-brand-ink">Неделя {index + 1}</span>
                    <span className="block font-display text-base font-bold tracking-[-0.02em] text-ink">{week.title}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-semibold text-muted">
                    {week.lessons.length} {pluralizeRu(week.lessons.length, ["урок", "урока", "уроков"])}
                    <span className="hidden sm:inline"> · {formatMinutes(classMinutes)}</span>
                  </span>
                </button>
              </h3>
              <div id={`outline-week-${week.id}`} hidden={!open} className="bg-surface px-4 pb-4 pt-3 sm:px-5">
                {week.goal && (
                  <p className="mb-2 flex items-start gap-2 text-sm font-semibold text-ink">
                    <Flag aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-deep" />
                    Итог недели: {week.goal}
                  </p>
                )}
                <ul className="divide-y divide-border/70">
                  {week.lessons.map((lesson, lessonIndex) => (
                    <li key={lesson.id} className="flex items-start gap-3 py-2.5">
                      <span className="mt-0.5 w-14 shrink-0 text-xs font-bold text-muted">Урок {lessonIndex + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">{lesson.title}</p>
                        {lesson.topics.length > 0 && <p className="mt-0.5 text-xs leading-5 text-muted">{lesson.topics.join(" · ")}</p>}
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted">
                        <Clock aria-hidden className="h-3.5 w-3.5" />
                        {formatMinutes(lesson.durationMin)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
