import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[0.7rem] font-bold tracking-[0.02em]",
  {
    variants: {
      variant: {
        brand: "border-brand/15 bg-brand/10 text-brand-ink",
        amber: "border-amber/15 bg-amber/12 text-amber",
        emerald: "bg-emerald/15 text-emerald",
        rose: "bg-rose/10 text-rose",
        neutral: "border-border/70 bg-surface-sunken/80 text-ink-soft",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
