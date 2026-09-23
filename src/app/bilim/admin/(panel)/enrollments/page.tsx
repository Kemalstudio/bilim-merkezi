import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentAdminTable } from "@/components/admin/enrollment-admin-table";
import { formatPhone, realEmail } from "@/lib/phone";

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
    studentName: e.user.name ?? realEmail(e.user.email) ?? (e.user.phone ? formatPhone(e.user.phone) : "—"),
    // Phone-only accounts have no real email: show the number instead of the internal placeholder.
    studentEmail: realEmail(e.user.email) ?? (e.user.phone ? formatPhone(e.user.phone) : "—"),
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-ink">Записи на курсы</h1>
          <p className="mt-1 text-muted">Все записи студентов и статус оплаты</p>
        </div>
        <Button asChild variant="outline">
          <a href="/bilim/admin/enrollments/export" download>
            <Download aria-hidden className="h-4 w-4" /> Экспорт в CSV
          </a>
        </Button>
      </div>
      <EnrollmentAdminTable enrollments={rows} />
    </div>
  );
}
