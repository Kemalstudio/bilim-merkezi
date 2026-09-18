import type { Metadata } from "next";
import { BadgeDollarSign, GraduationCap, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueLineChart } from "@/components/admin/revenue-line-chart";
import { CoursePopularityBarChart } from "@/components/admin/course-popularity-bar-chart";
import { CategoryPieChart } from "@/components/admin/category-pie-chart";
import { AdminWelcome } from "@/components/admin/admin-welcome";
import { getCurrentUser } from "@/lib/rbac";

export const metadata: Metadata = { title: "Дашборд" };

export default async function AdminDashboardPage() {
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Counted in the database: the dashboard should not load every enrollment and payment.
  const [user, studentCount, enrollmentCount, activeCount, revenue, payments, byCourse, popularCourses] =
    await Promise.all([
      getCurrentUser(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true } }),
      prisma.payment.findMany({
        where: { status: "SUCCEEDED", createdAt: { gte: windowStart } },
        select: { amount: true, createdAt: true },
      }),
      prisma.enrollment.groupBy({ by: ["courseId"], _count: { _all: true } }),
      prisma.course.findMany({
        select: { title: true, _count: { select: { enrollments: true } } },
        orderBy: { enrollments: { _count: "desc" } },
        take: 6,
      }),
    ]);

  const totalRevenue = Number(revenue._sum.amount ?? 0);
  const conversionRate = studentCount > 0 ? (activeCount / studentCount) * 100 : 0;

  const courseCategories = await prisma.course.findMany({
    where: { id: { in: byCourse.map((row) => row.courseId) } },
    select: { id: true, category: { select: { name: true } } },
  });
  const categoryOf = new Map(courseCategories.map((course) => [course.id, course.category.name]));

  const monthOrder: string[] = [];
  const monthBuckets: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("ru-RU", { month: "short" });
    monthOrder.push(key);
    monthBuckets[key] = 0;
  }
  for (const payment of payments) {
    const d = new Date(payment.createdAt);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 6) {
      const key = d.toLocaleDateString("ru-RU", { month: "short" });
      monthBuckets[key] = (monthBuckets[key] ?? 0) + Number(payment.amount);
    }
  }
  const revenueData = monthOrder.map((month) => ({ month, revenue: monthBuckets[month] }));

  const categoryBuckets = new Map<string, number>();
  for (const row of byCourse) {
    const name = categoryOf.get(row.courseId) ?? "Без категории";
    categoryBuckets.set(name, (categoryBuckets.get(name) ?? 0) + row._count._all);
  }
  const categoryData = Array.from(categoryBuckets.entries()).map(([name, value]) => ({ name, value }));

  const popularityData = popularCourses.map((course) => ({
    title: course.title,
    count: course._count.enrollments,
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminWelcome name={user?.name ?? null} isAdmin={user?.role === "ADMIN"} />

      <h2 className="-mb-2 font-display text-xl font-bold tracking-[-0.03em] text-ink">Ключевые показатели</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Аккаунтов родителей" value={String(studentCount)} icon={Users} />
        <KpiCard label="Записей на курсы" value={String(enrollmentCount)} icon={GraduationCap} />
        <KpiCard label="Доход" value={formatCurrency(totalRevenue)} icon={BadgeDollarSign} />
        <KpiCard
          label="Конверсия"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          hint="активных записей на аккаунт"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow-sm lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Динамика дохода</h2>
          <p className="text-sm text-muted">За последние 6 месяцев</p>
          <div className="mt-4">
            <RevenueLineChart data={revenueData} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Популярность курсов</h2>
          <p className="text-sm text-muted">По количеству записей</p>
          <div className="mt-4">
            <CoursePopularityBarChart data={popularityData} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Распределение по категориям</h2>
          <p className="text-sm text-muted">Доля записей на курсы</p>
          <div className="mt-4">
            <CategoryPieChart data={categoryData} />
          </div>
        </div>
      </div>
    </div>
  );
}
