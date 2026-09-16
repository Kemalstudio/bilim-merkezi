import type { LucideIcon } from "lucide-react";
import { Constellation } from "@/components/marketing/constellation";
import { LottieIcon } from "@/components/shared/lottie-icon";

export function EmptyState({
  icon: Icon,
  title,
  description,
  animation,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional animated icon from /public/lottie, shown instead of the static one. */
  animation?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-surface-sunken/50 px-6 py-16 text-center">
      <Constellation
        variant="watermark"
        className="absolute inset-0 h-full w-full text-brand-start opacity-10"
      />
      {animation ? (
        <LottieIcon src={animation} className="relative h-24 w-24" />
      ) : (
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-glow-sm">
          <Icon className="h-6 w-6 text-brand-start" />
        </span>
      )}
      <h3 className="relative font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="relative max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
