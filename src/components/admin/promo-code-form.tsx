"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPromoCodeAction } from "@/actions/admin-promo-codes";

export function PromoCodeForm() {
  const [active, setActive] = useState(true);
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createPromoCodeAction(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Промокод создан");
      formRef.current?.reset();
      setActive(true);
      setDiscountType("PERCENT");
    });
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <input type="hidden" name="active" value={active ? "on" : ""} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Код</Label>
        <Input id="code" name="code" placeholder="BILIM10" required className="uppercase" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="discountType">Тип скидки</Label>
        <Select name="discountType" value={discountType} onValueChange={(v) => setDiscountType(v as "PERCENT" | "FIXED")}>
          <SelectTrigger id="discountType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENT">Процент, %</SelectItem>
            <SelectItem value="FIXED">Фиксированная сумма, $</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="discountValue">{discountType === "PERCENT" ? "Скидка, %" : "Скидка, $"}</Label>
        <Input
          id="discountValue"
          name="discountValue"
          type="number"
          min={0}
          step="0.01"
          max={discountType === "PERCENT" ? 100 : undefined}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="maxUses">Лимит использований</Label>
        <Input id="maxUses" name="maxUses" type="number" min={1} placeholder="Без лимита" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expiresAt">Действует до</Label>
        <Input id="expiresAt" name="expiresAt" type="date" />
      </div>

      <div className="flex items-end justify-between gap-4 lg:col-span-5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-soft">
          <Switch checked={active} onCheckedChange={setActive} /> Активен
        </label>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Создание..." : "Создать промокод"}
        </Button>
      </div>
    </form>
  );
}
