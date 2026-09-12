import { cn } from "@/lib/utils";

/**
 * Colour-coded initials. The hue is stored per child so a parent with several
 * children can tell cards apart at a glance without photos.
 */
export function ChildAvatar({
  firstName,
  lastName,
  hue,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  hue: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl font-display font-bold text-white",
        sizes[size],
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 58% 46%), hsl(${(hue + 34) % 360} 52% 34%))`,
      }}
    >
      {firstName[0]}
      {lastName[0]}
    </span>
  );
}
