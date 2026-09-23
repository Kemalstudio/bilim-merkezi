"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

/**
 * "Share this course": the phone's own share sheet where the browser offers one (WhatsApp,
 * Telegram, iMessage… — how parents actually pass a course to each other), a copied link
 * everywhere else. The link is the page's own address without tracking or filter parameters.
 */
export function ShareButton({ title, path, className }: { title: string; path: string; className?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the sheet is not a failure; anything else falls through to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.course.linkCopied);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard access can be blocked (insecure origin, permissions); show the link instead.
      toast.info(url, { duration: 8000 });
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand/40 hover:text-ink active:scale-95",
        className
      )}
    >
      {copied ? <Check aria-hidden className="h-4 w-4 text-emerald" /> : <Share2 aria-hidden className="h-4 w-4" />}
      {copied ? t.course.linkCopiedShort : t.course.share}
    </button>
  );
}
