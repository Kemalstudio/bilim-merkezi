"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

const FIRST_OPEN = 0;

export function FaqSection({ labels }: { labels: Dictionary["faq"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(FIRST_OPEN);
  const listRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const panelsRef = useRef<Array<HTMLDivElement | null>>([]);
  const isFirstRender = useRef(true);

  // The rows arrive one by one, and the question mark drifts against the scroll.
  useEffect(() => {
    const list = listRef.current;
    const mark = markRef.current;
    if (!list || !mark) return;

    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-faq-row]"));
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(rows, {
        y: 30,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: { trigger: list, start: "top 82%", once: true },
      });

      gsap.fromTo(
        mark,
        { yPercent: 12, rotation: -10 },
        {
          yPercent: -12,
          rotation: 8,
          ease: "none",
          scrollTrigger: { trigger: list, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    return () => mm.revert();
  }, []);

  // Open and close with GSAP, so each panel animates from its real content height.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panels = panelsRef.current;

    panels.forEach((panel, i) => {
      if (!panel) return;
      const answer = panel.firstElementChild;

      if (i === openIndex) {
        gsap.to(panel, { height: "auto", duration: reduced ? 0 : 0.5, ease: "power2.out", overwrite: true });
        if (answer) {
          gsap.fromTo(
            answer,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: reduced ? 0 : 0.45, ease: "power2.out", overwrite: true }
          );
        }
      } else {
        gsap.to(panel, { height: 0, duration: reduced ? 0 : 0.35, ease: "power2.inOut", overwrite: true });
      }
    });

    // Reverting would undo the open/closed heights, so only stop the tweens on unmount.
    return () => {
      gsap.killTweensOf(panels.filter(Boolean) as HTMLDivElement[]);
    };
  }, [openIndex]);

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-36">
      <AnimeReveal className="relative isolate lg:sticky lg:top-28 lg:self-start">
        <span
          ref={markRef}
          aria-hidden
          className="pointer-events-none absolute -left-6 -top-16 -z-10 select-none font-display text-[12rem] font-bold leading-none text-accent/30 sm:text-[16rem] lg:-top-24 lg:text-[20rem]"
        >
          ?
        </span>
        <span className="eyebrow">{labels.eyebrow}</span>
        <SplitHeading className="section-title mt-6 text-ink">{labels.title}</SplitHeading>
        <p className="mt-6 max-w-sm text-sm leading-6 text-muted">{labels.prompt}</p>
      </AnimeReveal>

      <div ref={listRef} className="flex flex-col border-t border-border">
        {labels.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} data-faq-row className="group relative border-b border-border">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-brand-ink transition-transform duration-500 group-hover:scale-x-100"
              />
              <button
                type="button"
                id={`faq-question-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-left"
              >
                <span
                  className={cn(
                    "font-display text-base font-bold tracking-[-0.02em] text-ink transition-colors duration-300 sm:text-lg",
                    isOpen && "text-brand-ink"
                  )}
                >
                  {item.q}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-all duration-300 group-hover:border-brand/40",
                    isOpen && "rotate-180 border-brand-ink bg-brand-ink text-white"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                ref={(el) => {
                  panelsRef.current[i] = el;
                }}
                // Set once: tying this to state would make React fight the GSAP tween.
                style={{ height: i === FIRST_OPEN ? "auto" : 0, overflow: "hidden" }}
              >
                <p className="max-w-xl pb-6 text-sm leading-6 text-muted">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
