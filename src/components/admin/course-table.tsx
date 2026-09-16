"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { toggleCoursePublishedAction, deleteCourseAction } from "@/actions/admin-courses";
import { formatCurrency } from "@/lib/utils";

type CourseRow = {
  id: string;
  title: string;
  category: { name: string };
  price: string;
  published: boolean;
  enrollmentCount: number;
};

export function CourseTable({ courses }: { courses: CourseRow[] }) {
  const [rows, setRows] = useState(courses);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null);

  function handleTogglePublished(course: CourseRow, checked: boolean) {
    setRows((prev) => prev.map((c) => (c.id === course.id ? { ...c, published: checked } : c)));
    startTransition(async () => {
      await toggleCoursePublishedAction(course.id, checked);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteCourseAction(target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setRows((prev) => prev.filter((c) => c.id !== target.id));
        toast.success("Курс удалён");
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Курс</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead>Записей</TableHead>
            <TableHead>Опубликован</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="max-w-xs truncate font-semibold text-ink">{course.title}</TableCell>
              <TableCell>
                <Badge variant="neutral">{course.category.name}</Badge>
              </TableCell>
              <TableCell>{formatCurrency(course.price)}</TableCell>
              <TableCell>{course.enrollmentCount}</TableCell>
              <TableCell>
                <Switch
                  checked={course.published}
                  onCheckedChange={(checked) => handleTogglePublished(course, checked)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/bilim/admin/courses/${course.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(course)}>
                    <Trash2 className="h-4 w-4 text-rose" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить курс?</DialogTitle>
            <DialogDescription>
              Курс «{deleteTarget?.title}» будет удалён без возможности восстановления.
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
