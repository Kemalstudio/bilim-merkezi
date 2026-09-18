"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.common.themeToggle}
      className={cn(
        "group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-sunken hover:text-brand-ink active:scale-90",
        className
      )}
    >
      {/* The moon tilts and the sun turns on hover. */}
      <Moon aria-hidden className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-[25deg] group-hover:scale-110 dark:hidden" />
      <Sun aria-hidden className="hidden h-4 w-4 transition-transform duration-700 group-hover:rotate-90 group-hover:scale-110 dark:block" />
    </button>
  );
}
