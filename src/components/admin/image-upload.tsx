"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Uploads an image and keeps its URL in a hidden field, so it travels with the surrounding form.
 * `kind="cover"` is a wide course cover; `kind="avatar"` is a round portrait (cropped square on
 * the server) for teachers.
 */
export function ImageUpload({
  name,
  defaultValue,
  kind = "cover",
}: {
  name: string;
  defaultValue?: string | null;
  kind?: "cover" | "avatar";
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isPending, startTransition] = useTransition();
  const isAvatar = kind === "avatar";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch(isAvatar ? "/api/uploads?kind=avatar" : "/api/uploads", { method: "POST", body: formData });
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
          "relative flex items-center justify-center overflow-hidden border-2 border-dashed border-border bg-surface-sunken",
          isAvatar ? "h-28 w-28 rounded-full" : "aspect-video w-full max-w-sm rounded-xl",
          isPending && "opacity-60"
        )}
      >
        {url ? (
          <>
            <Image
              src={url}
              alt={isAvatar ? "Фото преподавателя" : "Обложка курса"}
              fill
              sizes={isAvatar ? "112px" : "384px"}
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setUrl("")}
              aria-label="Убрать изображение"
              className={cn(
                "absolute flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white cursor-pointer",
                isAvatar ? "bottom-1 left-1/2 -translate-x-1/2" : "right-2 top-2"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-muted">
            {isAvatar ? <UserRound className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" />}
            <span className="px-2 text-center text-sm">
              {isPending ? "Загрузка..." : isAvatar ? "Загрузить фото" : "Загрузить обложку"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={isPending} />
          </label>
        )}
      </div>
    </div>
  );
}
