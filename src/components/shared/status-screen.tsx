import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/marketing/logo";

/** Full-page message used by the 404 and error screens: what happened and where to go next. */
export function StatusScreen({
  code,
  icon: Icon,
  title,
  description,
  children,
}: {
  code?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo />
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-sunken text-brand-ink">
        <Icon aria-hidden className="h-8 w-8" />
      </span>
      <div className="max-w-md">
        {code && <p className="eyebrow mb-3">{code}</p>}
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-ink">{title}</h1>
        <p className="mt-3 text-muted">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">{children}</div>
    </main>
  );
}
