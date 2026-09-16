"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "@/actions/locale";
import type { Locale } from "@/lib/i18n/config";
import { LANGUAGE_META } from "@/lib/site-settings-schema";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  available,
  label,
}: {
  locale: Locale;
  /** The languages switched on in the admin panel. */
  available: readonly Locale[];
  label: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // With a single language switched on there is nothing to choose between.
  if (available.length < 2) return null;

  function handleSelect(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex h-10 w-10 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-start cursor-pointer",
          isPending && "opacity-60"
        )}
        aria-label={label}
      >
        {/* The globe turns on hover and keeps spinning while the language switches. */}
        <Globe
          className={cn(
            "h-[18px] w-[18px] transition-transform duration-700 group-hover:rotate-180",
            isPending && "animate-spin"
          )}
          strokeWidth={1.75}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.map((code) => (
          <DropdownMenuItem key={code} onSelect={() => handleSelect(code)}>
            <span className="text-base leading-none">{LANGUAGE_META[code].flag}</span>
            <span className="flex-1">{LANGUAGE_META[code].label}</span>
            {code === locale && <Check className="h-4 w-4 text-brand-start" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
