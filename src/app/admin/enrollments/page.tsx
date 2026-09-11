import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EnrollmentAdminTable } from "@/components/admin/enrollment-admin-table";

export const metadata: Metadata = { title: "Записи" };

export default async function AdminEnrollmentsPage() {
  const enrollments = await prisma.enrollment.findMany({
    include: { user: true, course: true, payment: true, application: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = enrollments.map((e) => ({
    id: e.id,
    status: e.status,
    createdAt: e.createdAt,
    studentName: e.user.name ?? e.user.email,
    studentEmail: e.user.email,
    courseTitle: e.course.title,
    paymentAmount: e.payment?.amount.toString() ?? null,
    paymentStatus: e.payment?.status ?? null,
    applicantName: e.application
      ? [e.application.lastName, e.application.firstName, e.application.patronymic].filter(Boolean).join(" ")
      : null,
    documentKey: e.application?.documentFile ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Записи на курсы</h1>
        <p className="mt-1 text-muted">Все записи студентов и статус оплаты</p>
      </div>
      <EnrollmentAdminTable enrollments={rows} />
    </div>
  );
}
