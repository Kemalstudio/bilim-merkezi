"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createReportProgress } from "@/components/marketing/hero-report-progress";

gsap.registerPlugin(ScrollTrigger);

/** Screens that get the pinned scene: wide enough to show the card, tall enough to hold the hero. */
export const HERO_STAGE_MEDIA = "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 700px)";

/** Where each chip (homework, next step) drifts while the card sits in the centre. */
const CHIP_SPREAD = [
  { x: -45, y: -70, rotation: -6 },
  { x: 45, y: 80, rotation: 5 },
];

/** Width of the longest line of the heading inside `wrapper`, unaffected by the wrapper's scale. */
function longestLineWidth(wrapper: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(wrapper.firstElementChild ?? wrapper);
  const scale = wrapper.getBoundingClientRect().width / wrapper.offsetWidth || 1;
  return range.getBoundingClientRect().width / scale;
}

/**
 * Pins the hero, together with the stats bar that overlaps it, and scrubs a scene as the
 * visitor scrolls: the copy clears away while the report card glides to the centre, the
 * weeks go by on the card (line, score and topics fill in), then the card tips back and
 * sinks and the headline comes into focus in the centre before the pin lets go.
 *
 * Elsewhere HeroScrollScene keeps its plain parallax. Every tween here targets wrappers
 * (data-hero-*), never the nodes anime.js or HeroVisualReveal animate, and the chips move on
 * xPercent/yPercent/rotation so their floating y stays untouched.
 */
export function HeroStage({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage || !enabled) return;

    const mm = gsap.matchMedia();

    mm.add(HERO_STAGE_MEDIA, () => {
      const scene = stage.querySelector<HTMLElement>("[data-hero-scene]");
      const title = stage.querySelector<HTMLElement>("[data-hero-title]");
      const visual = stage.querySelector<HTMLElement>("[data-hero-visual]");
      const card = stage.querySelector<HTMLElement>("[data-hv-card]");
      if (!scene || !title || !visual) return;

      const q = gsap.utils.selector(stage);
      const asides = q("[data-hero-aside]");
      const stats = q("[data-trust-stats]");
      const header = document.querySelector("header");

      // The card starts at its first week; scrolling walks it to the last.
      const report = card ? createReportProgress(card) : null;
      const progress = { t: 0 };
      report?.render(0);

      // Offsets rather than bounding rects: they ignore this scene's own transforms, so
      // re-measuring on a mid-scroll refresh still starts from the resting layout.
      const centreX = (el: HTMLElement) => scene.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
      const centreY = (el: HTMLElement) => scene.offsetHeight / 2 - (el.offsetTop + el.offsetHeight / 2);
      // The headline is left-aligned, so it is centred on its longest line rather than its box.
      const titleCentreX = () => scene.offsetWidth / 2 - (title.offsetLeft + longestLineWidth(title) / 2);

      // No filter/blur tweens here: a scrubbed blur on the large headline re-rasterised it on
      // every scroll frame and made the pinned scene stutter. Opacity, transform and scale
      // run on the compositor and give the same "out of focus" read.
      gsap.set(visual, { transformPerspective: 1200, transformOrigin: "50% 60%" });

      // Promoted for the length of the pin only, so the moving pieces stay on their own layers.
      gsap.set([title, visual, ...asides, ...stats], { willChange: "transform, opacity" });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: stage,
            pin: true,
            // Pin right under the sticky header, so the scene starts with the first scroll.
            start: () => `top ${header?.offsetHeight ?? 0}px`,
            end: "+=240%",
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Refresh before the sections below, so their triggers include this pin's spacing.
            refreshPriority: 1,
          },
        })
        // 1 · the copy drifts out of focus; the card glides to the centre
        .to(asides, { x: -140, autoAlpha: 0, duration: 0.28, stagger: 0.03, ease: "power2.in" }, 0)
        .to(title, { x: 0, y: -90, scale: 0.97, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 0.04)
        .to(stats, { y: 90, autoAlpha: 0, duration: 0.2, ease: "power1.in" }, 0)
        .to(visual, { x: () => centreX(visual), scale: 1.12, duration: 0.42, ease: "power2.inOut" }, 0.06)
        // A slight bank into the move and back out of it, as if the card had some weight.
        .to(visual, { keyframes: { rotationY: [0, 12, 0], rotationX: [0, 4, 0], easeEach: "sine.inOut" }, duration: 0.42 }, 0.06)
        .to(
          q("[data-hv-chip]"),
          {
            xPercent: (index: number) => CHIP_SPREAD[index]?.x ?? 0,
            yPercent: (index: number) => CHIP_SPREAD[index]?.y ?? 0,
            rotation: (index: number) => CHIP_SPREAD[index]?.rotation ?? 0,
            duration: 0.42,
            ease: "power2.inOut",
          },
          0.06
        )
        // 2 · the weeks go by on the card
        .fromTo(
          progress,
          { t: 0 },
          { t: 1, duration: 0.5, ease: "none", immediateRender: false, onUpdate: () => report?.render(progress.t) },
          0.14
        )
        // 3 · the card tips back and sinks; the headline comes into focus in the centre
        .to(visual, { y: 170, rotationX: 38, scale: 0.8, autoAlpha: 0, duration: 0.24, ease: "power2.in" }, 0.72)
        .fromTo(
          title,
          { x: titleCentreX, y: () => centreY(title) + 90, scale: 0.94 },
          {
            y: () => centreY(title),
            scale: 1.22,
            autoAlpha: 1,
            duration: 0.32,
            ease: "power3.out",
            immediateRender: false,
          },
          0.8
        )
        .to(stats, { y: 0, autoAlpha: 1, duration: 0.14, ease: "power1.out" }, 1)
        // A short hold on the final frame before the pin releases.
        .to({}, { duration: 0.12 });

      return () => {
        report?.reset();
        gsap.set([title, visual, ...asides, ...stats], { clearProps: "willChange" });
      };
    });

    return () => mm.revert();
  }, [enabled]);

  return <div ref={ref}>{children}</div>;
}
