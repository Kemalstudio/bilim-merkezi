"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnEnter } from "@/lib/scroll-reveal";

gsap.registerPlugin(ScrollTrigger);

/**
 * Brings the hero report card in: the card rises, its header, chart and topic rows follow,
 * and the chips land and keep floating. This is appearance only; the card's data (weeks,
 * score, line, topic bars) is walked through on scroll by HeroStage.
 *
 * The markup already holds the final frame, so it reads fine without JavaScript or motion;
 * globals.css hides the card and chips until GSAP takes them over, so it never flashes.
 */
export function HeroVisualReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const $ = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    // The visual is display:none below lg, so there is nothing to animate there.
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
      const chips = $("[data-hv-chip]");

      const float = gsap.to(chips, {
        y: (index: number) => (index % 2 ? 7 : -7),
        duration: 2.8,
        ease: "sine.inOut",
        stagger: { each: 0.45, repeat: -1, yoyo: true },
        paused: true,
      });

      const timeline = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out" } })
        .from($("[data-hv-card]"), {
          autoAlpha: 0,
          y: 56,
          scale: 0.94,
          rotateX: 12,
          transformPerspective: 900,
          transformOrigin: "50% 100%",
          duration: 1,
        })
        .from($("[data-hv-fade]"), { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.08 }, 0.25)
        .from($("[data-hv-pop]"), { autoAlpha: 0, scale: 0.6, duration: 0.55, ease: "back.out(2.4)" }, 0.4)
        .from($("[data-hv-chart]"), { autoAlpha: 0, y: 18, duration: 0.7 }, 0.45)
        .from($("[data-hv-tile]"), { autoAlpha: 0, x: -12, duration: 0.5, stagger: 0.08 }, 0.6)
        .from(chips, { autoAlpha: 0, y: 24, scale: 0.8, duration: 0.7, ease: "back.out(1.8)", stagger: 0.12 }, 0.7)
        .call(() => void float.play());

      return playOnEnter(timeline, root, "top bottom");
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
