import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getChildrenForParent, getUpcomingForParent } from "@/lib/children-data";
import { ChildCard } from "@/components/account/child-card";
import { ChildFormDialog } from "@/components/account/child-form-dialog";
import { ScheduleTimeline } from "@/components/account/schedule-timeline";
import { EnrollmentList } from "@/components/account/enrollment-list";
import { Button } from "@/components/ui/button";
import { pluralizeRu } from "@/lib/utils";

export const metadata: Metadata = { title: "Личный кабинет" };

export default async function AccountOverviewPage() {
  const user = await requireUser();

  const [children, upcoming, enrollments] = await Promise.all([
    getChildrenForParent(user.id),
    getUpcomingForParent(user.id),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { category: true } }, payment: true, child: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const activeCount = enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length;
  const examCount = children.filter((child) => child.latestExam).length;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-4">Личный кабинет</p>
          <h1 className="font-display text-3xl font-bold tracking-[-0.045em] text-ink sm:text-4xl">
            Здравствуйте, {user.name?.split(" ")[0] ?? "друг"}!
          </h1>
          <p className="mt-1 text-muted">
            {children.length === 0
              ? "Добавьте профиль ребёнка — и вся подготовка будет как на ладони."
              : `У вас ${children.length} ${pluralizeRu(children.length, ["ребёнок", "ребёнка", "детей"])} в центре.`}
          </p>
        </div>
        {children.length > 0 && <ChildFormDialog triggerVariant="outline" />}
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken">
            <Users aria-hidden className="h-6 w-6 text-brand-ink" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">Начните с профиля ребёнка</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              После этого запись на курс займёт два шага, а баллы за экзамены будут появляться здесь
              сами.
            </p>
          </div>
          <ChildFormDialog />
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">Дети</h2>
              <Link
                href="/account/children"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink transition-colors hover:underline"
              >
                Все профили <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {children.slice(0, 4).map((child) => (
                <ChildCard key={child.id} child={child} />
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Активные курсы" value={String(activeCount)} />
            <StatCard label="Всего записей" value={String(enrollments.length)} />
            <StatCard label="Детей с результатами" value={`${examCount} из ${children.length}`} />
          </div>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Ближайшие занятия</h2>
            <div className="mt-4">
              <ScheduleTimeline items={upcoming} showChildName />
            </div>
          </section>
        </>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Последние записи</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">Записать ребёнка</Link>
          </Button>
        </div>
        <div className="mt-4">
          <EnrollmentList enrollments={enrollments} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-border bg-surface p-5 shadow-glow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent-deep">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] text-ink">{value}</p>
    </div>
  );
}
