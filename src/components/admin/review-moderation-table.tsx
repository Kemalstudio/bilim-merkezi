"use client";

import { useState, useTransition } from "react";
import type { ReviewStatus } from "@prisma/client";
import { Check, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setReviewStatusAction } from "@/actions/admin-reviews";
import { formatDate } from "@/lib/utils";

type ReviewRow = {
  id: string;
  courseTitle: string;
  authorName: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: Date;
};

const STATUS_BADGE: Record<ReviewStatus, { label: string; variant: "amber" | "emerald" | "rose" }> = {
  PENDING: { label: "На проверке", variant: "amber" },
  APPROVED: { label: "Опубликован", variant: "emerald" },
  HIDDEN: { label: "Скрыт", variant: "rose" },
};

export function ReviewModerationTable({ reviews }: { reviews: ReviewRow[] }) {
  const [rows, setRows] = useState(reviews);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSetStatus(row: ReviewRow, status: ReviewStatus) {
    setPendingId(row.id);
    startTransition(async () => {
      const result = await setReviewStatusAction(row.id, status);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
        toast.success(status === "APPROVED" ? "Отзыв опубликован" : "Отзыв скрыт");
      }
      setPendingId(null);
    });
  }

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">Пока нет отзывов</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Курс</TableHead>
          <TableHead>Автор</TableHead>
          <TableHead>Оценка</TableHead>
          <TableHead>Комментарий</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const badge = STATUS_BADGE[row.status];
          const busy = isPending && pendingId === row.id;
          return (
            <TableRow key={row.id}>
              <TableCell className="font-semibold text-ink">{row.courseTitle}</TableCell>
              <TableCell className="text-ink-soft">{row.authorName}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-amber">
                  <Star className="h-3.5 w-3.5 fill-current" /> {row.rating}
                </span>
              </TableCell>
              <TableCell className="max-w-xs truncate text-ink-soft" title={row.comment ?? undefined}>
                {row.comment || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="text-ink-soft">{formatDate(row.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  {row.status !== "APPROVED" && (
                    <Button
                      variant="outline"
                      size="icon"
                      title="Опубликовать"
                      disabled={busy}
                      onClick={() => handleSetStatus(row, "APPROVED")}
                    >
                      <Check className="h-4 w-4 text-emerald" />
                    </Button>
                  )}
                  {row.status !== "HIDDEN" && (
                    <Button
                      variant="outline"
                      size="icon"
                      title="Скрыть"
                      disabled={busy}
                      onClick={() => handleSetStatus(row, "HIDDEN")}
                    >
                      <EyeOff className="h-4 w-4 text-rose" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
