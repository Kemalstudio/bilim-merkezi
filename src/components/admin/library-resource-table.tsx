"use client";

import { useState, useTransition } from "react";
import { Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { toggleLibraryResourcePublishedAction, deleteLibraryResourceAction } from "@/actions/admin-library";

type LibraryResourceRow = {
  id: string;
  title: string;
  fileType: string;
  fileSizeKb: number | null;
  courseTitle: string | null;
  published: boolean;
};

export function LibraryResourceTable({ resources }: { resources: LibraryResourceRow[] }) {
  const [rows, setRows] = useState(resources);
  const [deleteTarget, setDeleteTarget] = useState<LibraryResourceRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(row: LibraryResourceRow, checked: boolean) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, published: checked } : r)));
    startTransition(async () => {
      await toggleLibraryResourcePublishedAction(row.id, checked);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      await deleteLibraryResourceAction(target.id);
      setRows((prev) => prev.filter((r) => r.id !== target.id));
      toast.success("Материал удалён");
      setDeleteTarget(null);
    });
  }

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">Пока нет материалов</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Материал</TableHead>
            <TableHead>Курс</TableHead>
            <TableHead>Файл</TableHead>
            <TableHead>Опубликован</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="flex max-w-xs items-center gap-2 truncate font-semibold text-ink">
                <FileText className="h-4 w-4 shrink-0 text-brand-start" /> {row.title}
              </TableCell>
              <TableCell>
                {row.courseTitle ? <Badge variant="neutral">{row.courseTitle}</Badge> : <span className="text-muted">—</span>}
              </TableCell>
              <TableCell className="uppercase text-muted">
                {row.fileType}
                {row.fileSizeKb ? ` · ${Math.round(row.fileSizeKb / 1024) || 1} МБ` : ""}
              </TableCell>
              <TableCell>
                <Switch checked={row.published} onCheckedChange={(checked) => handleToggle(row, checked)} disabled={isPending} />
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
            <DialogTitle>Удалить материал?</DialogTitle>
            <DialogDescription>«{deleteTarget?.title}» будет удалён без возможности восстановления.</DialogDescription>
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
