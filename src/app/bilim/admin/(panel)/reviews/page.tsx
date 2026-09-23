import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ReviewModerationTable } from "@/components/admin/review-moderation-table";

export const metadata: Metadata = { title: "Отзывы" };

// Pending first so new submissions surface immediately, then newest of the rest.
const STATUS_ORDER = { PENDING: 0, APPROVED: 1, HIDDEN: 2 } as const;

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { course: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = reviews
    .map((r) => ({
      id: r.id,
      courseTitle: r.course.title,
      authorName: r.user.name || "Без имени",
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const pendingCount = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-ink">Отзывы</h1>
        <p className="mt-1 text-muted">
          {pendingCount > 0 ? `${pendingCount} на проверке · ` : ""}Отзыв виден на странице курса только со статусом «Опубликован»
        </p>
      </div>
      <ReviewModerationTable reviews={rows} />
    </div>
  );
}
