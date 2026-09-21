import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One card of the settings page. The `id` is the anchor the section nav scrolls to;
 * `scroll-mt` keeps the heading clear of the sticky site header when it lands there.
 */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  text,
  tone = "default",
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  text?: string;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "scroll-mt-28 rounded-[1.4rem] border bg-surface p-5 sm:p-7",
        tone === "danger" ? "border-rose/30" : "border-border"
      )}
    >
      <header className="mb-6 flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            tone === "danger" ? "bg-rose/10 text-rose" : "bg-brand/10 text-brand-ink"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-xl font-bold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {text && <p className="mt-1 text-sm leading-6 text-muted">{text}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

/** A labelled block inside a section: a small heading, an optional hint, then the controls. */
export function SettingsGroup({
  title,
  hint,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-t border-border pt-6 first:border-t-0 first:pt-0", className)}>
      {(title || hint) && (
        <div>
          {title && <h3 className="text-sm font-bold text-ink">{title}</h3>}
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
