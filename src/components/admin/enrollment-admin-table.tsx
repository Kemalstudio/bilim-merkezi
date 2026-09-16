"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import type { EnrollmentStatus } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { refundEnrollmentAction } from "@/actions/admin-enrollments";
import { formatCurrency, formatDate } from "@/lib/utils";

type EnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  paymentAmount: string | null;
  paymentStatus: string | null;
  applicantName: string | null;
  documentKey: string | null;
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

export function EnrollmentAdminTable({ enrollments }: { enrollments: EnrollmentRow[] }) {
  const [rows, setRows] = useState(enrollments);
  const [refundTarget, setRefundTarget] = useState<EnrollmentRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRefund() {
    if (!refundTarget) return;
    const target = refundTarget;
    startTransition(async () => {
      const result = await refundEnrollmentAction(target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setRows((prev) =>
          prev.map((r) => (r.id === target.id ? { ...r, status: "CANCELLED", paymentStatus: "REFUNDED" } : r))
        );
        toast.success("Возврат оформлен");
      }
      setRefundTarget(null);
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Студент</TableHead>
            <TableHead>Курс</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Оплата</TableHead>
            <TableHead>Заявка</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <p className="font-semibold text-ink">{row.studentName}</p>
                <p className="text-xs text-muted">{row.studentEmail}</p>
              </TableCell>
              <TableCell className="max-w-xs truncate">{row.courseTitle}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(row.createdAt)}</TableCell>
              <TableCell>{row.paymentAmount ? formatCurrency(row.paymentAmount) : "—"}</TableCell>
              <TableCell>
                {row.documentKey ? (
                  <a
                    href={`/api/documents/${row.documentKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-brand-ink hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {row.applicantName ?? "Документ"}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {row.status === "ACTIVE" && row.paymentStatus === "SUCCEEDED" && (
                  <Button variant="outline" size="sm" onClick={() => setRefundTarget(row)}>
                    Вернуть оплату
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(refundTarget)} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вернуть оплату?</DialogTitle>
            <DialogDescription>
              Студенту «{refundTarget?.studentName}» будет возвращена оплата за курс «{refundTarget?.courseTitle}»,
              запись будет отменена.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRefund} disabled={isPending}>
              Вернуть оплату
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
