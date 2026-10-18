"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { deleteExamResultAction } from "@/actions/admin-exam-results";
import { formatDate } from "@/lib/utils";

type ExamResultRow = {
  id: string;
  studentName: string;
  examName: string;
  score: number;
  maxScore: number;
  examDate: Date;
  courseTitle: string | null;
};

function scoreVariant(score: number, maxScore: number) {
  const share = score / maxScore;
  if (share >= 0.85) return "emerald" as const;
  if (share >= 0.6) return "brand" as const;
  return "amber" as const;
}

export function ExamResultTable({ results }: { results: ExamResultRow[] }) {
  // Fresh rows come from the server (router.refresh after a new score); deletions hide at once.
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(new Set());
  const rows = results.filter((r) => !deleted.has(r.id));
  const [deleteTarget, setDeleteTarget] = useState<ExamResultRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteExamResultAction(target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setDeleted((prev) => new Set(prev).add(target.id));
        toast.success("Результат удалён");
      }
      setDeleteTarget(null);
    });
  }

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">Пока нет ни одного результата</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ученик</TableHead>
            <TableHead>Работа</TableHead>
            <TableHead>Баллы</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <p className="font-semibold text-ink">{row.studentName}</p>
                {row.courseTitle && <p className="mt-0.5 text-xs text-muted">{row.courseTitle}</p>}
              </TableCell>
              <TableCell className="text-ink-soft">{row.examName}</TableCell>
              <TableCell>
                <Badge variant={scoreVariant(row.score, row.maxScore)}>
                  {row.score} / {row.maxScore}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-ink-soft">{formatDate(row.examDate)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" aria-label="Удалить" onClick={() => setDeleteTarget(row)}>
                  <Trash2 className="h-4 w-4 text-rose" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить результат?</DialogTitle>
            <DialogDescription>
              «{deleteTarget?.examName}» — {deleteTarget?.studentName}, {deleteTarget?.score} из {deleteTarget?.maxScore}. Родитель
              больше не увидит его в кабинете.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
