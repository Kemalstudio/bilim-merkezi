"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { methodIllustrations } from "@/components/marketing/method-illustrations";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

type Item = Dictionary["learningExperience"]["items"][number];

const tones = [
  { card: "border-border bg-surface text-ink", text: "text-muted", number: "text-muted" },
  { card: "border-accent bg-accent text-[#0b2233]", text: "text-[#41607a]", number: "text-[#4a7690]" },
  { card: "border-panel bg-panel text-white", text: "text-white/60", number: "text-white/40" },
  { card: "border-[#f0b968] bg-[#f0b968] text-[#0b2233]", text: "text-[#14657f]", number: "text-[#b8701a]" },
];

/**
 * The method points as a deck of sticky cards: each card slides over the previous one,
 * which recedes, while its illustration settles into frame and animates with the scroll.
 */
export function MethodCardStack({ items }: { items: Item[] }) {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    const cards = Array.from(stack.querySelectorAll<HTMLElement>("[data-stack-card]"));

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Sticky cards report their stuck position once scrolled, so scroll positions come from
      // the (non-sticky) stack plus each card's place in normal flow.
      const gap = () => parseFloat(getComputedStyle(stack).rowGap) || 0;
      const stackTop = () => stack.getBoundingClientRect().top + window.scrollY;
      const flowTop = (i: number) => cards.slice(0, i).reduce((sum, card) => sum + card.offsetHeight + gap(), 0);
      const stuckTop = (i: number) => parseFloat(getComputedStyle(cards[i]).top) || 0;
      // Card i travels from the bottom of the viewport (entryStart) to its sticky slot (entryEnd).
      const entryStart = (i: number) => stackTop() + flowTop(i) - window.innerHeight;
      const entryEnd = (i: number) => stackTop() + flowTop(i) - stuckTop(i);

      const cleanups: Array<() => void> = [];

      cards.forEach((card, i) => {
        const media = card.querySelector<HTMLElement>("[data-stack-media]");
        const dim = card.querySelector<HTMLElement>("[data-stack-dim]");
        if (!media || !dim) return;

        // The illustration drifts slower than its card and settles into the frame.
        gsap.fromTo(
          media,
          { yPercent: -12, scale: 1.25 },
          {
            yPercent: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: { start: () => entryStart(i), end: () => entryEnd(i), scrub: true },
          }
        );

        // The illustration's details play out with the scroll while the card is in view.
        const details = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            start: () => entryStart(i) + window.innerHeight * 0.3,
            end: () => entryEnd(i) + window.innerHeight * 0.2,
            scrub: 0.6,
          },
        });
        const cleanup = methodIllustrations[i % methodIllustrations.length].animate(details, card);
        if (cleanup) cleanups.push(cleanup);

        // Recede into the deck while the next card slides over.
        if (i < cards.length - 1) {
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: { start: () => entryStart(i + 1), end: () => entryEnd(i + 1), scrub: true },
            })
            .to(card, { scale: 0.92 }, 0)
            .to(dim, { opacity: 0.45 }, 0);
        }
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={stackRef} className="flex flex-col gap-6">
      {items.map((item, i) => {
        const tone = tones[i % tones.length];
        const { Art } = methodIllustrations[i % methodIllustrations.length];
        return (
          <article
            key={item.title}
            data-stack-card
            style={{ "--i": i } as CSSProperties}
            className={cn(
              "sticky top-[calc(5.5rem+var(--i)*0.9rem)] origin-top overflow-hidden rounded-[1.7rem] border shadow-glow-md lg:top-[calc(7rem+var(--i)*1.4rem)]",
              tone.card
            )}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <div data-stack-media className="absolute inset-0">
                <Art />
              </div>
            </div>
            <div className="flex items-start gap-5 p-6 sm:p-7">
              <span className={cn("pt-1.5 font-display text-xs font-bold", tone.number)}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold leading-tight tracking-[-0.035em] sm:text-2xl">{item.title}</h3>
                <p className={cn("mt-2 max-w-md text-sm leading-6", tone.text)}>{item.description}</p>
              </div>
            </div>
            <div data-stack-dim aria-hidden className="pointer-events-none absolute inset-0 bg-[#051c29] opacity-0" />
          </article>
        );
      })}
    </div>
  );
}
