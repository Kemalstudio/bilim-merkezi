"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Everywhere HeroStage's pinned scene does not run (see HERO_STAGE_MEDIA). */
const PARALLAX_MEDIA =
  "(prefers-reduced-motion: no-preference) and (max-width: 1023px), (prefers-reduced-motion: no-preference) and (max-height: 699px)";

/**
 * Lays out the hero and, on screens without HeroStage's pinned scene, adds a parallax for the hero as it scrolls away: the copy drifts up and fades out, the visual
 * sinks and shrinks at a different rate (which is what reads as depth), and the card dims
 * so the next section takes over.
 *
 * The wrappers are animated, never the copy itself — anime.js owns those nodes for the
 * entrance, and two libraries writing the same transform would fight over it.
 */
export function HeroScrollScene({
  content,
  visual,
  pinned = true,
}: {
  content: ReactNode;
  visual: ReactNode;
  /** Whether HeroStage's pinned scene runs; without it this parallax covers every screen. */
  pinned?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add(pinned ? PARALLAX_MEDIA : "(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        })
        .fromTo($("[data-hero-copy]"), { yPercent: 0, autoAlpha: 1 }, { yPercent: -16, autoAlpha: 0.15, duration: 1 }, 0)
        .fromTo($("[data-hero-visual]"), { yPercent: 0, scale: 1 }, { yPercent: 10, scale: 0.92, duration: 1 }, 0)
        .fromTo($("[data-hero-dim]"), { opacity: 0 }, { opacity: 0.55, duration: 1 }, 0);
    });

    return () => mm.revert();
  }, [pinned]);

  return (
    <div
      ref={rootRef}
      data-hero-scene
      className="relative mx-auto grid min-h-[680px] min-w-0 max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-10 lg:py-20 xl:px-4"
    >
      <div data-hero-copy className="min-w-0">
        {content}
      </div>
      <div data-hero-visual className="hidden lg:block">
        {visual}
      </div>
      <div data-hero-dim aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-[#03121b] opacity-0" />
    </div>
  );
}
