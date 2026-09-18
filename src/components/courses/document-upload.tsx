"use client";

import { useState, useTransition } from "react";
import { FileCheck2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function DocumentUpload({ name }: { name: string }) {
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch("/api/uploads/enrollment-document", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t.enroll.uploadFailed);
        setKey(data.key);
        setFileName(file.name);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.enroll.uploadFailed);
      }
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={key} />
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-sunken p-4",
          isPending && "opacity-60"
        )}
      >
        {key ? (
          <>
            <FileCheck2 className="h-5 w-5 shrink-0 text-emerald" />
            <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{fileName}</span>
            <button
              type="button"
              onClick={() => {
                setKey("");
                setFileName("");
              }}
              aria-label={t.enroll.removeFile}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-border hover:text-ink"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex w-full cursor-pointer items-center gap-3 text-muted focus-within:text-ink">
            <Upload className="h-5 w-5 shrink-0" />
            <span className="text-sm">{isPending ? t.enroll.uploading : t.enroll.upload}</span>
            <input
              id={`${name}-input`}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleChange}
              disabled={isPending}
            />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {t.enroll.uploadHint}
      </p>
    </div>
  );
}
