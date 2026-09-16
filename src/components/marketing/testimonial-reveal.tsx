"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import type { TestimonialItem } from "@/components/marketing/testimonial-carousel";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Reviews as large quotes whose words light up one by one with the scroll; the stars pop
 * in first, the author follows, and an oversized quote mark drifts against the scroll.
 */
export function TestimonialReveal({ items }: { items: TestimonialItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      root.querySelectorAll<HTMLElement>("[data-quote]").forEach((quote) => {
        const text = quote.querySelector<HTMLElement>("[data-quote-text]");
        const stars = quote.querySelectorAll("[data-quote-star]");
        const author = quote.querySelector("[data-quote-author]");
        const mark = quote.querySelector("[data-quote-mark]");
        if (!text || !author) return;

        if (mark) {
          gsap.fromTo(
            mark,
            { yPercent: 40, rotation: -8 },
            {
              yPercent: -40,
              rotation: 6,
              ease: "none",
              scrollTrigger: { trigger: quote, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        }

        SplitText.create(text, {
          type: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap
              .timeline({ scrollTrigger: { trigger: quote, start: "top 78%", end: "bottom 52%", scrub: 0.6 } })
              .fromTo(
                stars,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.15, stagger: 0.05, ease: "back.out(3)" },
                0
              )
              .fromTo(self.words, { opacity: 0.14 }, { opacity: 1, duration: 0.3, stagger: 0.06, ease: "none" }, 0.1)
              .fromTo(author, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, ">-0.1"),
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col">
      {items.map((item, i) => (
        <figure
          key={item.id}
          data-quote
          className={cn(
            "relative grid gap-6 border-t border-white/10 py-14 sm:py-20 lg:grid-cols-[9rem_1fr] lg:gap-10",
            i % 2 === 1 && "lg:pl-[12%]"
          )}
        >
          <div className="relative">
            <span className="font-display text-sm font-bold text-white/35">{String(i + 1).padStart(2, "0")}</span>
            <span
              data-quote-mark
              aria-hidden
              className="pointer-events-none absolute -top-6 left-6 select-none font-display text-[9rem] font-bold leading-none text-accent/15 sm:text-[12rem]"
            >
              &ldquo;
            </span>
          </div>
          <div>
            <div role="img" aria-label={`${item.rating} / 5`} className="flex gap-1 text-amber">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} data-quote-star className="h-5 w-5" fill={idx < item.rating ? "currentColor" : "none"} />
              ))}
            </div>
            <blockquote
              data-quote-text
              className="mt-6 max-w-4xl font-display text-[clamp(1.6rem,3.6vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.04em] text-white"
            >
              &ldquo;{item.comment}&rdquo;
            </blockquote>
            <figcaption data-quote-author className="mt-8 flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-accent text-xs font-bold text-[#0b2233]">{initials(item.userName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-white">{item.userName}</p>
                <p className="text-xs text-white/45">{item.courseTitle}</p>
              </div>
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
