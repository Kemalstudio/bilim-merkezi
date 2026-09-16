"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sticky bar at the bottom of every settings form: whether there is anything unsaved, and
 * the save, discard and reset buttons. Reset asks inline instead of through a browser dialog.
 */
export function SaveBar({
  dirty,
  pending,
  onSave,
  onDiscard,
  onReset,
}: {
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  onReset?: () => void;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div
      role="region"
      aria-label="Сохранение изменений"
      className="sticky bottom-3 z-30 mt-8 flex flex-col gap-3 rounded-[1.2rem] border border-border bg-surface/90 p-3 shadow-glow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="flex items-center gap-2.5 px-2 text-sm font-semibold text-ink-soft">
        <span className={cn("h-2 w-2 rounded-full", dirty ? "bg-accent" : "bg-emerald")} />
        {dirty ? "Есть несохранённые изменения" : "Всё сохранено"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onReset &&
          (confirmingReset ? (
            <>
              <span className="px-1 text-sm text-muted">Вернуть исходные значения?</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setConfirmingReset(false);
                  onReset();
                }}
              >
                Да, сбросить
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>
                Нет
              </Button>
            </>
          ) : (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmingReset(true)}>
              <RotateCcw className="h-4 w-4" /> Сбросить к исходным
            </Button>
          ))}
        {dirty && onDiscard && (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onDiscard}>
            Отменить
          </Button>
        )}
        <Button type="button" size="sm" disabled={!dirty || pending} onClick={onSave}>
          <Save className="h-4 w-4" />
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
