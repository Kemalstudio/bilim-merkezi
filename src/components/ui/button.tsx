import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Every button presses in on click and nudges its trailing icon on hover; filled and outlined
// buttons also get a sheen sweeping across (.btn-shine in globals.css).
const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[0.9rem] text-sm font-bold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:transition-transform [&_svg]:duration-300 hover:[&>svg:last-child]:translate-x-0.5",
  {
    variants: {
      variant: {
        primary:
          "btn-gradient-border btn-shine text-white shadow-glow-sm hover:-translate-y-0.5 hover:bg-brand-mid hover:shadow-glow-md",
        outline:
          "btn-shine btn-shine-soft border border-border bg-surface/50 text-ink hover:-translate-y-0.5 hover:border-brand/50 hover:bg-surface",
        ghost: "text-ink-soft hover:bg-surface-sunken hover:text-ink",
        subtle: "bg-surface-sunken text-ink hover:bg-border",
        destructive: "bg-rose text-white hover:bg-rose/90",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-[0.95rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        // Picked up by CursorFollower for the magnetic pull (ignored where it isn't mounted).
        data-magnetic=""
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
