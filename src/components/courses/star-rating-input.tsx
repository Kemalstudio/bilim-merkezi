"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({ name, defaultValue = 5 }: { name: string; defaultValue?: number }) {
  const [rating, setRating] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={rating} />
      {Array.from({ length: 5 }, (_, i) => i + 1).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setRating(value)}
          onMouseEnter={() => setHovered(value)}
          onMouseLeave={() => setHovered(null)}
          className="cursor-pointer p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-start rounded"
          aria-label={`Оценка ${value} из 5`}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              (hovered ?? rating) >= value ? "fill-amber text-amber" : "text-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}
