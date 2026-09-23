"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { initials } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

/** What the browser sends; the server crops and re-encodes again, so this only saves bandwidth. */
const OUTPUT_SIZE = 640;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image failed to load"));
    image.src = src;
  });
}

/** Cuts the chosen square out of the photo and returns it as an image blob. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const size = Math.min(OUTPUT_SIZE, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/webp", 0.92)
  );
}

/**
 * The profile photo: shows it, lets the person pick a new one, crop it to a square in a dialog
 * and upload it, or remove it. The name in the fallback is the same one the header shows.
 */
export function AvatarEditor({ name, image }: { name: string; image: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(image);
  const [seenImage, setSeenImage] = useState(image);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [isPending, startTransition] = useTransition();

  // The page can re-render with a different stored photo (another tab, a refresh). Adjusting
  // state while rendering is React's recommended way to follow a changed prop.
  if (image !== seenImage) {
    setSeenImage(image);
    setCurrent(image);
  }

  // The object URL is released when the dialog closes or another file replaces it.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source);
    };
  }, [source]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => setArea(pixels), []);

  function closeDialog() {
    setSource(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // the same file can be chosen again after cancelling
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_INPUT_BYTES) {
      toast.error(t.settings.profile.uploadFailed);
      return;
    }
    setSource(URL.createObjectURL(file));
  }

  function upload() {
    if (!source || !area) return;
    startTransition(async () => {
      try {
        const blob = await cropToBlob(source, area);
        const body = new FormData();
        body.append("file", blob, "avatar.webp");
        const response = await fetch("/api/uploads/avatar", { method: "POST", body });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { url: string };
        setCurrent(data.url);
        toast.success(t.settings.profile.photoUpdated);
        closeDialog();
        router.refresh();
      } catch {
        toast.error(t.settings.profile.uploadFailed);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/uploads/avatar", { method: "DELETE" });
        if (!response.ok) throw new Error(String(response.status));
        setCurrent(null);
        toast.success(t.settings.profile.photoRemoved);
        router.refresh();
      } catch {
        toast.error(t.settings.profile.uploadFailed);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <div className="relative">
        <Avatar className="h-24 w-24 ring-4 ring-surface-sunken sm:h-28 sm:w-28">
          <AvatarImage src={current ?? undefined} alt={name} className="object-cover" />
          <AvatarFallback className="text-2xl">{initials(name || "?")}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          aria-label={current ? t.settings.profile.change : t.settings.profile.upload}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-accent text-[#0b2233] shadow-glow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Camera aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="max-w-xs text-sm leading-6 text-muted">{t.settings.profile.photoHint}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isPending}>
            {current ? t.settings.profile.change : t.settings.profile.upload}
          </Button>
          {current && (
            <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isPending} className="text-rose hover:text-rose">
              <Trash2 aria-hidden className="h-4 w-4" /> {t.settings.profile.remove}
            </Button>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} />

      <ResponsiveDialog open={source !== null} onOpenChange={(open) => !open && !isPending && closeDialog()}>
        <ResponsiveDialogContent className="max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t.settings.profile.cropTitle}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t.settings.profile.cropHint}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-ink sm:h-80">
            {source && (
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
            {t.settings.profile.zoom}
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 flex-1 cursor-pointer accent-[var(--color-brand)]"
            />
          </label>
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
              {t.settings.profile.cancel}
            </Button>
            <Button type="button" onClick={upload} disabled={isPending || !area}>
              {isPending ? t.settings.profile.uploading : t.settings.profile.apply}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
