"use client";

import { useState, useTransition } from "react";
import { Trash2, MapPin } from "lucide-react";
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
import { deleteScheduleEventAction } from "@/actions/admin-schedule";
import { formatDateTime } from "@/lib/utils";

type ScheduleEventRow = {
  id: string;
  title: string;
  courseTitle: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  isPast: boolean;
};

export function ScheduleEventTable({ events }: { events: ScheduleEventRow[] }) {
  const [rows, setRows] = useState(events);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEventRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteScheduleEventAction(target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success("Занятие удалено");
      }
      setDeleteTarget(null);
    });
  }

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">Пока нет занятий в расписании</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Занятие</TableHead>
            <TableHead>Курс</TableHead>
            <TableHead>Дата и время</TableHead>
            <TableHead>Место</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={row.isPast ? "opacity-50" : undefined}>
              <TableCell className="font-semibold text-ink">{row.title}</TableCell>
              <TableCell className="text-ink-soft">{row.courseTitle}</TableCell>
              <TableCell>
                <Badge variant={row.isPast ? "neutral" : "brand"}>{formatDateTime(row.startsAt)}</Badge>
              </TableCell>
              <TableCell className="text-ink-soft">
                {row.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {row.location}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
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
            <DialogTitle>Удалить занятие?</DialogTitle>
            <DialogDescription>
              «{deleteTarget?.title}» будет убрано из расписания курса «{deleteTarget?.courseTitle}».
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
