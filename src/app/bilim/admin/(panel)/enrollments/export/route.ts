import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { toCsv } from "@/lib/csv";
import { formatPhone, realEmail } from "@/lib/phone";

const STATUS: Record<string, string> = { ACTIVE: "Активна", PENDING: "Ожидает оплаты", CANCELLED: "Отменена" };
const PAYMENT: Record<string, string> = { SUCCEEDED: "Оплачено", PENDING: "Ожидает", FAILED: "Ошибка", REFUNDED: "Возврат" };

/** All enrolments with their payments as a spreadsheet — for the accountant, not for the site. */
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    include: { user: true, course: true, payment: true, application: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Дата записи", "Родитель", "Email", "Телефон", "Ребёнок (заявитель)", "Курс", "Статус записи", "Сумма, TMT", "Статус оплаты"],
    enrollments.map((enrollment) => [
      enrollment.createdAt,
      enrollment.user.name,
      realEmail(enrollment.user.email),
      enrollment.user.phone ? formatPhone(enrollment.user.phone) : null,
      enrollment.application
        ? [enrollment.application.lastName, enrollment.application.firstName, enrollment.application.patronymic].filter(Boolean).join(" ")
        : null,
      enrollment.course.title,
      STATUS[enrollment.status] ?? enrollment.status,
      enrollment.payment ? Number(enrollment.payment.amount) : null,
      enrollment.payment ? (PAYMENT[enrollment.payment.status] ?? enrollment.payment.status) : null,
    ])
  );

  await logAction(session.user.id, "enrollments.exported", "enrollment", undefined, { rows: enrollments.length });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bilim-enrollments-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
