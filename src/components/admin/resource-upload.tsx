"use client";

import { useState, useTransition } from "react";
import { FileCheck2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ResourceUpload() {
  const [state, setState] = useState<{ url: string; fileType: string; fileSizeKb: number; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch("/api/uploads/library-resource", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
        setState({ url: data.url, fileType: data.fileType, fileSizeKb: data.fileSizeKb, name: file.name });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл");
      }
    });
  }

  return (
    <div>
      <input type="hidden" name="fileUrl" value={state?.url ?? ""} />
      <input type="hidden" name="fileType" value={state?.fileType ?? ""} />
      <input type="hidden" name="fileSizeKb" value={state?.fileSizeKb ?? ""} />
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-sunken p-4",
          isPending && "opacity-60"
        )}
      >
        {state ? (
          <>
            <FileCheck2 className="h-5 w-5 shrink-0 text-emerald" />
            <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{state.name}</span>
            <button
              type="button"
              onClick={() => setState(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex w-full cursor-pointer items-center gap-3 text-muted">
            <Upload className="h-5 w-5 shrink-0" />
            <span className="text-sm">{isPending ? "Загрузка..." : "Загрузить PDF, DOCX или архив материалов"}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.zip,image/png,image/jpeg"
              className="hidden"
              onChange={handleChange}
              disabled={isPending}
            />
          </label>
        )}
      </div>
    </div>
  );
}
