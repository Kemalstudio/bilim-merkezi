import type { LucideIcon } from "lucide-react";
import { Award, CalendarRange, Clock, Globe, Repeat, Signal, UserRound, Users } from "lucide-react";
import { getLevelLabel } from "@/lib/course-visuals";
import { ageRangeLabel } from "@/lib/course-levels";
import { lessonsPerWeekLabel, totalHoursLabel, weeklyHoursLabel, weeksLabel, type CourseFormat } from "@/lib/course-schedule";

type Fact = { icon: LucideIcon; label: string; value: string; hint?: string };

/** "Детали курса": the practical answers a parent looks for before enrolling, in one grid. */
export function CourseFacts({
  course,
  format,
  weeks,
}: {
  course: {
    level: string;
    levelCode: string | null;
    ageMin: number | null;
    ageMax: number | null;
    groupSize: number | null;
    teachingLanguage: string | null;
    certificate: boolean;
  };
  format: CourseFormat;
  weeks: number;
}) {
  const age = ageRangeLabel(course.ageMin, course.ageMax);
  const facts: Fact[] = [
    ...(age ? [{ icon: UserRound, label: "Возраст", value: age }] : []),
    {
      icon: Signal,
      label: "Уровень",
      value: course.levelCode ? `${getLevelLabel(course.level)} · ${course.levelCode}` : getLevelLabel(course.level),
    },
    ...(weeks > 0
      ? [{ icon: CalendarRange, label: "Длительность", value: weeksLabel(weeks), hint: `${totalHoursLabel(weeks, format)} учёбы` }]
      : []),
    { icon: Repeat, label: "Расписание", value: lessonsPerWeekLabel(format.lessonsPerWeek), hint: "занятия в группе с преподавателем" },
    { icon: Clock, label: "Нагрузка", value: weeklyHoursLabel(format), hint: "уроки, практика и домашние задания" },
    ...(course.groupSize ? [{ icon: Users, label: "Группа", value: `до ${course.groupSize} учеников` }] : []),
    ...(course.teachingLanguage ? [{ icon: Globe, label: "Язык обучения", value: course.teachingLanguage }] : []),
    {
      icon: Award,
      label: "Итог",
      value: course.certificate ? "Сертификат центра" : "Итоговое занятие",
      hint: course.certificate ? "после итогового теста" : "без сертификата",
    },
  ];

  return (
    <section aria-labelledby="facts-title">
      <h2 id="facts-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">
        Детали курса
      </h2>
      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4">
            <dt className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
              <Icon aria-hidden className="h-4 w-4 text-brand" />
              {label}
            </dt>
            <dd className="mt-2 font-display text-base font-bold leading-snug tracking-[-0.02em] text-ink">{value}</dd>
            {hint && <dd className="mt-0.5 text-xs text-muted">{hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
