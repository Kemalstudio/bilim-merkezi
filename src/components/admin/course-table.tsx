"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Tag, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toggleCoursePublishedAction, deleteCourseAction, updateCoursePriceAction } from "@/actions/admin-courses";
import { formatCurrency } from "@/lib/utils";

type CourseRow = {
  id: string;
  title: string;
  category: { name: string };
  price: string;
  discountPrice: string | null;
  published: boolean;
  enrollmentCount: number;
};

export function CourseTable({ courses }: { courses: CourseRow[] }) {
  const [rows, setRows] = useState(courses);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null);
  const [priceTarget, setPriceTarget] = useState<CourseRow | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  function openPrice(course: CourseRow) {
    setPriceError(null);
    setPriceTarget(course);
  }

  function handlePriceSubmit(formData: FormData) {
    if (!priceTarget) return;
    const target = priceTarget;
    setPriceError(null);
    startTransition(async () => {
      const result = await updateCoursePriceAction(target.id, {
        price: String(formData.get("price") ?? ""),
        discountPrice: String(formData.get("discountPrice") ?? ""),
      });
      if (result.error) {
        setPriceError(result.error);
        return;
      }
      setRows((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, price: result.price ?? c.price, discountPrice: result.discountPrice ?? null } : c
        )
      );
      toast.success("Цена обновлена");
      setPriceTarget(null);
    });
  }

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
            <TableHead className="hidden md:table-cell">Категория</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead className="hidden sm:table-cell">Записей</TableHead>
            <TableHead>Опубликован</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="max-w-[10rem] truncate font-semibold text-ink sm:max-w-xs">{course.title}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="neutral">{course.category.name}</Badge>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => openPrice(course)}
                  className="flex flex-col items-start rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-sunken"
                  title="Изменить цену"
                >
                  {course.discountPrice ? (
                    <>
                      <span className="font-semibold text-ink">{formatCurrency(course.discountPrice)}</span>
                      <span className="text-xs text-muted line-through">{formatCurrency(course.price)}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-ink">{formatCurrency(course.price)}</span>
                  )}
                </button>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{course.enrollmentCount}</TableCell>
              <TableCell>
                <Switch
                  checked={course.published}
                  onCheckedChange={(checked) => handleTogglePublished(course, checked)}
                  disabled={isPending}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" aria-label="Изменить цену" onClick={() => openPrice(course)}>
                    <Tag className="h-4 w-4" />
                  </Button>
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

      <Dialog open={Boolean(priceTarget)} onOpenChange={(open) => !open && setPriceTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Цена курса</DialogTitle>
            <DialogDescription>
              «{priceTarget?.title}». Цены в манатах, изменения сразу видны на сайте.
            </DialogDescription>
          </DialogHeader>
          {priceTarget && (
            <form action={handlePriceSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="quick-price">Цена, TMT</Label>
                  <Input
                    id="quick-price"
                    name="price"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    defaultValue={Math.round(Number(priceTarget.price))}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="quick-discount">Со скидкой, TMT</Label>
                  <Input
                    id="quick-discount"
                    name="discountPrice"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    placeholder="Без скидки"
                    defaultValue={priceTarget.discountPrice ? Math.round(Number(priceTarget.discountPrice)) : ""}
                  />
                </div>
              </div>
              {priceError && (
                <p role="alert" className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
                  {priceError}
                </p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Отмена
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  Сохранить
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
