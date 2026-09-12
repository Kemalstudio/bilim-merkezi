import Link from "next/link";
import type { EnrollmentStatus } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { CourseCover } from "@/components/courses/course-cover";

type EnrollmentItem = {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  course: { slug: string; title: string; category: { slug: string; name: string } };
  payment: { amount: unknown; status: string } | null;
  child?: { firstName: string; lastName: string } | null;
};

const statusVariant: Record<EnrollmentStatus, BadgeProps["variant"]> = {
  ACTIVE: "emerald",
  PENDING: "amber",
  CANCELLED: "rose",
};

const statusLabel: Record<EnrollmentStatus, string> = {
  ACTIVE: "Активен",
  PENDING: "Ожидает оплаты",
  CANCELLED: "Отменён",
};

export function EnrollmentList({ enrollments }: { enrollments: EnrollmentItem[] }) {
  if (enrollments.length === 0) {
    return <p className="text-sm text-muted">Вы ещё не записались ни на один курс.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {enrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
        >
          <CourseCover
            categorySlug={enrollment.course.category.slug}
            className="h-20 w-32 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/courses/${enrollment.course.slug}`}
              className="font-display font-semibold text-ink hover:text-brand-ink"
            >
              {enrollment.course.title}
            </Link>
            <p className="mt-1 text-xs text-muted">
              {enrollment.child
                ? `${enrollment.child.firstName} ${enrollment.child.lastName} · записан ${formatDate(enrollment.createdAt)}`
                : `Записан ${formatDate(enrollment.createdAt)}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant={statusVariant[enrollment.status]}>{statusLabel[enrollment.status]}</Badge>
            {enrollment.payment && (
              <span className="text-sm font-semibold text-ink">
                {formatCurrency(String(enrollment.payment.amount))}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
