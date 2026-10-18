"use client";

import { useState } from "react";
import { CreditCard, FlaskConical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { saveSiteSettingAction } from "@/actions/admin-site";
import { cn } from "@/lib/utils";
import type { PaymentSettings } from "@/lib/site-settings-schema";

export function PaymentsToggle({ initial }: { initial: PaymentSettings }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const { pending, run } = useSettingSaver();

  function change(next: boolean) {
    setEnabled(next);
    run(
      () => saveSiteSettingAction("payments", { enabled: next }),
      next ? "Оплата включена" : "Оплата выключена — записи подтверждаются без оплаты",
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex cursor-pointer items-start gap-4 rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-panel text-accent">
          <CreditCard aria-hidden className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display font-bold text-ink">Оплата картой при записи</span>
          <span className="mt-1 block text-sm text-muted">
            Включено — родитель переходит на страницу оплаты, запись подтверждается после платежа. Выключено — запись
            подтверждается сразу, без оплаты.
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={change} disabled={pending} aria-label="Оплата картой при записи" />
      </label>

      <div
        className={cn(
          "flex items-start gap-3 rounded-[1.4rem] border p-5 text-sm leading-6",
          enabled ? "border-emerald/25 bg-emerald/8 text-ink-soft" : "border-amber/30 bg-amber/10 text-ink-soft",
        )}
      >
        <FlaskConical aria-hidden className={cn("mt-0.5 h-5 w-5 shrink-0", enabled ? "text-emerald" : "text-amber")} />
        {enabled ? (
          <p>
            <span className="font-semibold text-ink">Рабочий режим.</span> Записи оплачиваются картой через Stripe; цена
            переводится в доллары по курсу из настроек сервера.
          </p>
        ) : (
          <p>
            <span className="font-semibold text-ink">Тестовый режим.</span> На сайте и в приложении кнопка «Записаться»
            подтверждает запись сразу. Платёж сохраняется на 0 TMT, поэтому выручка в отчётах не искажается, а промокоды не
            расходуются. Записи, которые ждали оплаты, подтвердятся, если родитель запишется повторно. Не забудьте включить
            оплату перед запуском.
          </p>
        )}
      </div>
    </div>
  );
}
