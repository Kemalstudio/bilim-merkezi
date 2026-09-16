import { createElement } from "react";
import { getCategoryIcon } from "@/lib/course-visuals";
import { Constellation } from "@/components/marketing/constellation";
import { cn } from "@/lib/utils";

export function CourseCover({
  categorySlug,
  className,
}: {
  categorySlug: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-[#073b52]",
        categorySlug === "design" && "bg-[#e2604f]",
        categorySlug === "marketing" && "bg-[#f0b968] text-[#0b2233]",
        categorySlug === "languages" && "bg-[#f4a83a] text-[#0b2233]",
        categorySlug === "business" && "bg-[#115a78]",
        className
      )}
    >
      <Constellation
        variant="watermark"
        className={cn("absolute inset-0 h-full w-full scale-125 text-white opacity-35", (categorySlug === "languages" || categorySlug === "marketing") && "text-[#0b2233]")}
      />
      {createElement(getCategoryIcon(categorySlug), {
        className: cn("relative h-10 w-10 text-white drop-shadow-sm", (categorySlug === "languages" || categorySlug === "marketing") && "text-[#0b2233]"),
        strokeWidth: 1.75,
      })}
    </div>
  );
}
