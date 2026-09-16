"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummitArt } from "@/components/marketing/summit-art";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

// How far (scene units) each layer starts from its resting place: nearer layers travel further.
const LAYER_DEPTH = { stars: -30, sun: 170, far: 60, mid: 120, near: 190, front: 290 } as const;

/**
 * A pinned, full-screen picture reveal: a framed landscape opens edge to edge while the
 * intro words part, its layers settle at different depths, a route climbs to the summit
 * and the copy arrives. Without motion the opened picture and copy are shown as they are.
 */
export function SummitSection({ labels }: { labels: Dictionary["summit"] }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const $ = gsap.utils.selector(stage);
    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 640px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 639px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { mobile } = ctx.conditions as Record<"mobile", boolean>;

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, pin: true, start: "top top", end: "+=220%", scrub: 0.8 },
        });

        // 0 → 1: the framed picture opens to full screen while the intro words part.
        timeline
          .fromTo(
            $("[data-summit-frame]"),
            { clipPath: mobile ? "inset(25% 7% 25% 7% round 24px)" : "inset(22% 30% 22% 30% round 36px)" },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1, ease: "power2.inOut" },
            0
          )
          .fromTo($("[data-summit-scene]"), { scale: 1.35 }, { scale: 1, duration: 1.2, ease: "power2.out" }, 0)
          .fromTo(
            $("[data-summit-intro='start']"),
            { xPercent: 0, opacity: 1 },
            { xPercent: -25, opacity: 0, duration: 0.6, ease: "power2.in" },
            0
          )
          .fromTo(
            $("[data-summit-intro='end']"),
            { xPercent: 0, opacity: 1 },
            { xPercent: 25, opacity: 0, duration: 0.6, ease: "power2.in" },
            0
          )
          .fromTo($("[data-cloud]"), { x: -140 }, { x: 90, duration: 2.3 }, 0);

        // The landscape settles layer by layer, nearer layers travelling further.
        Object.entries(LAYER_DEPTH).forEach(([layer, depth]) => {
          timeline.fromTo($(`[data-layer='${layer}']`), { y: depth }, { y: 0, duration: 1.2, ease: "power2.out" }, 0);
        });

        // 1 → 2: the route climbs to the summit, the flag goes up and the copy arrives.
        timeline
          .fromTo($("[data-summit-route='low']"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3 }, 0.95)
          .fromTo($("[data-summit-route='high']"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5 }, 1.25)
          .fromTo(
            $("[data-summit-flag]"),
            { scaleY: 0, transformOrigin: "50% 100%" },
            { scaleY: 1, duration: 0.15, ease: "back.out(2)" },
            1.75
          )
          .fromTo($("[data-summit-shade]"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.8)
          .fromTo(
            $("[data-summit-copy]"),
            { y: 40, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.1, ease: "power2.out" },
            1.15
          )
          // Hold on the finished picture before the pin releases.
          .to({}, { duration: 0.3 });
      }
    );

    return () => mm.revert();
  }, []);

  const introClass = "absolute font-display text-[clamp(2rem,6vw,6.5rem)] font-bold leading-none tracking-[-0.06em] text-ink";

  return (
    <section aria-labelledby="summit-title" className="relative">
      <div ref={stageRef} className="relative h-svh min-h-[34rem] overflow-hidden">
        <p data-summit-intro="start" aria-hidden className={`${introClass} left-[5%] top-[8%]`}>
          {labels.introStart}
        </p>
        <p data-summit-intro="end" aria-hidden className={`${introClass} bottom-[8%] right-[5%] text-right`}>
          <span className="brand-gradient-text">{labels.introEnd}</span>
        </p>

        <div data-summit-frame className="absolute inset-0 overflow-hidden">
          <div data-summit-scene className="absolute inset-0">
            <SummitArt />
          </div>
          <div
            data-summit-shade
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#03121b]/90 via-[#03121b]/35 via-45% to-transparent"
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-12 text-white sm:px-10 sm:pb-16 lg:px-16 lg:pb-20">
            <div className="grid gap-7 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                <p data-summit-copy className="eyebrow !text-accent">
                  {labels.eyebrow}
                </p>
                <h2
                  data-summit-copy
                  id="summit-title"
                  className="mt-5 max-w-3xl font-display text-[clamp(2.1rem,5vw,4.8rem)] font-bold leading-[0.98] tracking-[-0.055em]"
                >
                  {labels.title}
                </h2>
                <p data-summit-copy className="mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                  {labels.subtitle}
                </p>
              </div>
              <div className="flex flex-col gap-4 lg:items-end">
                <ul data-summit-copy className="flex flex-wrap gap-2 lg:justify-end">
                  {labels.points.map((point) => (
                    <li
                      key={point}
                      className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                <div data-summit-copy>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="!border-accent !bg-accent !text-[#0b2233] hover:-translate-y-0.5 hover:!bg-accent-soft"
                  >
                    <Link href="/courses">
                      {labels.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
