import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

/**
 * Mark plus wordmark. `tone="light"` is for dark backgrounds (footer, the auth side panel);
 * the mark itself never changes colour.
 */
export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  const light = tone === "light";
  return (
    <Link href="/" aria-label="Bilim Merkezi" className={cn("group flex items-center gap-2.5", className)}>
      <BrandMark className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]" />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[1.08rem] font-extrabold tracking-[-0.035em]", light ? "text-white" : "text-ink")}>
          BILIM
        </span>
        <span
          className={cn(
            "mt-[3px] text-[0.6rem] font-bold uppercase tracking-[0.28em]",
            light ? "text-white/60" : "text-muted"
          )}
        >
          merkezi
        </span>
      </span>
    </Link>
  );
}
