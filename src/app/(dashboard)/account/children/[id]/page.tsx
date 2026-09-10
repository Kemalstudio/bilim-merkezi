import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, LineChart, Target } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { getChildDetail } from "@/lib/children-data";
import { ChildAvatar } from "@/components/account/child-avatar";
import { ChildFormDialog } from "@/components/account/child-form-dialog";
import { DeleteChildButton } from "@/components/account/delete-child-button";
import { ExamProgressChart } from "@/components/account/exam-progress-chart";
import { ScheduleTimeline } from "@/components/account/schedule-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, pluralizeRu } from "@/lib/utils";

export const metadata: Metadata = { title: "Профиль ребёнка" };

const statusLabels = {
  ACTIVE: { label: "Активен", variant: "emerald" as const },
  PENDING: { label: "Ожидает оплаты", variant: "amber" as const },
  CANCELLED: { label: "Отменён", variant: "neutral" as const },
};

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const child = await getChildDetail(id, user.id);
  if (!child) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/account/children"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" /> Все дети
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ChildAvatar
              firstName={child.firstName}
              lastName={child.lastName}
              hue={child.avatarHue}
              size="lg"
            />
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                {child.firstName} {child.lastName}
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                {child.grade != null ? `${child.grade} класс · ` : ""}
                {formatDate(child.birthDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ChildFormDialog
              triggerVariant="outline"
              child={{
                id: child.id,
                firstName: child.firstName,
                lastName: child.lastName,
                birthDate: child.birthDate,
                grade: child.grade,
                notes: child.notes,
              }}
            />
            <DeleteChildButton childId={child.id} name={child.firstName} />
          </div>
        </div>

        {child.notes && (
          <p className="mt-4 rounded-xl bg-surface-sunken p-4 text-sm text-ink-soft">
            {child.notes}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={LineChart}
          label="Последний результат"
          value={child.latestExam ? `${child.latestExam.percent}%` : "—"}
          hint={child.latestExam?.examName}
        />
        <StatCard
          icon={Target}
          label="Средний балл"
          value={child.averagePercent != null ? `${child.averagePercent}%` : "—"}
          hint={`${child.exams.length} ${pluralizeRu(child.exams.length, ["экзамен", "экзамена", "экзаменов"])}`}
        />
        <StatCard
          icon={Award}
          label="Лучший результат"
          value={child.bestPercent != null ? `${child.bestPercent}%` : "—"}
        />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-glow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Динамика результатов</h2>
        <p className="mt-1 text-sm text-muted">
          Каждый экзамен показан в процентах от максимального балла — так результаты разных работ
          сравнимы между собой.
        </p>
        <div className="mt-6">
          {child.exams.length > 1 ? (
            <ExamProgressChart exams={child.exams} averagePercent={child.averagePercent} />
          ) : (
            <p className="rounded-xl bg-surface-sunken p-6 text-sm text-muted">
              {child.exams.length === 1
                ? "Пока есть только один результат — график появится после второго экзамена."
                : "Результатов пока нет. Они появятся здесь сразу после первого экзамена."}
            </p>
          )}
        </div>

        {child.exams.length > 0 && (
          <ul className="mt-6 flex flex-col divide-y divide-border">
            {[...child.exams].reverse().map((exam) => (
              <li key={exam.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{exam.examName}</p>
                  <p className="text-xs text-muted">
                    {formatDate(exam.examDate)}
                    {exam.courseTitle ? ` · ${exam.courseTitle}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-base font-bold text-ink">{exam.percent}%</p>
                  <p className="text-xs text-muted">
                    {exam.score} из {exam.maxScore}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Ближайшие занятия</h2>
        <div className="mt-4">
          <ScheduleTimeline items={child.upcoming} />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Курсы</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">Записать на курс</Link>
          </Button>
        </div>

        {child.enrollments.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
            {child.firstName} пока не записан ни на один курс.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {child.enrollments.map((enrollment) => {
              const status = statusLabels[enrollment.status];
              return (
                <li key={enrollment.id}>
                  <Link
                    href={`/courses/${enrollment.courseSlug}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-glow-sm transition-colors hover:border-accent-deep"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {enrollment.courseTitle}
                      </p>
                      <p className="text-xs text-muted">{enrollment.categoryName}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-glow-sm">
      <div className="flex items-center gap-2 text-muted">
        <Icon aria-hidden className="h-4 w-4" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}
