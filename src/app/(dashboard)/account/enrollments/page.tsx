import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { EnrollmentList } from "@/components/account/enrollment-list";

export const metadata: Metadata = { title: "Мои курсы" };

export default async function MyEnrollmentsPage() {
  const user = await requireUser();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: { include: { category: true } }, payment: true, child: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Мои курсы</h1>
      <div className="mt-6">
        <EnrollmentList enrollments={enrollments} />
      </div>
    </div>
  );
}
