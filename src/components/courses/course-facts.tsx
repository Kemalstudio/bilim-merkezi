import type { LucideIcon } from "lucide-react";
import { Award, CalendarRange, Clock, Globe, Repeat, Signal, UserRound, Users } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { tpl, type CourseFormatLike } from "@/lib/i18n/format";

type Fact = { icon: LucideIcon; label: string; value: string; hint?: string };

/** Course details: the practical answers a parent looks for before enrolling, in one grid. */
export async function CourseFacts({
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
  format: CourseFormatLike;
  weeks: number;
}) {
  const { t, f } = await getI18n();
  const labels = t.course.facts;
  const age = f.ageRange(course.ageMin, course.ageMax);
  const facts: Fact[] = [
    ...(age ? [{ icon: UserRound, label: labels.age, value: age }] : []),
    {
      icon: Signal,
      label: labels.level,
      value: course.levelCode ? `${f.level(course.level)} · ${course.levelCode}` : f.level(course.level),
    },
    ...(weeks > 0
      ? [
          {
            icon: CalendarRange,
            label: labels.duration,
            value: f.weeks(weeks),
            hint: tpl(labels.durationHint, { hours: f.totalHours(weeks, format) }),
          },
        ]
      : []),
    { icon: Repeat, label: labels.schedule, value: f.lessonsPerWeek(format.lessonsPerWeek), hint: labels.scheduleHint },
    { icon: Clock, label: labels.load, value: f.weeklyHours(format), hint: labels.loadHint },
    ...(course.groupSize
      ? [{ icon: Users, label: labels.group, value: tpl(labels.groupValue, { size: course.groupSize }) }]
      : []),
    ...(course.teachingLanguage ? [{ icon: Globe, label: labels.language, value: course.teachingLanguage }] : []),
    {
      icon: Award,
      label: labels.result,
      value: course.certificate ? labels.certificate : labels.finalLesson,
      hint: course.certificate ? labels.certificateHint : labels.noCertificate,
    },
  ];

  return (
    <section aria-labelledby="facts-title">
      <h2 id="facts-title" className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">
        {t.course.factsTitle}
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
