"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
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
import { togglePromoCodeActiveAction, deletePromoCodeAction } from "@/actions/admin-promo-codes";
import { formatDate } from "@/lib/utils";

type PromoCodeRow = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
};

export function PromoCodeTable({ promoCodes }: { promoCodes: PromoCodeRow[] }) {
  const [rows, setRows] = useState(promoCodes);
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(row: PromoCodeRow, checked: boolean) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: checked } : r)));
    startTransition(async () => {
      await togglePromoCodeActiveAction(row.id, checked);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deletePromoCodeAction(target.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success("Промокод удалён");
      }
      setDeleteTarget(null);
    });
  }

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">Пока нет промокодов</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Код</TableHead>
            <TableHead>Скидка</TableHead>
            <TableHead>Использовано</TableHead>
            <TableHead>Истекает</TableHead>
            <TableHead>Активен</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono font-semibold text-ink">{row.code}</TableCell>
              <TableCell>
                <Badge variant="amber">
                  {row.discountType === "PERCENT" ? `${row.discountValue}%` : `$${row.discountValue}`}
                </Badge>
              </TableCell>
              <TableCell>
                {row.usedCount}
                {row.maxUses ? ` / ${row.maxUses}` : ""}
              </TableCell>
              <TableCell>{row.expiresAt ? formatDate(row.expiresAt) : "—"}</TableCell>
              <TableCell>
                <Switch checked={row.active} onCheckedChange={(checked) => handleToggle(row, checked)} disabled={isPending} />
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
            <DialogTitle>Удалить промокод?</DialogTitle>
            <DialogDescription>Код «{deleteTarget?.code}» будет удалён без возможности восстановления.</DialogDescription>
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
