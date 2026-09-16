"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ImageUpload({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
        setUrl(data.url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить изображение");
      }
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div
        className={cn(
          "relative flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-surface-sunken",
          isPending && "opacity-60"
        )}
      >
        {url ? (
          <>
            <Image src={url} alt="Обложка курса" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 text-muted">
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm">{isPending ? "Загрузка..." : "Загрузить обложку"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={isPending} />
          </label>
        )}
      </div>
    </div>
  );
}
