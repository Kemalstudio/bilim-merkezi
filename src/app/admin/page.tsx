import type { Metadata } from "next";
import { BadgeDollarSign, GraduationCap, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueLineChart } from "@/components/admin/revenue-line-chart";
import { CoursePopularityBarChart } from "@/components/admin/course-popularity-bar-chart";
import { CategoryPieChart } from "@/components/admin/category-pie-chart";

export const metadata: Metadata = { title: "Дашборд" };

export default async function AdminDashboardPage() {
  const [studentCount, enrollments, payments, popularCourses] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.findMany({ include: { course: { include: { category: true } } } }),
    prisma.payment.findMany({
      where: { status: "SUCCEEDED" },
      select: { amount: true, createdAt: true },
    }),
    prisma.course.findMany({
      select: { title: true, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: "desc" } },
      take: 6,
    }),
  ]);

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const conversionRate = studentCount > 0 ? (activeEnrollments.length / studentCount) * 100 : 0;

  const now = new Date();
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
  for (const enrollment of enrollments) {
    const name = enrollment.course.category.name;
    categoryBuckets.set(name, (categoryBuckets.get(name) ?? 0) + 1);
  }
  const categoryData = Array.from(categoryBuckets.entries()).map(([name, value]) => ({ name, value }));

  const popularityData = popularCourses.map((course) => ({
    title: course.title,
    count: course._count.enrollments,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Дашборд</h1>
        <p className="mt-1 text-muted">Ключевые показатели платформы</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Студентов" value={String(studentCount)} icon={Users} />
        <KpiCard label="Записей на курсы" value={String(enrollments.length)} icon={GraduationCap} />
        <KpiCard label="Доход" value={formatCurrency(totalRevenue)} icon={BadgeDollarSign} />
        <KpiCard
          label="Конверсия"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          hint="активных записей на студента"
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
