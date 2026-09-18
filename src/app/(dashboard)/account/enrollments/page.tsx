import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n/server";
import { EnrollmentList } from "@/components/account/enrollment-list";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.enrollmentsMeta };
}

export default async function MyEnrollmentsPage() {
  const user = await requireUser();
  const [enrollments, { t }] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { category: true } }, payment: true, child: true },
      orderBy: { createdAt: "desc" },
    }),
    getI18n(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{t.account.enrollmentsTitle}</h1>
      <div className="mt-6">
        <EnrollmentList enrollments={enrollments} />
      </div>
    </div>
  );
}
