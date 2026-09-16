"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export type TestimonialItem = {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  courseTitle: string;
};

export function TestimonialCarousel({ items }: { items: TestimonialItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? 340) + 24;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <figure
            key={item.id}
            data-card
            className="flex min-h-80 w-[88%] shrink-0 snap-start flex-col gap-5 rounded-[1.4rem] border border-white/10 bg-white/[0.07] p-6 text-white backdrop-blur-sm sm:w-[410px] sm:p-7"
          >
            <div className="flex gap-0.5 text-amber">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="h-4 w-4" fill={idx < item.rating ? "currentColor" : "none"} />
              ))}
            </div>
            <blockquote className="flex-1 font-display text-xl font-semibold leading-8 tracking-[-0.025em] text-white">&ldquo;{item.comment}&rdquo;</blockquote>
            <figcaption className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-accent text-[11px] font-bold text-[#0b2233]">{initials(item.userName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-white">{item.userName}</p>
                <p className="text-xs text-white/45">{item.courseTitle}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Предыдущий отзыв"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white transition-colors hover:border-accent hover:bg-accent hover:text-[#0b2233]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Следующий отзыв"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white transition-colors hover:border-accent hover:bg-accent hover:text-[#0b2233]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
